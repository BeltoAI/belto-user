/**
 * Test to simulate the exact same input that would come from the browser
 */

// Simulate the exact same structure that comes from the browser
const testBody = {
  prompt: "hi"
};

const testMessages = [
  { role: 'system', content: 'You are BELTO AI, an educational assistant.' },
  { role: 'user', content: 'hi' }
];

console.log('Testing with exact browser input structure...');

// Copy our functions exactly as they are in route.js
function calculateDynamicTokenLimit(body, messages) {
  console.log('🔍 Starting calculateDynamicTokenLimit');
  console.log('Body:', body);
  console.log('Messages:', messages);
  
  // Base configuration
  const config = {
    minTokens: 400,       
    maxTokens: 4000,      
    baseTokens: 800,      
  };

  console.log('Config:', config);

  // Content analysis
  console.log('🔍 Calling analyzeContentComplexity');
  const contentMetrics = analyzeContentComplexity(body, messages);
  console.log('Content metrics:', contentMetrics);
  
  // Intent analysis  
  console.log('🔍 Calling analyzeUserIntent');
  const intentMetrics = analyzeUserIntent(body, messages);
  console.log('Intent metrics:', intentMetrics);
  
  // Context analysis
  console.log('🔍 Calling analyzeContextRequirements');
  const contextMetrics = analyzeContextRequirements(body, messages);
  console.log('Context metrics:', contextMetrics);
  
  // Calculate base requirement
  let tokenRequirement = config.baseTokens;
  console.log('Base token requirement:', tokenRequirement);
  
  // Apply content complexity multiplier
  tokenRequirement *= contentMetrics.complexityMultiplier;
  console.log('After complexity multiplier:', tokenRequirement);
  
  // Apply intent-based adjustments
  tokenRequirement += intentMetrics.intentBonus;
  console.log('After intent bonus:', tokenRequirement);
  
  // Apply context requirements
  tokenRequirement += contextMetrics.contextBonus;
  console.log('After context bonus:', tokenRequirement);
  
  // Apply user preferences if available
  if (body.preferences?.maxTokens || body.aiConfig?.maxTokens) {
    const userMax = body.preferences?.maxTokens || body.aiConfig?.maxTokens;
    tokenRequirement = Math.min(tokenRequirement, userMax);
    console.log('After user preference limit:', tokenRequirement);
  }
  
  // Ensure within bounds
  const finalTokens = Math.max(
    config.minTokens, 
    Math.min(config.maxTokens, Math.round(tokenRequirement))
  );
  
  console.log('Final tokens:', finalTokens);
  
  return finalTokens;
}

function analyzeContentComplexity(body, messages) {
  console.log('🔍 analyzeContentComplexity - messages:', messages);
  
  const totalContentLength = messages.reduce((sum, msg) => {
    const length = (msg.content?.length || 0);
    console.log(`Message content length: ${length}`);
    return sum + length;
  }, 0);
  
  console.log('Total content length:', totalContentLength);
  
  const hasAttachments = body.attachments && body.attachments.length > 0;
  console.log('Has attachments:', hasAttachments);
  
  let complexityMultiplier = 1.0;
  let reasoning = [];
  
  if (totalContentLength < 100) {
    complexityMultiplier = 0.75;
    reasoning.push('Simple content');
  } else if (totalContentLength < 500) {
    complexityMultiplier = 1.0;
    reasoning.push('Standard content');
  } else if (totalContentLength < 2000) {
    complexityMultiplier = 1.3;
    reasoning.push('Moderate complexity');
  } else {
    complexityMultiplier = 1.6;
    reasoning.push('High complexity content');
  }
  
  if (hasAttachments) {
    const docSize = body.attachments.reduce((max, att) => Math.max(max, att.content?.length || 0), 0);
    if (docSize > 100000) {
      complexityMultiplier *= 2.0;
      reasoning.push('Very large document');
    } else if (docSize > 50000) {
      complexityMultiplier *= 1.5;
      reasoning.push('Large document');
    } else if (docSize > 20000) {
      complexityMultiplier *= 1.3;
      reasoning.push('Medium document');
    } else {
      complexityMultiplier *= 1.1;
      reasoning.push('Small document');
    }
  }
  
  const result = { complexityMultiplier, reasoning: reasoning.join(', ') };
  console.log('Content complexity result:', result);
  return result;
}

function analyzeUserIntent(body, messages) {
  console.log('🔍 analyzeUserIntent - messages:', messages);
  
  const userMessages = messages.filter(m => m.role === 'user');
  console.log('User messages:', userMessages);
  
  const lastUserMessage = userMessages.pop()?.content?.toLowerCase() || '';
  console.log('Last user message:', lastUserMessage);
  
  let intentBonus = 0;
  
  if (/^(hi|hello|hey|what|who are you|how are you)/.test(lastUserMessage.trim())) {
    intentBonus = -200;
    console.log('Detected greeting, intentBonus:', intentBonus);
  } else if (/\b(analyze|analysis|explain|breakdown|detailed|comprehensive|examine)\b/.test(lastUserMessage)) {
    intentBonus = 400;
    console.log('Detected analysis request, intentBonus:', intentBonus);
  } else if (/\b(summarize|summary|overview|brief|outline)\b/.test(lastUserMessage)) {
    intentBonus = 200;
    console.log('Detected summary request, intentBonus:', intentBonus);
  } else if (/\b(steps|how to|tutorial|guide|procedure|process)\b/.test(lastUserMessage)) {
    intentBonus = 300;
  } else if (/\b(compare|contrast|difference|similar|versus|vs)\b/.test(lastUserMessage)) {
    intentBonus = 350;
  } else if (/\b(teach|learn|understand|concept|theory|principle|formula)\b/.test(lastUserMessage)) {
    intentBonus = 250;
  } else if (/\b(list|enumerate|points|items|examples|types|kinds)\b/.test(lastUserMessage)) {
    intentBonus = 150;
  }
  
  const result = { intentBonus };
  console.log('Intent result:', result);
  return result;
}

function analyzeContextRequirements(body, messages) {
  console.log('🔍 analyzeContextRequirements - messages:', messages);
  
  let contextBonus = 0;
  
  const historyLength = messages.filter(m => m.role !== 'system').length;
  console.log('History length:', historyLength);
  
  if (historyLength > 10) {
    contextBonus += 100;
  } else if (historyLength > 5) {
    contextBonus += 50;
  }
  
  if (body.processingHints) {
    console.log('Processing hints:', body.processingHints);
    const hints = body.processingHints;
    if (hints.analysisType === 'analysis') {
      contextBonus += 200;
    } else if (hints.analysisType === 'summary') {
      contextBonus += 100;
    }
    
    if (hints.documentType === 'pdf') {
      contextBonus += 100;
    }
  }
  
  if (body.preferences?.systemPrompts?.length > 0) {
    console.log('System prompts present');
    contextBonus += 150;
  }
  
  const result = { contextBonus };
  console.log('Context result:', result);
  return result;
}

try {
  console.log('🧪 Starting test...');
  const result = calculateDynamicTokenLimit(testBody, testMessages);
  console.log('✅ Success! Final result:', result);
} catch (error) {
  console.error('❌ Error occurred:', error);
  console.error('Stack trace:', error.stack);
}
