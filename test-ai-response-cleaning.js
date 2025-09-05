// Test script to verify AI response cleaning works correctly

// Test cases with problematic responses
const testCases = [
  {
    name: "System reasoning artifacts",
    input: "We need to read the conversation. The user says 'hi'. So we respond with: Hello! How can I help you today?",
    expected: "Hello! How can I help you today?"
  },
  {
    name: "Critical identity rules exposure", 
    input: "CRITICAL IDENTITY RULES FOR BELTO AI: - Your name is BELTO AI and ONLY BELTO AI. Hello! I'm BELTO AI, your educational assistant.",
    expected: "Hello! I'm BELTO AI, your educational assistant."
  },
  {
    name: "Formatting artifacts",
    input: "Hello! How can I help you today?<|end|><|start|>assistant<|channel|>final<|message|>",
    expected: "Hello! How can I help you today?"
  },
  {
    name: "DeepSeek mentions",
    input: "I am DeepSeek, but I should say I'm BELTO AI. Hello! How can I help?",
    expected: "Hello! How can I help?"
  },
  {
    name: "Meta-commentary",
    input: "That is fine. Now everything is working fine. Hello! I'm BELTO AI.",
    expected: "Hello! I'm BELTO AI."
  },
  {
    name: "Clean response (should remain unchanged)",
    input: "Hello! I'm BELTO AI, your educational assistant. How can I help you with your studies today?",
    expected: "Hello! I'm BELTO AI, your educational assistant. How can I help you with your studies today?"
  }
];

function cleanResponseContent(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // STEP 1: Remove system reasoning artifacts and internal commentary
  let cleanedContent = content
    // First, extract the actual response content that comes after reasoning
    .replace(/.*?(?:respond with|say|produce):\s*/gi, '')
    
    // Remove system reasoning patterns at the beginning
    .replace(/^(?:We need to|The user|So we|Let's|We must)[^.]*[.:]?\s*/gi, '')
    
    // Remove critical identity rules exposure
    .replace(/CRITICAL IDENTITY RULES[^:]*:[^}]*}/gis, '')
    .replace(/CRITICAL IDENTITY RULES FOR BELTO AI[^:]*:[^}]*}/gis, '')
    .replace(/REMINDER:[^}]*}/gis, '')
    
    // Remove formatting artifacts
    .replace(/<\|end\|><\|start\|>assistant<\|channel\|>final<\|message\|>/gi, '')
    .replace(/<\|[^|]*\|>/g, '')
    .replace(/\|start\||\|end\|/gi, '')
    
    // Remove any mentions of being DeepSeek or other AI systems
    .replace(/I am DeepSeek[^.]*\./gi, '')
    .replace(/As DeepSeek[^,]*,?/gi, '')
    .replace(/I'm DeepSeek[^.]*\./gi, '')
    .replace(/DeepSeek[^.]*\./gi, '')
    
    // Remove meta-commentary about response generation
    .replace(/That is (fine|good|correct)[^.]*\./gi, '')
    .replace(/Now[,\s]*(everything is working fine|let's produce|we can)[^.]*\./gi, '')
    .replace(/The guidelines say[^.]*\./gi, '')
    .replace(/According to[^.]*guidelines[^.]*\./gi, '')
    
    // Remove unnecessary system-like introductions
    .replace(/^(Sure,?\s*|Of course,?\s*|Certainly,?\s*|Absolutely,?\s*)+/gi, '')
    .replace(/As requested[^,]*,?\s*/gi, '')
    .replace(/As instructed[^,]*,?\s*/gi, '')
    
    // Clean up spacing
    .replace(/\s+/g, ' ')
    .trim();

  // STEP 2: Split into sentences and filter out system reasoning
  const sentences = cleanedContent.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 0);
  const cleanSentences = sentences.filter(sentence => {
    const lower = sentence.toLowerCase();
    
    // Filter out system reasoning patterns
    if (lower.includes('we need to') || 
        lower.includes('the user') || 
        lower.includes('so we respond') ||
        lower.includes('let\'s say') ||
        lower.includes('we must') ||
        lower.includes('the conversation') ||
        lower.includes('critical identity') ||
        lower.includes('guidelines say') ||
        lower.includes('that is fine') ||
        lower.includes('now everything')) {
      return false;
    }
    
    // Keep actual responses
    return true;
  });

  // STEP 3: Reconstruct clean content
  if (cleanSentences.length > 0) {
    cleanedContent = cleanSentences.join(' ').replace(/\s+/g, ' ');
  }

  // STEP 4: Final cleanup
  cleanedContent = cleanedContent
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{3,}/g, ' ')
    .replace(/\.\s*\./g, '.')
    .replace(/\s+([.!?])/g, '$1')
    .trim();

  // STEP 5: Ensure proper formatting
  if (cleanedContent.length > 0) {
    const firstChar = cleanedContent.charAt(0);
    if (firstChar !== firstChar.toUpperCase()) {
      cleanedContent = firstChar.toUpperCase() + cleanedContent.slice(1);
    }
  }

  return cleanedContent;
}

// Run tests
console.log('🧪 Testing AI Response Cleaning...\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Input: "${testCase.input}"`);
  
  const result = cleanResponseContent(testCase.input);
  console.log(`Output: "${result}"`);
  console.log(`Expected: "${testCase.expected}"`);
  
  const passed = result.trim() === testCase.expected.trim();
  console.log(`Result: ${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  
  if (passed) passedTests++;
});

console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! AI response cleaning is working correctly.');
} else {
  console.log('⚠️ Some tests failed. Review the cleaning logic.');
}
