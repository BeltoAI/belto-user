/**
 * Direct API Test for Document Processing
 * Tests the actual document processing workflow with real API calls
 */

const API_BASE = 'http://localhost:3000';

// Test document content (simulating PDF content)
const testDocuments = [
  {
    name: "Small Test Document",
    fileName: "test-small.pdf",
    content: "This is a small test document for verification. It contains basic content to test the processing system.",
    expectedSuccess: true
  },
  {
    name: "Medium Test Document",
    fileName: "test-medium.pdf", 
    content: "Executive Summary: This comprehensive report analyzes market trends and business opportunities. ".repeat(100), // ~8KB
    expectedSuccess: true
  },
  {
    name: "Large Test Document",
    fileName: "test-large.pdf",
    content: "Chapter 1: Introduction\n\nThis extensive technical documentation covers all aspects of system architecture. ".repeat(500), // ~40KB
    expectedSuccess: true
  }
];

async function testDocumentProcessing() {
  console.log('🧪 Testing Document Processing with Real API Calls...\n');

  for (let i = 0; i < testDocuments.length; i++) {
    const doc = testDocuments[i];
    console.log(`📝 Test ${i + 1}: ${doc.name}`);
    console.log(`File: ${doc.fileName} (${doc.content.length} characters)`);
    
    try {
      const startTime = Date.now();
      
      // Test the exact request format used by the frontend
      const requestBody = {
        prompt: "Summarize this document",
        attachments: [{
          name: doc.fileName,
          content: doc.content
        }],
        history: [],
        messageCount: 0
      };
      
      console.log(`🚀 Making API request...`);
      
      const response = await fetch(`${API_BASE}/api/ai-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`📊 Response received in ${duration}ms`);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS');
        console.log(`Response length: ${data.response?.length || 0} characters`);
        console.log(`Fallback: ${data.fallback ? 'Yes' : 'No'}`);
        console.log(`Partial Analysis: ${data.partialAnalysis ? 'Yes' : 'No'}`);
        
        if (data.response) {
          const preview = data.response.substring(0, 200);
          console.log(`Response preview: "${preview}${data.response.length > 200 ? '...' : ''}"`);
        }
        
        if (data.suggestions) {
          console.log(`Suggestions provided: ${data.suggestions.length}`);
        }
      } else {
        console.log('❌ FAILED');
        const errorData = await response.json().catch(() => ({}));
        console.log(`Error: ${errorData.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.log('❌ NETWORK ERROR');
      console.log(`Error: ${error.message}`);
    }
    
    console.log('---\n');
  }
  
  // Test with a simple non-document request for comparison
  console.log('📝 Control Test: Simple Request (No Document)');
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/api/ai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: "Hello, how are you?",
        history: [],
        messageCount: 0
      }),
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`📊 Response received in ${duration}ms`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS');
      console.log(`Response: "${data.response?.substring(0, 100) || 'No response'}..."`);
    } else {
      console.log('❌ FAILED');
      const errorData = await response.json().catch(() => ({}));
      console.log(`Error: ${errorData.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.log('❌ NETWORK ERROR');
    console.log(`Error: ${error.message}`);
  }
}

testDocumentProcessing().catch(console.error);
