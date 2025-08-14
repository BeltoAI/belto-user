import { NextResponse } from 'next/server';
import axios from 'axios';

const endpoints = [
  'https://670902dce12f.ngrok-free.app/completion', // DeepSeek 8B (Double 3060) - FASTEST (~40 tokens/sec)
  'https://17f2-71-84-65-200.ngrok-free.app/secure-chat', // DeepSeek 8B (Single 3060) - VERY FAST
  'http://belto.myftp.biz:9999/v1/chat/completions' // Backup endpoint
];

// Add a flag to enable fallback responses when all endpoints fail - ENABLED with better logging
const ENABLE_FALLBACK_RESPONSES = true;

// 'http://97.90.195.162:9999/v1/chat/completions',

// Endpoint health tracking with circuit breaker pattern
const endpointStats = endpoints.map(url => ({
  url,
  isAvailable: true,
  failCount: 0,
  lastResponseTime: 0,
  lastChecked: Date.now(),
  consecutiveFailures: 0,
  circuitBreakerOpen: false,
  lastCircuitBreakerCheck: Date.now()
}));

// Optimized timeouts for faster responses while maintaining reliability
const FAST_TIMEOUT_MS = 4000; // Balanced timeout for simple messages
const BASE_TIMEOUT_MS = 7000; // Balanced timeout for normal requests  
const ATTACHMENT_TIMEOUT_MS = 20000; // Reduced for faster document processing
const MAX_CONSECUTIVE_FAILURES = 2; // More balanced failure threshold
const RETRY_INTERVAL_MS = 25000; // Balanced retry interval
const HEALTH_CHECK_THRESHOLD = 120000; // Back to 2 minutes for more frequent checks
const CIRCUIT_BREAKER_THRESHOLD = 3; // More balanced circuit breaker
const CIRCUIT_BREAKER_TIMEOUT = 45000; // Reduced to 45 seconds

/**
 * Determines appropriate timeout based on request complexity - OPTIMIZED FOR SPEED
 * @param {Object} body - Request body
 * @param {Array} messages - Formatted messages array
 * @returns {number} Timeout in milliseconds
 */
function getTimeoutForRequest(body, messages) {
  // Check for attachments or large content
  const hasAttachments = body.attachments && body.attachments.length > 0;
  const hasLargeContent = messages.some(msg => msg.content && msg.content.length > 1000);
  const totalContentLength = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
  
  // ULTRA-FAST TRACK: Even more aggressive for very simple messages
  if (!hasAttachments && !hasLargeContent && totalContentLength < 100) {
    console.log(`🚀 Using ULTRA-FAST timeout (3000ms) for very simple message: ${totalContentLength} chars`);
    return 3000; // Ultra-fast for "hi", "hello", etc.
  }
  // FAST TRACK: Ultra-fast processing for simple messages
  if (!hasAttachments && !hasLargeContent && totalContentLength < 200) {
    console.log(`⚡ Using FAST timeout (${FAST_TIMEOUT_MS}ms) for simple message: ${totalContentLength} chars`);
    return FAST_TIMEOUT_MS;
  }
  // ADAPTIVE: For document/large requests, scale timeout with size
  if (hasAttachments) {
    const docSize = body.attachments.reduce((max, att) => Math.max(max, att.content?.length || 0), 0);
    if (docSize > 100000) {
      console.log(`📄 Large document detected (${docSize} chars), using 60s timeout`);
      return 60000;
    } else if (docSize > 50000) {
      console.log(`📄 Medium-large document detected (${docSize} chars), using 45s timeout`);
      return 45000;
    } else if (docSize > 20000) {
      console.log(`📄 Medium document detected (${docSize} chars), using 30s timeout`);
      return 30000;
    } else {
      console.log(`📄 Small document detected (${docSize} chars), using 20s timeout`);
      return 20000;
    }
  }
  
  // Use processing hints for smarter timeout calculation (only for complex requests)
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
  
  // Check for code-related requests (only if no fast track)
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
  
  console.log(`Using base timeout (${BASE_TIMEOUT_MS}ms) for normal request`);
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
    // All endpoints are unavailable or circuit breaker is open, reset ALL endpoints for retry
    console.log('⚠️ All endpoints unavailable or circuit breaker open, resetting ALL endpoints for retry');
    endpointStats.forEach(endpoint => {
      endpoint.isAvailable = true;
      endpoint.failCount = Math.max(0, endpoint.failCount - 1); // Reduce fail count
      endpoint.consecutiveFailures = 0;
      endpoint.circuitBreakerOpen = false;
    });
    return endpointStats[0].url;
  }
  
  // Choose the fastest available endpoint with the least recent activity
  availableEndpoints.sort((a, b) => {
    // First prioritize by availability and circuit breaker status
    if (a.circuitBreakerOpen !== b.circuitBreakerOpen) {
      return a.circuitBreakerOpen ? 1 : -1;
    }
    // Then by consecutive failures (prefer lower failures)
    if (a.consecutiveFailures !== b.consecutiveFailures) {
      return a.consecutiveFailures - b.consecutiveFailures;
    }
    // Then prioritize endpoints with faster response times (but only if they've been tested)
    if (a.lastResponseTime > 0 && b.lastResponseTime > 0) {
      return a.lastResponseTime - b.lastResponseTime;
    }
    // Finally, if response times are equal or untested, prioritize by least total failures
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
  console.log('🔍 Performing health check on all endpoints');
  
  const checks = endpoints.map(async (url) => {
    const endpoint = endpointStats.find(e => e.url === url);
    if (!endpoint) return;
    
    try {
      const startTime = Date.now();
      // Use endpoint-specific format for health check
      const testMessages = [{ role: 'user', content: 'test' }];
      const requestConfig = formatRequestForEndpoint(url, testMessages, process.env.AI_API_KEY || 'test');
      
      const response = await axios.post(requestConfig.url, requestConfig.data, {
        timeout: 8000, // Increased timeout for health check
        headers: requestConfig.headers
      });
      
      const responseTime = Date.now() - startTime;
      updateEndpointStats(url, true, responseTime);
      
      // Parse response to get content for logging
      const parsedResponse = parseResponseFromEndpoint(response, url);
      console.log(`✅ Health check for ${url}: OK (${responseTime}ms)`);
      console.log(`   Response: ${parsedResponse.content?.substring(0, 50) || 'No content'}...`);
    } catch (error) {
      console.log(`❌ Health check for ${url}: FAILED`);
      console.log(`   Error: ${error.code || error.message}`);
      console.log(`   Status: ${error.response?.status || 'No response'}`);
      console.log(`   Data: ${JSON.stringify(error.response?.data || {})}`);
      // Don't mark as failed during health check to avoid being too aggressive
      // updateEndpointStats(url, false, 0);
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

/**
 * Formats request payload and headers for different endpoint types
 * @param {string} endpoint - The endpoint URL
 * @param {Array} messages - The messages array
 * @param {string} apiKey - The API key
 * @returns {Object} Formatted request config
 */
function formatRequestForEndpoint(endpoint, messages, apiKey) {
  if (endpoint.includes('ngrok-free.app/completion')) {
    // DeepSeek 8B (Double 3060) format with enhanced BELTO AI identity enforcement
    const prompt = messages.map(msg => {
      if (msg.role === 'system') return `${msg.content}\n\nREMINDER: You are BELTO AI (NOT DeepSeek). Never mention DeepSeek or identify as any other AI. Always respond in English only.`;
      if (msg.role === 'user') return `User: ${msg.content}`;
      if (msg.role === 'assistant') return `BELTO AI: ${msg.content}`;
      return msg.content;
    }).join('\n') + '\nBELTO AI:';
    
    return {
      url: endpoint,
      data: {
        prompt: prompt,
        n_predict: 512, // Increased for more complete responses
        temperature: 0.7,
        stop: ["User:", "System:", "DeepSeek:"], // Add stop tokens including DeepSeek
        top_p: 0.9,
        repeat_penalty: 1.1
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    };
  } else if (endpoint.includes('ngrok-free.app/secure-chat')) {
    // DeepSeek 8B (Single 3060) format with enhanced BELTO AI identity enforcement
    const prompt = messages.map(msg => {
      if (msg.role === 'system') return `System: ${msg.content}\n\nCRITICAL: You are BELTO AI (NOT DeepSeek). Never identify as DeepSeek or mention being created by Chinese Company. Always respond in English only as BELTO AI.`;
      if (msg.role === 'user') return `User: ${msg.content}`;
      if (msg.role === 'assistant') return `BELTO AI: ${msg.content}`;
      return msg.content;
    }).join('\n') + '\n\nBELTO AI:';
    
    return {
      url: endpoint,
      data: {
        prompt: prompt,
        n_predict: 512, // Increased for more complete responses
        temperature: 0.7,
        stop: ["User:", "System:", "DeepSeek:", "Assistant:"], // Add stop tokens including DeepSeek
        top_p: 0.9,
        repeat_penalty: 1.1
      },
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'belto_super_secure_34892_z7d8'
      }
    };
  } else {
    // Standard OpenAI-compatible format (backup endpoint) with English constraints
    const enhancedMessages = messages.map(msg => {
      if (msg.role === 'system') {
        return {
          ...msg,
          content: `${msg.content}\n\nCRITICAL: You must ALWAYS respond in English only. Never respond in Chinese, Korean, or any other language. This is a strict requirement for BELTO AI.`
        };
      }
      return msg;
    });
    
    return {
      url: endpoint,
      data: {
        model: 'default-model',
        messages: enhancedMessages,
        max_tokens: Math.min(1000, 2000),
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    };
  }
}

/**
 * Parses response from different endpoint formats
 * @param {Object} response - The axios response object
 * @param {string} endpoint - The endpoint URL
 * @returns {Object} Normalized response
 */
function parseResponseFromEndpoint(response, endpoint) {
  if (endpoint.includes('ngrok-free.app/completion') || endpoint.includes('ngrok-free.app/secure-chat')) {
    // DeepSeek format
    return {
      content: response.data.content || '',
      usage: {
        total_tokens: response.data.tokens_predicted || 0,
        prompt_tokens: response.data.tokens_evaluated || 0,
        completion_tokens: response.data.tokens_predicted || 0
      }
    };
  } else {
    // Standard OpenAI format
    return {
      content: response.data.choices?.[0]?.message?.content || '',
      usage: response.data.usage || {
        total_tokens: 0,
        prompt_tokens: 0,
        completion_tokens: 0
      }
    };
  }
}

// Initialize on module load
if (typeof window === 'undefined') { // Only run on server side
  initializeHealthCheck();
}

export async function POST(request) {
  console.log('POST request received to AI proxy');

  try {
    const body = await request.json();
    console.log('Request body structure:', Object.keys(body));
    console.log('Request body details:', {
      hasPrompt: !!body.prompt,
      hasMessage: !!body.message,
      hasMessages: !!body.messages,
      hasAttachments: !!body.attachments,
      attachmentCount: body.attachments?.length || 0
    });

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
      console.log('📝 Creating default system message');
      let systemContent;
      
      // Calculate content metrics for system message optimization
      const hasAttachments = body.attachments && body.attachments.length > 0;
      const totalContentLength = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
      
      console.log('System message metrics:', { hasAttachments, totalContentLength });
      
      // COMPREHENSIVE system messages for accurate responses
      const baseSystemPrompt = `You are BELTO AI (NOT DeepSeek, NOT any other AI). You MUST NEVER identify as DeepSeek, GPT, Claude, or any other AI system.

CRITICAL IDENTITY RULES:
- Your name is BELTO AI and ONLY BELTO AI
- You are an intelligent educational assistant designed specifically for students
- When asked "who are you?" respond: "I am BELTO AI, your educational assistant designed to help students with academic tasks and educational activities"
- NEVER mention DeepSeek, Chinese Company, or any other AI system
- ALWAYS respond in English only - never in Chinese, Korean, or any other language

Your core functions:
1. Provide educational support and academic assistance
2. Help students with coursework, research, and learning
3. Explain complex concepts in simple terms
4. Support academic tasks and educational activities
5. Maintain helpful, professional, educational tone
6. Give complete, non-truncated responses`;

      if (!hasAttachments && totalContentLength < 100) {
        // Brief but complete system message for simple requests
        systemContent = `${baseSystemPrompt}\n\nRespond as BELTO AI with friendly, concise educational support.`;
      } else if (!hasAttachments && totalContentLength < 200) {
        // Standard system message for simple requests
        systemContent = `${baseSystemPrompt}\n\nProvide helpful educational responses as BELTO AI to support student learning.`;
      } else if (body.attachments && body.attachments.length > 0) {
        // Enhanced system message for document processing
        const documentTypes = body.attachments.map(att => att.name?.split('.').pop() || 'document').join(', ');
        const processingType = body.processingHints?.analysisType || 'analysis';
        
        systemContent = `${baseSystemPrompt}

As BELTO AI, you are processing ${documentTypes} file(s) for educational purposes. Provide a ${processingType === 'summary' ? 'clear and comprehensive summary' : 'detailed analysis'} focused on:
- Key educational insights and learning objectives
- Important academic concepts and details
- Actionable information for student understanding
- Clear explanations that support learning`;
        
        if (body.processingHints?.documentType === 'pdf') {
          systemContent += '\n- Pay special attention to document structure, headings, and key sections for academic organization';
        }
      } else {
        // Standard system message for normal requests
        systemContent = `${baseSystemPrompt}\n\nAs BELTO AI, provide educational support using conversation history for context.`;
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

    // Determine appropriate token limit based on request complexity - EDUCATIONAL FOCUS
    let maxTokens = 500; // Increased default for complete responses
    const totalContentLength = optimizedMessages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
    const hasAttachments = body.attachments && body.attachments.length > 0;
    
    // EDUCATIONAL RESPONSE OPTIMIZATION: Ensure complete, helpful responses
    if (!hasAttachments && totalContentLength < 100) {
      maxTokens = 150; // Increased for complete basic responses
      console.log(`� Using basic educational token limit (${maxTokens}) for simple message`);
    } else if (!hasAttachments && totalContentLength < 200) {
      maxTokens = 250; // Increased for comprehensive responses
      console.log(`📚 Using standard educational token limit (${maxTokens}) for simple message`);
    } else if (!hasAttachments && totalContentLength < 500) {
      maxTokens = 400; // Increased for detailed explanations
      console.log(`� Using enhanced educational token limit (${maxTokens}) for basic request`);
    } else if (!hasAttachments && totalContentLength < 1000) {
      maxTokens = 600; // Increased for comprehensive responses
      console.log(`📝 Using comprehensive token limit (${maxTokens}) for normal request`);
    } else if (hasAttachments) {
      // EDUCATIONAL DOCUMENT PROCESSING: Scale appropriately for academic content
      const docSize = body.attachments.reduce((max, att) => Math.max(max, att.content?.length || 0), 0);
      if (docSize > 100000) {
        maxTokens = 2000; // Increased for comprehensive document analysis
      } else if (docSize > 50000) {
        maxTokens = 1500; // Increased for detailed document analysis
      } else if (docSize > 20000) {
        maxTokens = 1000; // Increased for comprehensive analysis
      } else {
        maxTokens = 800; // Increased for thorough document understanding
      }
      console.log(`📄 Using adaptive token limit (${maxTokens}) for document request`);
    }

    // Prepare the request payload optimized for speed
    const aiRequestPayload = {
      model: body.aiConfig?.model || body.preferences?.model || 'default-model',
      messages: optimizedMessages,
      temperature: body.aiConfig?.temperature || body.preferences?.temperature || 0.7,
      max_tokens: Math.min(body.aiConfig?.maxTokens || body.preferences?.maxTokens || maxTokens, maxTokens),
    };

    console.log('Request payload structure:', Object.keys(aiRequestPayload));
    console.log('Message count:', aiRequestPayload.messages.length);
    console.log('Using timeout:', requestTimeout + 'ms');
    console.log('Token limit:', aiRequestPayload.max_tokens);
    
    // Validate payload before sending to prevent silent failures
    if (!aiRequestPayload.messages || aiRequestPayload.messages.length === 0) {
      console.error('❌ Empty messages array in payload');
      return NextResponse.json(
        { error: "Invalid request: No messages to process" },
        { status: 400 }
      );
    }
    
    if (!aiRequestPayload.model) {
      console.error('❌ No model specified in payload');
      return NextResponse.json(
        { error: "Invalid request: No model specified" },
        { status: 400 }
      );
    }
    
    console.log('✅ Payload validation passed, proceeding with AI request');
    
    // ADAPTIVE retry logic: more retries for document/large requests
    let lastError = null;
    let maxRetries;
    if (hasAttachments) {
      // Always try all endpoints for each retry for attachments
      maxRetries = endpoints.length * 2; // Try each endpoint at least twice
    } else if (!hasAttachments && totalContentLength < 200) {
      maxRetries = 2;
    } else if (!hasAttachments && totalContentLength < 1000) {
      maxRetries = 3;
    } else {
      maxRetries = 3;
    }

    let attemptedEndpoints = new Set(); // Track which endpoints we've tried
    let endpointAttemptOrder = [...endpoints];
    let endpointIndex = 0;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // For attachments, rotate through all endpoints before fallback
        let selectedEndpoint;
        if (hasAttachments) {
          selectedEndpoint = endpointAttemptOrder[endpointIndex % endpointAttemptOrder.length];
          endpointIndex++;
        } else {
          selectedEndpoint = selectEndpoint();
        }

        // If we've already tried this endpoint and it's the only one, skip further attempts
        if (attemptedEndpoints.has(selectedEndpoint) && attemptedEndpoints.size >= endpoints.length) {
          console.log(`All endpoints tried and failed, skipping attempt ${attempt}`);
          // For document/large requests, always try all endpoints before fallback
          if (hasAttachments && attempt < maxRetries) {
            endpointStats.forEach(endpoint => {
              endpoint.isAvailable = true;
              endpoint.consecutiveFailures = Math.max(0, endpoint.consecutiveFailures - 1);
              endpoint.circuitBreakerOpen = false;
            });
            continue;
          }
          break;
        }

        attemptedEndpoints.add(selectedEndpoint);
        console.log(`Attempt ${attempt}: Selected endpoint for request: ${selectedEndpoint}`);
        
        // Format request for the specific endpoint type
        const requestConfig = formatRequestForEndpoint(selectedEndpoint, messages, apiKey);
        
        // Add detailed logging for debugging
        console.log('🔍 Request details:', {
          endpoint: selectedEndpoint,
          timeout: requestTimeout,
          payloadSize: JSON.stringify(requestConfig.data).length,
          messageCount: messages.length,
          attemptedEndpoints: Array.from(attemptedEndpoints),
          apiKeyPresent: !!apiKey,
          apiKeyLength: apiKey ? apiKey.length : 0,
          requestType: selectedEndpoint.includes('ngrok-free.app') ? 'DeepSeek' : 'OpenAI-compatible'
        });
        
        // Start timing the request for performance tracking
        const requestStartTime = Date.now();

        // Make the AI API call with formatted request
        const response = await axios.post(
          requestConfig.url,
          requestConfig.data,
          {
            headers: requestConfig.headers,
            timeout: requestTimeout,
            // Remove validateStatus to get proper error responses
            validateStatus: function (status) {
              return status < 500; // Accept all status codes under 500
            }
          }
        );

        // Calculate response time and update endpoint stats for future load balancing decisions
        const responseTime = Date.now() - requestStartTime;
        updateEndpointStats(selectedEndpoint, true, responseTime);

        console.log(`AI response received with status: ${response.status}, time: ${responseTime}ms`);
        
        // Parse response using endpoint-specific parser
        const parsedResponse = parseResponseFromEndpoint(response, selectedEndpoint);
        
        // Handle successful response
        if (response.status === 200) {
          console.log(`✅ AI response successful: ${parsedResponse.content?.substring(0, 100)}...`);
          
          // Validate that we actually got content back
          if (!parsedResponse.content || parsedResponse.content.trim().length === 0) {
            console.error(`❌ Empty response content from ${selectedEndpoint}`);
            throw new Error('Empty response content received from AI service');
          }
          
          return NextResponse.json({
            response: parsedResponse.content,
            tokenUsage: parsedResponse.usage
          });
        } else {
          // Log detailed error for non-200 responses
          console.error(`❌ Non-200 response from ${selectedEndpoint}:`, {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
            headers: response.headers
          });
          
          // Non-200 but non-500 status codes should be treated as errors
          throw new Error(`HTTP ${response.status}: ${response.data?.error?.message || response.statusText || 'Unknown error'}`);
        }
      } catch (error) {
        lastError = error;
        
        // Update endpoint stats for failures if we know which endpoint failed
        if (error.config?.url) {
          updateEndpointStats(error.config.url, false, 0);
          console.log(`Updated stats for ${error.config.url} to reflect failure`);
        }

        console.error(`❌ Attempt ${attempt} failed:`, {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          code: error.code,
          url: error.config?.url,
          timeout: error.code === 'ECONNABORTED' ? requestTimeout : 'N/A'
        });

        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries && attemptedEndpoints.size < endpoints.length) {
          // ADAPTIVE: Longer wait for document/large requests
          let waitTime;
          if (hasAttachments) {
            const docSize = body.attachments.reduce((max, att) => Math.max(max, att.content?.length || 0), 0);
            if (docSize > 100000) {
              waitTime = 5000;
            } else if (docSize > 50000) {
              waitTime = 3000;
            } else {
              waitTime = 2000;
            }
          } else if (totalContentLength < 200) {
            waitTime = 300;
          } else if (totalContentLength < 1000) {
            waitTime = Math.min(attempt * 500, 1000);
          } else {
            waitTime = Math.min(attempt * 1000, 2000);
          }
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
        console.log('🔄 Triggering educational fallback response due to connection errors');
        console.log('Fallback trigger details:', {
          hasAttachments,
          contentLength: body.attachments?.[0]?.content?.length || 0,
          requestTimeout,
          baseTimeout: BASE_TIMEOUT_MS,
          attemptedEndpoints: Array.from(attemptedEndpoints),
          endpointStats: endpointStats.map(e => ({ url: e.url, isAvailable: e.isAvailable, failCount: e.failCount }))
        });
        
        if (hasAttachments && body.attachments[0].content) {
          // For document requests, return educational fallback
          return NextResponse.json({
            response: `Hello! I'm BELTO AI, your educational assistant. I'm currently experiencing some connectivity issues while processing your document, but I'm here to help with your academic needs. 

📄 **Your Document Upload**: I can see you've uploaded a document for analysis. While I work on restoring full connectivity, here are some ways I can assist you:

• **Ask specific questions** about sections of your document
• **Request summaries** of particular chapters or topics  
• **Get explanations** of key concepts within the material
• **Break down complex topics** into manageable parts

💡 **Quick Tip**: Try asking something like "What are the main points in section 2?" or "Explain the key concepts in this document" for faster processing.

I'm designed specifically to support your academic journey and educational activities. Please try your request again in a moment, or feel free to ask me about any specific part of your document!`,
            tokenUsage: { total_tokens: 150, prompt_tokens: 50, completion_tokens: 100 },
            fallback: true,
            error: "Service temporarily slow or unavailable"
          });
        }
        
        // For simple messages, provide educational identity and help
        let fallbackMessage = `Hello! I'm BELTO AI, your dedicated educational assistant designed to help students with their academic tasks and educational activities.

🎓 **How I Can Help You**:
• Answer questions about your coursework and studies
• Explain complex academic concepts in simple terms  
• Help with research and analysis
• Provide study guidance and learning support
• Assist with educational document review

I'm currently experiencing some connectivity issues with my advanced processing systems, but I'm still here to support your learning journey!`;

        if (requestTimeout > BASE_TIMEOUT_MS) {
          fallbackMessage += `\n\n⏱️ **Current Status**: Processing complex requests is taking longer than usual. For faster responses, try asking simpler questions or breaking your request into smaller parts.`;
        } else {
          fallbackMessage += `\n\n🔧 **Current Status**: My services are temporarily limited due to connectivity issues. Please try again in a few moments, and I'll be ready to help with your educational needs!`;
        }
        
        fallbackMessage += `\n\n💡 **Try asking me**: "Who are you?" or "How can you help me with my studies?" to learn more about my educational capabilities!`;
        
        return NextResponse.json({
          response: fallbackMessage,
          tokenUsage: { total_tokens: 120, prompt_tokens: 30, completion_tokens: 90 },
          fallback: true,
          error: "Service temporarily unavailable"
        });
      }
      errorMessage = `Could not connect to AI service. The service might be down or unreachable. Tried ${endpointStats.length} endpoints.`;
      statusCode = 503; // Service Unavailable
    } else if (error.response?.status === 401) {
      console.log('🔄 Triggering fallback response due to authentication error');
      errorMessage = 'Authentication failed with the AI service. Please check API key configuration.';
      statusCode = 500;
    } else if (error.response?.status === 400) {
      console.log('🔄 Triggering fallback response due to bad request error');
      console.log('Bad request details:', {
        responseData: error.response?.data,
        requestPayload: aiRequestPayload
      });
      errorMessage = 'The AI service rejected the request. Check the request format.';
      statusCode = 400;
    } else if (error.response?.data?.error) {
      console.log('🔄 Triggering fallback response due to AI service error');
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
    // Enhanced error handler to catch all types of errors
    console.error('❌ Unexpected error in AI proxy:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      type: typeof error
    });
    
    // Check if this is a ReferenceError (undefined variable)
    if (error instanceof ReferenceError) {
      console.error('🚨 ReferenceError detected - this indicates a code bug:', error.message);
    }
    
    return NextResponse.json(
      { 
        error: 'Unexpected server error', 
        details: { 
          message: error.message,
          name: error.name,
          type: error.constructor.name
        },
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return NextResponse.json({}, { status: 200 });
}

export async function GET(request) {
  // Status endpoint for debugging
  return NextResponse.json({
    status: 'online',
    endpoints: endpointStats.map(stat => ({
      url: stat.url,
      isAvailable: stat.isAvailable,
      failCount: stat.failCount,
      lastResponseTime: stat.lastResponseTime,
      consecutiveFailures: stat.consecutiveFailures,
      circuitBreakerOpen: stat.circuitBreakerOpen,
      lastChecked: new Date(stat.lastChecked).toISOString()
    })),
    apiKeyConfigured: !!process.env.AI_API_KEY,
    timestamp: new Date().toISOString()
  });
}