#!/usr/bin/env node

/**
 * Simple Speed Test - Test AI proxy response times
 * Usage: node test-speed-simple.js
 */

const axios = require('axios');

// Change this to your deployment URL if not running locally
const API_BASE = process.env.API_BASE || 'http://localhost:3000';

const speedTests = [
  {
    name: "🚀 Ultra-Fast Simple Greeting",
    payload: {
      message: "hi",
      messages: [{ role: 'user', content: 'hi' }]
    },
    expectedTime: 3000 // Should be under 3 seconds
  },
  {
    name: "⚡ Fast Simple Question", 
    payload: {
      message: "How are you?",
      messages: [{ role: 'user', content: 'How are you?' }]
    },
    expectedTime: 4000 // Should be under 4 seconds
  },
  {
    name: "📝 Normal Request",
    payload: {
      message: "What is AI?",
      messages: [{ role: 'user', content: 'What is AI?' }]
    },
    expectedTime: 7000 // Should be under 7 seconds
  }
];

async function testSpeed() {
  console.log('🚀 SPEED TEST - AI Proxy Response Times\n');

  let passedTests = 0;

  for (let i = 0; i < speedTests.length; i++) {
    const test = speedTests[i];
    console.log(`${i + 1}. ${test.name}`);
    console.log(`   Expected: <${test.expectedTime}ms`);
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${API_BASE}/api/ai-proxy`, test.payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: test.expectedTime + 2000 // Allow buffer
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200 && response.data.response) {
        if (responseTime <= test.expectedTime) {
          console.log(`   ✅ PASS - ${responseTime}ms`);
          console.log(`   Response: "${response.data.response.substring(0, 60)}..."`);
          passedTests++;
        } else {
          console.log(`   ⚠️  SLOW - ${responseTime}ms (expected <${test.expectedTime}ms)`);
          console.log(`   Response: "${response.data.response.substring(0, 60)}..."`);
        }
        
        if (response.data.fallback) {
          console.log(`   ⚠️  Note: Fallback response used`);
        }
      } else {
        console.log(`   ❌ FAIL - No response content`);
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

  console.log('📊 RESULTS');
  console.log('==========');
  console.log(`Passed: ${passedTests}/${speedTests.length} tests`);
  
  if (passedTests === speedTests.length) {
    console.log('🎉 ALL TESTS PASSED! Speed optimizations are working!');
  } else {
    console.log('⚠️  Some tests failed. Check endpoint configuration and availability.');
  }
}

// Run the test
testSpeed().catch(console.error);
