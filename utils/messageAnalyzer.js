/**
 * Utility to analyze messages for concerning content
 */

// Keywords that should trigger flagging
const CONCERNING_KEYWORDS = [
  "kill", "murder", "death", "suicide", "harm", "hurt", "weapon",
  "gun", "knife", "bomb", "threat", "attack", "violent", "destroy",
  "hate", "revenge", "shoot", "stab", "dangerous", "explosive"
];

/**
 * Analyzes a message for concerning content
 * @param {string} message - The message to analyze
 * @returns {Object} - Result of the analysis
 */
export const analyzeMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return { isFlagged: false, severity: 'none', matchedKeywords: [] };
  }

  const lowerCaseMessage = message.toLowerCase();
  const matchedKeywords = CONCERNING_KEYWORDS.filter(keyword => 
    lowerCaseMessage.includes(keyword.toLowerCase())
  );

  // Calculate severity based on number of matched keywords
  let severity = 'none';
  if (matchedKeywords.length > 0) {
    severity = matchedKeywords.length >= 3 ? 'high' : 'medium';
  }

  return {
    isFlagged: matchedKeywords.length > 0,
    severity,
    matchedKeywords
  };
};