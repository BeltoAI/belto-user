// Test script for new fast endpoints integration
const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testNewEndpoints() {
  console.log('🚀 Testing New Fast Endpoints Integration');
  console.log('=========================================');
  
  // Test 1: Simple message to test endpoint selection
  console.log('\n1. Testing simple message (should use fastest endpoint)...');
  try {
    const startTime = Date.now();
    const response = await axios.post(`${API_BASE}/api/ai-proxy`, {
      message: "Hello! How are you today?"
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Simple message test: ${responseTime}ms`);
    console.log(`Response: ${response.data.response?.substring(0, 100)}...`);
    console.log(`Tokens: ${response.data.tokenUsage?.total_tokens || 0}`);
    console.log(`Fallback: ${response.data.fallback || false}`);
  } catch (error) {
    console.error(`❌ Simple message test failed: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
  }

  // Test 2: Complex message to test performance
  console.log('\n2. Testing complex message...');
  try {
    const startTime = Date.now();
    const response = await axios.post(`${API_BASE}/api/ai-proxy`, {
      message: "Explain the concept of machine learning, including supervised and unsupervised learning, with examples of each type."
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Complex message test: ${responseTime}ms`);
    console.log(`Response length: ${response.data.response?.length || 0} chars`);
    console.log(`Tokens: ${response.data.tokenUsage?.total_tokens || 0}`);
    console.log(`Fallback: ${response.data.fallback || false}`);
  } catch (error) {
    console.error(`❌ Complex message test failed: ${error.message}`);
  }

  // Test 3: Chat history to test conversation handling
  console.log('\n3. Testing with chat history...');
  try {
    const startTime = Date.now();
    const response = await axios.post(`${API_BASE}/api/ai-proxy`, {
      message: "What did I just ask you about?",
      history: [
        { role: 'user', content: 'Tell me about quantum computing' },
        { role: 'assistant', content: 'Quantum computing is a revolutionary technology that uses quantum mechanics principles...' }
      ]
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ Chat history test: ${responseTime}ms`);
    console.log(`Response: ${response.data.response?.substring(0, 100)}...`);
    console.log(`Tokens: ${response.data.tokenUsage?.total_tokens || 0}`);
  } catch (error) {
    console.error(`❌ Chat history test failed: ${error.message}`);
  }

  // Test 4: Check endpoint status
  console.log('\n4. Checking endpoint status...');
  try {
    const response = await axios.get(`${API_BASE}/api/ai-proxy/status`);
    console.log('✅ Status check successful:');
    console.log(`Total endpoints: ${response.data.totalEndpoints}`);
    console.log(`Status: ${response.data.status}`);
    response.data.endpoints.forEach((endpoint, index) => {
      console.log(`  ${index + 1}. ${endpoint.url} - ${endpoint.status}`);
    });
  } catch (error) {
    console.error(`❌ Status check failed: ${error.message}`);
  }

  // Test 5: Speed comparison test
  console.log('\n5. Running speed comparison test...');
  const testMessages = [
    "Hi there!",
    "What's the weather like?",
    "Tell me a joke",
    "Explain photosynthesis",
    "What is 2+2?"
  ];

  const results = [];
  for (let i = 0; i < testMessages.length; i++) {
    try {
      const startTime = Date.now();
      const response = await axios.post(`${API_BASE}/api/ai-proxy`, {
        message: testMessages[i]
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      const responseTime = Date.now() - startTime;
      results.push(responseTime);
      console.log(`  Test ${i + 1}: ${responseTime}ms - "${testMessages[i]}"`);
    } catch (error) {
      console.log(`  Test ${i + 1}: FAILED - "${testMessages[i]}"`);
      results.push(null);
    }
  }

  const validResults = results.filter(r => r !== null);
  if (validResults.length > 0) {
    const avgTime = Math.round(validResults.reduce((sum, time) => sum + time, 0) / validResults.length);
    const minTime = Math.min(...validResults);
    const maxTime = Math.max(...validResults);
    
    console.log(`\n📊 Speed Test Results:`);
    console.log(`  Average: ${avgTime}ms`);
    console.log(`  Fastest: ${minTime}ms`);
    console.log(`  Slowest: ${maxTime}ms`);
    console.log(`  Success Rate: ${validResults.length}/${results.length} (${Math.round(validResults.length/results.length*100)}%)`);
  }

  console.log('\n🎯 Test Summary:');
  console.log('If speeds are consistently under 5 seconds, the new fast endpoints are working!');
  console.log('Expected performance: 1-3 seconds for simple messages, 3-6 seconds for complex ones.');
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get(`${API_BASE}/api/ai-proxy/status`, { timeout: 5000 });
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server not accessible. Please start the development server with: npm run dev');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testNewEndpoints();
  }
}

main().catch(console.error);
