import { NextResponse } from 'next/server';

/**
 * Analyzes the complexity of the content to determine appropriate token scaling
 */
function analyzeContentComplexity(body, messages) {
  let complexityMultiplier = 1.0; // Base multiplier
  const reasoning = [];
  
  // Calculate total content length
  const totalContentLength = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
  const hasAttachments = body.attachments && body.attachments.length > 0;
  
  // Base content complexity analysis
  if (totalContentLength < 200) {
    complexityMultiplier = 0.75; // Simple content
    reasoning.push('Simple content');
  } else if (totalContentLength < 500) {
    complexityMultiplier = 1.0; // Standard content
    reasoning.push('Standard content');
  } else if (totalContentLength < 2000) {
    complexityMultiplier = 1.3; // Moderate complexity
    reasoning.push('Moderate complexity');
  } else {
    complexityMultiplier = 1.6; // High complexity
    reasoning.push('High complexity content');
  }
  
  // Document processing scaling
  if (hasAttachments) {
    const docSize = body.attachments.reduce((max, att) => Math.max(max, att.content?.length || 0), 0);
    if (docSize > 100000) {
      complexityMultiplier *= 2.0;
      reasoning.push('Very large document');
    } else if (docSize > 50000) {
      complexityMultiplier *= 1.5;
      reasoning.push('Large document');
    } else if (docSize > 20000) {
      complexityMultiplier *= 1.3;
      reasoning.push('Medium document');
    } else {
      complexityMultiplier *= 1.1;
      reasoning.push('Small document');
    }
  }
  
  return { complexityMultiplier, reasoning: reasoning.join(', ') };
}

/**
 * Analyzes user intent to determine response requirements
 */
function analyzeUserIntent(body, messages) {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content?.toLowerCase() || '';
  let intentBonus = 0;
  
  // Greeting and simple interactions
  if (lastUserMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening|greetings)$/i)) {
    intentBonus = -200; // Reduce tokens for simple greetings
  }
  // Questions requiring detailed explanations
  else if (lastUserMessage.includes('explain') || lastUserMessage.includes('describe') || 
           lastUserMessage.includes('analyze') || lastUserMessage.includes('compare')) {
    intentBonus = 400; // Increase tokens for explanatory content
  }
  // Code-related requests
  else if (lastUserMessage.includes('code') || lastUserMessage.includes('program') || 
           lastUserMessage.includes('function') || lastUserMessage.includes('algorithm')) {
    intentBonus = 300; // Code responses need more space
  }
  // Creative writing requests
  else if (lastUserMessage.includes('write') || lastUserMessage.includes('create') || 
           lastUserMessage.includes('story') || lastUserMessage.includes('essay')) {
    intentBonus = 250; // Creative content needs more tokens
  }
  // Math and problem-solving
  else if (lastUserMessage.includes('solve') || lastUserMessage.includes('calculate') || 
           lastUserMessage.includes('math') || lastUserMessage.includes('formula')) {
    intentBonus = 200; // Math solutions benefit from detailed steps
  }
  // Simple yes/no or factual questions
  else if (lastUserMessage.includes('is ') || lastUserMessage.includes('are ') || 
           lastUserMessage.includes('can ') || lastUserMessage.includes('will ')) {
    intentBonus = -100; // Simple questions need fewer tokens
  }
  
  return intentBonus;
}

/**
 * Analyzes the context to determine additional token requirements
 */
function analyzeContextRequirements(body, messages) {
  let contextBonus = 0;
  
  // Conversation history analysis
  const conversationLength = messages.length;
  if (conversationLength > 10) {
    contextBonus += 200; // Long conversations need more context awareness
  } else if (conversationLength > 5) {
    contextBonus += 100; // Medium conversations need some extra context
  }
  
  // Attachment context analysis
  if (body.attachments && body.attachments.length > 0) {
    const totalAttachmentSize = body.attachments.reduce((sum, att) => sum + (att.content?.length || 0), 0);
    if (totalAttachmentSize > 20000) {
      contextBonus += 200; // Large attachments need comprehensive analysis
    } else if (totalAttachmentSize > 5000) {
      contextBonus += 100; // Medium attachments need moderate analysis
    } else {
      contextBonus += 50; // Small attachments need basic analysis
    }
  }
  
  // Document chunks analysis
  if (body.documentChunks && body.documentChunks.length > 0) {
    contextBonus += body.documentChunks.length * 30; // Each chunk adds context requirements
  }
  
  return Math.min(contextBonus, 400); // Cap the context bonus
}

/**
 * Calculates dynamic token limit based on content analysis
 */
function calculateDynamicTokenLimit(body, messages) {
  const baseTokens = 800;
  
  // Analyze different aspects of the request
  const { complexityMultiplier, reasoning: complexityReasoning } = analyzeContentComplexity(body, messages);
  const intentBonus = analyzeUserIntent(body, messages);
  const contextBonus = analyzeContextRequirements(body, messages);
  
  // Calculate final token limit
  const calculatedTokens = Math.round((baseTokens * complexityMultiplier) + intentBonus + contextBonus);
  
  // Apply bounds (minimum 200, maximum 2000)
  const finalTokens = Math.max(200, Math.min(2000, calculatedTokens));
  
  console.log(`🧠 Dynamic Token Calculation:
    📊 Base: ${baseTokens} tokens
    🔍 Complexity: ${complexityMultiplier}x (${complexityReasoning})
    🎯 Intent Bonus: ${intentBonus > 0 ? '+' : ''}${intentBonus}
    📋 Context Bonus: +${contextBonus}
    ➡️ Calculated: ${calculatedTokens} → Final: ${finalTokens} tokens`);
  
  return finalTokens;
}

/**
 * Formats the request for different AI endpoints
 */
function formatRequestForEndpoint(endpoint, messages, maxTokens) {
  const apiKey = process.env.AI_API_KEY;

  if (endpoint.includes('open-ai-21')) {
    return {
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'open-ai-21.p.rapidapi.com'
      },
      body: {
        messages: messages,
        web_access: false,
        max_tokens: maxTokens,
        temperature: 0.7
      }
    };
  } else if (endpoint.includes('cheapest-gpt-4-turbo')) {
    return {
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'cheapest-gpt-4-turbo-gpt-4-vision-chatgpt-openai-ai-api.p.rapidapi.com'
      },
      body: {
        model: "gpt-4",
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.7
      }
    };
  } else if (endpoint.includes('chatgpt-42')) {
    // Convert messages to simple text for this endpoint
    const conversationText = messages.map(msg => 
      `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    
    return {
      url: endpoint,
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'chatgpt-42.p.rapidapi.com'
      },
      body: {
        messages: [{ role: 'user', content: conversationText }],
        max_tokens: maxTokens,
        temperature: 0.7
      }
    };
  }

  // Default format (fallback)
  return {
    url: endpoint,
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': apiKey
    },
    body: {
      messages: messages,
      max_tokens: maxTokens,
      temperature: 0.7
    }
  };
}

export async function POST(request) {
  console.log(`🚀 Starting AI proxy request - ${new Date().toISOString()}`);

  try {
    // Enhanced request parsing with error handling
    let body;
    try {
      body = await request.json();
      console.log('📥 Request body parsed successfully');
      console.log('📥 Body keys:', Object.keys(body));
      if (body.messages) {
        console.log('📥 Messages count:', body.messages.length);
      }
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format', details: parseError.message },
        { status: 400 }
      );
    }

    const { 
      messages, 
      maxTokens: userMaxTokens, 
      attachments = [],
      sessionId = `session-${Date.now()}`,
      documentChunks = []
    } = body;

    console.log(`📨 Processing request for session: ${sessionId}`);

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('❌ Missing or invalid messages array');
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    console.log(`📚 Processing ${messages.length} messages`);
    
    // Process messages safely
    let optimizedMessages;
    try {
      console.log('🔄 Processing messages...');
      optimizedMessages = messages.map((msg, index) => {
        if (!msg || typeof msg !== 'object') {
          throw new Error(`Message at index ${index} is invalid`);
        }
        return {
          role: msg.role || 'user',
          content: msg.content || ''
        };
      });
      console.log('✅ Messages processed successfully');
    } catch (msgError) {
      console.error('❌ Error processing messages:', msgError);
      return NextResponse.json(
        { error: 'Invalid message format', details: msgError.message },
        { status: 400 }
      );
    }

    // DYNAMIC TOKEN MANAGEMENT SYSTEM - Intelligent scaling based on content and context
    let maxTokens;
    try {
      console.log('🔍 Calling calculateDynamicTokenLimit...');
      console.log('🔍 Body keys:', Object.keys(body));
      console.log('🔍 Messages length:', optimizedMessages.length);
      maxTokens = calculateDynamicTokenLimit(body, optimizedMessages);
      console.log(`🧠 Dynamic token limit calculated: ${maxTokens} tokens`);
    } catch (error) {
      console.error('❌ Error in calculateDynamicTokenLimit:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error name:', error.name);
      console.error('❌ Input body:', JSON.stringify(body, null, 2));
      console.error('❌ Input messages:', JSON.stringify(optimizedMessages, null, 2));
      
      // Simple fallback calculation without dynamic functions
      const totalContentLength = optimizedMessages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
      const hasAttachments = body.attachments && body.attachments.length > 0;
      
      if (!hasAttachments && totalContentLength < 100) {
        maxTokens = 400;
        console.log(`🔄 Using simple fallback for greeting: ${maxTokens} tokens`);
      } else if (!hasAttachments && totalContentLength < 500) {
        maxTokens = 600;
        console.log(`🔄 Using simple fallback for simple content: ${maxTokens} tokens`);
      } else if (hasAttachments) {
        const docSize = body.attachments.reduce((max, att) => Math.max(max, att.content?.length || 0), 0);
        if (docSize > 50000) {
          maxTokens = 1500;
        } else {
          maxTokens = 1000;
        }
        console.log(`🔄 Using simple fallback for document: ${maxTokens} tokens`);
      } else {
        maxTokens = 800;
        console.log(`🔄 Using simple fallback default: ${maxTokens} tokens`);
      }
    }

    // Process attachments for enhanced context
    if (attachments && attachments.length > 0) {
      console.log(`📎 Processing ${attachments.length} attachments`);
      for (const attachment of attachments) {
        if (attachment.content) {
          const contextAddition = `\n\nDocument: ${attachment.name}\nContent: ${attachment.content}`;
          const lastUserMsgIndex = optimizedMessages.map(m => m.role).lastIndexOf('user');
          if (lastUserMsgIndex >= 0) {
            optimizedMessages[lastUserMsgIndex].content += contextAddition;
          }
        }
      }
    }

    // Process document chunks if provided (for collaborative editing context)
    if (documentChunks && documentChunks.length > 0) {
      console.log(`📄 Processing ${documentChunks.length} document chunks`);
      let docContext = "\n\nDocument Context:\n";
      documentChunks.forEach((chunk, index) => {
        docContext += `\nChunk ${index + 1}: ${chunk.content}\n`;
      });
      
      const lastUserMsgIndex = optimizedMessages.map(m => m.role).lastIndexOf('user');
      if (lastUserMsgIndex >= 0) {
        optimizedMessages[lastUserMsgIndex].content += docContext;
      }
    }

    // Get API key from environment
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      console.error('❌ AI API key is not configured');
      return NextResponse.json(
        { error: 'AI API key is not configured on the server' },
        { status: 500 }
      );
    }

    // Define available AI endpoints with circuit breaker pattern
    const endpoints = [
      'https://open-ai-21.p.rapidapi.com/chatgpt',
      'https://cheapest-gpt-4-turbo-gpt-4-vision-chatgpt-openai-ai-api.p.rapidapi.com/v1/chat/completions',
      'https://chatgpt-42.p.rapidapi.com/gpt4'
    ];

    // Try endpoints in sequence until one succeeds
    let lastError = null;
    let response = null;
    let usedEndpoint = null;
    let statusCode = 200;

    console.log(`🎯 Attempting to generate response with ${maxTokens} tokens`);

    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      console.log(`🔄 Trying endpoint ${i + 1}/${endpoints.length}: ${endpoint.split('/')[2]}`);

      try {
        const formattedRequest = formatRequestForEndpoint(endpoint, optimizedMessages, maxTokens);
        
        const fetchResponse = await fetch(formattedRequest.url, {
          method: 'POST',
          headers: formattedRequest.headers,
          body: JSON.stringify(formattedRequest.body),
          timeout: 30000
        });

        console.log(`📡 Response status from ${endpoint.split('/')[2]}: ${fetchResponse.status}`);

        if (!fetchResponse.ok) {
          const errorText = await fetchResponse.text();
          console.error(`❌ Endpoint failed with status ${fetchResponse.status}:`, errorText.substring(0, 200));
          lastError = new Error(`HTTP ${fetchResponse.status}: ${errorText.substring(0, 100)}`);
          continue;
        }

        const data = await fetchResponse.json();
        console.log(`✅ Success with endpoint: ${endpoint.split('/')[2]}`);
        
        // Parse response based on endpoint format
        let content = '';
        if (endpoint.includes('open-ai-21')) {
          content = data.result || data.message || '';
        } else if (endpoint.includes('cheapest-gpt-4-turbo')) {
          content = data.choices?.[0]?.message?.content || '';
        } else if (endpoint.includes('chatgpt-42')) {
          content = data.result || data.answer || '';
        }

        if (content && content.trim()) {
          response = content.trim();
          usedEndpoint = endpoint;
          console.log(`🎉 Generated response: ${response.length} characters`);
          break;
        } else {
          console.error(`❌ Empty response from ${endpoint.split('/')[2]}:`, Object.keys(data));
          lastError = new Error('Empty response content');
          continue;
        }

      } catch (error) {
        console.error(`❌ Error with endpoint ${endpoint.split('/')[2]}:`, error.message);
        lastError = error;
        continue;
      }
    }

    // Handle case where all endpoints failed
    if (!response) {
      console.error(`❌ All ${endpoints.length} AI endpoints failed. Last error:`, lastError?.message);
      statusCode = 503;
      
      return NextResponse.json(
        { 
          error: 'All AI services are currently unavailable', 
          details: lastError?.message || 'Unknown error',
          attempted_endpoints: endpoints.length,
          timestamp: new Date().toISOString()
        },
        { status: statusCode }
      );
    }

    // Success - return the AI response with metadata
    console.log(`🎯 Request completed successfully using: ${usedEndpoint?.split('/')[2]}`);
    
    return NextResponse.json({
      response: response,
      metadata: {
        endpoint_used: usedEndpoint?.split('/')[2] || 'unknown',
        tokens_allocated: maxTokens,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        message_count: optimizedMessages.length,
        has_attachments: attachments.length > 0,
        attachment_count: attachments.length
      }
    });

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

// CORS headers for browser requests
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request) {
  return NextResponse.json({ message: 'AI Proxy is running', timestamp: new Date().toISOString() });
}
