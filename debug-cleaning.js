// Debug test for the failing case
function cleanResponseContent(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }

  console.log('Original:', JSON.stringify(content));
  
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
    
  console.log('After step 1:', JSON.stringify(cleanedContent));
  
  cleanedContent = cleanedContent
    // Clean up leftover colons and spacing
    .replace(/:\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
  console.log('After cleanup:', JSON.stringify(cleanedContent));
  
  // STEP 2: Split into sentences and filter out system reasoning
  const sentences = cleanedContent.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 0);
  console.log('Sentences:', sentences);
  
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
      console.log('Filtering out:', sentence);
      return false;
    }
    
    // Keep actual responses
    return true;
  });
  
  console.log('Clean sentences:', cleanSentences);

  // STEP 3: Reconstruct clean content
  if (cleanSentences.length > 0) {
    cleanedContent = cleanSentences.join(' ').replace(/\s+/g, ' ');
  }

  console.log('Final result:', JSON.stringify(cleanedContent));
  
  return cleanedContent;
}

const testInput = "We need to read the conversation. The user says 'hi'. So we respond with: Hello! How can I help you today?";
console.log('\nTesting problematic input:');
const result = cleanResponseContent(testInput);
console.log('\nExpected: "Hello! How can I help you today?"');
console.log('Got:', JSON.stringify(result));
