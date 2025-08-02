/**
 * Test PDF attachment and complex request handling
 * Tests the improved timeout and error handling for PDF files and complex requests
 */

const API_BASE = 'http://localhost:3000';

async function testPDFHandling() {
  console.log('🧪 Testing PDF attachment and complex request handling...\n');

  // Test 1: Simple message (should use base timeout)
  console.log('📝 Test 1: Simple message');
  try {
    const response = await fetch(`${API_BASE}/api/ai-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, how are you?',
        messages: [{ role: 'user', content: 'Hello, how are you?' }]
      })
    });
    
    const data = await response.json();
    console.log('✅ Simple message:', response.ok ? 'SUCCESS' : 'FAILED');
    if (!response.ok) console.log('Error:', data.error);
  } catch (error) {
    console.log('❌ Simple message failed:', error.message);
  }
  
  console.log('');

  // Test 2: Complex programming request (should use extended timeout)
  console.log('📝 Test 2: Complex programming request');
  try {
    const complexMessage = 'Give me a complete Java code example to sum two numbers with proper error handling, input validation, and documentation. Include multiple methods and explain each part.';
    
    const response = await fetch(`${API_BASE}/api/ai-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: complexMessage,
        messages: [{ role: 'user', content: complexMessage }]
      })
    });
    
    const data = await response.json();
    console.log('✅ Complex programming request:', response.ok ? 'SUCCESS' : 'FAILED');
    if (!response.ok) {
      console.log('Error:', data.error);
    } else {
      console.log('Response preview:', data.response?.substring(0, 100) + '...');
    }
  } catch (error) {
    console.log('❌ Complex programming request failed:', error.message);
  }
  
  console.log('');

  // Test 3: Simulated PDF attachment request (large content)
  console.log('📝 Test 3: Simulated PDF attachment (large content)');
  try {
    const largePDFContent = 'This is a simulated PDF document content. '.repeat(100); // Simulate large PDF content
    
    const response = await fetch(`${API_BASE}/api/ai-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Please analyze this document and provide a summary.',
        attachments: [{
          type: 'pdf',
          content: largePDFContent,
          filename: 'test-document.pdf'
        }],
        messages: [{ 
          role: 'user', 
          content: `Please analyze this document and provide a summary.\n\nAttached document content:\n${largePDFContent}`
        }]
      })
    });
    
    const data = await response.json();
    console.log('✅ PDF attachment request:', response.ok ? 'SUCCESS' : 'FAILED');
    if (!response.ok) {
      console.log('Error:', data.error);
    } else {
      console.log('Response preview:', data.response?.substring(0, 100) + '...');
      if (data.fallback) {
        console.log('⚠️ Note: This was a fallback response');
      }
    }
  } catch (error) {
    console.log('❌ PDF attachment request failed:', error.message);
  }
  
  console.log('');

  // Test 4: Timeout behavior with very large content
  console.log('📝 Test 4: Very large content (timeout test)');
  try {
    const veryLargeContent = 'This is a very large document that should trigger extended timeout. '.repeat(1000);
    
    const startTime = Date.now();
    const response = await fetch(`${API_BASE}/api/ai-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Analyze this very large document thoroughly.',
        messages: [{ 
          role: 'user', 
          content: `Analyze this very large document thoroughly.\n\n${veryLargeContent}`
        }]
      })
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const data = await response.json();
    console.log('✅ Large content request:', response.ok ? 'SUCCESS' : 'FAILED');
    console.log(`⏱️ Request duration: ${duration}ms`);
    
    if (!response.ok) {
      console.log('Error:', data.error);
    } else {
      console.log('Response preview:', data.response?.substring(0, 100) + '...');
      if (data.fallback) {
        console.log('⚠️ Note: This was a fallback response');
      }
    }
  } catch (error) {
    console.log('❌ Large content request failed:', error.message);
  }

  console.log('\n🏁 PDF and complex request testing completed!');
}

// Run the test
testPDFHandling().catch(console.error);
