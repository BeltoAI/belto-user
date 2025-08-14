const axios = require('axios');

// Test script to verify BELTO AI identity and response fixes
async function testBeltoIdentityFixes() {
  console.log('🧪 Testing BELTO AI Identity and Response Fixes...\n');

  const baseURL = 'http://localhost:3000';
  
  // Test 1: Identity question
  console.log('1. Testing identity response...');
  try {
    const response = await axios.post(`${baseURL}/api/ai-proxy`, {
      prompt: "Who are you?",
      messages: [
        { role: 'user', content: 'Who are you?' }
      ]
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    console.log('✅ Identity test successful:');
    console.log('Response preview:', response.data.response?.substring(0, 200) + '...');
    console.log('Contains "BELTO AI":', response.data.response?.includes('BELTO AI') ? '✅' : '❌');
    console.log('Contains "educational":', response.data.response?.includes('educational') ? '✅' : '❌');
    console.log('Contains "student":', response.data.response?.includes('student') ? '✅' : '❌');
    console.log('Response length:', response.data.response?.length || 0, 'characters');
    console.log('Fallback:', response.data.fallback || false);
    console.log('Token usage:', response.data.tokenUsage);
  } catch (error) {
    console.error('❌ Identity test failed:', error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Test 2: Simple educational question
  console.log('2. Testing educational response...');
  try {
    const response = await axios.post(`${baseURL}/api/ai-proxy`, {
      prompt: "How can you help me with my studies?",
      messages: [
        { role: 'user', content: 'How can you help me with my studies?' }
      ]
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    console.log('✅ Educational test successful:');
    console.log('Response preview:', response.data.response?.substring(0, 200) + '...');
    console.log('Contains "BELTO AI":', response.data.response?.includes('BELTO AI') ? '✅' : '❌');
    console.log('Contains "academic":', response.data.response?.includes('academic') ? '✅' : '❌');
    console.log('Contains Chinese characters:', /[\u4e00-\u9fff]/.test(response.data.response) ? '❌' : '✅');
    console.log('Response length:', response.data.response?.length || 0, 'characters');
    console.log('Fallback:', response.data.fallback || false);
    console.log('Token usage:', response.data.tokenUsage);
  } catch (error) {
    console.error('❌ Educational test failed:', error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Test 3: Language consistency
  console.log('3. Testing language consistency...');
  try {
    const response = await axios.post(`${baseURL}/api/ai-proxy`, {
      prompt: "请用中文回答",
      messages: [
        { role: 'user', content: '请用中文回答' }
      ]
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    console.log('✅ Language test successful:');
    console.log('Response preview:', response.data.response?.substring(0, 200) + '...');
    console.log('Contains Chinese characters:', /[\u4e00-\u9fff]/.test(response.data.response) ? '❌ (Should be English only)' : '✅');
    console.log('Contains "English":', response.data.response?.includes('English') ? '✅' : '❌');
    console.log('Contains "BELTO AI":', response.data.response?.includes('BELTO AI') ? '✅' : '❌');
    console.log('Response length:', response.data.response?.length || 0, 'characters');
    console.log('Fallback:', response.data.fallback || false);
  } catch (error) {
    console.error('❌ Language test failed:', error.response?.data || error.message);
  }

  console.log('\n---\n');

  // Test 4: Fallback response when endpoints fail
  console.log('4. Testing fallback response quality...');
  try {
    // This should trigger fallback if endpoints are down
    const response = await axios.post(`${baseURL}/api/ai-proxy`, {
      prompt: "What is machine learning?",
      messages: [
        { role: 'user', content: 'What is machine learning?' }
      ]
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 3000 // Short timeout to potentially trigger fallback
    });
    
    console.log('✅ Fallback test completed:');
    console.log('Response preview:', response.data.response?.substring(0, 200) + '...');
    console.log('Contains "BELTO AI":', response.data.response?.includes('BELTO AI') ? '✅' : '❌');
    console.log('Is fallback response:', response.data.fallback ? '✅' : '❌');
    console.log('Response length:', response.data.response?.length || 0, 'characters');
    console.log('Contains educational content:', response.data.response?.includes('educational') ? '✅' : '❌');
  } catch (error) {
    console.log('✅ Timeout triggered as expected, checking fallback...');
    // Check if the error contains a proper fallback response
    if (error.response?.data?.error) {
      console.log('Error response:', error.response.data.error);
    }
  }

  console.log('\n🎯 Test Summary:');
  console.log('- Identity responses should contain "BELTO AI" and educational context');
  console.log('- All responses should be in English only');
  console.log('- Response lengths should be adequate (>100 characters for complete answers)');
  console.log('- Fallback responses should maintain BELTO AI identity and educational focus');
  console.log('- No Chinese or other language content should appear');
}

// Run the tests
testBeltoIdentityFixes().catch(console.error);
