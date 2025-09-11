/**
 * Test file to validate AI response code formatting improvements
 * This demonstrates the before and after of code formatting fixes
 */

import { processAIResponse, enhanceCodeExamples, validateCodeFormatting } from '../app/chat/utils/responseProcessor.js';

// Test responses that simulate common AI output issues
const testResponses = [
  {
    name: "Unformatted Python Code",
    input: `Here's a simple Python code snippet that calculates the sum of all even numbers from 1 to 100: \`\`\` # Initialize sum variable to 0 total_sum = 0 # Iterate over numbers from 1 to 100 for num in range(1, 101): # Check if number is even if num % 2 == 0: # Add even number to the total sum total_sum += num print("The sum of all even numbers from 1 to 100 is:", total_sum) \`\`\` Alternatively, you can use a list comprehension and built-in functions in Python: \`\`\` # Use list comprehension to get even numbers from 1 to 100 even_numbers = [num for num in range(1, 101) if num % 2 == 0] # Calculate the sum of even numbers total_sum = sum(even_numbers) print("The sum of all even numbers from 1 to 100 is:", total_sum) \`\`\``
  },
  {
    name: "Missing Language Specification",
    input: `Here's how to create a simple function:\n\`\`\`\nfunction calculateSum(numbers) {\n  let sum = 0;\n  for (let i = 0; i < numbers.length; i++) {\n    sum += numbers[i];\n  }\n  return sum;\n}\n\`\`\`\n\nThis function takes an array of numbers and returns their sum.`
  },
  {
    name: "Malformed Code Block", 
    input: `To solve this problem, you can use this code: \`\`\`python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))\n\nThis is a recursive implementation of the Fibonacci sequence.`
  }
];

// Run tests
function runTests() {
  console.log('🧪 Testing AI Response Code Formatting Improvements\n');
  
  testResponses.forEach((test, index) => {
    console.log(`\n📝 Test ${index + 1}: ${test.name}`);
    console.log('=' * 50);
    
    console.log('\n📥 ORIGINAL INPUT:');
    console.log(test.input);
    
    // Validate original formatting
    const originalValidation = validateCodeFormatting(test.input);
    console.log('\n🔍 ORIGINAL VALIDATION:');
    console.log(`Valid: ${originalValidation.isValid}`);
    console.log(`Code blocks found: ${originalValidation.codeBlockCount}`);
    if (originalValidation.issues.length > 0) {
      console.log('Issues found:');
      originalValidation.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    // Process the response
    const processed = processAIResponse(test.input);
    const enhanced = enhanceCodeExamples(processed);
    
    console.log('\n📤 PROCESSED OUTPUT:');
    console.log(enhanced);
    
    // Validate processed formatting
    const processedValidation = validateCodeFormatting(enhanced);
    console.log('\n✅ PROCESSED VALIDATION:');
    console.log(`Valid: ${processedValidation.isValid}`);
    console.log(`Code blocks found: ${processedValidation.codeBlockCount}`);
    if (processedValidation.issues.length > 0) {
      console.log('Issues found:');
      processedValidation.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    console.log('\n🎯 IMPROVEMENTS:');
    console.log(`Issues fixed: ${originalValidation.issues.length - processedValidation.issues.length}`);
    console.log(`Code blocks properly formatted: ${processedValidation.isValid ? 'Yes' : 'No'}`);
    
    console.log('\n' + '='.repeat(60));
  });
}

// Expected output demonstration
function showExpectedOutput() {
  console.log('\n🎨 EXPECTED IMPROVED OUTPUT EXAMPLE:\n');
  
  const improvedExample = `Here's a simple Python code snippet that calculates the sum of all even numbers from 1 to 100:

\`\`\`python
# Initialize sum variable to 0
total_sum = 0

# Iterate over numbers from 1 to 100
for num in range(1, 101):
    # Check if number is even
    if num % 2 == 0:
        # Add even number to the total sum
        total_sum += num

print("The sum of all even numbers from 1 to 100 is:", total_sum)
\`\`\`

Alternatively, you can use a list comprehension and built-in functions in Python:

\`\`\`python
# Use list comprehension to get even numbers from 1 to 100
even_numbers = [num for num in range(1, 101) if num % 2 == 0]

# Calculate the sum of even numbers
total_sum = sum(even_numbers)

print("The sum of all even numbers from 1 to 100 is:", total_sum)
\`\`\`

Both code snippets will give you the same result. I am BELTO AI, your educational assistant.`;

  console.log(improvedExample);
  
  console.log('\n🌟 KEY IMPROVEMENTS:');
  console.log('✅ Proper code block formatting with language specification');
  console.log('✅ Correct syntax highlighting support');
  console.log('✅ Proper indentation and line breaks');
  console.log('✅ Clear separation between code blocks');
  console.log('✅ Preserved comments and educational content');
  console.log('✅ Professional presentation suitable for educational use');
}

// Run the tests
if (typeof window === 'undefined') {
  // Node.js environment
  runTests();
  showExpectedOutput();
} else {
  // Browser environment
  console.log('Code formatting test utilities loaded. Call runTests() and showExpectedOutput() to see examples.');
}

export { runTests, showExpectedOutput, testResponses };
