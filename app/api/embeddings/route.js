import { NextResponse } from 'next/server';
import axios from 'axios';

// RAG API configuration
const RAG_API_CONFIG = {
  baseUrl: 'http://ragging.duckdns.org:5005',
  apiKey: '123456789012345',
  model: 'sentence-transformers/all-MiniLM-L6-v2',
  timeout: 10000
};

/**
 * Health check endpoint - no API key required
 */
async function checkHealth() {
  try {
    const response = await axios.get(`${RAG_API_CONFIG.baseUrl}/health`, {
      timeout: RAG_API_CONFIG.timeout
    });
    return {
      status: 'healthy',
      response: response.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('RAG API health check failed:', error.message);
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get API info - requires API key
 */
async function getApiInfo() {
  try {
    const response = await axios.get(`${RAG_API_CONFIG.baseUrl}/info`, {
      headers: {
        'x-api-key': RAG_API_CONFIG.apiKey
      },
      timeout: RAG_API_CONFIG.timeout
    });
    return {
      status: 'success',
      info: response.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('RAG API info request failed:', error.message);
    return {
      status: 'error',
      error: error.message,
      statusCode: error.response?.status || 500,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Generate embeddings for text array
 */
async function generateEmbeddings(textArray) {
  try {
    if (!Array.isArray(textArray) || textArray.length === 0) {
      throw new Error('Text array is required and must not be empty');
    }

    // Validate text array contents
    const validTexts = textArray.filter(text => 
      typeof text === 'string' && text.trim().length > 0
    );

    if (validTexts.length === 0) {
      throw new Error('At least one valid text string is required');
    }

    console.log(`Generating embeddings for ${validTexts.length} text(s)`);
    
    const response = await axios.post(`${RAG_API_CONFIG.baseUrl}/embed`, {
      text: validTexts
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': RAG_API_CONFIG.apiKey
      },
      timeout: RAG_API_CONFIG.timeout
    });

    return {
      status: 'success',
      embeddings: response.data.embeddings || response.data,
      model: RAG_API_CONFIG.model,
      textCount: validTexts.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('RAG API embedding request failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    return {
      status: 'error',
      error: error.message,
      statusCode: error.response?.status || 500,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * POST handler for embedding requests
 */
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Embedding request received:', {
      hasText: !!body.text,
      textType: Array.isArray(body.text) ? 'array' : typeof body.text,
      textCount: Array.isArray(body.text) ? body.text.length : 'N/A'
    });

    // Validate request body
    if (!body.text) {
      return NextResponse.json({
        error: 'Text field is required',
        example: {
          text: ["Example text 1", "Example text 2"]
        }
      }, { status: 400 });
    }

    // Convert single text to array if needed
    const textArray = Array.isArray(body.text) ? body.text : [body.text];

    // Generate embeddings
    const result = await generateEmbeddings(textArray);

    if (result.status === 'error') {
      return NextResponse.json({
        error: result.error,
        timestamp: result.timestamp
      }, { status: result.statusCode });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Unexpected error in embeddings endpoint:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET handler for health check and info
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'health':
        const healthResult = await checkHealth();
        return NextResponse.json(healthResult);

      case 'info':
        const infoResult = await getApiInfo();
        if (infoResult.status === 'error') {
          return NextResponse.json(infoResult, { status: infoResult.statusCode });
        }
        return NextResponse.json(infoResult);

      case 'test':
        // Quick test with sample data
        const testResult = await generateEmbeddings(["Smoke test"]);
        if (testResult.status === 'error') {
          return NextResponse.json(testResult, { status: testResult.statusCode });
        }
        return NextResponse.json({
          message: 'Test successful',
          ...testResult
        });

      default:
        // Default response with API information
        return NextResponse.json({
          message: 'RAG Embeddings API',
          model: RAG_API_CONFIG.model,
          endpoints: {
            health: '/api/embeddings?action=health',
            info: '/api/embeddings?action=info',
            test: '/api/embeddings?action=test',
            embed: 'POST /api/embeddings'
          },
          usage: {
            POST: {
              description: 'Generate embeddings for text array',
              body: {
                text: ['Text string 1', 'Text string 2']
              }
            },
            GET: {
              description: 'Health check and info endpoints',
              parameters: {
                action: 'health | info | test'
              }
            }
          },
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Unexpected error in embeddings GET endpoint:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function OPTIONS(request) {
  return NextResponse.json({}, { status: 200 });
}
