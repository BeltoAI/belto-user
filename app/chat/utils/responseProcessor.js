/**
 * Response processor utility for improving AI response formatting
 * Focuses on code formatting, markdown structure, and educational content presentation
 */

/**
 * Improves code formatting within AI responses
 * @param {string} response - The AI response text
 * @returns {string} - Formatted response with improved code blocks
 */
export function improveCodeFormatting(response) {
  if (!response || typeof response !== 'string') {
    return response;
  }

  // Improve code block detection and formatting
  let formattedResponse = response
    // Fix missing language specifiers in code blocks
    .replace(/```\s*\n([^`]+?)```/g, (match, code) => {
      // Try to detect the language from the code content
      const detectedLang = detectCodeLanguage(code.trim());
      return `\`\`\`${detectedLang}\n${code.trim()}\n\`\`\``;
    })
    
    // Ensure proper spacing around code blocks
    .replace(/([^\n])```/g, '$1\n```')
    .replace(/```([^\n])/g, '```\n$1')
    
    // Fix inline code formatting
    .replace(/`([^`\n]+)`/g, (match, code) => {
      // Clean up inline code content
      const cleanCode = code.trim();
      return `\`${cleanCode}\``;
    })
    
    // Improve list formatting
    .replace(/^(\d+\.\s+)/gm, '$1')
    .replace(/^(-\s+|\*\s+)/gm, '• ')
    
    // Fix paragraph spacing
    .replace(/\n{3,}/g, '\n\n')
    .replace(/([.!?])\s*\n\s*([A-Z])/g, '$1\n\n$2');

  return formattedResponse.trim();
}

/**
 * Detects programming language from code content
 * @param {string} code - Code snippet to analyze
 * @returns {string} - Detected language identifier
 */
function detectCodeLanguage(code) {
  const lowerCode = code.toLowerCase();
  
  // Python detection
  if (code.includes('def ') || code.includes('import ') || code.includes('print(') || 
      code.includes('if __name__') || code.includes('for ') && code.includes(' in ') ||
      lowerCode.includes('python')) {
    return 'python';
  }
  
  // JavaScript detection
  if (code.includes('function ') || code.includes('const ') || code.includes('let ') ||
      code.includes('var ') || code.includes('console.log') || code.includes('=>') ||
      lowerCode.includes('javascript')) {
    return 'javascript';
  }
  
  // Java detection
  if (code.includes('public class') || code.includes('public static void main') ||
      code.includes('System.out.println') || lowerCode.includes('java')) {
    return 'java';
  }
  
  // C++ detection
  if (code.includes('#include') || code.includes('std::') || code.includes('cout') ||
      lowerCode.includes('c++') || lowerCode.includes('cpp')) {
    return 'cpp';
  }
  
  // C detection
  if (code.includes('#include <stdio.h>') || code.includes('printf(') ||
      (code.includes('#include') && !code.includes('std::')) || lowerCode.includes(' c ')) {
    return 'c';
  }
  
  // HTML detection
  if (code.includes('<html') || code.includes('<!DOCTYPE') || code.includes('<div') ||
      lowerCode.includes('html')) {
    return 'html';
  }
  
  // CSS detection
  if (code.includes('{') && code.includes(':') && code.includes(';') &&
      (code.includes('color') || code.includes('font') || code.includes('margin') ||
       lowerCode.includes('css'))) {
    return 'css';
  }
  
  // SQL detection
  if (code.includes('SELECT') || code.includes('INSERT') || code.includes('UPDATE') ||
      code.includes('CREATE TABLE') || lowerCode.includes('sql')) {
    return 'sql';
  }
  
  // Shell/Bash detection
  if (code.includes('#!/bin/bash') || code.includes('echo ') || code.includes('ls ') ||
      lowerCode.includes('bash') || lowerCode.includes('shell')) {
    return 'bash';
  }
  
  // Default to text if no language detected
  return 'text';
}

/**
 * Enhances educational content structure
 * @param {string} response - The AI response text
 * @returns {string} - Enhanced response with better educational formatting
 */
export function enhanceEducationalContent(response) {
  if (!response || typeof response !== 'string') {
    return response;
  }

  let enhancedResponse = response
    // Add proper emphasis to educational keywords
    .replace(/\b(important|note|remember|key point|definition|formula|theorem|example)\b/gi, '**$1**')
    
    // Improve step-by-step formatting
    .replace(/^step\s+(\d+)[\s:]+/gmi, '### Step $1: ')
    
    // Format mathematical expressions (basic)
    .replace(/\b(\d+)\s*\+\s*(\d+)\s*=\s*(\d+)\b/g, '`$1 + $2 = $3`')
    .replace(/\b(\w+)\s*=\s*([^,\n]+)/g, '`$1 = $2`')
    
    // Add structure to explanations
    .replace(/^explanation[\s:]+/gmi, '## Explanation\n\n')
    .replace(/^solution[\s:]+/gmi, '## Solution\n\n')
    .replace(/^answer[\s:]+/gmi, '## Answer\n\n');

  return enhancedResponse;
}

/**
 * Validates and fixes markdown structure
 * @param {string} response - The AI response text
 * @returns {string} - Response with fixed markdown structure
 */
export function fixMarkdownStructure(response) {
  if (!response || typeof response !== 'string') {
    return response;
  }

  let fixedResponse = response
    // Fix heading spacing
    .replace(/^(#{1,6})\s*(.+)$/gm, '$1 $2')
    
    // Fix list spacing
    .replace(/^(\s*)([*-])\s+(.+)$/gm, '$1$2 $3')
    .replace(/^(\s*)(\d+\.)\s+(.+)$/gm, '$1$2 $3')
    
    // Fix bold and italic formatting
    .replace(/\*\*([^*]+)\*\*/g, '**$1**')
    .replace(/\*([^*]+)\*/g, '*$1*')
    
    // Ensure proper line breaks around code blocks
    .replace(/([^\n])```/g, '$1\n\n```')
    .replace(/```([^\n])/g, '```\n\n$1')
    
    // Clean up excessive spacing
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/[ \t]+$/gm, ''); // Remove trailing spaces

  return fixedResponse.trim();
}

/**
 * Main function to process and improve AI responses
 * @param {string} response - Raw AI response
 * @returns {string} - Processed and improved response
 */
export function processAIResponse(response) {
  if (!response || typeof response !== 'string') {
    return response || '';
  }

  // Apply all processing steps in order
  let processedResponse = response;
  
  // Step 1: Improve code formatting
  processedResponse = improveCodeFormatting(processedResponse);
  
  // Step 2: Enhance educational content
  processedResponse = enhanceEducationalContent(processedResponse);
  
  // Step 3: Fix markdown structure
  processedResponse = fixMarkdownStructure(processedResponse);
  
  return processedResponse;
}

/**
 * Specifically processes code examples for better formatting
 * @param {string} response - AI response containing code
 * @returns {string} - Response with enhanced code formatting
 */
export function enhanceCodeExamples(response) {
  if (!response || typeof response !== 'string') {
    return response;
  }

  return response.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || detectCodeLanguage(code);
    const cleanedCode = code
      .split('\n')
      .map(line => line.trimEnd()) // Remove trailing whitespace
      .join('\n')
      .trim();
    
    // Add helpful comments for educational purposes
    let enhancedCode = cleanedCode;
    
    if (language === 'python') {
      // Add explanatory comments for Python code
      enhancedCode = addPythonComments(cleanedCode);
    } else if (language === 'javascript') {
      // Add explanatory comments for JavaScript code
      enhancedCode = addJavaScriptComments(cleanedCode);
    }
    
    return `\`\`\`${language}\n${enhancedCode}\n\`\`\``;
  });
}

/**
 * Adds educational comments to Python code
 * @param {string} code - Python code
 * @returns {string} - Code with added comments
 */
function addPythonComments(code) {
  return code
    .replace(/^(def\s+\w+.*:)$/gm, '$1  # Function definition')
    .replace(/^(\s*for\s+.*:)$/gm, '$1  # Loop iteration')
    .replace(/^(\s*if\s+.*:)$/gm, '$1  # Conditional check')
    .replace(/^(\s*print\(.*)$/gm, '$1  # Output to console');
}

/**
 * Adds educational comments to JavaScript code
 * @param {string} code - JavaScript code
 * @returns {string} - Code with added comments
 */
function addJavaScriptComments(code) {
  return code
    .replace(/^(\s*function\s+\w+.*{)$/gm, '$1  // Function definition')
    .replace(/^(\s*for\s*\(.*\)\s*{)$/gm, '$1  // Loop iteration')
    .replace(/^(\s*if\s*\(.*\)\s*{)$/gm, '$1  // Conditional check')
    .replace(/^(\s*console\.log\(.*)$/gm, '$1  // Output to console');
}
