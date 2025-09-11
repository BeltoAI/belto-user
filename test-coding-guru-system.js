/**
 * Test file for CODING GURU system prompt enforcement and code formatting
 */

// Test cases for query validation
const testQueries = [
  // Should be REJECTED (non-coding)
  {
    query: "give me the history of usa in three bullet points",
    expected: "REJECT",
    reason: "History question - not coding related"
  },
  {
    query: "what is the capital of france",
    expected: "REJECT", 
    reason: "Geography question - not coding related"
  },
  {
    query: "tell me about politics",
    expected: "REJECT",
    reason: "Politics question - not coding related"
  },
  {
    query: "write a poem about love",
    expected: "REJECT",
    reason: "Creative writing - not coding related"
  },
  
  // Should be ACCEPTED (coding-related)
  {
    query: "write python code to sum even numbers from 1 to 100",
    expected: "ACCEPT",
    reason: "Python programming request"
  },
  {
    query: "how to create a function in javascript",
    expected: "ACCEPT",
    reason: "JavaScript programming question"
  },
  {
    query: "explain recursion in programming",
    expected: "ACCEPT",
    reason: "Programming concept explanation"
  },
  {
    query: "debug this code: def sum_numbers(n): return n + 1",
    expected: "ACCEPT", 
    reason: "Code debugging request"
  },
  {
    query: "what is object oriented programming",
    expected: "ACCEPT",
    reason: "Programming paradigm question"
  },
  {
    query: "create a REST API in node.js",
    expected: "ACCEPT",
    reason: "Web development programming task"
  }
];

// Expected system behavior
const expectedBehavior = {
  identity: "I am CODING GURU (BELTO AI), your dedicated programming assistant",
  nonCodingResponse: "Sorry, I can't answer this query as it is not related to coding",
  codeFormatting: {
    multiLine: true,
    properIndentation: true,
    languageSpecification: true,
    syntaxHighlighting: true
  }
};

// Test for code formatting - this should be properly formatted
const expectedPythonCodeFormat = `\`\`\`python
def sum_even_numbers(n, total):
    if n > 100:
        return total
    elif n % 2 == 0:
        return sum_even_numbers(n + 1, total + n)
    else:
        return sum_even_numbers(n + 1, total)

print(sum_even_numbers(1, 0))
\`\`\``;

console.log('🧪 CODING GURU System Test Cases');
console.log('=' * 50);

console.log('\n📋 Test Queries:');
testQueries.forEach((test, index) => {
  console.log(`${index + 1}. ${test.query}`);
  console.log(`   Expected: ${test.expected} - ${test.reason}`);
});

console.log('\n🎯 Expected Behavior:');
console.log(`Identity Response: "${expectedBehavior.identity}"`);
console.log(`Non-Coding Response: "${expectedBehavior.nonCodingResponse}"`);

console.log('\n💻 Expected Code Formatting:');
console.log('Python code should appear as:');
console.log(expectedPythonCodeFormat);

console.log('\n✅ Key Improvements Implemented:');
console.log('1. Strong query validation before AI processing');
console.log('2. Comprehensive non-coding keyword detection');
console.log('3. Enhanced system prompt enforcement');
console.log('4. Proper code formatting with line breaks');
console.log('5. Language-specific indentation preservation');
console.log('6. Immediate rejection of non-coding queries');

export { testQueries, expectedBehavior, expectedPythonCodeFormat };
