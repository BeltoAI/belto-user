/**
 * Test script for Dynamic Token Management System
 */

// Mock the dynamic token calculation functions for testing
function calculateDynamicTokenLimit(body, messages) {
  const config = {
    minTokens: 400,       
    maxTokens: 4000,      
    baseTokens: 800,      
  };

  const contentMetrics = analyzeContentComplexity(body, messages);
  const intentMetrics = analyzeUserIntent(body, messages);
  const contextMetrics = analyzeContextRequirements(body, messages);
  
  let tokenRequirement = config.baseTokens;
  tokenRequirement *= contentMetrics.complexityMultiplier;
  tokenRequirement += intentMetrics.intentBonus;
  tokenRequirement += contextMetrics.contextBonus;
  
  if (body.preferences?.maxTokens || body.aiConfig?.maxTokens) {
    const userMax = body.preferences?.maxTokens || body.aiConfig?.maxTokens;
    tokenRequirement = Math.min(tokenRequirement, userMax);
  }
  
  const finalTokens = Math.max(
    config.minTokens, 
    Math.min(config.maxTokens, Math.round(tokenRequirement))
  );
  
  console.log('🧮 Token calculation breakdown:', {
    contentComplexity: contentMetrics.complexityMultiplier,
    intentBonus: intentMetrics.intentBonus,
    contextBonus: contextMetrics.contextBonus,
    baseRequirement: Math.round(config.baseTokens * contentMetrics.complexityMultiplier),
    finalTokens: finalTokens,
    reasoning: contentMetrics.reasoning
  });
  
  return finalTokens;
}

function analyzeContentComplexity(body, messages) {
  const totalContentLength = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
  const hasAttachments = body.attachments && body.attachments.length > 0;
  
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
  
  return { complexityMultiplier, reasoning: reasoning.join(', ') };
}

function analyzeUserIntent(body, messages) {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content?.toLowerCase() || '';
  let intentBonus = 0;
  
  if (/^(hi|hello|hey|what|who are you|how are you)/.test(lastUserMessage.trim())) {
    intentBonus = -200;
  } else if (/\b(analyze|analysis|explain|breakdown|detailed|comprehensive|examine)\b/.test(lastUserMessage)) {
    intentBonus = 400;
  } else if (/\b(summarize|summary|overview|brief|outline)\b/.test(lastUserMessage)) {
    intentBonus = 200;
  } else if (/\b(steps|how to|tutorial|guide|procedure|process)\b/.test(lastUserMessage)) {
    intentBonus = 300;
  } else if (/\b(compare|contrast|difference|similar|versus|vs)\b/.test(lastUserMessage)) {
    intentBonus = 350;
  } else if (/\b(teach|learn|understand|concept|theory|principle|formula)\b/.test(lastUserMessage)) {
    intentBonus = 250;
  } else if (/\b(list|enumerate|points|items|examples|types|kinds)\b/.test(lastUserMessage)) {
    intentBonus = 150;
  }
  
  return { intentBonus };
}

function analyzeContextRequirements(body, messages) {
  let contextBonus = 0;
  
  const historyLength = messages.filter(m => m.role !== 'system').length;
  if (historyLength > 10) {
    contextBonus += 100;
  } else if (historyLength > 5) {
    contextBonus += 50;
  }
  
  if (body.processingHints) {
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
    contextBonus += 150;
  }
  
  return { contextBonus };
}

// Test cases
console.log('🧪 Testing Dynamic Token Management System\n');

// Test 1: Simple greeting
console.log('TEST 1: Simple greeting');
const test1 = {
  body: {},
  messages: [
    { role: 'user', content: 'Hi' }
  ]
};
const tokens1 = calculateDynamicTokenLimit(test1.body, test1.messages);
console.log(`Expected: ~400-600 tokens, Got: ${tokens1}\n`);

// Test 2: Complex analysis request
console.log('TEST 2: Complex analysis request');
const test2 = {
  body: {},
  messages: [
    { role: 'user', content: 'Please provide a detailed analysis of the economic implications of artificial intelligence in modern healthcare systems, examining both benefits and potential risks across different stakeholder groups including patients, healthcare providers, insurance companies, and regulatory bodies.' }
  ]
};
const tokens2 = calculateDynamicTokenLimit(test2.body, test2.messages);
console.log(`Expected: ~1200-1500 tokens, Got: ${tokens2}\n`);

// Test 3: Document processing
console.log('TEST 3: Document processing');
const test3 = {
  body: {
    attachments: [
      { content: 'A'.repeat(25000), name: 'medium-doc.pdf' }
    ],
    processingHints: {
      documentType: 'pdf',
      analysisType: 'analysis'
    }
  },
  messages: [
    { role: 'user', content: 'Analyze this document' }
  ]
};
const tokens3 = calculateDynamicTokenLimit(test3.body, test3.messages);
console.log(`Expected: ~1800-2200 tokens, Got: ${tokens3}\n`);

// Test 4: Large document with summary request
console.log('TEST 4: Large document with summary');
const test4 = {
  body: {
    attachments: [
      { content: 'A'.repeat(120000), name: 'large-doc.pdf' }
    ],
    processingHints: {
      documentType: 'pdf',
      analysisType: 'summary'
    }
  },
  messages: [
    { role: 'user', content: 'Summarize this document' }
  ]
};
const tokens4 = calculateDynamicTokenLimit(test4.body, test4.messages);
console.log(`Expected: ~2500-3000 tokens, Got: ${tokens4}\n`);

// Test 5: User preference limit
console.log('TEST 5: User preference override');
const test5 = {
  body: {
    preferences: { maxTokens: 500 },
    attachments: [
      { content: 'A'.repeat(50000), name: 'doc.pdf' }
    ]
  },
  messages: [
    { role: 'user', content: 'Analyze this complex document in detail' }
  ]
};
const tokens5 = calculateDynamicTokenLimit(test5.body, test5.messages);
console.log(`Expected: 500 tokens (user limit), Got: ${tokens5}\n`);

// Test 6: Educational context
console.log('TEST 6: Educational context with lecture materials');
const test6 = {
  body: {
    preferences: {
      systemPrompts: [{ content: 'Educational prompt' }]
    }
  },
  messages: [
    { role: 'user', content: 'Explain the concept of machine learning algorithms' },
    { role: 'assistant', content: 'Previous response...' },
    { role: 'user', content: 'Now explain deep learning' }
  ]
};
const tokens6 = calculateDynamicTokenLimit(test6.body, test6.messages);
console.log(`Expected: ~1100-1300 tokens, Got: ${tokens6}\n`);

console.log('✅ Dynamic Token Management System tests completed!');
console.log('🎯 The system now adapts tokens based on:');
console.log('   • Content complexity and length');
console.log('   • User intent (greetings, analysis, summaries, etc.)');
console.log('   • Document size and type');
console.log('   • Conversation context');
console.log('   • User preferences and limits');
console.log('   • Educational context requirements');
