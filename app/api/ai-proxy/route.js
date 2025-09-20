import { NextResponse } from 'next/server';
import axios from 'axios';

// Simple endpoint configuration
const endpoints = [
  {
    url: 'http://bel2ai.duckdns.org:8001/v1/chat/completions',
    name: 'Llama 3.1 8B Instruct (RTX 3090)',
    model: 'Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf',
    type: 'chat',
    priority: 1
  },
  {
    url: 'http://bel2ai.duckdns.org:8002/v1/completions',
    name: 'GPT-OSS 20B (RTX 3090)',
    model: 'gpt-oss-20b.Q8_0.gguf',
    type: 'completion',
    priority: 2
  },
  {
    url: 'http://bigbelto.duckdns.org:8004/v1/completions',
    name: 'GPT-OSS 20B F16 (RTX 4090)',
    model: 'gpt-oss-20b-F16.gguf',
    type: 'completion',
    priority: 3
  }
];

// Simple response cleaning function
function cleanResponseContent(content) {
  if (!content) return '';
  
  // Remove thinking process patterns
  let cleaned = content
    .replace(/```thinking[\s\S]*?```/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/\*thinking\*[\s\S]*?\*\/thinking\*/gi, '')
    .replace(/Let me think[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '')
    .replace(/I need to[\s\S]*?(?=\n\n|\n[A-Z]|$)/gi, '');
  
  return cleaned.trim();
}

// Simple request formatter - NO TIMEOUTS for complete responses
function formatRequestForEndpoint(endpoint, messages) {
  const endpointConfig = endpoints.find(e => e.url === endpoint);
  
  if (endpointConfig.type === 'chat') {
    return {
      url: endpoint,
      data: {
        model: 'local',
        messages: messages,
        temperature: 0.7
        // No max_tokens limit for complete responses
      },
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } else {
    const prompt = messages.map(msg => {
      if (msg.role === 'user') return `User: ${msg.content}`;
      if (msg.role === 'assistant') return `BELTO AI: ${msg.content}`;
      return msg.content;
    }).join('\n') + '\nBELTO AI:';
    
    return {
      url: endpoint,
      data: {
        model: 'local',
        prompt: prompt,
        temperature: 0.7
        // No max_tokens limit for complete responses
      },
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
}

// Simple response parser
function parseResponseFromEndpoint(response, endpoint) {
  const endpointConfig = endpoints.find(e => e.url === endpoint);
  
  if (endpointConfig.type === 'chat' && response.data.choices?.[0]?.message?.content) {
    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage
    };
  } else if (response.data.choices?.[0]?.text) {
    return {
      content: response.data.choices[0].text,
      usage: response.data.usage
    };
  }
  
  throw new Error('Invalid response format');
}

// Health check function
async function quickHealthCheck(endpointConfig) {
  try {
    console.log(`🔍 Health checking ${endpointConfig.name}...`);
    
    let testPayload;
    if (endpointConfig.type === 'chat') {
      testPayload = {
        model: 'local',
        messages: [{ role: 'user', content: 'test' }],
        temperature: 0.1,
        max_tokens: 5
      };
    } else {
      testPayload = {
        model: 'local',
        prompt: 'User: test\nBELTO AI:',
        temperature: 0.1,
        max_tokens: 5
      };
    }
    
    const response = await axios.post(endpointConfig.url, testPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    console.log(`✅ ${endpointConfig.name} is healthy`);
    return response.status === 200;
    
  } catch (error) {
    console.log(`❌ ${endpointConfig.name} health check failed: ${error.message}`);
    return false;
  }
}

// Find healthy endpoint with fallback strategy
async function findHealthyEndpoint() {
  console.log('🎯 Finding healthy endpoint...');
  
  for (const endpoint of endpoints) {
    const isHealthy = await quickHealthCheck(endpoint);
    if (isHealthy) {
      console.log(`🎯 Selected healthy endpoint: ${endpoint.name}`);
      return endpoint;
    }
  }
  
  console.log('⚠️ No healthy endpoints found, using primary');
  return endpoints[0]; // Fallback to primary
}

// Get timeout based on message complexity
function getSmartTimeout(messages) {
  const userMessage = messages.find(m => m.role === 'user')?.content || '';
  const messageLength = userMessage.length;
  
  // Base timeout for simple messages
  if (messageLength < 20) {
    return 15000; // 15 seconds for simple greetings
  } else if (messageLength < 100) {
    return 25000; // 25 seconds for medium questions
  } else {
    return 45000; // 45 seconds for complex questions
  }
}

export async function POST(request) {
  try {
    console.log('[AI Proxy] POST request received');
    
    const requestBody = await request.json();
    console.log('[AI Proxy] Request body received:', JSON.stringify(requestBody, null, 2));
    
    // Handle both formats: direct messages array or chat interface format
    let messages;
    
    if (requestBody.messages && Array.isArray(requestBody.messages)) {
      // Direct format (Thunder Client, external API calls)
      messages = requestBody.messages;
      console.log('[AI Proxy] Using direct messages format');
    } else if (requestBody.prompt) {
      // Chat interface format
      console.log('[AI Proxy] Converting chat interface format to messages');
      messages = [];
      
      // Add history messages first
      if (requestBody.history && Array.isArray(requestBody.history)) {
        messages.push(...requestBody.history);
      }
      
      // Add current user message
      messages.push({
        role: 'user',
        content: requestBody.prompt
      });
      
      console.log('[AI Proxy] Converted to messages:', messages.length);
    } else {
      console.log('[AI Proxy] VALIDATION FAILED: No valid format found');
      return NextResponse.json({ 
        error: 'Invalid request format. Expected either "messages" array or "prompt" with optional "history"' 
      }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('[AI Proxy] VALIDATION FAILED:', {
        hasMessages: !!messages,
        isArray: Array.isArray(messages),
        length: messages?.length || 0,
        fullRequest: requestBody
      });
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Get smart timeout based on message complexity
    const smartTimeout = getSmartTimeout(messages);
    console.log(`[AI Proxy] Using smart timeout: ${smartTimeout}ms`);

    // Try multiple endpoints with fallback strategy
    let lastError = null;
    
    for (let i = 0; i < endpoints.length; i++) {
      const selectedEndpoint = endpoints[i];
      console.log(`[AI Proxy] Attempting endpoint ${i + 1}/${endpoints.length}: ${selectedEndpoint.name}`);

      try {
        // Quick health check first
        const isHealthy = await quickHealthCheck(selectedEndpoint);
        if (!isHealthy && i < endpoints.length - 1) {
          console.log(`[AI Proxy] ${selectedEndpoint.name} failed health check, trying next...`);
          continue;
        }

        const requestConfig = formatRequestForEndpoint(selectedEndpoint.url, messages);
        console.log(`[AI Proxy] Sending request with ${smartTimeout}ms timeout...`);
        
        const startTime = Date.now();
        
        // Use smart timeout to balance completeness with reliability
        const response = await axios.post(requestConfig.url, requestConfig.data, {
          headers: requestConfig.headers,
          timeout: smartTimeout,
          // Better connection handling
          maxRedirects: 0,
          responseType: 'json'
        });

        const responseTime = Date.now() - startTime;
        console.log(`[AI Proxy] Response received in ${responseTime}ms from ${selectedEndpoint.name}`);

        if (response.data) {
          const parsedResponse = parseResponseFromEndpoint(response, selectedEndpoint.url);
          
          if (!parsedResponse.content || parsedResponse.content.trim().length === 0) {
            throw new Error('Empty response content');
          }
          
          let finalContent = cleanResponseContent(parsedResponse.content);
          
          if (!finalContent || finalContent.trim().length < 10) {
            finalContent = "I am BELTO AI, your educational assistant. How can I help you today?";
          }
          
          console.log(`[AI Proxy] Success! Response length: ${finalContent.length} characters`);
          
          return NextResponse.json({
            response: finalContent,
            model: selectedEndpoint.model,
            endpoint: selectedEndpoint.name,
            responseTime: responseTime,
            tokenUsage: parsedResponse.usage
          });
        } else {
          throw new Error('No data in response');
        }
        
      } catch (error) {
        lastError = error;
        console.error(`[AI Proxy] ${selectedEndpoint.name} failed:`, error.message);
        
        // If this is a socket hang up or timeout, try next endpoint
        if (error.code === 'ECONNABORTED' || error.message.includes('socket hang up') || error.code === 'ECONNRESET') {
          console.log(`[AI Proxy] Connection issue with ${selectedEndpoint.name}, trying next endpoint...`);
          if (i < endpoints.length - 1) {
            continue; // Try next endpoint
          }
        } else {
          // For other errors, also try next endpoint as fallback
          if (i < endpoints.length - 1) {
            console.log(`[AI Proxy] Error with ${selectedEndpoint.name}, trying next endpoint...`);
            continue;
          }
        }
      }
    }

    // If all endpoints failed, return the last error
    console.error('[AI Proxy] All endpoints failed');
    return NextResponse.json({ 
      error: 'All endpoints failed', 
      details: lastError?.message || 'Unknown error',
      suggestion: 'Please try again with a shorter message or try again later.'
    }, { status: 503 });

  } catch (error) {
    console.error('[AI Proxy] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  return NextResponse.json({
    status: 'online',
    version: '2.0.0',
    endpoints: endpoints.length,
    availableEndpoints: endpoints,
    features: [
      'Health-check based endpoint selection',
      'No timeout limits for complete responses',
      'Response cleaning (no thinking process)',
      'Priority-based endpoint selection'
    ],
    message: 'AI Proxy - Health Check Approach (No Timeouts)'
  });
}

export async function OPTIONS(request) {
  return NextResponse.json({}, { status: 200 });
}
