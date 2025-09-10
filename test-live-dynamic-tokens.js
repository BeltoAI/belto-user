/**
 * Test the actual AI proxy with dynamic token management
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Adjust if different

async function testAIProxy(testCase) {
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 Input: ${testCase.body.prompt || testCase.body.message || 'Multiple messages'}`);
    
    const response = await axios.post(`${BASE_URL}/api/ai-proxy`, testCase.body, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      console.log(`✅ Success: Got response`);
      console.log(`📊 Token Usage: ${JSON.stringify(response.data.tokenUsage || 'Not provided')}`);
      console.log(`📄 Response Length: ${response.data.response?.length || 0} characters`);
      console.log(`🎯 Response Preview: ${response.data.response?.substring(0, 100)}...`);
      
      // Check for truncation signs
      if (response.data.response?.includes('etc…') || 
          response.data.response?.includes('………') ||
          response.data.response?.endsWith('...')) {
        console.log(`⚠️  Warning: Response may be truncated`);
      } else {
        console.log(`✅ Response appears complete`);
      }
    } else {
      console.log(`❌ Error: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.response?.data) {
      console.log(`📄 Error Details: ${JSON.stringify(error.response.data)}`);
    }
  }
}

async function runTests() {
  console.log('🚀 Testing Dynamic Token Management System in Live AI Proxy\n');
  
  // Test 1: Simple greeting
  await testAIProxy({
    name: "Simple Greeting",
    body: {
      prompt: "Hi"
    }
  });
  
  // Test 2: Educational question
  await testAIProxy({
    name: "Educational Question",
    body: {
      prompt: "Explain the concept of machine learning in simple terms"
    }
  });
  
  // Test 3: Analysis request
  await testAIProxy({
    name: "Analysis Request",
    body: {
      prompt: "Please provide a detailed analysis of the benefits and challenges of implementing artificial intelligence in educational systems, considering both student outcomes and administrative efficiency."
    }
  });
  
  // Test 4: List request
  await testAIProxy({
    name: "List Request",
    body: {
      prompt: "List the main types of machine learning algorithms and briefly explain each one"
    }
  });
  
  // Test 5: Step-by-step guide
  await testAIProxy({
    name: "Step-by-step Guide",
    body: {
      prompt: "How to create a study plan for learning data science? Please provide step-by-step instructions."
    }
  });
  
  // Test 6: Document simulation (without actual attachment)
  await testAIProxy({
    name: "Document Analysis Simulation",
    body: {
      prompt: "Based on this document content: 'Artificial Intelligence (AI) has revolutionized many industries, including healthcare, finance, and education. In healthcare, AI helps with diagnosis, treatment recommendations, and drug discovery. In finance, it enables fraud detection, algorithmic trading, and risk assessment. In education, AI powers personalized learning platforms, automated grading systems, and intelligent tutoring systems. However, AI also presents challenges including ethical concerns, job displacement, privacy issues, and the need for regulatory frameworks. Organizations must carefully balance the benefits of AI adoption with these potential risks.' Please provide a comprehensive analysis of this text.",
      processingHints: {
        documentType: 'text',
        analysisType: 'analysis',
        contentLength: 650
      }
    }
  });
  
  console.log('\n🎯 All tests completed! Check the responses for:');
  console.log('   • Complete responses (no truncation)');
  console.log('   • Appropriate detail level for each request type');
  console.log('   • Educational quality and completeness');
  console.log('   • Token usage efficiency');
}

// Run the tests
runTests().catch(console.error);
