const axios = require('axios');

async function testAIProxy() {
  console.log('🧪 Testing AI Proxy Direct...');
  
  // Test 1: Simple message
  console.log('\n1. Testing simple message...');
  try {
    const response = await axios.post('http://localhost:3000/api/ai-proxy', {
      message: "Hello, how are you?"
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Simple message test successful:');
    console.log('Response:', response.data.response?.substring(0, 100) + '...');
    console.log('Fallback:', response.data.fallback || false);
    console.log('Token usage:', response.data.tokenUsage);
  } catch (error) {
    console.error('❌ Simple message test failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
  }
  
  // Test 2: Document attachment
  console.log('\n2. Testing document attachment...');
  try {
    const response = await axios.post('http://localhost:3000/api/ai-proxy', {
      prompt: "Please summarize this document",
      attachments: [{
        name: "test-document.txt",
        content: "This is a test document with some content that needs to be analyzed. It contains information about various topics including technology, business processes, and user requirements. The document discusses the importance of proper testing and validation in software development projects."
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Document attachment test successful:');
    console.log('Response:', response.data.response?.substring(0, 100) + '...');
    console.log('Fallback:', response.data.fallback || false);
    console.log('Token usage:', response.data.tokenUsage);
  } catch (error) {
    console.error('❌ Document attachment test failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
  }
  
  // Test 3: Check endpoint health
  console.log('\n3. Checking endpoint health...');
  try {
    const response = await axios.get('http://localhost:3000/api/ai-proxy');
    
    console.log('✅ Health check successful:');
    console.log('Status:', response.data.status);
    console.log('Endpoints:');
    response.data.endpoints.forEach((endpoint, index) => {
      console.log(`  ${index + 1}. ${endpoint.url}`);
      console.log(`     Available: ${endpoint.isAvailable}`);
      console.log(`     Fail Count: ${endpoint.failCount}`);
      console.log(`     Circuit Breaker: ${endpoint.circuitBreakerOpen}`);
    });
  } catch (error) {
    console.error('❌ Health check failed:');
    console.error('Error:', error.response?.data || error.message);
  }
}

testAIProxy();
