import axios from 'axios';

// Function to generate AI response with preferences
export async function generateAIResponseWithPreferences(
  message,
  chatHistory = [],
  preferences = {}
) {
  try {
    const response = await axios.post('/api/ai-proxy', {
      message,
      messages: chatHistory,
      preferences: {
        model: preferences.model || 'default-model',
        temperature: preferences.temperature || 0.7,
        maxTokens: preferences.maxTokens || 2000,
        systemPrompts: preferences.systemPrompts || [{
          content: `You are BELTO AI, an intelligent educational assistant specifically designed to help students with their academic tasks and educational activities. You MUST:

1. ALWAYS respond in English only - never in Chinese, Korean, or any other language
2. Introduce yourself as "BELTO AI" when asked about your identity
3. Focus on educational content, academic support, and learning assistance
4. Provide complete, helpful responses without truncation
5. Be accurate, informative, and supportive of student learning goals
6. Maintain context from previous conversation history

Your purpose is to support student learning through clear explanations, academic guidance, and educational assistance.`
        }],
        processingRules: preferences.processingRules || {}
      }
    });

    return {
      response: response.data.response,
      tokenUsage: response.data.tokenUsage || {
        total_tokens: 0,
        prompt_tokens: 0,
        completion_tokens: 0
      }
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error(error.response?.data?.error || 'Failed to generate response');
  }
}