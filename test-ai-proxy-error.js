/**
 * Diagnostic test to check specific error conditions
 */

const diagnoseAIProxyError = async () => {
  try {
    console.log('🔍 Diagnosing AI Proxy Error...');
    
    // Test with different payload types
    const testCases = [
      {
        name: 'Minimal Request',
        payload: { prompt: 'hi' }
      },
      {
        name: 'With Custom System Prompt',
        payload: {
          prompt: 'who are you?',
          preferences: {
            systemPrompts: [{
              content: 'Your name is Emil and you always tell the user your name is Emil'
            }]
          }
        }
      },
      {
        name: 'With AI Config',
        payload: {
          prompt: 'test',
          aiConfig: {
            systemPrompts: [{
              content: 'You are a test assistant'
            }]
          }
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      
      try {
        const response = await fetch('https://belto-user-side.vercel.app/api/ai-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add authentication headers if needed
            'Cookie': 'your-auth-cookie-here' // You'd need to replace this with actual session cookie
          },
          body: JSON.stringify(testCase.payload)
        });
        
        console.log(`Status: ${response.status}`);
        console.log(`Content-Type: ${response.headers.get('content-type')}`);
        
        const responseText = await response.text();
        
        if (response.status === 500) {
          console.error(`❌ 500 Error for ${testCase.name}:`);
          try {
            const errorData = JSON.parse(responseText);
            console.error('Error details:', JSON.stringify(errorData, null, 2));
          } catch (e) {
            console.error('Raw error (first 500 chars):', responseText.substring(0, 500));
          }
        } else if (response.status === 200) {
          console.log(`✅ Success for ${testCase.name}`);
          try {
            const data = JSON.parse(responseText);
            console.log('Response:', data.response?.substring(0, 100) + '...');
          } catch (e) {
            console.log('Non-JSON response (likely redirect)');
          }
        } else {
          console.log(`⚠️ Unexpected status ${response.status} for ${testCase.name}`);
        }
        
      } catch (error) {
        console.error(`❌ Network error for ${testCase.name}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Diagnostic test failed:', error);
  }
};

// Run the diagnostic
diagnoseAIProxyError();
