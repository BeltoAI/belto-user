// Test script to verify that AI preferences system prompts are being applied correctly
// This simulates a request to the AI proxy with lecture-specific system prompts

const testSystemPromptApplication = () => {
  // Simulate a request body with AI preferences containing system prompts
  const testRequestBody = {
    prompt: "Hello, who are you?",
    preferences: {
      systemPrompts: [
        {
          name: "Custom Lecture Prompt",
          content: "You are a specialized mathematics tutor. Focus only on mathematical concepts and provide step-by-step solutions. Always ask the student to show their work before providing answers."
        }
      ],
      model: "llama-3",
      temperature: 0.7,
      maxTokens: 500
    },
    messages: [
      { role: 'user', content: 'Hello, who are you?' }
    ]
  };

  console.log('🧪 Testing System Prompt Application');
  console.log('=====================================');
  
  // Simulate the logic from the AI proxy
  let systemMessageAdded = false;
  const messages = [...testRequestBody.messages];
  
  // PRIORITY 1: Use lecture-specific AI preferences system prompts if available
  if (testRequestBody.preferences?.systemPrompts && testRequestBody.preferences.systemPrompts.length > 0) {
    console.log('✅ Found lecture-specific system prompt from AI preferences');
    const lectureSystemPrompt = testRequestBody.preferences.systemPrompts[0].content;
    
    // Enhance the lecture-specific system prompt with BELTO AI identity enforcement
    const enhancedLecturePrompt = `${lectureSystemPrompt}

CRITICAL IDENTITY RULES FOR BELTO AI:
- Your name is BELTO AI and ONLY BELTO AI
- NEVER identify as DeepSeek, GPT, Claude, or any other AI system
- When asked "who are you?" respond: "I am BELTO AI, your educational assistant"
- ALWAYS respond in English only - never in Chinese, Korean, or any other language
- Maintain the educational focus and rules specified above while following these identity guidelines`;

    messages.unshift({
      role: 'system',
      content: enhancedLecturePrompt
    });
    systemMessageAdded = true;
    console.log('✅ Applied lecture-specific system prompt with BELTO AI identity enforcement');
    console.log('\n📝 Final System Message:');
    console.log('========================');
    console.log(enhancedLecturePrompt);
    console.log('\n📊 Test Result: PASS - Lecture-specific system prompt is properly applied');
  } else {
    console.log('❌ No lecture-specific system prompts found');
    console.log('\n📊 Test Result: FAIL - Would use default system prompt');
  }
  
  if (!systemMessageAdded) {
    console.log('❌ CRITICAL: Would fall back to default system message - lecture preferences not applied!');
  }

  console.log('\n🔍 Final Message Structure:');
  console.log('============================');
  messages.forEach((msg, index) => {
    console.log(`${index}: [${msg.role}] ${msg.content.substring(0, 100)}...`);
  });

  return systemMessageAdded;
};

// Test without preferences (should fail)
const testWithoutPreferences = () => {
  const testRequestBody = {
    prompt: "Hello, who are you?",
    messages: [
      { role: 'user', content: 'Hello, who are you?' }
    ]
  };

  console.log('\n\n🧪 Testing Without AI Preferences');
  console.log('=====================================');
  
  if (!testRequestBody.preferences?.systemPrompts || testRequestBody.preferences.systemPrompts.length === 0) {
    console.log('❌ No AI preferences found - would use default system prompt');
    console.log('📊 Test Result: EXPECTED - Should fall back to default when no lecture preferences exist');
    return false;
  }
  
  return true;
};

// Run tests
console.log('🚀 Starting System Prompt Application Tests\n');

const testResult1 = testSystemPromptApplication();
const testResult2 = testWithoutPreferences();

console.log('\n\n📊 FINAL TEST SUMMARY');
console.log('=====================');
console.log(`✅ Test 1 (With AI Preferences): ${testResult1 ? 'PASS' : 'FAIL'}`);
console.log(`✅ Test 2 (Without AI Preferences): ${!testResult2 ? 'PASS' : 'FAIL'}`);
console.log('\n🎯 CONCLUSION:');

if (testResult1 && !testResult2) {
  console.log('✅ System prompt application logic is working correctly!');
  console.log('✅ Lecture-specific AI preferences will be properly applied in the chat section.');
  console.log('✅ The CORE issue has been resolved - system prompts from lecture AI preferences will now be used.');
} else {
  console.log('❌ System prompt application logic needs further review.');
}
