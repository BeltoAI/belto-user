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

// Simple request formatter
function formatRequestForEndpoint(endpoint, messages) {
  const endpointConfig = endpoints.find(e => e.url === endpoint);
  
  if (endpointConfig.type === 'chat') {
    return {
      url: endpoint,
      data: {
        model: 'local',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
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
        temperature: 0.7,
        max_tokens: 1000
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

export async function POST(request) {
  try {
    console.log('[AI Proxy] POST request received');
    
    const { messages } = await request.json();
    console.log('[AI Proxy] Messages received:', messages?.length || 0);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Use the primary endpoint
    const primaryEndpoint = endpoints[0];
    console.log(`[AI Proxy] Using endpoint: ${primaryEndpoint.name}`);

    try {
      const requestConfig = formatRequestForEndpoint(primaryEndpoint.url, messages);
      console.log(`[AI Proxy] Sending request...`);
      
      const response = await axios.post(requestConfig.url, requestConfig.data, {
        headers: requestConfig.headers,
        timeout: 30000
      });

      console.log(`[AI Proxy] Response received`);

      if (response.data) {
        const parsedResponse = parseResponseFromEndpoint(response, primaryEndpoint.url);
        
        if (!parsedResponse.content || parsedResponse.content.trim().length === 0) {
          throw new Error('Empty response content');
        }
        
        let finalContent = cleanResponseContent(parsedResponse.content);
        
        if (!finalContent || finalContent.trim().length < 10) {
          finalContent = "I am BELTO AI, your educational assistant. How can I help you today?";
        }
        
        console.log(`[AI Proxy] Success! Response ready`);
        
        return NextResponse.json({
          response: finalContent,
          model: primaryEndpoint.model,
          endpoint: primaryEndpoint.name
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
    version: '1.0.0',
    endpoints: endpoints.length,
    message: 'AI Proxy Simplified'
  });
}

export async function OPTIONS(request) {
  return NextResponse.json({}, { status: 200 });
}
