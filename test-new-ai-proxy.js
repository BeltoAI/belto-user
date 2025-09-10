// Test the new AI proxy with exact browser input format
console.log('🧪 Testing NEW AI proxy implementation...');

const testEndpoint = 'http://localhost:3000/api/ai-proxy';

// Simulate exact browser request format (what the chat component sends)
const testPayload = {
  messages: [
    { role: 'user', content: 'hi' }
  ],
  attachments: [],
  sessionId: 'test-session-123'
};

console.log('📤 Sending request with payload:', JSON.stringify(testPayload, null, 2));

async function testNewImplementation() {
  try {
    const response = await fetch(testEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Response data:', JSON.stringify(data, null, 2));
      
      if (data.response) {
        console.log('🎉 AI Response received:', data.response);
        console.log('📊 Metadata:', data.metadata);
      }
    } else {
      const errorData = await response.text();
      console.log('❌ ERROR Response:', errorData);
    }

  } catch (error) {
    console.error('❌ Network/Request Error:', error.message);
  }
}

testNewImplementation();
