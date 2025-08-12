// Simple test script to check AI endpoints
const axios = require('axios');

const endpoints = [
  'https://670902dce12f.ngrok-free.app/completion', // DeepSeek 8B (Double 3060) - FASTEST
  'https://17f2-71-84-65-200.ngrok-free.app/secure-chat', // DeepSeek 8B (Single 3060) - VERY FAST
  'http://belto.myftp.biz:9999/v1/chat/completions' // Backup endpoint
];

const apiKey = 'qQhUOBjNamjELp2g69ww8APeFD8FNHW8';

async function testEndpoint(url) {
  console.log(`Testing endpoint: ${url}`);
  
  try {
    const startTime = Date.now();
    
    const testPayload = {
      model: 'default-model',
      messages: [{ role: 'user', content: 'Hello, this is a test.' }],
      max_tokens: 10
    };
    
    const response = await axios.post(url, testPayload, {
      timeout: 10000,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ ${url} - SUCCESS (${responseTime}ms)`);
    console.log('Response:', response.data.choices?.[0]?.message?.content || 'No content');
    return { url, status: 'success', responseTime, data: response.data };
    
  } catch (error) {
    console.log(`❌ ${url} - FAILED`);
    console.log('Error:', error.code || error.message);
    if (error.response) {
      console.log('HTTP Status:', error.response.status);
      console.log('Response Data:', error.response.data);
    }
    return { url, status: 'failed', error: error.message, code: error.code };
  }
}

async function testAllEndpoints() {
  console.log('Testing AI endpoints...\n');
  
  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log('---');
  }
  
  console.log('\nSummary:');
  const working = results.filter(r => r.status === 'success');
  console.log(`${working.length}/${results.length} endpoints working`);
  
  if (working.length === 0) {
    console.log('🚨 ALL ENDPOINTS DOWN!');
  }
}

testAllEndpoints().catch(console.error);
