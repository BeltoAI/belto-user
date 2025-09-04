// Test script for the updated AI endpoints and RAG API
// This script can be run with Node.js to test all endpoints

const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Adjust if running on different port

// Test AI Proxy endpoints
async function testAIProxy() {
  console.log('\n🤖 Testing AI Proxy Endpoints...\n');
  
  try {
    // Test status endpoint first
    console.log('📊 Testing AI Proxy Status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/ai-proxy`);
    console.log('✅ Status endpoint working:', statusResponse.data.status);
    console.log('Available endpoints:', statusResponse.data.availableEndpoints, '/', statusResponse.data.totalEndpoints);
    
    // Test simple message
    console.log('\n💬 Testing simple message...');
    const simpleMessage = {
      message: "Hello, who are you?",
      aiConfig: {
        temperature: 0.7,
        maxTokens: 100
      }
    };
    
    const simpleResponse = await axios.post(`${BASE_URL}/api/ai-proxy`, simpleMessage, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Simple message test successful');
    console.log('Response preview:', simpleResponse.data.response?.substring(0, 100) + '...');
    
    // Test with conversation history
    console.log('\n📜 Testing with conversation history...');
    const historyMessage = {
      messages: [
        { role: 'system', content: 'You are a helpful educational assistant.' },
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', content: '2+2 equals 4.' },
        { role: 'user', content: 'What about 3+3?' }
      ],
      aiConfig: {
        temperature: 0.5,
        maxTokens: 50
      }
    };
    
    const historyResponse = await axios.post(`${BASE_URL}/api/ai-proxy`, historyMessage, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Conversation history test successful');
    console.log('Response preview:', historyResponse.data.response?.substring(0, 100) + '...');
    
  } catch (error) {
    console.error('❌ AI Proxy test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Test RAG/Embeddings API
async function testEmbeddingsAPI() {
  console.log('\n🔍 Testing RAG Embeddings API...\n');
  
  try {
    // Test health endpoint
    console.log('🏥 Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/api/embeddings?action=health`);
    console.log('✅ Health check:', healthResponse.data.status);
    
    // Test info endpoint
    console.log('\n📋 Testing info endpoint...');
    const infoResponse = await axios.get(`${BASE_URL}/api/embeddings?action=info`);
    console.log('✅ Info endpoint working');
    console.log('Model info:', infoResponse.data.info || 'Info available');
    
    // Test quick test endpoint
    console.log('\n🧪 Testing quick test endpoint...');
    const testResponse = await axios.get(`${BASE_URL}/api/embeddings?action=test`);
    console.log('✅ Quick test successful');
    console.log('Test embeddings shape:', Array.isArray(testResponse.data.embeddings) ? `Array of ${testResponse.data.embeddings.length} embeddings` : 'Embeddings available');
    
    // Test custom embeddings
    console.log('\n📊 Testing custom embeddings...');
    const embeddingData = {
      text: [
        "Belto builds an AI Virtual TA.",
        "Testing embeddings with multiple texts.",
        "Educational technology for students."
      ]
    };
    
    const embeddingResponse = await axios.post(`${BASE_URL}/api/embeddings`, embeddingData, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Custom embeddings test successful');
    console.log('Generated embeddings for', embeddingResponse.data.textCount, 'texts');
    console.log('Model used:', embeddingResponse.data.model);
    
  } catch (error) {
    console.error('❌ Embeddings API test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

// Test all endpoint configurations
async function testEndpointConfigurations() {
  console.log('\n⚙️ Testing Individual Endpoint Configurations...\n');
  
  const testEndpoints = [
    {
      name: 'Llama 3.1 8B (Chat)',
      url: 'http://bel2ai.duckdns.org:8001/v1/chat/completions',
      type: 'chat',
      testData: {
        model: 'local',
        messages: [
          { role: 'system', content: 'You are BELTO AI, an educational assistant.' },
          { role: 'user', content: 'Say hello briefly.' }
        ],
        max_tokens: 50,
        temperature: 0.7
      }
    },
    {
      name: 'GPT-OSS 20B (Completion)',
      url: 'http://bel2ai.duckdns.org:8002/v1/completions',
      type: 'completion',
      testData: {
        model: 'local',
        prompt: 'System: You are BELTO AI, an educational assistant.\nUser: Say hello briefly.\nBELTO AI:',
        max_tokens: 50,
        temperature: 0.7
      }
    }
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`🧪 Testing ${endpoint.name}...`);
      
      const response = await axios.post(endpoint.url, endpoint.testData, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      let content = '';
      if (endpoint.type === 'chat') {
        content = response.data.choices?.[0]?.message?.content || 'No content';
      } else {
        content = response.data.choices?.[0]?.text || response.data.content || 'No content';
      }
      
      console.log(`✅ ${endpoint.name} - Success`);
      console.log(`   Response: ${content.substring(0, 100)}...`);
      
    } catch (error) {
      console.log(`❌ ${endpoint.name} - Failed`);
      console.log(`   Error: ${error.message}`);
      console.log(`   Status: ${error.response?.status || 'No response'}`);
      
      // Don't fail the entire test suite for individual endpoint failures
      // This is expected as not all endpoints may be available in testing
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive API Tests...');
  console.log('========================================\n');
  
  try {
    await testAIProxy();
    await testEmbeddingsAPI();
    
    // Optional: Test direct endpoint configurations (may fail if endpoints are not accessible)
    console.log('\n⚠️  Note: Direct endpoint tests may fail if external services are not accessible during development');
    // await testEndpointConfigurations();
    
    console.log('\n🎉 Test Suite Completed!');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n💥 Test suite failed with unexpected error:', error.message);
  }
}

// Export for use in other test files or run directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testAIProxy,
  testEmbeddingsAPI,
  testEndpointConfigurations,
  runAllTests
};
