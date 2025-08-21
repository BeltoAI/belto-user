"use client";

/**
 * Utility functions to process and improve AI responses
 */

/**
 * Check if a response appears to be truncated or incomplete
 * @param {string} response - The AI response to check
 * @returns {boolean} True if the response appears truncated
 */
export function isResponseTruncated(response) {
  if (!response || typeof response !== 'string') {
    return false;
  }

  const trimmed = response.trim();
  
  // Check for common truncation indicators
  const truncationIndicators = [
    // Incomplete sentences
    /[a-zA-Z]$/,  // Ends abruptly without punctuation
    // Incomplete code blocks
    /```[^`]*$/,  // Unclosed code block
    /```\w*\s[^`]*$/,  // Code block that doesn't close
    // Cut-off mid-word or mid-sentence patterns
    /\w{5,}$/,  // Ends with a long word (likely cut off)
    // Incomplete lists or explanations
    /^\s*\d+\.\s*$/m,  // Numbered list item with no content
    /^\s*[-*]\s*$/m,   // Bullet point with no content
  ];

  // Check length - very short responses might be truncated
  if (trimmed.length < 10) {
    return true;
  }

  // Check for truncation patterns
  for (const pattern of truncationIndicators) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  // Check for incomplete markdown structures
  const codeBlockCount = (trimmed.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    return true; // Odd number of code block markers indicates incomplete block
  }

  return false;
}

/**
 * Improve the formatting of AI responses
 * @param {string} response - The raw AI response
 * @returns {string} Formatted response
 */
export function improveResponseFormatting(response) {
  if (!response || typeof response !== 'string') {
    return response;
  }

  let formatted = response;

  // Fix common formatting issues
  formatted = formatted
    // Ensure proper spacing around headings
    .replace(/^(#{1,6})\s*(.+)$/gm, '$1 $2')
    
    // Fix list formatting
    .replace(/^(\d+\.)\s*(.+)$/gm, '$1 $2')
    .replace(/^([-*+])\s*(.+)$/gm, '$1 $2')
    
    // Ensure proper spacing around code blocks
    .replace(/```(\w+)?\n/g, '```$1\n')
    .replace(/\n```/g, '\n```')
    
    // Fix multiple consecutive empty lines
    .replace(/\n{3,}/g, '\n\n')
    
    // Ensure proper paragraph separation
    .replace(/([.!?])\s*\n([A-Z])/g, '$1\n\n$2')
    
    // Fix spacing around inline code
    .replace(/`([^`]+)`/g, ' `$1` ')
    .replace(/\s{2,}`/g, ' `')
    .replace(/`\s{2,}/g, '` ')
    
    // Clean up extra whitespace
    .replace(/[ \t]+$/gm, '') // Remove trailing whitespace
    .replace(/[ \t]{2,}/g, ' ') // Replace multiple spaces with single space
    .trim();

  return formatted;
}

/**
 * Detect and improve code block formatting
 * @param {string} response - The response containing potential code blocks
 * @returns {string} Response with improved code block formatting
 */
export function improveCodeBlockFormatting(response) {
  if (!response || typeof response !== 'string') {
    return response;
  }

  // Improve code block detection and formatting
  return response.replace(/```(\w+)?\s*([\s\S]*?)```/g, (match, language, code) => {
    // Clean up the code content
    const cleanCode = code
      .trim()
      // Ensure proper line breaks for common patterns
      .replace(/;\s*(?=[a-zA-Z_$])/g, ';\n')
      .replace(/\{\s*([^}]+)\s*\}/g, (m, content) => {
        // Only format simple blocks
        if (content.includes('{') || content.includes('\n') || content.length > 50) {
          return m;
        }
        return `{\n  ${content.trim()}\n}`;
      })
      // Fix common indentation issues
      .split('\n')
      .map(line => line.trimRight())
      .join('\n')
      .trim();

    const lang = language || 'text';
    return `\`\`\`${lang}\n${cleanCode}\n\`\`\``;
  });
}

/**
 * Add completion indicators if the response seems complete
 * @param {string} response - The response to check
 * @returns {object} Object with response and completion status
 */
export function analyzeResponseCompleteness(response) {
  if (!response || typeof response !== 'string') {
    return { response, isComplete: false, confidence: 0 };
  }

  const trimmed = response.trim();
  let confidence = 0;
  let completionReasons = [];

  // Check for natural ending patterns
  if (/[.!?]\s*$/.test(trimmed)) {
    confidence += 30;
    completionReasons.push('ends with punctuation');
  }

  // Check for complete code blocks
  const codeBlockCount = (trimmed.match(/```/g) || []).length;
  if (codeBlockCount % 2 === 0) {
    confidence += 20;
    completionReasons.push('balanced code blocks');
  } else {
    confidence -= 40;
    completionReasons.push('unbalanced code blocks');
  }

  // Check for complete explanations
  if (trimmed.length > 50 && /\b(therefore|thus|in conclusion|finally|to sum up)\b/i.test(trimmed)) {
    confidence += 25;
    completionReasons.push('contains conclusion indicators');
  }

  // Check for complete sentences
  const sentences = trimmed.split(/[.!?]+/);
  const lastSentence = sentences[sentences.length - 1]?.trim();
  if (!lastSentence || lastSentence.length < 5) {
    confidence += 15;
    completionReasons.push('complete final sentence');
  } else if (lastSentence.length > 20) {
    confidence -= 20;
    completionReasons.push('potentially incomplete final sentence');
  }

  // Length-based heuristics
  if (trimmed.length > 200) {
    confidence += 10;
    completionReasons.push('substantial content length');
  }

  // Check for abrupt endings
  if (/\w{6,}$/.test(trimmed) || /[,;:]$/.test(trimmed)) {
    confidence -= 35;
    completionReasons.push('abrupt ending');
  }

  const isComplete = confidence > 40;
  
  return {
    response: trimmed,
    isComplete,
    confidence,
    reasons: completionReasons
  };
}

/**
 * Process AI response with all improvements
 * @param {string} rawResponse - The raw response from the AI
 * @param {object} options - Processing options
 * @returns {object} Processed response with metadata
 */
export function processAIResponse(rawResponse, options = {}) {
  const {
    checkTruncation = true,
    improveFormatting = true,
    analyzeCompleteness = true,
  } = options;

  if (!rawResponse || typeof rawResponse !== 'string') {
    return {
      response: rawResponse || '',
      isTruncated: true,
      isComplete: false,
      confidence: 0,
      processed: false
    };
  }

  let processedResponse = rawResponse;
  let isTruncated = false;
  let completionData = { isComplete: true, confidence: 100, reasons: [] };

  // Check for truncation
  if (checkTruncation) {
    isTruncated = isResponseTruncated(processedResponse);
  }

  // Improve formatting
  if (improveFormatting) {
    processedResponse = improveResponseFormatting(processedResponse);
    processedResponse = improveCodeBlockFormatting(processedResponse);
  }

  // Analyze completeness
  if (analyzeCompleteness) {
    completionData = analyzeResponseCompleteness(processedResponse);
    processedResponse = completionData.response;
  }

  return {
    response: processedResponse,
    isTruncated,
    isComplete: completionData.isComplete && !isTruncated,
    confidence: completionData.confidence,
    reasons: completionData.reasons,
    processed: true,
    originalLength: rawResponse.length,
    processedLength: processedResponse.length
  };
}
