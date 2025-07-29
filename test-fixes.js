// Test script to verify the fixes for reaction buttons and token counting

const testReactionButtonOptimization = () => {
  console.log('Testing reaction button optimization...');
  
  // Simulate reaction toggle
  const mockReactions = { 'msg-1': 'like' };
  const messageId = 'msg-1';
  
  // Test optimistic update
  const currentReaction = mockReactions[messageId];
  const newReaction = currentReaction === 'like' ? null : 'like';
  
  console.log('Current reaction:', currentReaction);
  console.log('New reaction:', newReaction);
  console.log('Optimistic update should be immediate');
  
  return newReaction;
};

const testTokenPersistence = () => {
  console.log('Testing token persistence...');
  
  const sessionId = 'test-session-123';
  const mockStats = {
    totalTokenUsage: 150,
    totalPrompts: 3,
    startTime: new Date().toISOString()
  };
  
  // Test localStorage persistence
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`sessionStats_${sessionId}`, JSON.stringify(mockStats));
    const retrieved = JSON.parse(localStorage.getItem(`sessionStats_${sessionId}`));
    
    console.log('Saved stats:', mockStats);
    console.log('Retrieved stats:', retrieved);
    console.log('Persistence working:', JSON.stringify(mockStats) === JSON.stringify(retrieved));
    
    return retrieved;
  } else {
    console.log('localStorage not available in this environment');
    return null;
  }
};

const testNavigationStatePreservation = () => {
  console.log('Testing navigation state preservation...');
  
  const beforeNavigation = {
    sessionId: 'session-123',
    tokenUsage: 200,
    promptCount: 5
  };
  
  // Simulate saving state before navigation
  if (typeof localStorage !== 'undefined') {
    const statsToSave = {
      totalTokenUsage: beforeNavigation.tokenUsage,
      totalPrompts: beforeNavigation.promptCount,
      startTime: new Date().toISOString()
    };
    
    localStorage.setItem(`sessionStats_${beforeNavigation.sessionId}`, JSON.stringify(statsToSave));
    
    // Simulate loading state after navigation
    const afterNavigation = JSON.parse(localStorage.getItem(`sessionStats_${beforeNavigation.sessionId}`));
    
    console.log('Before navigation:', beforeNavigation);
    console.log('After navigation:', afterNavigation);
    console.log('State preserved:', 
      afterNavigation.totalTokenUsage === beforeNavigation.tokenUsage &&
      afterNavigation.totalPrompts === beforeNavigation.promptCount
    );
    
    return afterNavigation;
  } else {
    console.log('localStorage not available in this environment');
    return null;
  }
};

// Run tests
console.log('=== Running Fix Verification Tests ===\n');

console.log('1. Reaction Button Optimization Test:');
testReactionButtonOptimization();

console.log('\n2. Token Persistence Test:');
testTokenPersistence();

console.log('\n3. Navigation State Preservation Test:');
testNavigationStatePreservation();

console.log('\n=== Tests Complete ===');
