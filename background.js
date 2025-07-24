// AI Shura Background Service Worker
console.log('=== AI SHURA BACKGROUND SERVICE WORKER STARTING ===');

// Configuration
// Users should replace this with their own OpenAI API key
// Get your API key from: https://platform.openai.com/api-keys
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';



// Global state
let conversationHistory = [];

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type);
  
  switch (message.type) {
    case 'SUBMIT_QUESTION':
      handleQuestion(message, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'CAPTURE_SCREENSHOT':
      handleScreenshotCapture(message, sendResponse);
      return true; // Keep message channel open for async response
      
    case 'EXTRACT_CONTENT':
      handleContentExtraction(message, sendResponse);
      return true;
      
    case 'PROCESS_AUDIO_INPUT':
      handleAudioInput(message, sendResponse);
      return true;
      
    case 'REQUEST_DESKTOP_CAPTURE':
      handleDesktopCapture(message, sendResponse);
      return true;
      
    default:
      console.log('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
      return false;
  }
});

// Handle question submission to ChatGPT
async function handleQuestion(message, sendResponse) {
  try {
    const { question, content } = message;
    
    if (!question || !content) {
      sendResponse({ success: false, error: 'Missing question or content' });
      return;
    }

    console.log('Processing question:', question.substring(0, 100) + '...');
    
    // Prepare the conversation context
    const systemPrompt = `You are AI Shura, an intelligent browser assistant that helps users understand web page content. 

You have access to the following information about the current web page:
- Title: ${content.title || 'Unknown'}
- URL: ${content.url || 'Unknown'}
- Text content: ${content.text ? content.text.substring(0, 8000) + '...' : 'No text content available'}
- Images: ${content.images ? content.images.length + ' images with descriptions' : 'No images'}
- Links: ${content.links ? content.links.length + ' relevant links' : 'No links'}
- Screenshot: ${content.screenshot ? 'Visual screenshot of the page is available' : 'No screenshot available'}

IMPORTANT: If the user asks about what they see in a screenshot or about visual elements, and a screenshot is available, you can analyze the visual content. If no screenshot is available, let them know they may need to take a screenshot first.

Please provide helpful, accurate, and concise answers about the page content. If the user asks about something not present in the content, politely inform them. Focus on being helpful and informative while staying within the context of the provided content.

Current conversation history: ${conversationHistory.length} previous exchanges`;

    // Prepare the user message with image if available
    let userMessage = { role: 'user', content: [] };
    
    // Add text content
    userMessage.content.push({
      type: 'text',
      text: question
    });
    
    // Add screenshot if available
    if (content.screenshot) {
      console.log('Including screenshot in AI context, screenshot length:', content.screenshot.length);
      userMessage.content.push({
        type: 'image_url',
        image_url: {
          url: content.screenshot
        }
      });
    } else {
      console.log('No screenshot available in content');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 exchanges for context
      userMessage
    ];

    // Call OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content;

    if (!answer) {
      throw new Error('No response from AI');
    }

    // Update conversation history
    conversationHistory.push(userMessage);
    conversationHistory.push({ role: 'assistant', content: answer });

    // Keep conversation history manageable
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    console.log('AI response generated successfully');
    sendResponse({ success: true, answer: answer });

  } catch (error) {
    console.error('Error processing question:', error);
    sendResponse({ 
      success: false, 
      error: `Failed to process question: ${error.message}` 
    });
  }
}

// Handle screenshot capture using chrome.tabs.captureVisibleTab
async function handleScreenshotCapture(message, sendResponse) {
  try {
    console.log('Starting screenshot capture...');
    
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }

    // Use chrome.tabs.captureVisibleTab for simple screenshot capture
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
      quality: 100
    });

    console.log('Screenshot captured successfully');
    sendResponse({ success: true, screenshotData: dataUrl });

  } catch (error) {
    console.error('Screenshot capture failed:', error);
    sendResponse({ 
      success: false, 
      error: `Failed to capture screenshot: ${error.message}` 
    });
  }
}

// Handle content extraction request
async function handleContentExtraction(message, sendResponse) {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }

    // Execute content script to extract content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        // This function will be executed in the content script context
        if (window.aiShura && window.aiShura.extractContent) {
          return window.aiShura.extractContent();
        } else {
          throw new Error('AI Shura not available on this page');
        }
      }
    });

    if (results && results[0] && results[0].result) {
      sendResponse({ success: true, content: results[0].result });
    } else {
      throw new Error('Failed to extract content');
    }

  } catch (error) {
    console.error('Content extraction failed:', error);
    sendResponse({ 
      success: false, 
      error: `Failed to extract content: ${error.message}` 
    });
  }
}

// Handle audio input processing
async function handleAudioInput(message, sendResponse) {
  try {
    const { text, source, content } = message;
    
    if (!text || !content) {
      sendResponse({ success: false, error: 'Missing text or content' });
      return;
    }

    console.log(`Processing audio input from ${source}:`, text.substring(0, 100) + '...');
    console.log('Content has screenshot:', !!content.screenshot);
    
    // Prepare the conversation context for audio input
    const systemPrompt = `You are AI Shura, an intelligent browser assistant that helps users understand web page content. 

You have received an audio input from the user's ${source}. Please provide a helpful, concise response that can be spoken back to the user.

You have access to the following information about the current web page:
- Title: ${content.title || 'Unknown'}
- URL: ${content.url || 'Unknown'}
- Text content: ${content.text ? content.text.substring(0, 4000) + '...' : 'No text content available'}
- Images: ${content.images ? content.images.length + ' images with descriptions' : 'No images'}
- Links: ${content.links ? content.links.length + ' relevant links' : 'No links'}
- Screenshot: ${content.screenshot ? 'Visual screenshot of the page is available' : 'No screenshot available'}

IMPORTANT: If the user asks about what they see in a screenshot or about visual elements, and a screenshot is available, you can analyze the visual content. If no screenshot is available, let them know they may need to take a screenshot first.

Please provide a natural, conversational response that answers the user's audio question. Keep responses concise and suitable for speech synthesis.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 exchanges for context
      { role: 'user', content: text }
    ];

    // Call OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500, // Shorter for speech
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content;

    if (!answer) {
      throw new Error('No response from AI');
    }

    // Update conversation history
    conversationHistory.push({ role: 'user', content: text });
    conversationHistory.push({ role: 'assistant', content: answer });

    // Keep conversation history manageable
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    console.log('Audio input processed successfully');
    sendResponse({ success: true, response: answer });

  } catch (error) {
    console.error('Error processing audio input:', error);
    sendResponse({ 
      success: false, 
      error: `Failed to process audio input: ${error.message}` 
    });
  }
}

// Handle desktop capture request
async function handleDesktopCapture(message, sendResponse) {
  try {
    console.log('Requesting desktop capture...');
    
    // Get current tab for desktop capture
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }
    
    // Use chrome.desktopCapture to get stream ID
    const streamId = await new Promise((resolve, reject) => {
      chrome.desktopCapture.chooseDesktopMedia(['tab', 'audio'], tab, (streamId) => {
        if (streamId) {
          resolve(streamId);
        } else {
          reject(new Error('No stream selected'));
        }
      });
    });
    
    console.log('Desktop capture stream ID obtained:', streamId);
    sendResponse({ success: true, streamId: streamId });
    
  } catch (error) {
    console.error('Desktop capture failed:', error);
    sendResponse({ 
      success: false, 
      error: `Failed to get desktop capture: ${error.message}` 
    });
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('AI Shura extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // Set up default settings
    chrome.storage.local.set({
      apiKey: OPENAI_API_KEY,
      conversationHistory: [],
      settings: {
        maxTokens: 1000,
        temperature: 0.7,
        model: 'gpt-4o-mini'
      }
    });
  }
});

// Handle tab updates to reset conversation history for new pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    console.log('Tab updated, resetting conversation history for:', tab.url);
    conversationHistory = [];
  }
});

console.log('=== AI SHURA BACKGROUND SERVICE WORKER LOADED ==='); 