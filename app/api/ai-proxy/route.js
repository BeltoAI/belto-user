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

// Find healthy endpoint
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

export async function POST(request) {
  try {
    console.log('[AI Proxy] POST request received');
    
    const { messages } = await request.json();
    console.log('[AI Proxy] Messages received:', messages?.length || 0);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Find a healthy endpoint first
    const selectedEndpoint = await findHealthyEndpoint();
    console.log(`[AI Proxy] Using endpoint: ${selectedEndpoint.name}`);

    try {
      const requestConfig = formatRequestForEndpoint(selectedEndpoint.url, messages);
      console.log(`[AI Proxy] Sending request without timeout...`);
      
      const startTime = Date.now();
      
      // NO TIMEOUT - wait for complete response
      const response = await axios.post(requestConfig.url, requestConfig.data, {
        headers: requestConfig.headers
        // No timeout to ensure complete responses
      });

      const responseTime = Date.now() - startTime;
      console.log(`[AI Proxy] Response received in ${responseTime}ms`);

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
      console.error(`[AI Proxy] Request failed:`, error.message);
      
      return NextResponse.json({ 
        error: 'Request failed', 
        details: error.message 
      }, { status: 503 });
    }

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
