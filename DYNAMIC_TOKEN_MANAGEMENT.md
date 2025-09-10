# Dynamic Token Management System - BELTO AI

## Overview

The Dynamic Token Management System replaces hard-coded token limits with an intelligent, adaptive approach that analyzes content, user intent, and context to determine optimal token allocation for AI responses.

## Problem Solved

**Previous Issue**: Hard-coded token limits (300, 500, 800, 1200, etc.) caused:
- Incomplete responses for complex queries
- Truncated educational content
- Inefficient token usage for simple questions
- Poor user experience with cut-off responses

**New Solution**: Dynamic calculation based on actual content analysis and user needs.

## How It Works

### 1. Content Analysis
The system analyzes message content to determine complexity:

```javascript
// Content Length Scaling
- < 100 chars: 0.75x multiplier (simple questions)
- < 500 chars: 1.0x multiplier (standard content)  
- < 2000 chars: 1.3x multiplier (moderate complexity)
- > 2000 chars: 1.6x multiplier (high complexity)

// Document Processing Scaling
- Small documents (< 20KB): 1.1x multiplier
- Medium documents (20-50KB): 1.3x multiplier
- Large documents (50-100KB): 1.5x multiplier
- Very large documents (> 100KB): 2.0x multiplier
```

### 2. Intent Recognition
The system recognizes user intent to adjust token allocation:

```javascript
// Intent-Based Token Adjustments
- Greetings ("hi", "hello"): -200 tokens
- Analysis requests: +400 tokens
- Summary requests: +200 tokens
- Step-by-step guides: +300 tokens
- Comparisons: +350 tokens
- Educational content: +250 tokens
- Lists/enumerations: +150 tokens
```

### 3. Context Requirements
Additional context factors influence token allocation:

```javascript
// Context-Based Adjustments
- Long conversations (> 10 messages): +100 tokens
- Medium conversations (5-10 messages): +50 tokens
- Processing hints for analysis: +200 tokens
- Processing hints for summary: +100 tokens
- PDF document processing: +100 tokens
- Lecture-specific content: +150 tokens
```

## Configuration

### Base Configuration
```javascript
const config = {
  minTokens: 400,       // Minimum for basic responses
  maxTokens: 4000,      // Maximum cap to prevent excessive costs
  baseTokens: 800,      // Starting point for calculations
};
```

### User Preferences Override
Users can set maximum token limits that override dynamic calculations:
- Admin preferences: `body.preferences.maxTokens`
- AI config: `body.aiConfig.maxTokens`

## Examples

### Example 1: Simple Greeting
```
Input: "Hi"
Calculation: 800 * 0.75 - 200 = 400 tokens
Result: 400 tokens (efficient for greeting)
```

### Example 2: Complex Analysis
```
Input: "Analyze the economic implications of AI in healthcare..."
Calculation: 800 * 1.0 + 400 = 1200 tokens
Result: 1200 tokens (comprehensive analysis)
```

### Example 3: Large Document Processing
```
Input: 120KB PDF + "Summarize this document"
Calculation: 800 * 1.5 * 2.0 + 200 + 100 = 2700 tokens
Result: 2700 tokens (thorough document processing)
```

### Example 4: User Limit Override
```
Input: Complex request with user preference maxTokens: 500
Calculation: Dynamic calculation = 1500, but user limit = 500
Result: 500 tokens (respects user preference)
```

## Benefits

### 1. Improved Response Quality
- No more truncated responses for complex queries
- Complete educational explanations
- Proper document analysis completion

### 2. Efficient Resource Usage
- Simple greetings use fewer tokens
- Complex analysis gets adequate allocation
- Better cost management

### 3. Better User Experience
- Responses match user expectations
- No surprise cut-offs
- Consistent quality across request types

### 4. Adaptive Learning Support
- Educational content gets appropriate space
- Document processing scales with size
- Context-aware responses

## Technical Implementation

### Core Function
```javascript
function calculateDynamicTokenLimit(body, messages) {
  const contentMetrics = analyzeContentComplexity(body, messages);
  const intentMetrics = analyzeUserIntent(body, messages);
  const contextMetrics = analyzeContextRequirements(body, messages);
  
  let tokenRequirement = baseTokens;
  tokenRequirement *= contentMetrics.complexityMultiplier;
  tokenRequirement += intentMetrics.intentBonus;
  tokenRequirement += contextMetrics.contextBonus;
  
  return Math.max(minTokens, Math.min(maxTokens, tokenRequirement));
}
```

### Integration Points
1. **AI Proxy Route**: Main calculation before request
2. **Endpoint Formatting**: Dynamic tokens passed to all endpoints
3. **Request Payload**: User preferences still respected
4. **Health Checks**: Use smaller token limits for testing

## Monitoring and Debugging

### Logging
The system provides detailed breakdown of token calculations:
```javascript
console.log('🧮 Token calculation breakdown:', {
  contentComplexity: contentMetrics.complexityMultiplier,
  intentBonus: intentMetrics.intentBonus,
  contextBonus: contextMetrics.contextBonus,
  baseRequirement: baseRequirement,
  finalTokens: finalTokens,
  reasoning: contentMetrics.reasoning
});
```

### Test Results
Based on test cases:
- Simple greetings: 400 tokens (efficient)
- Complex analysis: 1200 tokens (comprehensive)
- Document processing: 1480-1600 tokens (adequate)
- User limits: Properly respected
- Educational context: 1150 tokens (appropriate)

## Future Enhancements

### Possible Improvements
1. **Machine Learning**: Learn from response quality feedback
2. **Response Tracking**: Analyze which token allocations produce best results
3. **User Patterns**: Adapt to individual user preferences over time
4. **Domain-Specific**: Special handling for different academic subjects

### Configuration Options
1. **Department Settings**: Different base configs for different academic departments
2. **Time-Based**: Different allocations for peak vs off-peak usage
3. **Cost Controls**: Budget-aware token management

## Migration Notes

### Changes Made
1. Replaced all hard-coded token limits in `route.js`
2. Added dynamic calculation functions
3. Updated `formatRequestForEndpoint` to accept dynamic tokens
4. Modified payload preparation to use dynamic limits
5. Maintained backward compatibility with user preferences

### Breaking Changes
- None - the system maintains full backward compatibility
- User preferences still override dynamic calculations
- Default behavior is now smarter but doesn't break existing functionality

## Conclusion

The Dynamic Token Management System provides:
- **Flexibility**: Adapts to actual content needs
- **Efficiency**: Optimal resource usage
- **Quality**: Complete, comprehensive responses
- **User Control**: Preferences still respected
- **Maintainability**: No more hard-coded limits to update

This system ensures BELTO AI provides consistently high-quality, complete responses while efficiently managing computational resources.
