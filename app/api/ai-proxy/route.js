import { NextResponse } from 'next/server';
import axios from 'axios';

const endpoints = [
  'http://47.34.185.47:9999/v1/chat/completions',
  'http://belto.myftp.biz:9999/v1/chat/completions'
];

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

const TIMEOUT_MS = 25000; // 25 seconds timeout for Vercel compatibility
const MAX_CONSECUTIVE_FAILURES = 2; // Reduce failures before marking endpoint as unavailable
const RETRY_INTERVAL_MS = 30000; // Try unavailable endpoints again after 30 seconds
const HEALTH_CHECK_THRESHOLD = 180000; // 3 minutes in ms
const CIRCUIT_BREAKER_THRESHOLD = 3; // Number of failures to open circuit breaker
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute timeout for circuit breaker

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
    // All endpoints are unavailable or circuit breaker is open, reset the first one for retry
    console.log('All endpoints unavailable or circuit breaker open, resetting the first one for retry');
    endpointStats[0].isAvailable = true;
    endpointStats[0].failCount = 0;
    endpointStats[0].consecutiveFailures = 0;
    endpointStats[0].circuitBreakerOpen = false;
    return endpointStats[0].url;
  }
  
  // Choose the fastest available endpoint with the least recent activity
  availableEndpoints.sort((a, b) => {
    // Prioritize endpoints with faster response times
    if (a.lastResponseTime !== b.lastResponseTime) {
      return a.lastResponseTime - b.lastResponseTime;
    }
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
}   // Gradually reduce fail count on success
    if (endpoint.failCount > 0) {
      endpoint.failCount = Math.max(0, endpoint.failCount - 1);
    }
  } else {
    endpoint.failCount++;
    endpoint.consecutiveFailures++;
    
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
setInterval(() => {
  const now = Date.now();
  // Only perform health check if enough time has passed since the last check
  const needsCheck = endpointStats.some(
    endpoint => now - endpoint.lastChecked > HEALTH_CHECK_THRESHOLD
  );
  
  if (needsCheck) {
    healthCheck();
  }
}, HEALTH_CHECK_THRESHOLD);

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
      const newUserMessage = { role: 'user', content: body.prompt };
      const isDuplicate = messages.some(existingMsg =>
        existingMsg.role === 'user' &&
        existingMsg.content === body.prompt
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

    // Add system message if preferences contains it
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
   
    // Add default system message if none provided
    if (!systemMessageAdded) {
      messages.unshift({
        role: 'system',
        content: 'You are a helpful AI assistant named BELTO. Use previous conversation history to maintain context.'
      });
    }

    // Ensure each message has content and remove any empty messages
    const validMessages = messages.filter(msg => msg.content);
   
    if (validMessages.length === 0) {
      return NextResponse.json(
        { error: "No valid messages with content provided" },
        { status: 400 }
      );
    }

    console.log('Final message count being sent to AI:', validMessages.length);

    // Prepare the request payload based on the expected format
    const aiRequestPayload = {
      model: body.aiConfig?.model || body.preferences?.model || 'default-model',
      messages: validMessages,
      temperature: body.aiConfig?.temperature || body.preferences?.temperature || 0.7,
      max_tokens: body.aiConfig?.maxTokens || body.preferences?.maxTokens || 500,
    };

    console.log('Request payload structure:', Object.keys(aiRequestPayload));
    console.log('Message count:', aiRequestPayload.messages.length);
    
    // Implement retry logic for better reliability
    let lastError = null;
    let maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Select the best endpoint using our load balancing algorithm
        const selectedEndpoint = selectEndpoint();
        console.log(`Attempt ${attempt}: Selected endpoint for request: ${selectedEndpoint}`);
        
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
            },
            timeout: TIMEOUT_MS,
          }
        );

        // Calculate response time and update endpoint stats for future load balancing decisions
        const responseTime = Date.now() - requestStartTime;
        updateEndpointStats(selectedEndpoint, true, responseTime);

        console.log(`AI response received with status: ${response.status}, time: ${responseTime}ms`);

        return NextResponse.json({
          response: response.data.choices?.[0]?.message?.content || 'No response content',
          tokenUsage: response.data.usage || {
            total_tokens: 0,
            prompt_tokens: 0,
            completion_tokens: 0
          }
        });
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
        if (attempt < maxRetries) {
          const waitTime = attempt * 1000; // Progressive delay: 1s, 2s
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

    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Could not connect to AI service. The service might be down or unreachable.';
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