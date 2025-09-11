/**
 * Test script to check AI proxy endpoint directly on the deployed version
 */

const testDeployedAIProxy = async () => {
  try {
    console.log('🧪 Testing Deployed AI Proxy...');
    
    const response = await fetch('https://belto-user-side.vercel.app/api/ai-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'hi'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const responseText = await response.text();
    console.log('Response body length:', responseText.length);
    console.log('Response body preview:', responseText.substring(0, 500));
    
    if (!response.ok) {
      console.error('❌ Request failed with status:', response.status);
      try {
        const errorData = JSON.parse(responseText);
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Raw error response (first 1000 chars):', responseText.substring(0, 1000));
      }
    } else {
      console.log('✅ Request successful');
      try {
        const data = JSON.parse(responseText);
        console.log('Response data:', data);
      } catch (e) {
        console.log('Response is not JSON - likely HTML redirect');
      }
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

// Run the test
testDeployedAIProxy();
