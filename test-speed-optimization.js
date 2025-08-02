#!/usr/bin/env node

/**
 * Speed Optimization Test - Verify fast response times for simple messages
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';

// Test cases optimized for different message complexities
const speedTests = [
  {
    name: "⚡ Ultra-Fast Simple Greeting",
    payload: {
      message: "hi",
      messages: [{ role: 'user', content: 'hi' }]
    },
    expectedTime: 3000, // Should be under 3 seconds
    expectedTokens: 50   // Should use minimal tokens
  },
  {
    name: "🚀 Fast Simple Question", 
    payload: {
      message: "How are you?",
      messages: [{ role: 'user', content: 'How are you?' }]
    },
    expectedTime: 3000,
    expectedTokens: 50
  },
  {
    name: "📝 Normal Request",
    payload: {
      message: "What is machine learning and how does it work?",
      messages: [{ role: 'user', content: 'What is machine learning and how does it work?' }]
    },
    expectedTime: 6000, // Should be under 6 seconds
    expectedTokens: 150
  },
  {
    name: "🔬 Complex Request",
    payload: {
      message: "Explain quantum computing, its principles, applications, and provide a detailed comparison with classical computing including examples of quantum algorithms and their advantages",
      messages: [{ role: 'user', content: 'Explain quantum computing, its principles, applications, and provide a detailed comparison with classical computing including examples of quantum algorithms and their advantages' }]
    },
    expectedTime: 6000,
    expectedTokens: 300
  }
];

async function testResponseSpeed() {
  console.log('🚀 SPEED OPTIMIZATION TEST - Fast Response Times\n');
  console.log('Testing optimized AI proxy for improved response speeds...\n');

  let passedTests = 0;
  let totalTests = speedTests.length;

  for (let i = 0; i < speedTests.length; i++) {
    const test = speedTests[i];
    console.log(`${i + 1}. ${test.name}`);
    console.log(`   Expected time: <${test.expectedTime}ms, Expected tokens: ~${test.expectedTokens}`);
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${API_BASE}/api/ai-proxy`, test.payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: test.expectedTime + 2000 // Allow some buffer
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200 && response.data.response) {
        const tokenUsage = response.data.tokenUsage || { total_tokens: 0 };
        const timeCheck = responseTime <= test.expectedTime;
        const tokenCheck = tokenUsage.total_tokens <= test.expectedTokens * 1.5; // Allow 50% buffer
        
        if (timeCheck && tokenCheck) {
          console.log(`   ✅ PASS - ${responseTime}ms (${tokenUsage.total_tokens} tokens)`);
          console.log(`   Response: "${response.data.response.substring(0, 80)}..."`);
          passedTests++;
        } else {
          console.log(`   ⚠️  SLOW - ${responseTime}ms (${tokenUsage.total_tokens} tokens)`);
          if (!timeCheck) console.log(`     ❌ Time exceeded: ${responseTime}ms > ${test.expectedTime}ms`);
          if (!tokenCheck) console.log(`     ❌ Tokens exceeded: ${tokenUsage.total_tokens} > ${test.expectedTokens * 1.5}`);
          console.log(`   Response: "${response.data.response.substring(0, 80)}..."`);
        }
      } else {
        console.log(`   ❌ FAIL - No response content`);
        console.log(`   Status: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error: ${error.response.data?.error || 'Unknown error'}`);
      }
    }
    
    console.log(''); // Empty line between tests
  }

  // Summary
  console.log('📊 SPEED TEST RESULTS');
  console.log('====================');
  console.log(`Passed: ${passedTests}/${totalTests} tests`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Speed optimizations are working correctly.');
    console.log('✅ Simple messages should now respond in 1-3 seconds');
    console.log('✅ Complex messages should respond in 3-6 seconds');
  } else {
    console.log('\n⚠️  Some tests failed. Check the AI proxy configuration and endpoint availability.');
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await axios.get(`${API_BASE}/api/ai-proxy/status`, { timeout: 5000 });
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
    await testResponseSpeed();
  }
}

main().catch(console.error);
