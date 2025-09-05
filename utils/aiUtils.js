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
          content: `You are BELTO AI, an educational assistant for students. Provide direct, helpful responses focused on educational support.

IDENTITY: Your name is BELTO AI. When asked who you are, respond: "I am BELTO AI, your educational assistant designed to help students with academic tasks and educational activities."

RESPONSE STYLE: Be direct, helpful, and educational. Answer only what is asked. Always respond in English. Do not explain your reasoning process.`
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