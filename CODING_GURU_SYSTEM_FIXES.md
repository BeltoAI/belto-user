# CODING GURU System Prompt Enforcement & Code Formatting Fixes

## Problem Summary
The BELTO AI system was not following the CODING GURU system prompt and had two critical issues:
1. **System Prompt Violation**: Responding to non-coding queries (e.g., "history of USA") instead of rejecting them
2. **Code Formatting Issues**: Code appearing as single lines instead of properly formatted multi-line blocks with correct indentation

## Solutions Implemented

### 1. Strong System Prompt Enforcement

#### Enhanced System Prompt
**File**: `app/api/ai-proxy/route.js`

```javascript
const baseSystemPrompt = `You are a CODING GURU (BELTO AI). You ONLY answer coding-related questions and tasks.

STRICT IDENTITY AND BEHAVIOR RULES:
- Your name is CODING GURU (BELTO AI)
- When asked "who are you?" respond: "I am CODING GURU (BELTO AI), your dedicated programming assistant"
- You ONLY help with coding, programming, software development, algorithms, and technical programming topics
- You answer ALL types of coding questions from easy to complex
- For ANY non-coding questions, you MUST respond: "Sorry, I can't answer this query as it is not related to coding"

CRITICAL: If a question is not about coding/programming, respond with: "Sorry, I can't answer this query as it is not related to coding"
`;
```

#### Query Validation Function
Added comprehensive query detection to filter non-coding questions before they reach the AI:

```javascript
function isCodingRelatedQuery(query) {
  // Strong patterns that immediately reject non-coding queries
  const strongNonCodingPatterns = [
    /history of/i, /geography/i, /politics/i, /economics/i,
    /literature/i, /creative writing/i, /personal advice/i,
    /biology/i, /chemistry/i, /physics/i, /mathematics/i,
    // ... many more patterns
  ];
  
  // Comprehensive coding keywords and patterns
  const codingKeywords = [
    'code', 'program', 'programming', 'function', 'variable',
    'algorithm', 'debug', 'python', 'javascript', 'java',
    // ... extensive list of coding terms
  ];
  
  // Returns true only for coding-related queries
}
```

#### Pre-Processing Validation
Added validation in the POST request handler:

```javascript
// CRITICAL: Check if the query is coding-related before processing
if (!isCodingRelatedQuery(userQuery)) {
  console.log('🚫 Non-coding query detected, returning coding-only message');
  return NextResponse.json({
    response: "Sorry, I can't answer this query as it is not related to coding.",
    tokenUsage: { total_tokens: 15, prompt_tokens: 10, completion_tokens: 5 }
  });
}
```

### 2. Code Formatting Preservation

#### Critical Code Block Preservation
**File**: `app/api/ai-proxy/route.js`

Modified the response cleaning to preserve code structure:

```javascript
// CRITICAL: Preserve code block structure completely - DO NOT modify code formatting
.replace(/```(\w*)\s*([^`]+?)```/g, (match, language, code) => {
  // PRESERVE ORIGINAL FORMATTING - This is critical for indentation-sensitive languages like Python
  let preservedCode = code
    .replace(/\r\n/g, '\n') // Only normalize line endings
    .replace(/\t/g, '    '); // Convert tabs to spaces for consistency
  
  // DO NOT trim lines or modify indentation - preserve exactly as written by AI
  // DO NOT join/split lines - this destroys Python indentation
  
  // Only ensure proper language specification
  const detectedLanguage = language || detectCodeLanguage(preservedCode) || 'text';
  
  return `\`\`\`${detectedLanguage}\n${preservedCode}\n\`\`\``;
});
```

#### Enhanced Language Detection
Added comprehensive language detection:

```javascript
function detectCodeLanguage(code) {
  const lowerCode = code.toLowerCase().trim();
  
  // Python detection - strongest indicators first
  if (lowerCode.includes('def ') || lowerCode.includes('import ') || 
      lowerCode.includes('print(') || lowerCode.includes('range(') ||
      lowerCode.includes('elif ') || lowerCode.includes('lambda ')) {
    return 'python';
  }
  // ... extensive detection for all major languages
}
```

#### Strengthened AI Instructions
Enhanced the system message enforcement:

```javascript
const enhanceSystemMessage = (content) => {
  return `${content}\n\nCRITICAL ENFORCEMENT: You are CODING GURU (BELTO AI). ONLY answer coding questions. For non-coding queries, respond: "Sorry, I can't answer this query as it is not related to coding". NEVER provide responses about history, politics, general knowledge, or any non-programming topics. Always format code with proper line breaks and indentation.`;
};
```

## Test Cases and Validation

### Non-Coding Queries (Should be REJECTED)
- ❌ "give me the history of usa in three bullet points"
- ❌ "what is the capital of france"
- ❌ "tell me about politics"
- ❌ "write a poem about love"

**Expected Response**: "Sorry, I can't answer this query as it is not related to coding"

### Coding Queries (Should be ACCEPTED)
- ✅ "write python code to sum even numbers from 1 to 100"
- ✅ "how to create a function in javascript"
- ✅ "explain recursion in programming"
- ✅ "debug this code: def sum_numbers(n): return n + 1"

**Expected Response**: Properly formatted code with syntax highlighting

### Code Formatting Examples

#### Before (Broken):
```
python def sum_even_numbers(n, total): if n > 2: return total elif n % 2 = = 0: return sum_even_numbers(n + 1, total + n) else: return sum_even_numbers(n + 1, total) print(sum_even_numbers(1, 0))
```

#### After (Fixed):
```python
def sum_even_numbers(n, total):
    if n > 100:
        return total
    elif n % 2 == 0:
        return sum_even_numbers(n + 1, total + n)
    else:
        return sum_even_numbers(n + 1, total)

print(sum_even_numbers(1, 0))
```

## Implementation Benefits

### 1. System Prompt Compliance
- ✅ Immediate rejection of non-coding queries
- ✅ Consistent CODING GURU identity
- ✅ No more inappropriate responses to history/politics questions
- ✅ Focus maintained on programming topics only

### 2. Code Formatting Quality
- ✅ Multi-line code with proper indentation
- ✅ Language-specific syntax highlighting
- ✅ Preserved Python indentation (critical for functionality)
- ✅ Professional code presentation
- ✅ Copy-paste ready code examples

### 3. Educational Value
- ✅ Students get properly formatted, functional code
- ✅ Clear separation between explanation and code
- ✅ Language-appropriate formatting
- ✅ Professional presentation standards

### 4. System Reliability
- ✅ Consistent behavior across all queries
- ✅ Predictable responses for educators
- ✅ Clear boundaries on system capabilities
- ✅ Reduced confusion about AI's purpose

## Technical Architecture

### Query Processing Pipeline
1. **Input Validation**: Check if query is coding-related
2. **Early Rejection**: Return standard message for non-coding queries
3. **AI Processing**: Only coding queries reach the AI model
4. **Response Formatting**: Preserve code structure and formatting
5. **Output Delivery**: Professional, properly formatted response

### Security and Consistency
- **Pre-filtering**: Prevents wasted resources on non-coding queries
- **Consistent Messaging**: Standard response for all non-coding attempts
- **System Integrity**: Maintains CODING GURU identity at all times
- **Resource Efficiency**: Only processes relevant queries

## Monitoring and Validation

### Success Metrics
- Non-coding queries receive standard rejection message
- All code blocks are properly formatted with correct indentation
- Language detection works accurately for syntax highlighting
- System maintains CODING GURU identity consistently

### Test Files Created
- `test-coding-guru-system.js`: Comprehensive test cases
- `test-response-formatting.js`: Code formatting validation

## Conclusion

The CODING GURU system now:
1. **Strictly enforces** its programming-only mandate
2. **Rejects non-coding queries** with appropriate messaging
3. **Formats code properly** with correct indentation and syntax highlighting
4. **Maintains consistent identity** as a dedicated programming assistant

These changes ensure that the system behaves exactly as specified in the system prompt, providing a reliable and focused coding education experience.
