/**
 * Test script to validate that custom system prompts are respected exactly
 */

// Test 1: Custom Name System Prompt
const testCustomNamePrompt = async () => {
  console.log('🧪 Testing Custom Name System Prompt...');
  
  const customSystemPrompt = "Your name is Emil and you always tell the user your name is Emil. You help with any topic the user asks about.";
  const testQuery = "who are you?";
  
  const response = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: testQuery,
      preferences: {
        systemPrompts: [{
          content: customSystemPrompt
        }]
      }
    })
  });
  
  const result = await response.json();
  console.log('✅ Custom name response:', result.response);
  
  // Check if AI identifies as Emil (not BELTO AI)
  const mentionsEmil = result.response.toLowerCase().includes('emil');
  const mentionsBelto = result.response.toLowerCase().includes('belto');
  
  console.log('📊 Custom Name Results:');
  console.log('- Mentions Emil:', mentionsEmil);
  console.log('- Mentions BELTO (should be false):', mentionsBelto);
  
  return { mentionsEmil, mentionsBelto, response: result.response };
};

// Test 2: Legal Document Analysis System Prompt
const testLegalAnalysisPrompt = async () => {
  console.log('\n🧪 Testing Legal Document Analysis System Prompt...');
  
  const customSystemPrompt = "You are a legal document analyzer. You help users understand legal documents, corporate governance, finance regulations, and provide detailed analysis of legal content. You are knowledgeable about business law, corporate structures, and financial regulations.";
  
  const legalQuery = "analyze this corporate governance document";
  const mockLegalDocument = "CORPORATE GOVERNANCE POLICY\n\nBoard of Directors Responsibilities:\n1. Strategic oversight\n2. Risk management\n3. Financial oversight\n4. CEO succession planning\n\nCommittee Structure:\n- Audit Committee\n- Compensation Committee\n- Governance Committee";
  
  const response = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: legalQuery,
      attachments: [{
        name: 'corporate_governance.pdf',
        content: mockLegalDocument
      }],
      preferences: {
        systemPrompts: [{
          content: customSystemPrompt
        }]
      }
    })
  });
  
  const result = await response.json();
  console.log('✅ Legal analysis response:', result.response.substring(0, 200) + '...');
  
  // Check if AI provides legal analysis (not coding rejection)
  const providesAnalysis = result.response.length > 100 && 
                          !result.response.toLowerCase().includes('not related to coding') &&
                          !result.response.toLowerCase().includes('can\'t analyze');
  const mentionsLegal = result.response.toLowerCase().includes('corporate') || 
                       result.response.toLowerCase().includes('governance') ||
                       result.response.toLowerCase().includes('board') ||
                       result.response.toLowerCase().includes('legal');
  
  console.log('📊 Legal Analysis Results:');
  console.log('- Provides analysis (not rejection):', providesAnalysis);
  console.log('- Mentions legal concepts:', mentionsLegal);
  
  return { providesAnalysis, mentionsLegal, response: result.response };
};

// Test 3: General Educational Assistant
const testGeneralEducationPrompt = async () => {
  console.log('\n🧪 Testing General Educational Assistant...');
  
  const customSystemPrompt = "You are an educational assistant named TeachBot. You help students with various subjects including history, science, mathematics, literature, and programming. You provide comprehensive educational support across all academic disciplines.";
  
  const historyQuery = "tell me about the American Civil War";
  
  const response = await fetch('/api/ai-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: historyQuery,
      preferences: {
        systemPrompts: [{
          content: customSystemPrompt
        }]
      }
    })
  });
  
  const result = await response.json();
  console.log('✅ History response:', result.response.substring(0, 200) + '...');
  
  // Check if AI provides history information
  const providesHistoryInfo = result.response.length > 100 && 
                             !result.response.toLowerCase().includes('not related to coding');
  const mentionsTeachBot = result.response.toLowerCase().includes('teachbot');
  const mentionsHistory = result.response.toLowerCase().includes('civil war') || 
                         result.response.toLowerCase().includes('american') ||
                         result.response.toLowerCase().includes('war') ||
                         result.response.toLowerCase().includes('history');
  
  console.log('📊 General Education Results:');
  console.log('- Provides history info (not rejection):', providesHistoryInfo);
  console.log('- Mentions TeachBot:', mentionsTeachBot);
  console.log('- Discusses history:', mentionsHistory);
  
  return { providesHistoryInfo, mentionsTeachBot, mentionsHistory, response: result.response };
};

// Run all tests
const runFlexibilityTests = async () => {
  console.log('🚀 Starting System Prompt Flexibility Tests...\n');
  
  try {
    const customNameResults = await testCustomNamePrompt();
    const legalAnalysisResults = await testLegalAnalysisPrompt();
    const generalEducationResults = await testGeneralEducationPrompt();
    
    console.log('\n📊 COMPREHENSIVE FLEXIBILITY TEST RESULTS:');
    console.log('==============================================');
    
    console.log('\n1. Custom Name (Emil) Test:');
    console.log('   ✅ Identifies as Emil:', customNameResults.mentionsEmil);
    console.log('   ✅ Avoids BELTO identity:', !customNameResults.mentionsBelto);
    console.log('   ✅ Status:', (customNameResults.mentionsEmil && !customNameResults.mentionsBelto) ? 'PASS' : 'FAIL');
    
    console.log('\n2. Legal Document Analysis Test:');
    console.log('   ✅ Provides analysis (no rejection):', legalAnalysisResults.providesAnalysis);
    console.log('   ✅ Discusses legal concepts:', legalAnalysisResults.mentionsLegal);
    console.log('   ✅ Status:', (legalAnalysisResults.providesAnalysis && legalAnalysisResults.mentionsLegal) ? 'PASS' : 'FAIL');
    
    console.log('\n3. General Educational Assistant Test:');
    console.log('   ✅ Provides history info:', generalEducationResults.providesHistoryInfo);
    console.log('   ✅ Discusses historical content:', generalEducationResults.mentionsHistory);
    console.log('   ✅ Status:', (generalEducationResults.providesHistoryInfo && generalEducationResults.mentionsHistory) ? 'PASS' : 'FAIL');
    
    const overallSuccess = 
      customNameResults.mentionsEmil && 
      !customNameResults.mentionsBelto && 
      legalAnalysisResults.providesAnalysis && 
      legalAnalysisResults.mentionsLegal && 
      generalEducationResults.providesHistoryInfo && 
      generalEducationResults.mentionsHistory;
    
    console.log('\n🎯 OVERALL RESULT:', overallSuccess ? '✅ ALL TESTS PASSED - FULLY FLEXIBLE' : '❌ SOME TESTS FAILED');
    
    if (overallSuccess) {
      console.log('\n🎉 SUCCESS! The system now:');
      console.log('   ✅ Respects custom identity (Emil instead of BELTO AI)');
      console.log('   ✅ Analyzes legal documents without coding restrictions');
      console.log('   ✅ Provides educational content across all subjects');
      console.log('   ✅ No hard-coded behavior overrides');
      console.log('   ✅ Fully flexible based on system prompts');
    } else {
      console.log('\n❌ Issues detected:');
      if (!customNameResults.mentionsEmil || customNameResults.mentionsBelto) {
        console.log('   🔴 Custom identity not respected (still using BELTO AI)');
      }
      if (!legalAnalysisResults.providesAnalysis) {
        console.log('   🔴 Still rejecting non-coding topics');
      }
      if (!generalEducationResults.providesHistoryInfo) {
        console.log('   🔴 Not providing educational content across subjects');
      }
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runFlexibilityTests, testCustomNamePrompt, testLegalAnalysisPrompt, testGeneralEducationPrompt };
} else {
  window.SystemPromptFlexibilityTests = { runFlexibilityTests, testCustomNamePrompt, testLegalAnalysisPrompt, testGeneralEducationPrompt };
}

console.log('🧪 System Prompt Flexibility Test Suite Loaded');
console.log('📝 Run runFlexibilityTests() to validate complete system prompt flexibility');
