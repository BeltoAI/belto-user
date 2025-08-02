const axios = require('axios');

// Test the complete RAG system end-to-end
async function testRAGSystem() {
  console.log('🧪 Testing RAG System End-to-End...\n');
  
  const baseURL = 'http://localhost:3000';
  const apiKey = 'qQhUOBjNamjELp2g69ww8APeFD8FNHW8';
  
  // Test configurations
  const testCases = [
    {
      name: 'Simple Question',
      payload: {
        prompt: 'What is artificial intelligence?',
        history: [],
        messageCount: 1
      }
    },
    {
      name: 'Question with History',
      payload: {
        prompt: 'Can you explain that in simpler terms?',
        history: [
          { role: 'user', content: 'What is machine learning?' },
          { role: 'assistant', content: 'Machine learning is a subset of artificial intelligence...' }
        ],
        messageCount: 2
      }
    },
    {
      name: 'Question with AI Preferences',
      payload: {
        prompt: 'Explain neural networks',
        preferences: {
          model: 'default-model',
          temperature: 0.7,
          maxTokens: 200,
          numPrompts: 5,
          tokenPredictionLimit: 1000
        },
        history: [],
        messageCount: 1
      }
    }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);
    console.log('Request payload:', JSON.stringify(testCase.payload, null, 2));
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${baseURL}/api/ai-proxy`, testCase.payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000 // 15 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.status === 200) {
        const data = response.data;
        
        console.log(`✅ ${testCase.name} - SUCCESS (${responseTime}ms)`);
        console.log('Response preview:', data.response?.substring(0, 100) + '...');
        console.log('Token usage:', data.tokenUsage);
        
        if (data.fallback) {
          console.log('⚠️  Fallback response detected');
        }
        
        results.push({
          name: testCase.name,
          status: 'SUCCESS',
          responseTime,
          hasResponse: !!data.response,
          hasTokenUsage: !!data.tokenUsage,
          isFallback: !!data.fallback
        });
      } else {
        console.log(`❌ ${testCase.name} - HTTP ${response.status}`);
        results.push({
          name: testCase.name,
          status: 'HTTP_ERROR',
          statusCode: response.status
        });
      }
    } catch (error) {
      console.log(`❌ ${testCase.name} - FAILED`);
      console.log('Error:', error.response?.data || error.message);
      
      results.push({
        name: testCase.name,
        status: 'FAILED',
        error: error.response?.data?.error || error.message
      });
    }
    
    console.log('---\n');
  }
  
  // Summary
  console.log('📊 RAG System Test Results:');
  console.log('============================');
  
  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const total = results.length;
  
  console.log(`Overall Success Rate: ${successful}/${total} (${Math.round((successful/total)*100)}%)`);
  
  results.forEach(result => {
    if (result.status === 'SUCCESS') {
      console.log(`✅ ${result.name}: ${result.responseTime}ms${result.isFallback ? ' (fallback)' : ''}`);
    } else {
      console.log(`❌ ${result.name}: ${result.error || result.statusCode}`);
    }
  });
  
  if (successful === total) {
    console.log('\n🎉 All RAG system tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

// Run the test
testRAGSystem().catch(console.error);
