/**
 * Debug the AI proxy error by testing the dynamic token functions
 */

// Test if the functions are working in isolation
console.log('🔍 Testing dynamic token functions...');

try {
  // Copy the functions from route.js to test them
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

  // Test with the actual request that's failing
  const testBody = {};
  const testMessages = [
    { role: 'user', content: 'hi' }
  ];

  console.log('Testing calculateDynamicTokenLimit...');
  const result = calculateDynamicTokenLimit(testBody, testMessages);
  console.log('✅ Result:', result);

  console.log('\n✅ All functions work correctly in isolation');
  
} catch (error) {
  console.error('❌ Error in dynamic token functions:', error);
  console.error('Stack trace:', error.stack);
}

// Test if there might be an import issue
console.log('\n🔍 Checking for potential import issues...');
console.log('typeof axios:', typeof require('axios'));
console.log('typeof NextResponse:', typeof (function() {
  try {
    const { NextResponse } = require('next/server');
    return NextResponse;
  } catch (e) {
    return 'undefined - import issue';
  }
})());
