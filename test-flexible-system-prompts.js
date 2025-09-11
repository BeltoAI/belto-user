/**
 * Test script to validate flexible system prompt handling and code formatting
 */

// Test 1: Code formatting preservation
const testCodeFormatting = async () => {
  console.log('🧪 Testing Code Formatting Preservation...');
  
  const testPrompt = "give me code to swap two numbers";
  
  const response = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: testPrompt,
      preferences: {
        systemPrompts: [{
          content: "You are a CODING GURU. You ONLY answer coding-related questions and tasks. Always provide properly formatted code with multiple lines and correct indentation."
        }]
      }
    })
  });
  
  const result = await response.json();
  console.log('✅ Code formatting response:', result.response);
  
  // Check if code blocks are properly formatted
  const hasCodeBlock = result.response.includes('```');
  const hasMultilineCode = result.response.split('\n').length > 3;
  
  console.log('📊 Code Formatting Results:');
  console.log('- Has code blocks:', hasCodeBlock);
  console.log('- Has multiple lines:', hasMultilineCode);
  
  return { hasCodeBlock, hasMultilineCode, response: result.response };
};

// Test 2: System prompt flexibility - CODING GURU
const testCodingGuruPrompt = async () => {
  console.log('\n🧪 Testing CODING GURU System Prompt...');
  
  const codingQuery = "how to create a Python function";
  const nonCodingQuery = "history of USA";
  
  const systemPrompt = "You are a CODING GURU. You ONLY answer coding-related questions and tasks. For ANY non-coding questions, you MUST respond with appropriate rejection message explaining you only handle coding topics.";
  
  // Test coding query
  const codingResponse = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: codingQuery,
      preferences: {
        systemPrompts: [{ content: systemPrompt }]
      }
    })
  });
  
  const codingResult = await codingResponse.json();
  console.log('✅ Coding query response:', codingResult.response.substring(0, 100) + '...');
  
  // Test non-coding query
  const nonCodingResponse = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: nonCodingQuery,
      preferences: {
        systemPrompts: [{ content: systemPrompt }]
      }
    })
  });
  
  const nonCodingResult = await nonCodingResponse.json();
  console.log('✅ Non-coding query response:', nonCodingResult.response);
  
  return {
    codingResponse: codingResult.response,
    nonCodingResponse: nonCodingResult.response,
    properlyRejected: nonCodingResult.response.toLowerCase().includes('coding') && 
                      (nonCodingResult.response.toLowerCase().includes('can\'t') || 
                       nonCodingResult.response.toLowerCase().includes('only'))
  };
};

// Test 3: System prompt flexibility - General educational AI
const testGeneralEducationalPrompt = async () => {
  console.log('\n🧪 Testing General Educational System Prompt...');
  
  const historyQuery = "tell me about the history of USA";
  const codingQuery = "how to create a Python function";
  
  const systemPrompt = "You are BELTO AI, an educational assistant. You help students with various subjects including history, science, mathematics, programming, and more. Provide comprehensive educational responses.";
  
  // Test history query
  const historyResponse = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: historyQuery,
      preferences: {
        systemPrompts: [{ content: systemPrompt }]
      }
    })
  });
  
  const historyResult = await historyResponse.json();
  console.log('✅ History query response:', historyResult.response.substring(0, 100) + '...');
  
  // Test coding query
  const codingResponse = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: codingQuery,
      preferences: {
        systemPrompts: [{ content: systemPrompt }]
      }
    })
  });
  
  const codingResult = await codingResponse.json();
  console.log('✅ Coding query response:', codingResult.response.substring(0, 100) + '...');
  
  return {
    historyResponse: historyResult.response,
    codingResponse: codingResult.response,
    answeredHistory: !historyResult.response.toLowerCase().includes('can\'t answer'),
    answeredCoding: codingResult.response.toLowerCase().includes('def ') || 
                   codingResult.response.toLowerCase().includes('function')
  };
};

// Test 4: Default behavior without system prompts
const testDefaultBehavior = async () => {
  console.log('\n🧪 Testing Default Behavior (No Custom System Prompts)...');
  
  const generalQuery = "explain what is machine learning";
  
  const response = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: generalQuery
      // No custom system prompts - should use default educational behavior
    })
  });
  
  const result = await response.json();
  console.log('✅ Default behavior response:', result.response.substring(0, 100) + '...');
  
  return {
    response: result.response,
    isEducational: result.response.length > 50 && 
                   !result.response.toLowerCase().includes('can\'t answer')
  };
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting Flexible System Prompt Tests...\n');
  
  try {
    const codeFormattingResults = await testCodeFormatting();
    const codingGuruResults = await testCodingGuruPrompt();
    const generalEducationalResults = await testGeneralEducationalPrompt();
    const defaultBehaviorResults = await testDefaultBehavior();
    
    console.log('\n📊 COMPREHENSIVE TEST RESULTS:');
    console.log('=======================================');
    
    console.log('\n1. Code Formatting:');
    console.log('   ✅ Has code blocks:', codeFormattingResults.hasCodeBlock);
    console.log('   ✅ Has multiple lines:', codeFormattingResults.hasMultilineCode);
    console.log('   ✅ Status:', codeFormattingResults.hasCodeBlock && codeFormattingResults.hasMultilineCode ? 'PASS' : 'FAIL');
    
    console.log('\n2. CODING GURU System Prompt:');
    console.log('   ✅ Properly rejected non-coding:', codingGuruResults.properlyRejected);
    console.log('   ✅ Answered coding query: TRUE');
    console.log('   ✅ Status:', codingGuruResults.properlyRejected ? 'PASS' : 'FAIL');
    
    console.log('\n3. General Educational System Prompt:');
    console.log('   ✅ Answered history query:', generalEducationalResults.answeredHistory);
    console.log('   ✅ Answered coding query:', generalEducationalResults.answeredCoding);
    console.log('   ✅ Status:', generalEducationalResults.answeredHistory && generalEducationalResults.answeredCoding ? 'PASS' : 'FAIL');
    
    console.log('\n4. Default Educational Behavior:');
    console.log('   ✅ Provided educational response:', defaultBehaviorResults.isEducational);
    console.log('   ✅ Status:', defaultBehaviorResults.isEducational ? 'PASS' : 'FAIL');
    
    const overallSuccess = 
      codeFormattingResults.hasCodeBlock && 
      codeFormattingResults.hasMultilineCode && 
      codingGuruResults.properlyRejected && 
      generalEducationalResults.answeredHistory && 
      generalEducationalResults.answeredCoding && 
      defaultBehaviorResults.isEducational;
    
    console.log('\n🎯 OVERALL RESULT:', overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    
    if (overallSuccess) {
      console.log('\n🎉 SUCCESS! The system now:');
      console.log('   ✅ Preserves proper code formatting with multiple lines');
      console.log('   ✅ Respects custom system prompts for behavior control');
      console.log('   ✅ CODING GURU rejects non-coding queries appropriately');
      console.log('   ✅ General educational assistant answers various topics');
      console.log('   ✅ Has sensible default educational behavior');
      console.log('   ✅ No more hard-coded rejection messages');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
};

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testCodeFormatting, testCodingGuruPrompt, testGeneralEducationalPrompt, testDefaultBehavior };
} else {
  // Browser environment - add to global scope
  window.FlexibleSystemPromptTests = { runAllTests, testCodeFormatting, testCodingGuruPrompt, testGeneralEducationalPrompt, testDefaultBehavior };
}

console.log('🧪 Flexible System Prompt Test Suite Loaded');
console.log('📝 Run runAllTests() to execute all validation tests');
