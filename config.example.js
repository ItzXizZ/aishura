// AI Shura Configuration Example
// Copy this file to config.js and add your OpenAI API key

const config = {
  // Get your API key from: https://platform.openai.com/api-keys
  OPENAI_API_KEY: 'your_openai_api_key_here',
  
  // OpenAI API settings
  OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
  MODEL: 'gpt-4o-mini',
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7
};

export default config; 