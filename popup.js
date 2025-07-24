// AI Shura Popup Script
console.log('=== AI SHURA POPUP SCRIPT LOADING ===');

// DOM elements
const analyzeBtn = document.getElementById('analyze-btn');
const screenshotBtn = document.getElementById('screenshot-btn');
const chatBtn = document.getElementById('chat-btn');
const autoScreenshotBtn = document.getElementById('auto-screenshot-btn');
const autoScreenshotText = document.getElementById('auto-screenshot-text');
const audioListenBtn = document.getElementById('audio-listen-btn');
const audioListenText = document.getElementById('audio-listen-text');
const systemAudioBtn = document.getElementById('system-audio-btn');
const systemAudioText = document.getElementById('system-audio-text');
const contentStatus = document.getElementById('content-status');
const screenshotStatus = document.getElementById('screenshot-status');
const chatStatus = document.getElementById('chat-status');
const autoScreenshotStatus = document.getElementById('auto-screenshot-status');
const audioListenStatus = document.getElementById('audio-listen-status');
const systemAudioStatus = document.getElementById('system-audio-status');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

// State
let currentTab = null;
let contentExtracted = false;
let screenshotAvailable = false;
let chatInterfaceOpen = false;
let autoScreenshotEnabled = false;
let audioListeningEnabled = false;
let systemAudioEnabled = false;

// Initialize popup
async function initializePopup() {
    try {
        // Get current active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTab = tabs[0];
        
        if (!currentTab) {
            throw new Error('No active tab found');
        }

        // Check if we're on a valid page
        if (!currentTab.url || currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('chrome-extension://')) {
            showError('AI Shura cannot work on this page. Please navigate to a regular website.');
            disableButtons();
            return;
        }

        // Check content status
        await checkContentStatus();
        
        console.log('Popup initialized successfully');
    } catch (error) {
        console.error('Failed to initialize popup:', error);
        showError('Failed to initialize: ' + error.message);
    }
}

// Check content status from content script
async function checkContentStatus() {
    try {
        const response = await chrome.tabs.sendMessage(currentTab.id, {
            type: 'GET_CONTENT_STATUS'
        });

        if (response && response.success !== false) {
            contentExtracted = response.hasContent || false;
            chatInterfaceOpen = response.isOverlayVisible || false;
            
            updateStatusDisplay();
        } else {
            // Content script might not be loaded yet
            contentExtracted = false;
            chatInterfaceOpen = false;
            updateStatusDisplay();
        }
    } catch (error) {
        console.log('Content script not ready yet:', error.message);
        contentExtracted = false;
        chatInterfaceOpen = false;
        updateStatusDisplay();
    }
}

// Update status display
function updateStatusDisplay() {
  contentStatus.textContent = contentExtracted ? 'Yes' : 'No';
  contentStatus.className = `status-value ${contentExtracted ? 'success' : ''}`;
  
  screenshotStatus.textContent = screenshotAvailable ? 'Yes' : 'No';
  screenshotStatus.className = `status-value ${screenshotAvailable ? 'success' : ''}`;
  
  chatStatus.textContent = chatInterfaceOpen ? 'Open' : 'Closed';
  chatStatus.className = `status-value ${chatInterfaceOpen ? 'success' : ''}`;
  
  autoScreenshotStatus.textContent = autoScreenshotEnabled ? 'Enabled' : 'Disabled';
  autoScreenshotStatus.className = `status-value ${autoScreenshotEnabled ? 'success' : ''}`;
  autoScreenshotText.textContent = autoScreenshotEnabled ? 'Disable Auto-Screenshots' : 'Enable Auto-Screenshots';
  
  audioListenStatus.textContent = audioListeningEnabled ? 'Listening' : 'Stopped';
  audioListenStatus.className = `status-value ${audioListeningEnabled ? 'success' : ''}`;
  audioListenText.textContent = audioListeningEnabled ? 'Stop Audio Listening' : 'Start Audio Listening';
  
  systemAudioStatus.textContent = systemAudioEnabled ? 'Listening' : 'Stopped';
  systemAudioStatus.className = `status-value ${systemAudioEnabled ? 'success' : ''}`;
  systemAudioText.textContent = systemAudioEnabled ? 'Stop System Audio' : 'Start System Audio';
}

// Show loading state
function showLoading(message = 'Processing...') {
    loading.querySelector('div:last-child').textContent = message;
    loading.style.display = 'block';
    hideMessages();
}

// Hide loading state
function hideLoading() {
    loading.style.display = 'none';
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    hideLoading();
}

// Show success message
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    hideLoading();
}

// Hide all messages
function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// Disable buttons
function disableButtons() {
  analyzeBtn.disabled = true;
  screenshotBtn.disabled = true;
  chatBtn.disabled = true;
  autoScreenshotBtn.disabled = true;
  audioListenBtn.disabled = true;
  systemAudioBtn.disabled = true;
}

// Enable buttons
function enableButtons() {
  analyzeBtn.disabled = false;
  screenshotBtn.disabled = false;
  chatBtn.disabled = false;
  autoScreenshotBtn.disabled = false;
  audioListenBtn.disabled = false;
  systemAudioBtn.disabled = false;
}

// Handle analyze page button
async function handleAnalyzePage() {
    try {
        showLoading('Analyzing page content...');
        enableButtons();

        // Send message to content script to extract content
        const response = await chrome.tabs.sendMessage(currentTab.id, {
            type: 'EXTRACT_CONTENT'
        });

        if (response && response.success) {
            contentExtracted = true;
            updateStatusDisplay();
            showSuccess('Page content analyzed successfully!');
            
            // Auto-open chat interface
            setTimeout(() => {
                handleOpenChat();
            }, 1000);
        } else {
            throw new Error(response?.error || 'Failed to analyze page content');
        }
    } catch (error) {
        console.error('Analyze page failed:', error);
        showError('Failed to analyze page: ' + error.message);
    }
}

// Handle screenshot button
async function handleTakeScreenshot() {
    try {
        showLoading('Capturing screenshot...');
        enableButtons();

        // Send message to background script to capture screenshot
        const response = await chrome.runtime.sendMessage({
            type: 'CAPTURE_SCREENSHOT'
        });

        if (response && response.success) {
            screenshotAvailable = true;
            updateStatusDisplay();
            showSuccess('Screenshot captured successfully!');
            
            // Extract content if not already done
            if (!contentExtracted) {
                await handleAnalyzePage();
            } else {
                // Auto-open chat interface
                setTimeout(() => {
                    handleOpenChat();
                }, 1000);
            }
        } else {
            throw new Error(response?.error || 'Failed to capture screenshot');
        }
    } catch (error) {
        console.error('Screenshot failed:', error);
        showError('Failed to capture screenshot: ' + error.message);
    }
}

// Handle auto-screenshot toggle
async function handleAutoScreenshotToggle() {
  try {
    showLoading(autoScreenshotEnabled ? 'Disabling auto-screenshots...' : 'Enabling auto-screenshots...');
    enableButtons();

    // Send message to content script to toggle auto-screenshot
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      type: 'TOGGLE_AUTO_SCREENSHOT'
    });

    if (response && response.success) {
      autoScreenshotEnabled = response.enabled;
      updateStatusDisplay();
      showSuccess(autoScreenshotEnabled ? 'Auto-screenshots enabled!' : 'Auto-screenshots disabled!');
    } else {
      throw new Error(response?.error || 'Failed to toggle auto-screenshots');
    }
  } catch (error) {
    console.error('Auto-screenshot toggle failed:', error);
    showError('Failed to toggle auto-screenshots: ' + error.message);
  }
}

// Handle audio listening toggle
async function handleAudioListeningToggle() {
  try {
    showLoading(audioListeningEnabled ? 'Stopping audio listening...' : 'Starting audio listening...');
    enableButtons();

    // Send message to content script to toggle audio listening
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      type: 'TOGGLE_AUDIO_LISTENING'
    });

    if (response && response.success) {
      audioListeningEnabled = response.enabled;
      updateStatusDisplay();
      showSuccess(audioListeningEnabled ? 'Audio listening started!' : 'Audio listening stopped!');
    } else {
      throw new Error(response?.error || 'Failed to toggle audio listening');
    }
  } catch (error) {
    console.error('Audio listening toggle failed:', error);
    showError('Failed to toggle audio listening: ' + error.message);
  }
}

// Handle system audio toggle
async function handleSystemAudioToggle() {
  try {
    showLoading(systemAudioEnabled ? 'Stopping system audio...' : 'Starting system audio...');
    enableButtons();

    // Send message to content script to toggle system audio
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      type: 'TOGGLE_SYSTEM_AUDIO'
    });

    if (response && response.success) {
      systemAudioEnabled = response.enabled;
      updateStatusDisplay();
      showSuccess(systemAudioEnabled ? 'System audio started!' : 'System audio stopped!');
    } else {
      throw new Error(response?.error || 'Failed to toggle system audio');
    }
  } catch (error) {
    console.error('System audio toggle failed:', error);
    showError('Failed to toggle system audio: ' + error.message);
  }
}

// Handle open chat button
async function handleOpenChat() {
  try {
    showLoading('Opening chat interface...');
    enableButtons();

    // Send message to content script to show overlay
    const response = await chrome.tabs.sendMessage(currentTab.id, {
      type: 'SHOW_GLASS_OVERLAY'
    });

    if (response && response.success) {
      chatInterfaceOpen = true;
      updateStatusDisplay();
      showSuccess('Chat interface opened!');
      
      // Close popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1500);
    } else {
      throw new Error(response?.error || 'Failed to open chat interface');
    }
  } catch (error) {
    console.error('Open chat failed:', error);
    showError('Failed to open chat interface: ' + error.message);
  }
}

// Event listeners
analyzeBtn.addEventListener('click', handleAnalyzePage);
screenshotBtn.addEventListener('click', handleTakeScreenshot);
chatBtn.addEventListener('click', handleOpenChat);
autoScreenshotBtn.addEventListener('click', handleAutoScreenshotToggle);
audioListenBtn.addEventListener('click', handleAudioListeningToggle);
systemAudioBtn.addEventListener('click', handleSystemAudioToggle);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.close();
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);

// Handle popup focus to refresh status
window.addEventListener('focus', () => {
    if (currentTab) {
        checkContentStatus();
    }
});

console.log('=== AI SHURA POPUP SCRIPT LOADED ==='); 