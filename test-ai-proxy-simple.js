/**
 * Simple test to check AI proxy functionality
 */

const axios = require('axios');

async function testAIProxy() {
  console.log('🧪 Testing AI Proxy...');
  
  try {
    console.log('📍 Testing status endpoint (GET)...');
    const statusResponse = await axios.get('http://localhost:3000/api/ai-proxy', {
      timeout: 10000
    });
    console.log('✅ Status endpoint working:', statusResponse.status);
    console.log('📊 Status data:', JSON.stringify(statusResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Status endpoint error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
  
  try {
    console.log('\n📍 Testing simple prompt (POST)...');
    const promptResponse = await axios.post('http://localhost:3000/api/ai-proxy', {
      prompt: 'hi'
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Prompt endpoint working:', promptResponse.status);
    console.log('📄 Response data:', JSON.stringify(promptResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Prompt endpoint error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAIProxy().catch(console.error);
