import { NextResponse } from 'next/server';
import axios from 'axios';

const endpoints = [
  { url: 'http://belto.myftp.biz:9999/v1/chat/completions', priority: 1 }, // Highest priority
  { url: 'http://47.34.185.47:9999/v1/chat/completions', priority: 2 }
];

// Add a flag to enable fallback responses when all endpoints fail
const ENABLE_FALLBACK_RESPONSES = true;
const STREAM_RESPONSE = true; // Enable/disable streaming

// 'http://97.90.195.162:9999/v1/chat/completions',

// Endpoint health tracking with circuit breaker pattern
const endpointStats = endpoints.map(e => ({
  ...e,
  isAvailable: true,
  failCount: 0,
  lastResponseTime: 0,
  lastChecked: Date.now(),
  consecutiveFailures: 0,
  circuitBreakerOpen: false,
  lastCircuitBreakerCheck: Date.now()
}));

const BASE_TIMEOUT_MS = 8000; // Base timeout for simple requests
const ATTACHMENT_TIMEOUT_MS = 25000; // Extended timeout for requests with attachments or complex content
const MAX_CONSECUTIVE_FAILURES = 1; // Reduce failures before marking endpoint as unavailable
const RETRY_INTERVAL_MS = 20000; // Try unavailable endpoints again after 20 seconds
const HEALTH_CHECK_THRESHOLD = 120000; // 2 minutes in ms
const CIRCUIT_BREAKER_THRESHOLD = 2; // Number of failures to open circuit breaker
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 second timeout for circuit breaker

/**
 * Determines appropriate timeout based on request complexity and processing hints
 * @param {Object} body - Request body
 * @param {Array} messages - Formatted messages array
 * @returns {number} Timeout in milliseconds
 */
function getTimeoutForRequest(body, messages) {
  // Check for attachments or large content
  const hasAttachments = body.attachments && body.attachments.length > 0;
  const hasLargeContent = messages.some(msg => msg.content && msg.content.length > 1000);
  const totalContentLength = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
  
  // Use processing hints for smarter timeout calculation
  if (body.processingHints && hasAttachments) {
    const hints = body.processingHints;
    console.log(`🕐 Calculating timeout using processing hints:`, hints);
    
    // PDF documents typically need more processing time
    if (hints.documentType === 'pdf') {
      if (hints.contentLength > 20000) {
        console.log(`Using maximum timeout (45000ms) for large PDF document: ${hints.contentLength} chars`);
        return 45000; // 45 seconds for large PDFs
      } else if (hints.contentLength > 10000) {
        console.log(`Using extended timeout (35000ms) for medium PDF document: ${hints.contentLength} chars`);
        return 35000; // 35 seconds for medium PDFs
      } else {
        console.log(`Using enhanced timeout (25000ms) for small PDF document: ${hints.contentLength} chars`);
        return 25000; // 25 seconds for small PDFs
      }
    }
    
    // DOC files processing
    if (hints.documentType === 'doc' || hints.documentType === 'docx') {
      if (hints.contentLength > 15000) {
        console.log(`Using enhanced timeout (35000ms) for large DOC document: ${hints.contentLength} chars`);
        return 35000;
      } else {
        console.log(`Using enhanced timeout (25000ms) for DOC document: ${hints.contentLength} chars`);
        return 25000;
      }
    }
    
    // Analysis vs Summary - Analysis needs more time
    if (hints.analysisType === 'analysis' && hints.contentLength > 5000) {
      console.log(`Using analysis timeout (30000ms) for detailed analysis: ${hints.contentLength} chars`);
      return 30000;
    }
  }
  
  // Check for code-related requests
  const hasCodeKeywords = messages.some(msg => 
    msg.content && /\b(code|function|class|variable|algorithm|program|java|python|javascript|html|css)\b/i.test(msg.content)
  );
  
  // Fallback to original logic for non-hinted requests
  if (hasAttachments) {
    const hasPDFContent = body.attachments.some(att => 
      att.content && att.content.length > 5000 || 
      att.name && att.name.toLowerCase().includes('.pdf')
    );
    
    if (hasPDFContent || totalContentLength > 10000) {
      console.log(`Using maximum timeout (45000ms) for large PDF/document request:`, {
        hasAttachments,
        totalContentLength,
        attachmentSizes: body.attachments.map(att => att.content?.length || 0)
      });
      return 45000; // 45 seconds for large PDFs
    }
  }
  
  if (hasAttachments || hasLargeContent || totalContentLength > 2000 || hasCodeKeywords) {
    console.log(`Using extended timeout (${ATTACHMENT_TIMEOUT_MS}ms) for complex request:`, {
      hasAttachments,
      hasLargeContent,
      totalContentLength,
      hasCodeKeywords
    });
    return ATTACHMENT_TIMEOUT_MS;
  }
  
  console.log(`Using base timeout (${BASE_TIMEOUT_MS}ms) for simple request`);
  return BASE_TIMEOUT_MS;
}

/**
 * Selects the best endpoint based on availability and response time
 * @returns {string} The URL of the selected endpoint
 */
function selectEndpoint() {
  const now = Date.now();
  
  // First, check circuit breakers and reset if timeout has passed
  endpointStats.forEach(endpoint => {
    if (endpoint.circuitBreakerOpen && (now - endpoint.lastCircuitBreakerCheck) > CIRCUIT_BREAKER_TIMEOUT) {
      console.log(`Resetting circuit breaker for ${endpoint.url}`);
      endpoint.circuitBreakerOpen = false;
      endpoint.consecutiveFailures = 0;
      endpoint.lastCircuitBreakerCheck = now;
    }
  });
  
  // Check if any unavailable endpoints should be retried
  endpointStats.forEach(endpoint => {
    if (!endpoint.isAvailable && (now - endpoint.lastChecked) > RETRY_INTERVAL_MS) {
      console.log(`Marking ${endpoint.url} as available for retry`);
      endpoint.isAvailable = true;
      endpoint.failCount = 0;
      endpoint.consecutiveFailures = 0;
    }
  });

  // Filter for available endpoints that don't have circuit breaker open
  const availableEndpoints = endpointStats.filter(endpoint => 
    endpoint.isAvailable && !endpoint.circuitBreakerOpen
  );
  
  if (availableEndpoints.length === 0) {
    // All endpoints are unavailable or circuit breaker is open, reset the highest priority one for retry
    console.log('All endpoints unavailable or circuit breaker open, resetting the highest priority one for retry');
    endpointStats.sort((a, b) => a.priority - b.priority);
    endpointStats[0].isAvailable = true;
    endpointStats[0].failCount = 0;
    endpointStats[0].consecutiveFailures = 0;
    endpointStats[0].circuitBreakerOpen = false;
    return endpointStats[0].url;
  }
  
  // Choose the best available endpoint
  availableEndpoints.sort((a, b) => {
    // 1. Prioritize by specified priority
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // 2. Prioritize by circuit breaker status
    if (a.circuitBreakerOpen !== b.circuitBreakerOpen) {
      return a.circuitBreakerOpen ? 1 : -1;
    }
    // 3. Prioritize by consecutive failures (lower is better)
    if (a.consecutiveFailures !== b.consecutiveFailures) {
      return a.consecutiveFailures - b.consecutiveFailures;
    }
    // 4. Prioritize by response time (faster is better)
    if (a.lastResponseTime > 0 && b.lastResponseTime > 0) {
      return a.lastResponseTime - b.lastResponseTime;
    }
    // 5. Prioritize by total failures (lower is better)
    return a.failCount - b.failCount;
  });
  
  return availableEndpoints[0].url;
}

/**
 * Updates endpoint statistics based on request success/failure
 * @param {string} url - The endpoint URL
 * @param {boolean} success - Whether the request was successful
 * @param {number} responseTime - Response time in milliseconds
 */
function updateEndpointStats(url, success, responseTime) {
  const endpoint = endpointStats.find(e => e.url === url);
  if (!endpoint) return;
  
  endpoint.lastChecked = Date.now();
  
  if (success) {
    endpoint.isAvailable = true;
    endpoint.lastResponseTime = responseTime;
    endpoint.consecutiveFailures = 0;
    endpoint.circuitBreakerOpen = false;
    // Gradually reduce fail count on success
    if (endpoint.failCount > 0) {
      endpoint.failCount = Math.max(0, endpoint.failCount - 1);
    }
  } else {
    endpoint.failCount++;
    endpoint.consecutiveFailures++;
    
    // Check if we should open the circuit breaker
    if (endpoint.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      console.log(`Opening circuit breaker for ${url} after ${endpoint.consecutiveFailures} consecutive failures`);
      endpoint.circuitBreakerOpen = true;
      endpoint.lastCircuitBreakerCheck = Date.now();
    }
    
    if (endpoint.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log(`Marking ${url} as unavailable after ${endpoint.consecutiveFailures} consecutive failures`);
      endpoint.isAvailable = false;
    }
  }
}

/**
 * Performs a health check on all endpoints
 */
async function healthCheck() {
  console.log('Performing health check on all endpoints');
  
  const checks = endpoints.map(async (url) => {
    const endpoint = endpointStats.find(e => e.url === url);
    if (!endpoint) return;
    
    try {
      const startTime = Date.now();
      // Use a simple POST request similar to the actual chat request to test endpoint health
      const testPayload = {
        model: 'default-model',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10
      };
      
      await axios.post(url, testPayload, {
        timeout: 5000, // Short timeout for health check
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_API_KEY || 'test'}`
        }
      });
      
      const responseTime = Date.now() - startTime;
      updateEndpointStats(url, true, responseTime);
      console.log(`Health check for ${url}: OK (${responseTime}ms)`);
    } catch (error) {
      console.log(`Health check for ${url}: FAILED - ${error.message}`);
      updateEndpointStats(url, false, 0);
    }
  });
  
  await Promise.allSettled(checks);
}

// Periodically check endpoints health
let healthCheckInterval = null;

// Initialize health check with immediate execution
const initializeHealthCheck = () => {
  // Run initial health check
  setTimeout(() => {
    healthCheck();
  }, 5000); // Wait 5 seconds after startup
  
  // Set up periodic health checks
  healthCheckInterval = setInterval(() => {
    const now = Date.now();
    // Only perform health check if enough time has passed since the last check
    const needsCheck = endpointStats.some(
      endpoint => now - endpoint.lastChecked > HEALTH_CHECK_THRESHOLD
    );
    
    if (needsCheck) {
      healthCheck();
    }
  }, HEALTH_CHECK_THRESHOLD / 2); // Check twice as often as the threshold
};

// Initialize on module load
if (typeof window === 'undefined') { // Only run on server side
  initializeHealthCheck();
}

export async function POST(request) {
  console.log('POST request received to AI proxy');

  try {
    const body = await request.json();
    console.log('Request body structure:', Object.keys(body));

    // Get API key from environment variables
    const apiKey = process.env.AI_API_KEY;

    if (!apiKey) {
      console.error('AI API key is not configured');
      return NextResponse.json(
        { error: 'AI API key is not configured on the server' },
        { status: 500 }
      );
    }

    // Add request validation
    if (!body.prompt && !body.message && (!body.messages || body.messages.length === 0)) {
      return NextResponse.json(
        { error: "No message content provided" },
        { status: 400 }
      );
    }

    // Initialize messages array
    let messages = [];
   
    // Include conversation history if provided
    if (body.history && Array.isArray(body.history) && body.history.length > 0) {
      console.log('Using provided conversation history, length:', body.history.length);
      messages = [...body.history];
    }

    // Handle different request formats - both from generateAIResponse and generateAIResponseWithPreferences
    if (body.messages && Array.isArray(body.messages)) {
      // Direct message array format - append to any existing history
      if (messages.length === 0) {
        messages = body.messages;
      } else {
        // Only add messages that aren't duplicates in the history
        body.messages.forEach(newMsg => {
          const isDuplicate = messages.some(existingMsg =>
            existingMsg.role === newMsg.role &&
            existingMsg.content === newMsg.content
          );
          if (!isDuplicate) {
            messages.push(newMsg);
          }
        });
      }
    }
   
    // Add the current prompt/message if it's not already in the history
    if (body.prompt) {
      // For prompts with attachments, create optimized content
      let messageContent = body.prompt;
      
      if (body.attachments && body.attachments.length > 0) {
        const attachment = body.attachments[0];
        const contentLength = attachment.content?.length || 0;
        
        if (contentLength > 10000) {
          // For large documents, don't duplicate content in the prompt
          messageContent = body.prompt.replace(/\n\nAttached document content:\n.*$/s, '') + 
            `\n\n--- DOCUMENT ANALYSIS REQUEST ---\nDocument: ${attachment.name || 'Uploaded Document'}\nSize: ${Math.floor(contentLength/1000)}KB\n\nPlease analyze the attached document content and respond to the user's request.`;
        }
      }
      
      const newUserMessage = { role: 'user', content: messageContent };
      const isDuplicate = messages.some(existingMsg =>
        existingMsg.role === 'user' &&
        existingMsg.content.includes(body.prompt.split('\n')[0]) // Check first line to avoid duplicates
      );
      if (!isDuplicate) {
        messages.push(newUserMessage);
      }
    } else if (body.message) {
      const newUserMessage = { role: 'user', content: body.message };
      const isDuplicate = messages.some(existingMsg =>
        existingMsg.role === 'user' &&
        existingMsg.content === body.message
      );
      if (!isDuplicate) {
        messages.push(newUserMessage);
      }
    }

    // Make sure all messages have the required 'content' field
    messages = messages.map(msg => {
      if (!msg.content && msg.message) {
        return { ...msg, content: msg.message };
      }
      return msg;
    });

    // Enhanced document processing with processing hints support
    if (body.attachments && body.attachments.length > 0) {
      console.log('📄 Processing attachments with hints:', body.processingHints);
      
      for (let attachment of body.attachments) {
        if (attachment.content) {
          let processedContent = attachment.content;
          const contentLength = attachment.content.length;
          
          // Use processing hints to optimize content handling
          if (body.processingHints) {
            const hints = body.processingHints;
            console.log(`📋 Using processing hints: Type=${hints.documentType}, Length=${hints.contentLength}, Analysis=${hints.analysisType}`);
            
            // Adjust processing based on document type and analysis type
            if (hints.documentType === 'pdf' && hints.analysisType === 'summary') {
              // For PDF summaries, focus on key sections
              if (contentLength > 15000) {
                const beginning = attachment.content.substring(0, 8000);
                const ending = attachment.content.substring(contentLength - 6000);
                processedContent = `${beginning}\n\n[--- DOCUMENT SUMMARY OPTIMIZED FOR PDF ---]\n[Original document: ${Math.floor(contentLength/1000)}KB PDF file]\n[Processing mode: Summary generation]\n\n${ending}`;
                console.log(`PDF summary optimization: ${contentLength} → ${processedContent.length} characters`);
              }
            } else if (hints.analysisType === 'analysis') {
              // For detailed analysis, preserve more content structure
              if (contentLength > 20000) {
                const beginning = attachment.content.substring(0, 12000);
                const middle = attachment.content.substring(Math.floor(contentLength * 0.4), Math.floor(contentLength * 0.4) + 6000);
                const ending = attachment.content.substring(contentLength - 8000);
                processedContent = `${beginning}\n\n[--- DOCUMENT ANALYSIS MODE ---]\n[Full analysis requested for ${hints.documentType.toUpperCase()} document]\n[Key sections preserved for detailed analysis]\n\n${middle}\n\n[--- CONTINUING TO CONCLUSION ---]\n\n${ending}`;
                console.log(`Document analysis optimization: ${contentLength} → ${processedContent.length} characters`);
              }
            }
          } else {
            // Fallback to original logic if no processing hints
            if (contentLength > 15000) {
              console.log(`Large attachment detected (${contentLength} chars), applying smart chunking...`);
              
              if (contentLength > 50000) {
                const beginning = attachment.content.substring(0, 8000);
                const middle = attachment.content.substring(Math.floor(contentLength * 0.4), Math.floor(contentLength * 0.4) + 4000);
                const ending = attachment.content.substring(contentLength - 8000);
                processedContent = `${beginning}\n\n[... Document summary: This is a ${Math.floor(contentLength/1000)}KB document. Key sections included for analysis ...]\n\n${middle}\n\n[... continuing to end section ...]\n\n${ending}`;
              } else {
                const firstPart = attachment.content.substring(0, 12000);
                const lastPart = attachment.content.substring(contentLength - 8000);
                processedContent = `${firstPart}\n\n[... content continues - document processing optimized for analysis ...]\n\n${lastPart}`;
              }
              
              console.log(`Attachment content optimized: ${contentLength} → ${processedContent.length} characters`);
            }
          }
          
          // Create enhanced document message with processing context
          const documentContext = body.processingHints ? 
            `Document Analysis Request (${body.processingHints.documentType.toUpperCase()}): ${body.processingHints.analysisType === 'summary' ? 'Please provide a comprehensive summary' : 'Please provide detailed analysis'}` :
            `Document Content for Analysis`;
            
          const contentMessage = {
            role: 'system',
            content: `${documentContext} (${attachment.name || 'Document'}):\n\n${processedContent}`
          };
          messages.push(contentMessage);
          console.log(`✅ Added enhanced document content: ${processedContent.length} characters with processing context`);
        }
      }
    }

    // Add system message with document processing awareness
    let systemMessageAdded = false;
   
    if (body.preferences?.systemPrompts && body.preferences.systemPrompts.length > 0) {
      messages.unshift({
        role: 'system',
        content: body.preferences.systemPrompts[0].content
      });
      systemMessageAdded = true;
    } else if (body.aiConfig?.systemPrompts && body.aiConfig.systemPrompts.length > 0) {
      messages.unshift({
        role: 'system',
        content: body.aiConfig.systemPrompts[0].content
      });
      systemMessageAdded = true;
    }
   
    // Add enhanced default system message with document processing capabilities
    if (!systemMessageAdded) {
      let systemContent = 'You are BELTO, a helpful AI assistant. Use previous conversation history to maintain context.';
      
      // Enhance system message for document processing
      if (body.attachments && body.attachments.length > 0) {
        const documentTypes = body.attachments.map(att => att.name?.split('.').pop() || 'document').join(', ');
        const processingType = body.processingHints?.analysisType || 'analysis';
        
        systemContent += ` You are currently processing ${documentTypes} file(s). Provide a ${processingType === 'summary' ? 'clear and comprehensive summary' : 'detailed analysis'} based on the document content provided. Focus on key insights, important details, and actionable information.`;
        
        if (body.processingHints?.documentType === 'pdf') {
          systemContent += ' When analyzing PDF content, pay special attention to document structure, headings, and key sections.';
        }
      }
      
      messages.unshift({
        role: 'system',
        content: systemContent
      });
    }

    // Ensure each message has content and remove any empty messages
    const validMessages = messages.filter(msg => msg.content);
    
    // Optimize message content for large documents
    const optimizedMessages = validMessages.map(msg => {
      if (msg.content && msg.content.length > 20000) {
        console.log(`Large message content detected (${msg.content.length} chars), optimizing...`);
        // For very large content, take beginning and end for context
        const beginning = msg.content.substring(0, 12000);
        const ending = msg.content.substring(msg.content.length - 8000);
        return {
          ...msg,
          content: `${beginning}\n\n[... document content summarized for efficient processing ...]\n\n${ending}`
        };
      }
      return msg;
    });
   
    if (optimizedMessages.length === 0) {
      return NextResponse.json(
        { error: "No valid messages with content provided" },
        { status: 400 }
      );
    }

    console.log('Final message count being sent to AI:', optimizedMessages.length);

    // Determine appropriate timeout based on request complexity
    const requestTimeout = getTimeoutForRequest(body, optimizedMessages);

    // Prepare the request payload optimized for speed
    const aiRequestPayload = {
      model: body.aiConfig?.model || body.preferences?.model || 'default-model',
      messages: optimizedMessages,
      temperature: body.aiConfig?.temperature || body.preferences?.temperature || 0.7,
      max_tokens: Math.min(body.aiConfig?.maxTokens || body.preferences?.maxTokens || 400, 400), // Cap at 400 for speed
      stream: STREAM_RESPONSE // Enable streaming
    };

    console.log('Request payload structure:', Object.keys(aiRequestPayload));
    console.log('Message count:', aiRequestPayload.messages.length);
    console.log('Using timeout:', requestTimeout + 'ms');
    
    // Improved retry logic for better reliability
    let lastError = null;
    let maxRetries = 3; // Increased to 3 for better reliability
    let attemptedEndpoints = new Set(); // Track which endpoints we've tried
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Select the best endpoint using our load balancing algorithm
        const selectedEndpoint = selectEndpoint();
        
        // If we've already tried this endpoint and it's the only one, skip further attempts
        if (attemptedEndpoints.has(selectedEndpoint) && attemptedEndpoints.size >= endpointStats.length) {
          console.log(`All endpoints tried and failed, skipping attempt ${attempt}`);
          break;
        }
        
        attemptedEndpoints.add(selectedEndpoint);
        console.log(`Attempt ${attempt}: Selected endpoint for request: ${selectedEndpoint}`);
        
        // Add detailed logging for debugging
        console.log('Request details:', {
          endpoint: selectedEndpoint,
          timeout: requestTimeout,
          payloadSize: JSON.stringify(aiRequestPayload).length,
          messageCount: aiRequestPayload.messages.length,
          attemptedEndpoints: Array.from(attemptedEndpoints)
        });
        
        // Start timing the request for performance tracking
        const requestStartTime = Date.now();

        // Make the AI API call with API key in headers
        const response = await axios.post(
          selectedEndpoint,
          aiRequestPayload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'text/event-stream' // Accept streaming responses
            },
            timeout: requestTimeout,
            responseType: 'stream', // Tell axios to handle the response as a stream
            // Add additional debugging options
            validateStatus: function (status) {
              // Consider 2xx and some 4xx as valid for debugging
              return status < 500;
            }
          }
        );

        // Calculate response time and update endpoint stats for future load balancing decisions
        const responseTime = Date.now() - requestStartTime;
        updateEndpointStats(selectedEndpoint, true, responseTime);

        console.log(`AI response received with status: ${response.status}, time: ${responseTime}ms`);

        // Handle successful response
        if (response.status === 200) {
          if (STREAM_RESPONSE) {
            // For streaming responses, we pipe the stream back to the client
            const stream = response.data;
            return new NextResponse(stream, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              },
            });
          } else {
            // For non-streaming responses
            return NextResponse.json({
              response: response.data.choices?.[0]?.message?.content || 'No response content',
              tokenUsage: response.data.usage || {
                total_tokens: 0,
                prompt_tokens: 0,
                completion_tokens: 0
              }
            });
          }
        } else {
          // Non-200 but non-500 status codes should be treated as errors
          throw new Error(`HTTP ${response.status}: ${response.data?.error?.message || 'Unknown error'}`);
        }
      } catch (error) {
        lastError = error;
        
        // Update endpoint stats for failures if we know which endpoint failed
        if (error.config?.url) {
          updateEndpointStats(error.config.url, false, 0);
          console.log(`Updated stats for ${error.config.url} to reflect failure`);
        }

        console.error(`Attempt ${attempt} failed:`, {
          message: error.message,
          status: error.response?.status,
          code: error.code,
          url: error.config?.url
        });

        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries && attemptedEndpoints.size < endpointStats.length) {
          const waitTime = Math.min(attempt * 500, 1500); // Progressive delay: 500ms, 1000ms, 1500ms max
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // If we get here, all retries failed
    const error = lastError;

    // Log detailed error information
    console.error('AI API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
      url: error.config?.url,
      requestBody: error.config?.data ? JSON.parse(error.config.data) : 'No request body'
    });

    // Provide more specific error messages based on the error type
    let errorMessage = 'Failed to generate AI response';
    let statusCode = 500;
    let errorDetails = {
      message: error.message,
      code: error.code,
      status: error.response?.status
    };

    // Enhanced error handling with endpoint diagnostics
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.error('Connection error details:', {
        code: error.code,
        endpoint: error.config?.url,
        timeout: requestTimeout,
        availableEndpoints: endpointStats.filter(e => e.isAvailable).length,
        totalEndpoints: endpointStats.length
      });
      
      // If fallback is enabled and all endpoints failed, provide a helpful response
      if (ENABLE_FALLBACK_RESPONSES) {
        // Determine if this was a complex request for better error messaging
        const hasAttachments = body.attachments && body.attachments.length > 0;
        const isComplexRequest = requestTimeout > BASE_TIMEOUT_MS;
        
        // For document attachments, try to provide enhanced basic analysis instead of complete failure
        if (hasAttachments && body.attachments[0].content) {
          const content = body.attachments[0].content;
          const fileName = body.attachments[0].name || 'document';
          const hints = body.processingHints;
          
          console.log('📄 Generating enhanced fallback analysis for document:', fileName);
          
          // Enhanced document analysis using processing hints
          let basicAnalysis = `📄 **Document Analysis for ${fileName}**\n\n`;
          
          // Use processing hints for better analysis
          if (hints) {
            basicAnalysis += `*Document Type:* ${hints.documentType.toUpperCase()}\n`;
            basicAnalysis += `*Analysis Type:* ${hints.analysisType === 'summary' ? 'Summary' : 'Detailed Analysis'}\n`;
            basicAnalysis += `*Content Size:* ${Math.floor(hints.contentLength/1000)}KB\n\n`;
          }
          
          // Analyze document structure and content
          const wordCount = content.split(/\s+/).length;
          const paragraphCount = content.split(/\n\s*\n/).length;
          const hasHeadings = /^#+\s|\n#+\s|heading|title|chapter|section/i.test(content);
          const hasNumbers = /\b\d+(\.\d+)?\b/.test(content);
          const hasCode = /```|function|class|var|let|const|public|private/.test(content);
          const hasBullets = /^\s*[\*\-\•]/m.test(content);
          const hasLinks = /https?:\/\/|www\./i.test(content);
          
          // Document statistics
          basicAnalysis += `**Document Overview:**\n`;
          basicAnalysis += `• ${wordCount} words across ${paragraphCount} sections\n`;
          
          if (hasHeadings) basicAnalysis += `• Structured with headings and sections\n`;
          if (hasCode) basicAnalysis += `• Contains code or technical content\n`;
          if (hasNumbers) basicAnalysis += `• Includes numerical data and statistics\n`;
          if (hasBullets) basicAnalysis += `• Uses bullet points and lists\n`;
          if (hasLinks) basicAnalysis += `• Contains web links or references\n`;
          
          // Extract key content sections
          const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
          const firstSentence = sentences[0]?.trim();
          const lastSentence = sentences[sentences.length - 1]?.trim();
          
          if (firstSentence) {
            basicAnalysis += `\n**Opening Content:**\n"${firstSentence}..."\n`;
          }
          
          // Try to identify key topics/themes
          const commonWords = content.toLowerCase()
            .split(/\W+/)
            .filter(word => word.length > 4)
            .reduce((acc, word) => {
              acc[word] = (acc[word] || 0) + 1;
              return acc;
            }, {});
            
          const topWords = Object.entries(commonWords)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([word]) => word);
            
          if (topWords.length > 0) {
            basicAnalysis += `\n**Key Themes:** ${topWords.join(', ')}\n`;
          }
          
          if (lastSentence && lastSentence !== firstSentence) {
            basicAnalysis += `\n**Conclusion Area:**\n"${lastSentence}..."\n`;
          }
          
          // Provide specific suggestions based on processing hints
          basicAnalysis += `\n**🔧 Service Status:** Experiencing connectivity issues with full AI processing\n`;
          basicAnalysis += `\n**💡 Recommendations:**\n`;
          
          if (hints?.analysisType === 'summary') {
            basicAnalysis += `• Ask for analysis of specific sections\n`;
            basicAnalysis += `• Request summary of particular topics\n`;
            basicAnalysis += `• Break down into smaller questions\n`;
          } else {
            basicAnalysis += `• Focus on specific aspects of the document\n`;
            basicAnalysis += `• Ask about particular data points\n`;
            basicAnalysis += `• Request analysis of specific sections\n`;
          }
          
          basicAnalysis += `• Try again in a few moments for full AI processing\n`;
          
          return NextResponse.json({
            response: basicAnalysis,
            tokenUsage: { total_tokens: 75, prompt_tokens: 35, completion_tokens: 40 },
            fallback: true,
            partialAnalysis: true,
            processingHints: hints,
            suggestions: [
              `Analyze specific sections of ${fileName}`,
              `Request details about particular topics`,
              `Ask questions about the document structure`,
              `Try again for full AI processing`
            ]
          });
        }
        
        let fallbackMessage;
        if (isComplexRequest) {
          fallbackMessage = "I'm experiencing connectivity issues while processing your complex request. The AI service may be temporarily unavailable. Please try with a simpler question or wait a moment and try again.";
        } else {
          fallbackMessage = "I'm currently experiencing connectivity issues with my AI service. The endpoints may be temporarily unavailable. Please try again in a few moments, or contact support if this persists.";
        }
        
        return NextResponse.json({
          response: fallbackMessage,
          tokenUsage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 },
          fallback: true,
          error: "Service temporarily unavailable"
        });
      }
      
      errorMessage = `Could not connect to AI service. The service might be down or unreachable. Tried ${endpointStats.length} endpoints.`;
      statusCode = 503; // Service Unavailable
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication failed with the AI service. Please check API key configuration.';
      statusCode = 500;
    } else if (error.response?.status === 400) {
      errorMessage = 'The AI service rejected the request. Check the request format.';
      statusCode = 400;
    } else if (error.response?.data?.error) {
      errorMessage = `AI service error: ${error.response.data.error.message || 'Unknown error'}`;
    }

    return NextResponse.json(
      { 
        error: errorMessage, 
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  } catch (error) {
    // Fallback error handler
    console.error('Unexpected error in AI proxy:', error);
    return NextResponse.json(
      { 
        error: 'Unexpected server error', 
        details: { message: error.message },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return NextResponse.json({}, { status: 200 });
}