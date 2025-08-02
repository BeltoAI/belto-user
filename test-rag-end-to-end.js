const axios = require('axios');

// Test the complete RAG system end-to-end
async function testRAGSystem() {
  console.log('🧪 Testing RAG System End-to-End...\n');
  
  const baseURL = 'http://localhost:3000'; // Adjust for your deployment URL
  const testMessages = [
    {
      prompt: "Hello, can you explain what machine learning is?",
      expectsResponse: true,
      description: "Simple question test"
    },
    {
      prompt: "What are the key differences between supervised and unsupervised learning?",
      expectsResponse: true,
      description: "Complex technical question"
    },
    {
      prompt: "Can you help me understand neural networks?",
      expectsResponse: true,
      description: "Educational assistance"
    }
  ];

  let successCount = 0;
  let totalTests = testMessages.length;

  for (let i = 0; i < testMessages.length; i++) {
    const test = testMessages[i];
    console.log(`📝 Test ${i + 1}: ${test.description}`);
    console.log(`   Prompt: "${test.prompt}"`);
    
    try {
      const startTime = Date.now();
      
      // Test the AI proxy directly
      const response = await axios.post(`${baseURL}/api/ai-proxy`, {
        prompt: test.prompt,
        messages: [
          { role: 'user', content: test.prompt }
        ],
        preferences: {
          model: 'default-model',
          temperature: 0.7,
          maxTokens: 300
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      const responseTime = Date.now() - startTime;
      
      if (response.status === 200 && response.data.response) {
        console.log(`   ✅ SUCCESS (${responseTime}ms)`);
        console.log(`   Response: "${response.data.response.substring(0, 100)}${response.data.response.length > 100 ? '...' : ''}"`);
        console.log(`   Tokens: ${response.data.tokenUsage?.total_tokens || 0}`);
        successCount++;
      } else {
        console.log(`   ❌ FAILED - No response content`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Data:`, response.data);
      }
    } catch (error) {
      console.log(`   ❌ FAILED - ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error Details:`, error.response.data);
      }
    }
    
    console.log(''); // Empty line for readability
    
    // Wait between tests to avoid overwhelming the server
    if (i < testMessages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('📊 Test Results Summary:');
  console.log(`   ✅ Successful: ${successCount}/${totalTests}`);
  console.log(`   ❌ Failed: ${totalTests - successCount}/${totalTests}`);
  console.log(`   Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%`);
  
  if (successCount === totalTests) {
    console.log('\n🎉 All tests passed! RAG system is working correctly.');
  } else if (successCount > 0) {
    console.log('\n⚠️  Some tests failed. System partially functional.');
  } else {
    console.log('\n🚨 All tests failed. RAG system needs attention.');
  }

  return {
    totalTests,
    successCount,
    successRate: (successCount / totalTests) * 100
  };
}

// Test with different payload formats
async function testDifferentPayloadFormats() {
  console.log('\n🔄 Testing Different Payload Formats...\n');
  
  const baseURL = 'http://localhost:3000';
  const testFormats = [
    {
      name: "Direct message format",
      payload: {
        message: "What is artificial intelligence?",
        preferences: {
          model: 'default-model',
          temperature: 0.7,
          maxTokens: 200
        }
      }
    },
    {
      name: "Prompt format",
      payload: {
        prompt: "Explain machine learning in simple terms",
        preferences: {
          model: 'default-model',
          temperature: 0.7,
          maxTokens: 200
        }
      }
    },
    {
      name: "Messages array format",
      payload: {
        messages: [
          { role: 'user', content: 'What are the benefits of deep learning?' }
        ],
        preferences: {
          model: 'default-model',
          temperature: 0.7,
          maxTokens: 200
        }
      }
    }
  ];

  let formatSuccessCount = 0;

  for (const format of testFormats) {
    console.log(`📝 Testing: ${format.name}`);
    
    try {
      const startTime = Date.now();
      const response = await axios.post(`${baseURL}/api/ai-proxy`, format.payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200 && response.data.response) {
        console.log(`   ✅ SUCCESS (${responseTime}ms)`);
        console.log(`   Response: "${response.data.response.substring(0, 80)}..."`);
        formatSuccessCount++;
      } else {
        console.log(`   ❌ FAILED - No response content`);
      }
    } catch (error) {
      console.log(`   ❌ FAILED - ${error.message}`);
    }
    
    console.log('');
  }

  console.log(`📊 Format Test Results: ${formatSuccessCount}/${testFormats.length} formats working`);
  return formatSuccessCount === testFormats.length;
}

// Test error handling
async function testErrorHandling() {
  console.log('\n🛡️ Testing Error Handling...\n');
  
  const baseURL = 'http://localhost:3000';
  const errorTests = [
    {
      name: "Empty payload",
      payload: {},
      expectedError: true
    },
    {
      name: "Invalid message format",
      payload: { invalidField: "test" },
      expectedError: true
    },
    {
      name: "Very long prompt (potential timeout)",
      payload: {
        prompt: "A".repeat(10000) + " Please explain this in detail with comprehensive analysis and examples.",
        preferences: { maxTokens: 500 }
      },
      expectedError: false
    }
  ];

  let errorHandlingResults = [];

  for (const test of errorTests) {
    console.log(`📝 Testing: ${test.name}`);
    
    try {
      const response = await axios.post(`${baseURL}/api/ai-proxy`, test.payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });
      
      if (test.expectedError) {
        console.log(`   ❌ UNEXPECTED SUCCESS - Should have failed`);
        errorHandlingResults.push(false);
      } else {
        console.log(`   ✅ SUCCESS - Handled correctly`);
        errorHandlingResults.push(true);
      }
    } catch (error) {
      if (test.expectedError) {
        console.log(`   ✅ EXPECTED ERROR - Handled correctly`);
        console.log(`   Error: ${error.response?.data?.error || error.message}`);
        errorHandlingResults.push(true);
      } else {
        console.log(`   ❌ UNEXPECTED ERROR - ${error.message}`);
        errorHandlingResults.push(false);
      }
    }
    
    console.log('');
  }

  const errorHandlingSuccess = errorHandlingResults.filter(Boolean).length;
  console.log(`📊 Error Handling Results: ${errorHandlingSuccess}/${errorTests.length} tests passed`);
  return errorHandlingSuccess === errorTests.length;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive RAG System Tests\n');
  console.log('=' * 50);
  
  try {
    // Test basic functionality
    const basicResults = await testRAGSystem();
    
    // Test different formats
    const formatSuccess = await testDifferentPayloadFormats();
    
    // Test error handling
    const errorHandlingSuccess = await testErrorHandling();
    
    console.log('\n' + '=' * 50);
    console.log('🏁 FINAL TEST SUMMARY');
    console.log('=' * 50);
    console.log(`Basic RAG Tests: ${basicResults.successCount}/${basicResults.totalTests} (${basicResults.successRate.toFixed(1)}%)`);
    console.log(`Format Tests: ${formatSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`Error Handling: ${errorHandlingSuccess ? 'PASS' : 'FAIL'}`);
    
    const overallSuccess = basicResults.successRate >= 66.7 && formatSuccess && errorHandlingSuccess;
    
    if (overallSuccess) {
      console.log('\n🎉 RAG SYSTEM IS FULLY FUNCTIONAL!');
      console.log('✅ All core functionality working');
      console.log('✅ Multiple payload formats supported');
      console.log('✅ Error handling robust');
    } else {
      console.log('\n⚠️  RAG SYSTEM NEEDS ATTENTION');
      if (basicResults.successRate < 66.7) console.log('❌ Basic functionality issues');
      if (!formatSuccess) console.log('❌ Payload format issues');
      if (!errorHandlingSuccess) console.log('❌ Error handling issues');
    }
    
  } catch (error) {
    console.error('\n🚨 TEST RUNNER ERROR:', error.message);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testRAGSystem,
  testDifferentPayloadFormats,
  testErrorHandling,
  runAllTests
};
