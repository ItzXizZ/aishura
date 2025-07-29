// Enhanced AI Shura Content Script - Fullscreen Glass Interface with Screenshot Support
console.log('=== AI SHURA ENHANCED CONTENT SCRIPT STARTING ===');

// Add a minimal loading indicator
const indicator = document.createElement('div');
indicator.id = 'ai-shura-indicator';
indicator.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9));
  color: white;
  padding: 8px 16px;
  border-radius: 25px;
  font-size: 12px;
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 500;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  opacity: 0;
  animation: fadeInSlide 0.5s ease forwards;
`;
indicator.innerHTML = `
  <span style="margin-right: 6px;">✨</span>
  AI Shura Ready
`;

// Add keyframe animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInSlide {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes pulseGlow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
    }
    50% {
      box-shadow: 0 0 40px rgba(102, 126, 234, 0.6);
    }
  }
  
  @keyframes floatIn {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;
document.head.appendChild(style);
document.body.appendChild(indicator);

// Remove indicator after 3 seconds
setTimeout(() => {
  if (indicator && indicator.parentNode) {
    indicator.style.animation = 'fadeInSlide 0.5s ease reverse';
    setTimeout(() => indicator.remove(), 500);
  }
}, 3000);

// Global state
let extractedContent = null;
let glassOverlay = null;
let isOverlayVisible = false;
let conversationHistory = [];
let isResizing = false;
let currentResizer = null;
let screenshotData = null;
let scrollTimeout = null;
let lastScrollTime = 0;
let autoScreenshotEnabled = false;
let audioListeningEnabled = false;
let systemAudioEnabled = false;
let microphoneStream = null;
let systemAudioStream = null;
let audioContext = null;
let mediaRecorder = null;
let isRecording = false;
let screenshotNotifications = [];
let ttsEnabled = true;
let currentUtterance = null;
let leftPanelCollapsed = false;
let rightPanelCollapsed = false;

// Create fullscreen glass overlay
function createGlassOverlay() {
  console.log('Creating enhanced fullscreen glass overlay...');
  
  try {
    // Remove any existing overlays first
    const existingOverlay = document.getElementById('ai-shura-glass-overlay');
    if (existingOverlay) {
      console.log('Removing existing glass overlay');
      existingOverlay.remove();
    }

    // Create the main overlay container
    glassOverlay = document.createElement('div');
    glassOverlay.id = 'ai-shura-glass-overlay';
    glassOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: transparent;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      opacity: 0;
      visibility: hidden;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      cursor: default;
      pointer-events: none;
    `;



    // Create left sidebar (content info) - full height
    const leftSidebar = document.createElement('div');
    leftSidebar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 320px;
      height: 100vh;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border-right: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 2px 0 32px rgba(0, 0, 0, 0.1);
      overflow-y: auto;
      animation: floatIn 0.6s ease forwards;
      animation-delay: 0.1s;
      opacity: 0;
      pointer-events: auto;
      z-index: 2147483647;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    leftSidebar.id = 'ai-shura-left-sidebar';

    // Create right main area (chat interface) - full height
    const rightMain = document.createElement('div');
    rightMain.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 380px;
      height: 100vh;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border-left: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: -2px 0 32px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: floatIn 0.6s ease forwards;
      animation-delay: 0.2s;
      opacity: 0;
      pointer-events: auto;
      z-index: 2147483647;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    rightMain.id = 'ai-shura-right-main';

    // Create left sidebar header with analyze and screenshot buttons
    const leftHeader = document.createElement('div');
    leftHeader.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: sticky;
      top: 0;
      z-index: 10;
    `;
    leftHeader.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="
          margin: 0;
          color: rgba(0, 0, 0, 0.8);
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          📄 <span>Page Analysis</span>
        </h3>
        <button id="ai-shura-hide-left" style="
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          color: rgba(0, 0, 0, 0.7);
          cursor: pointer;
          font-size: 12px;
          padding: 4px 8px;
          backdrop-filter: blur(5px);
          transition: all 0.2s ease;
        ">Hide</button>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="ai-shura-analyze-btn" style="
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9));
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
          display: flex;
          align-items: center;
          gap: 6px;
          backdrop-filter: blur(10px);
          flex: 1;
        ">
          <span style="font-size: 14px;">🔍</span>
          <span>Analyze</span>
        </button>
        <button id="ai-shura-screenshot-btn" style="
          background: linear-gradient(135deg, rgba(76, 201, 240, 0.9), rgba(102, 126, 234, 0.9));
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 10px rgba(76, 201, 240, 0.3);
          display: flex;
          align-items: center;
          gap: 6px;
          backdrop-filter: blur(10px);
          flex: 1;
        ">
          <span style="font-size: 14px;">📸</span>
          <span>Screenshot</span>
        </button>
      </div>
    `;

    // Create left sidebar content
    const leftContent = document.createElement('div');
    leftContent.style.cssText = `
      padding: 16px;
      flex: 1;
    `;
    leftContent.id = 'ai-shura-left-content';

    // Create right main header with hide button
    const rightHeader = document.createElement('div');
    rightHeader.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 10;
    `;
    rightHeader.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <h3 style="
          margin: 0;
          color: rgba(0, 0, 0, 0.8);
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          💬 <span>AI Chat</span>
        </h3>
        <div id="ai-shura-audio-indicator" style="
          display: none;
          background: rgba(76, 201, 240, 0.2);
          border: 1px solid rgba(76, 201, 240, 0.3);
          border-radius: 12px;
          padding: 4px 8px;
          font-size: 11px;
          color: rgba(76, 201, 240, 0.8);
          font-weight: 500;
          animation: pulseGlow 2s ease-in-out infinite;
        ">
          🎤 Listening
        </div>
        <button id="ai-shura-tts-toggle" style="
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          color: rgba(0, 0, 0, 0.7);
          cursor: pointer;
          font-size: 12px;
          padding: 4px 8px;
          backdrop-filter: blur(5px);
          transition: all 0.2s ease;
        ">🔊 TTS</button>
        <button id="ai-shura-auto-screenshot-toggle" style="
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          color: rgba(0, 0, 0, 0.7);
          cursor: pointer;
          font-size: 12px;
          padding: 4px 8px;
          backdrop-filter: blur(5px);
          transition: all 0.2s ease;
        ">📸 Auto</button>
        <button id="ai-shura-microphone-toggle" style="
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          color: rgba(0, 0, 0, 0.7);
          cursor: pointer;
          font-size: 12px;
          padding: 4px 8px;
          backdrop-filter: blur(5px);
          transition: all 0.2s ease;
        ">🎤 Mic</button>
      </div>
      <button id="ai-shura-hide-right" style="
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        color: rgba(0, 0, 0, 0.7);
        cursor: pointer;
        font-size: 12px;
        padding: 4px 8px;
        backdrop-filter: blur(5px);
        transition: all 0.2s ease;
      ">Hide</button>
    `;

    // Create chat history area
    const chatHistory = document.createElement('div');
    chatHistory.style.cssText = `
      flex: 1;
      overflow-y: auto;
      margin: 16px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    `;
    chatHistory.id = 'ai-shura-chat-history';
    chatHistory.innerHTML = `
      <div style="
        text-align: center;
        color: rgba(0, 0, 0, 0.4);
        padding: 40px 20px;
        font-size: 14px;
      ">
        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.6;">💬</div>
        <div style="font-weight: 500; margin-bottom: 8px;">Start a conversation</div>
        <div style="font-size: 12px;">Ask me anything about the content on this page</div>
      </div>
    `;

    // Create input area
    const inputArea = document.createElement('div');
    inputArea.style.cssText = `
      background: rgba(255, 255, 255, 0.08);
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      padding: 16px;
      backdrop-filter: blur(10px);
      display: flex;
      gap: 12px;
      align-items: flex-end;
    `;

    inputArea.innerHTML = `
      <textarea id="ai-shura-question-input" placeholder="Ask me anything about this page..." style="
        flex: 1;
        min-height: 50px;
        max-height: 120px;
        padding: 12px 16px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        font-family: inherit;
        font-size: 14px;
        background: rgba(255, 255, 255, 0.05);
        color: rgba(0, 0, 0, 0.8);
        resize: none;
        outline: none;
        backdrop-filter: blur(5px);
        transition: all 0.2s ease;
      "></textarea>
      <button id="ai-shura-send-btn" style="
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        transition: all 0.2s ease;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
      ">
        <span id="send-btn-text">Send</span>
      </button>
    `;

    // Assemble the interface
    leftSidebar.appendChild(leftHeader);
    leftSidebar.appendChild(leftContent);
    
    rightMain.appendChild(rightHeader);
    rightMain.appendChild(chatHistory);
    rightMain.appendChild(inputArea);

    glassOverlay.appendChild(leftSidebar);
    glassOverlay.appendChild(rightMain);

    // Create floating reveal buttons (initially hidden)
    const revealButtons = document.createElement('div');
    revealButtons.id = 'ai-shura-reveal-buttons';
    revealButtons.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      display: none;
      flex-direction: column;
      gap: 8px;
      z-index: 2147483649;
      pointer-events: auto;
    `;
    revealButtons.innerHTML = `
      <button id="ai-shura-reveal-left" style="
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9));
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.2s ease;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        display: flex;
        align-items: center;
        gap: 8px;
        backdrop-filter: blur(10px);
        min-width: 140px;
        justify-content: center;
      ">
        <span style="font-size: 16px;">📄</span>
        <span>Show Analysis</span>
      </button>
    `;

    // Create separate reveal button for right panel
    const revealRightButton = document.createElement('div');
    revealRightButton.id = 'ai-shura-reveal-right-container';
    revealRightButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      display: none;
      z-index: 2147483649;
      pointer-events: auto;
    `;
    revealRightButton.innerHTML = `
      <button id="ai-shura-reveal-right" style="
        background: linear-gradient(135deg, rgba(76, 201, 240, 0.9), rgba(102, 126, 234, 0.9));
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.2s ease;
        box-shadow: 0 4px 20px rgba(76, 201, 240, 0.3);
        display: flex;
        align-items: center;
        gap: 8px;
        backdrop-filter: blur(10px);
        min-width: 140px;
        justify-content: center;
      ">
        <span style="font-size: 16px;">💬</span>
        <span>Show Chat</span>
      </button>
    `;
    glassOverlay.appendChild(revealButtons);
    glassOverlay.appendChild(revealRightButton);

    // Add to page
    document.body.appendChild(glassOverlay);

    // Add event listeners
    setupOverlayEventListeners();
    
    console.log('Enhanced fullscreen glass overlay created successfully');
  } catch (error) {
    console.error('Failed to create enhanced glass overlay:', error);
  }
}

// Setup event listeners for the overlay
function setupOverlayEventListeners() {
  if (!glassOverlay) return;

  const sendBtn = glassOverlay.querySelector('#ai-shura-send-btn');
  const questionInput = glassOverlay.querySelector('#ai-shura-question-input');
  const leftSidebar = glassOverlay.querySelector('#ai-shura-left-sidebar');
  const rightMain = glassOverlay.querySelector('#ai-shura-right-main');
  const hideLeftBtn = glassOverlay.querySelector('#ai-shura-hide-left');
  const hideRightBtn = glassOverlay.querySelector('#ai-shura-hide-right');
  const analyzeBtn = glassOverlay.querySelector('#ai-shura-analyze-btn');
  const screenshotBtn = glassOverlay.querySelector('#ai-shura-screenshot-btn');
  const ttsToggleBtn = glassOverlay.querySelector('#ai-shura-tts-toggle');
  const revealButtons = glassOverlay.querySelector('#ai-shura-reveal-buttons');
  const revealLeftBtn = glassOverlay.querySelector('#ai-shura-reveal-left');
  const revealRightContainer = glassOverlay.querySelector('#ai-shura-reveal-right-container');
  const revealRightBtn = glassOverlay.querySelector('#ai-shura-reveal-right');
  const autoScreenshotToggle = glassOverlay.querySelector('#ai-shura-auto-screenshot-toggle');
  const microphoneToggle = glassOverlay.querySelector('#ai-shura-microphone-toggle');

  // Track panel visibility
  let leftPanelHidden = false;
  let rightPanelHidden = false;
  
  // Track toggle states
  let autoScreenshotEnabled = false;
  let microphoneEnabled = false;

  // Function to check if reveal buttons should be shown
  function checkRevealButtons() {
    if (leftPanelHidden) {
      revealButtons.style.display = 'flex';
    } else {
      revealButtons.style.display = 'none';
    }
    
    if (rightPanelHidden) {
      revealRightContainer.style.display = 'block';
    } else {
      revealRightContainer.style.display = 'none';
    }
  }

  // Function to update auto screenshot button appearance
  function updateAutoScreenshotButton() {
    if (autoScreenshotEnabled) {
      autoScreenshotToggle.style.background = 'rgba(76, 201, 240, 0.2)';
      autoScreenshotToggle.style.borderColor = 'rgba(76, 201, 240, 0.4)';
      autoScreenshotToggle.style.color = 'rgba(76, 201, 240, 0.8)';
      autoScreenshotToggle.textContent = '📸 Auto';
    } else {
      autoScreenshotToggle.style.background = 'rgba(255, 255, 255, 0.2)';
      autoScreenshotToggle.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      autoScreenshotToggle.style.color = 'rgba(0, 0, 0, 0.7)';
      autoScreenshotToggle.textContent = '📸 Auto';
    }
  }

  // Function to update microphone button appearance
  function updateMicrophoneButton() {
    if (microphoneEnabled) {
      microphoneToggle.style.background = 'rgba(76, 201, 240, 0.2)';
      microphoneToggle.style.borderColor = 'rgba(76, 201, 240, 0.4)';
      microphoneToggle.style.color = 'rgba(76, 201, 240, 0.8)';
      microphoneToggle.textContent = '🎤 Mic';
    } else {
      microphoneToggle.style.background = 'rgba(255, 255, 255, 0.2)';
      microphoneToggle.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      microphoneToggle.style.color = 'rgba(0, 0, 0, 0.7)';
      microphoneToggle.textContent = '🎤 Mic';
    }
  }

  // Analyze Page button
  analyzeBtn.addEventListener('click', () => {
    extractContent().then(content => {
      updateSidebarContent(content);
      // Don't call showGlassOverlay() since panels are already visible
    }).catch(error => {
      console.error('Failed to analyze page:', error);
    });
  });

  analyzeBtn.addEventListener('mouseenter', (e) => {
    e.target.style.transform = 'translateY(-1px)';
    e.target.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.4)';
  });

  analyzeBtn.addEventListener('mouseleave', (e) => {
    e.target.style.transform = 'translateY(0)';
    e.target.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.3)';
  });

  // Screenshot button
  screenshotBtn.addEventListener('click', () => {
    takeScreenshot().then(() => {
      updateSidebarContent(extractedContent);
      // Don't call showGlassOverlay() since panels are already visible
    }).catch(error => {
      console.error('Failed to take screenshot:', error);
    });
  });

  screenshotBtn.addEventListener('mouseenter', (e) => {
    e.target.style.transform = 'translateY(-1px)';
    e.target.style.boxShadow = '0 6px 25px rgba(76, 201, 240, 0.4)';
  });

  screenshotBtn.addEventListener('mouseleave', (e) => {
    e.target.style.transform = 'translateY(0)';
    e.target.style.boxShadow = '0 4px 20px rgba(76, 201, 240, 0.3)';
  });

  // Hide left sidebar
  hideLeftBtn.addEventListener('click', () => {
    leftSidebar.style.display = 'none';
    leftPanelHidden = true;
    checkRevealButtons();
    console.log('Left panel hidden');
  });

  hideLeftBtn.addEventListener('mouseenter', (e) => {
    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
  });

  hideLeftBtn.addEventListener('mouseleave', (e) => {
    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
  });

  // Hide right main
  hideRightBtn.addEventListener('click', () => {
    rightMain.style.display = 'none';
    rightPanelHidden = true;
    checkRevealButtons();
    console.log('Right panel hidden');
  });

  hideRightBtn.addEventListener('mouseenter', (e) => {
    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
  });

  hideRightBtn.addEventListener('mouseleave', (e) => {
    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
  });

  // Reveal left panel
  revealLeftBtn.addEventListener('click', () => {
    // Reset to original position and styling with fade-in animation
    leftSidebar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 320px;
      height: 100vh;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border-right: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 2px 0 32px rgba(0, 0, 0, 0.1);
      overflow-y: auto;
      opacity: 0;
      pointer-events: auto;
      z-index: 2147483647;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      transform: translateX(-20px);
    `;
    
    // Trigger fade-in animation
    setTimeout(() => {
      leftSidebar.style.opacity = '1';
      leftSidebar.style.transform = 'translateX(0)';
    }, 10);
    
    leftPanelHidden = false;
    checkRevealButtons();
    console.log('Left panel revealed');
  });

  revealLeftBtn.addEventListener('mouseenter', (e) => {
    e.target.style.transform = 'scale(1.05)';
    e.target.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.4)';
  });

  revealLeftBtn.addEventListener('mouseleave', (e) => {
    e.target.style.transform = 'scale(1)';
    e.target.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.3)';
  });

  // Reveal right panel
  revealRightBtn.addEventListener('click', () => {
    // Reset to original position and styling with fade-in animation
    rightMain.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 380px;
      height: 100vh;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      border-left: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: -2px 0 32px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      pointer-events: auto;
      z-index: 2147483647;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateX(20px);
    `;
    
    // Trigger fade-in animation
    setTimeout(() => {
      rightMain.style.opacity = '1';
      rightMain.style.transform = 'translateX(0)';
    }, 10);
    
    rightPanelHidden = false;
    checkRevealButtons();
    console.log('Right panel revealed');
  });

  revealRightBtn.addEventListener('mouseenter', (e) => {
    e.target.style.transform = 'scale(1.05)';
    e.target.style.boxShadow = '0 6px 25px rgba(76, 201, 240, 0.4)';
  });

  revealRightBtn.addEventListener('mouseleave', (e) => {
    e.target.style.transform = 'scale(1)';
    e.target.style.boxShadow = '0 4px 20px rgba(76, 201, 240, 0.3)';
  });

  // Send button
  sendBtn.addEventListener('click', handleSendMessage);
  sendBtn.addEventListener('mouseenter', (e) => {
    e.target.style.transform = 'translateY(-1px)';
    e.target.style.boxShadow = '0 6px 25px rgba(102, 126, 234, 0.4)';
  });
  sendBtn.addEventListener('mouseleave', (e) => {
    e.target.style.transform = 'translateY(0)';
    e.target.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.3)';
  });

  // Question input
  questionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  questionInput.addEventListener('focus', (e) => {
    e.target.style.borderColor = 'rgba(102, 126, 234, 0.4)';
    e.target.style.background = 'rgba(255, 255, 255, 0.08)';
  });

  questionInput.addEventListener('blur', (e) => {
    e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    e.target.style.background = 'rgba(255, 255, 255, 0.05)';
  });

  // Auto-resize textarea
  questionInput.addEventListener('input', (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  });

  // TTS toggle button
  ttsToggleBtn.addEventListener('click', toggleTTS);
  
  ttsToggleBtn.addEventListener('mouseenter', (e) => {
    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
  });
  
  ttsToggleBtn.addEventListener('mouseleave', (e) => {
    e.target.style.background = ttsEnabled ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 59, 48, 0.2)';
  });

  // Auto Screenshot toggle button
  autoScreenshotToggle.addEventListener('click', () => {
    autoScreenshotEnabled = !autoScreenshotEnabled;
    updateAutoScreenshotButton();
    console.log('Auto screenshot:', autoScreenshotEnabled ? 'enabled' : 'disabled');
  });

  autoScreenshotToggle.addEventListener('mouseenter', (e) => {
    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
  });

  autoScreenshotToggle.addEventListener('mouseleave', (e) => {
    e.target.style.background = autoScreenshotEnabled ? 'rgba(76, 201, 240, 0.2)' : 'rgba(255, 255, 255, 0.2)';
  });

  // Microphone toggle button
  microphoneToggle.addEventListener('click', () => {
    microphoneEnabled = !microphoneEnabled;
    updateMicrophoneButton();
    if (microphoneEnabled) {
      startMicrophoneListening();
    } else {
      stopAudioListening();
    }
    console.log('Microphone:', microphoneEnabled ? 'enabled' : 'disabled');
  });

  microphoneToggle.addEventListener('mouseenter', (e) => {
    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
  });

  microphoneToggle.addEventListener('mouseleave', (e) => {
    e.target.style.background = microphoneEnabled ? 'rgba(76, 201, 240, 0.2)' : 'rgba(255, 255, 255, 0.2)';
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOverlayVisible) {
      hideGlassOverlay();
    }
  });

  // Prevent clicks inside panels from closing the overlay
  leftSidebar.addEventListener('click', (e) => e.stopPropagation());
  rightMain.addEventListener('click', (e) => e.stopPropagation());
}

// Take screenshot using tab capture
async function takeScreenshot() {
  console.log('Taking screenshot...');
  
  try {
    // Request tab capture from background script
    const response = await chrome.runtime.sendMessage({
      type: 'CAPTURE_SCREENSHOT'
    });

    if (response && response.success) {
      screenshotData = response.screenshotData;
      console.log('Screenshot captured successfully, data length:', screenshotData.length);
      
      // Add screenshot notification
      addScreenshotNotification('Manual screenshot captured');
      
      // Extract content if not already done
      if (!extractedContent) {
        extractedContent = await extractContent();
      }
      
      // Add screenshot data to content
      extractedContent.screenshot = screenshotData;
      console.log('Screenshot added to content, screenshot available:', !!extractedContent.screenshot);
      
      return true;
    } else {
      throw new Error(response?.error || 'Failed to capture screenshot');
    }
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    throw error;
  }
}

// Show glass overlay with animation
function showGlassOverlay() {
  console.log('Showing enhanced glass overlay...');
  if (glassOverlay) {
    glassOverlay.style.opacity = '1';
    glassOverlay.style.visibility = 'visible';
    glassOverlay.style.display = 'flex';
    isOverlayVisible = true;
    
    // Focus on input after animation
    setTimeout(() => {
      const input = glassOverlay.querySelector('#ai-shura-question-input');
      if (input) input.focus();
    }, 400);
    
    console.log('Enhanced glass overlay shown');
  } else {
    console.log('No glass overlay to show - creating new one');
    createGlassOverlay();
    setTimeout(() => showGlassOverlay(), 100);
  }
}

// Hide glass overlay with animation
function hideGlassOverlay() {
  console.log('Hiding enhanced glass overlay...');
  if (glassOverlay) {
    glassOverlay.style.opacity = '0';
    glassOverlay.style.visibility = 'hidden';
    isOverlayVisible = false;
    console.log('Enhanced glass overlay hidden');
  }
}

// Update sidebar content
function updateSidebarContent(content) {
  if (!glassOverlay) return;

  const sidebar = glassOverlay.querySelector('#ai-shura-left-content');
  
  if (content) {
    let screenshotSection = '';
    if (content.screenshot) {
      screenshotSection = `
        <div style="
          background: rgba(76, 201, 240, 0.1);
          border: 1px solid rgba(76, 201, 240, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          text-align: center;
        ">
          <div style="font-size: 24px; margin-bottom: 8px;">📸</div>
          <div style="font-size: 13px; color: rgba(0, 0, 0, 0.7); font-weight: 500; margin-bottom: 4px;">
            Screenshot Captured
          </div>
          <div style="font-size: 11px; color: rgba(0, 0, 0, 0.5);">
            Visual context available for AI analysis
          </div>
        </div>
      `;
    }

    // Create screenshot notifications section
    let notificationsSection = '';
    if (screenshotNotifications.length > 0) {
      const notificationsHtml = screenshotNotifications.map(notification => `
        <div style="
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.2);
          border-radius: 8px;
          padding: 8px 12px;
          margin-bottom: 8px;
          font-size: 11px;
        ">
          <div style="color: rgba(255, 152, 0, 0.8); font-weight: 500; margin-bottom: 2px;">
            📸 ${notification.message}
          </div>
          <div style="color: rgba(0, 0, 0, 0.5); font-size: 10px;">
            ${notification.timestamp}
          </div>
        </div>
      `).join('');
      
      notificationsSection = `
        <div style="margin-bottom: 16px;">
          <div style="
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.2);
            border-radius: 12px;
            padding: 16px;
          ">
            <div style="font-size: 13px; color: rgba(255, 152, 0, 0.8); font-weight: 600; margin-bottom: 12px;">
              📸 Screenshot Notifications
            </div>
            <div style="max-height: 200px; overflow-y: auto;">
              ${notificationsHtml}
            </div>
          </div>
        </div>
      `;
    }

    sidebar.innerHTML = `
      <div style="margin-bottom: 16px;">
        <div style="
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        ">
          <div style="font-weight: 600; color: rgba(0, 0, 0, 0.9); margin-bottom: 8px; font-size: 14px;">
            ${content.title || 'Untitled Page'}
          </div>
          <div style="font-size: 12px; color: rgba(0, 0, 0, 0.5); word-break: break-all;">
            ${content.url || ''}
          </div>
        </div>
        
        ${screenshotSection}
        
        ${notificationsSection}
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div style="
            background: rgba(102, 126, 234, 0.1);
            border: 1px solid rgba(102, 126, 234, 0.2);
            border-radius: 12px;
            padding: 12px;
            text-align: center;
          ">
            <div style="font-size: 20px; font-weight: 600; color: rgba(102, 126, 234, 0.9);">
              ${content.text ? content.text.split(' ').length.toLocaleString() : '0'}
            </div>
            <div style="font-size: 11px; color: rgba(102, 126, 234, 0.7); font-weight: 500;">
              Words
            </div>
          </div>
          
          <div style="
            background: rgba(118, 75, 162, 0.1);
            border: 1px solid rgba(118, 75, 162, 0.2);
            border-radius: 12px;
            padding: 12px;
            text-align: center;
          ">
            <div style="font-size: 20px; font-weight: 600; color: rgba(118, 75, 162, 0.9);">
              ${content.images ? content.images.length : '0'}
            </div>
            <div style="font-size: 11px; color: rgba(118, 75, 162, 0.7); font-weight: 500;">
              Images
            </div>
          </div>
        </div>
        
        <div style="
          background: linear-gradient(135deg, rgba(76, 201, 240, 0.1), rgba(102, 126, 234, 0.1));
          border: 1px solid rgba(76, 201, 240, 0.2);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        ">
          <div style="font-size: 24px; margin-bottom: 8px;">✨</div>
          <div style="font-size: 13px; color: rgba(0, 0, 0, 0.7); font-weight: 500; margin-bottom: 4px;">
            Ready for Analysis
          </div>
          <div style="font-size: 11px; color: rgba(0, 0, 0, 0.5);">
            Ask questions about the content
          </div>
        </div>
      </div>
    `;
  } else {
    sidebar.innerHTML = `
      <div style="text-align: center; color: rgba(0, 0, 0, 0.4); padding: 40px 20px;">
        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.6;">🔍</div>
        <div style="font-weight: 500; margin-bottom: 8px; color: rgba(0, 0, 0, 0.6);">
          No Content Analyzed
        </div>
        <div style="font-size: 14px;">
          Click "Analyze Page" or "Take Screenshot" to start
        </div>
      </div>
    `;
  }
}

// Handle sending messages
async function handleSendMessage() {
  const questionInput = document.getElementById('ai-shura-question-input');
  const chatHistory = document.getElementById('ai-shura-chat-history');
  const sendBtn = document.getElementById('ai-shura-send-btn');
  const sendBtnText = document.getElementById('send-btn-text');
  
  const question = questionInput.value.trim();
  if (!question) return;

  if (!extractedContent) {
    addMessageToChat('system', 'Please analyze the page content or take a screenshot first.');
    return;
  }

  // Clear input and disable send button
  questionInput.value = '';
  questionInput.style.height = 'auto';
  sendBtn.disabled = true;
  sendBtnText.textContent = 'Sending...';

  // Add user message to chat
  addMessageToChat('user', question);

  // Add thinking indicator
  const thinkingId = addThinkingIndicator();

  try {
    // Ensure we have the latest content with screenshot
    let currentContent = extractedContent;
    if (!currentContent) {
      currentContent = await extractContent();
    }
    
    // If we have screenshot data, make sure it's included
    if (screenshotData && !currentContent.screenshot) {
      currentContent.screenshot = screenshotData;
    }
    
    console.log('Sending question with content:', {
      hasScreenshot: !!currentContent.screenshot,
      textLength: currentContent.text?.length || 0,
      title: currentContent.title
    });
    
    // Send question to background script
    const response = await chrome.runtime.sendMessage({
      type: 'SUBMIT_QUESTION',
      question: question,
      content: currentContent
    });

    // Remove thinking indicator
    removeThinkingIndicator(thinkingId);

    if (response && response.success) {
      addMessageToChat('assistant', response.answer);
      conversationHistory.push({ role: 'user', content: question });
      conversationHistory.push({ role: 'assistant', content: response.answer });
    } else {
      addMessageToChat('error', response?.error || 'Failed to get response from AI.');
    }
  } catch (error) {
    removeThinkingIndicator(thinkingId);
    console.error('Failed to send message:', error);
    addMessageToChat('error', 'Connection error: ' + error.message);
  } finally {
    sendBtn.disabled = false;
    sendBtnText.textContent = 'Send';
    questionInput.focus();
  }
}

// Add message to chat history
function addMessageToChat(role, content) {
  const chatHistory = document.getElementById('ai-shura-chat-history');
  if (!chatHistory) return;

  // Clear welcome message if this is the first real message
  if (chatHistory.children.length === 1 && chatHistory.querySelector('div[style*="text-align: center"]')) {
    chatHistory.innerHTML = '';
  }

  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    margin-bottom: 16px;
    animation: floatIn 0.4s ease forwards;
    opacity: 0;
  `;

  let messageContent = '';
  
  if (role === 'user') {
    messageContent = `
      <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
        <div style="
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 12px 16px;
          border-radius: 18px 18px 4px 18px;
          max-width: 80%;
          word-wrap: break-word;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
        ">
          ${content}
        </div>
      </div>
    `;
  } else if (role === 'assistant') {
    messageContent = `
      <div style="display: flex; justify-content: flex-start; margin-bottom: 8px;">
        <div style="
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(0, 0, 0, 0.8);
          padding: 12px 16px;
          border-radius: 18px 18px 18px 4px;
          max-width: 80%;
          word-wrap: break-word;
          line-height: 1.5;
        ">
          ${content}
        </div>
      </div>
    `;
  } else if (role === 'error') {
    messageContent = `
      <div style="display: flex; justify-content: center; margin-bottom: 8px;">
        <div style="
          background: rgba(255, 59, 48, 0.1);
          border: 1px solid rgba(255, 59, 48, 0.2);
          color: rgba(255, 59, 48, 0.8);
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 12px;
          text-align: center;
        ">
          ⚠️ ${content}
        </div>
      </div>
    `;
  } else if (role === 'system') {
    messageContent = `
      <div style="display: flex; justify-content: center; margin-bottom: 8px;">
        <div style="
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.2);
          color: rgba(255, 152, 0, 0.8);
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 12px;
          text-align: center;
        ">
          ℹ️ ${content}
        </div>
      </div>
    `;
  }

  messageDiv.innerHTML = messageContent;
  chatHistory.appendChild(messageDiv);
  
  // Scroll to bottom
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Add thinking indicator
function addThinkingIndicator() {
  const chatHistory = document.getElementById('ai-shura-chat-history');
  if (!chatHistory) return null;

  const thinkingDiv = document.createElement('div');
  const thinkingId = 'thinking-' + Date.now();
  thinkingDiv.id = thinkingId;
  thinkingDiv.style.cssText = `
    display: flex;
    justify-content: flex-start;
    margin-bottom: 16px;
    animation: floatIn 0.4s ease forwards;
    opacity: 0;
  `;

  thinkingDiv.innerHTML = `
    <div style="
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(0, 0, 0, 0.6);
      padding: 12px 16px;
      border-radius: 18px 18px 18px 4px;
      font-style: italic;
      display: flex;
      align-items: center;
      gap: 8px;
    ">
      <div style="
        display: flex;
        gap: 4px;
      ">
        <div style="width: 6px; height: 6px; background: rgba(102, 126, 234, 0.6); border-radius: 50%; animation: pulseGlow 1.4s ease-in-out infinite;"></div>
        <div style="width: 6px; height: 6px; background: rgba(102, 126, 234, 0.6); border-radius: 50%; animation: pulseGlow 1.4s ease-in-out infinite; animation-delay: 0.2s;"></div>
        <div style="width: 6px; height: 6px; background: rgba(102, 126, 234, 0.6); border-radius: 50%; animation: pulseGlow 1.4s ease-in-out infinite; animation-delay: 0.4s;"></div>
      </div>
      AI is thinking...
    </div>
  `;

  chatHistory.appendChild(thinkingDiv);
  chatHistory.scrollTop = chatHistory.scrollHeight;
  
  return thinkingId;
}

// Remove thinking indicator
function removeThinkingIndicator(thinkingId) {
  if (thinkingId) {
    const thinkingDiv = document.getElementById(thinkingId);
    if (thinkingDiv) {
      thinkingDiv.remove();
    }
  }
}

// Extract content from page (enhanced)
async function extractContent() {
  console.log('Starting enhanced content extraction...');
  
  try {
    // Wait for page to be fully loaded
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve, { once: true });
      });
    }

    // Enhanced content extraction with better filtering
    const content = {
      title: document.querySelector('title')?.textContent?.trim() || 'Untitled Page',
      url: window.location.href,
      text: extractMainContent(),
      images: extractImages(),
      links: extractLinks(),
      metadata: extractMetadata()
    };

    console.log('Enhanced content extracted:', {
      title: content.title,
      textLength: content.text.length,
      imageCount: content.images.length,
      linkCount: content.links.length
    });

    extractedContent = content;
    updateSidebarContent(content);
    return content;
  } catch (error) {
    console.error('Enhanced content extraction failed:', error);
    throw error;
  }
}

// Extract main content with smart filtering
function extractMainContent() {
  // Try to find main content areas
  const mainSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.content',
    '#content',
    '.post-content',
    '.entry-content',
    '.article-content'
  ];

  let mainContent = null;
  for (const selector of mainSelectors) {
    mainContent = document.querySelector(selector);
    if (mainContent) break;
  }

  // If no main content found, use body but filter out common non-content elements
  if (!mainContent) {
    mainContent = document.body.cloneNode(true);
    
    // Remove common non-content elements
    const removeSelectors = [
      'nav', 'header', 'footer', 'aside',
      '.nav', '.navigation', '.menu', '.sidebar',
      '.ad', '.ads', '.advertisement', '.banner',
      '.social', '.share', '.comments', '.related',
      'script', 'style', 'noscript'
    ];
    
    removeSelectors.forEach(selector => {
      const elements = mainContent.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
  }

  // Extract and clean text
  let text = mainContent.textContent || '';
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim()
    .substring(0, 50000); // Increased limit for better analysis

  return text;
}

// Extract relevant images
function extractImages() {
  return Array.from(document.querySelectorAll('img[alt]'))
    .filter(img => {
      const alt = img.alt.trim();
      return alt.length > 3 && alt.length < 200 && !alt.toLowerCase().includes('icon');
    })
    .slice(0, 15)
    .map(img => ({
      src: img.src,
      alt: img.alt.trim()
    }));
}

// Extract meaningful links
function extractLinks() {
  return Array.from(document.querySelectorAll('a[href]'))
    .filter(link => {
      const text = link.textContent.trim();
      const href = link.href;
      return (
        text.length > 3 && 
        text.length < 100 && 
        !href.startsWith('javascript:') &&
        !href.startsWith('mailto:') &&
        !href.startsWith('#')
      );
    })
    .slice(0, 25)
    .map(link => ({
      href: link.href,
      text: link.textContent.trim()
    }));
}

// Extract page metadata
function extractMetadata() {
  const metadata = {};
  
  // Meta tags
  document.querySelectorAll('meta').forEach(meta => {
    const name = meta.getAttribute('name') || meta.getAttribute('property');
    const content = meta.getAttribute('content');
    if (name && content && content.length < 500) {
      metadata[name] = content;
    }
  });

  return metadata;
}

// Setup scroll listener for automatic screenshots
function setupScrollListener() {
  console.log('Setting up scroll listener for automatic screenshots...');
  
  // Throttled scroll handler
  let scrollTimeout = null;
  let isProcessing = false;
  let lastScrollY = window.scrollY;
  
  const handleScroll = async () => {
    if (isProcessing || !autoScreenshotEnabled) return;
    
    const currentScrollY = window.scrollY;
    const scrollDistance = Math.abs(currentScrollY - lastScrollY);
    
    // Only capture if scrolled more than 200px
    if (scrollDistance < 200) return;
    
    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    // Set new timeout for 1 second delay
    scrollTimeout = setTimeout(async () => {
      if (isProcessing) return;
      isProcessing = true;
      
      try {
        console.log('Auto-capturing screenshot after scroll...');
        await takeScreenshot();
        addScreenshotNotification('Auto-screenshot captured after scroll');
        console.log('Auto-screenshot captured successfully');
      } catch (error) {
        console.error('Auto-screenshot failed:', error);
      } finally {
        isProcessing = false;
        lastScrollY = window.scrollY;
      }
    }, 1000);
  };
  
  // Add scroll event listener
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  console.log('Scroll listener setup complete');
}

// Add screenshot notification
function addScreenshotNotification(message) {
  const notification = {
    id: Date.now(),
    message: message,
    timestamp: new Date().toLocaleTimeString(),
    type: 'screenshot'
  };
  
  screenshotNotifications.unshift(notification);
  
  // Keep only last 10 notifications
  if (screenshotNotifications.length > 10) {
    screenshotNotifications = screenshotNotifications.slice(0, 10);
  }
  
  // Add notification to chat interface
  addMessageToChat('system', `📸 ${message}`);
  
  // Update sidebar if overlay is visible
  if (isOverlayVisible) {
    updateSidebarContent(extractedContent);
  }
}

// Audio handling functions
async function startMicrophoneListening() {
  try {
    console.log('Starting microphone listening...');
    
    // Request microphone permission
    microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    // Create audio context for processing
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(microphoneStream);
    
    // Create analyzer node
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 2048;
    source.connect(analyzer);
    
    // Start recording and processing
    startAudioProcessing(analyzer, 'microphone');
    
    audioListeningEnabled = true;
    showAudioIndicator();
    console.log('Microphone listening started');
    return true;
  } catch (error) {
    console.error('Failed to start microphone listening:', error);
    throw error;
  }
}

async function startSystemAudioCapture() {
  try {
    console.log('Starting system audio capture...');
    
    // Request desktop capture for system audio through background script
    const response = await chrome.runtime.sendMessage({
      type: 'REQUEST_DESKTOP_CAPTURE'
    });
    
    if (!response || !response.success) {
      throw new Error(response?.error || 'Failed to get desktop capture permission');
    }
    
    // Get the stream using the stream ID
    systemAudioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: response.streamId
        }
      }
    });
    
    // Create audio context for processing
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(systemAudioStream);
    
    // Create analyzer node
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 2048;
    source.connect(analyzer);
    
    // Start recording and processing
    startAudioProcessing(analyzer, 'system');
    
    systemAudioEnabled = true;
    showAudioIndicator();
    console.log('System audio capture started');
    return true;
  } catch (error) {
    console.error('Failed to start system audio capture:', error);
    throw error;
  }
}

function startAudioProcessing(analyzer, source) {
  const bufferLength = analyzer.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  let silenceCounter = 0;
  let speechBuffer = [];
  let isSpeaking = false;
  let isProcessing = false;
  let speechStartTime = 0;
  let minSpeechDuration = 1000; // Minimum 1 second of speech before processing
  let silenceThreshold = 80; // Increased silence threshold for better word detection
  
  const processAudio = () => {
    if (!audioContext || audioContext.state === 'closed') return;
    
    analyzer.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    
    // Detect speech (improved threshold-based detection)
    if (average > 20) { // Lowered threshold for earlier detection
      silenceCounter = 0;
      if (!isSpeaking) {
        isSpeaking = true;
        speechStartTime = Date.now();
        console.log(`${source} speech detected`);
        addMessageToChat('system', `🎤 ${source} audio detected - listening...`);
        // Removed TTS interruption - let TTS continue playing
      }
      
      // Add to speech buffer
      speechBuffer.push(average);
    } else {
      silenceCounter++;
      
      // Only end speech after longer silence to capture trailing words
      if (silenceCounter > silenceThreshold && isSpeaking) {
        const speechDuration = Date.now() - speechStartTime;
        
        // Only process if we had enough speech and enough silence
        if (speechDuration >= minSpeechDuration && !isProcessing) {
          isProcessing = true;
          console.log(`${source} speech ended, duration: ${speechDuration}ms, processing...`);
          processSpeechData(speechBuffer, source).finally(() => {
            isProcessing = false;
            speechBuffer = [];
          });
        }
        
        isSpeaking = false;
        speechBuffer = [];
      }
    }
    
    // Continue processing
    if (audioContext && audioContext.state !== 'closed') {
      requestAnimationFrame(processAudio);
    }
  };
  
  processAudio();
}

async function processSpeechData(audioData, source) {
  try {
    console.log(`Processing ${source} audio data...`);
    
    // Add a small delay to ensure we capture trailing words
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Convert audio data to text using Web Speech API
    const text = await convertSpeechToText();
    
    if (text && text.trim()) {
      console.log(`${source} speech recognized:`, text);
      
      // Add audio notification to chat
      addMessageToChat('system', `🎤 Audio detected: "${text}"`);
      
      // Send to AI for processing
      const response = await processAudioWithAI(text, source);
      
      // Add AI response to chat
      addMessageToChat('assistant', response);
      
      // Speak the response
      speakResponse(response);
    } else {
      console.log('No speech text recognized');
    }
  } catch (error) {
    console.error(`Failed to process ${source} audio:`, error);
    addMessageToChat('error', `Audio processing failed: ${error.message}`);
  }
}

async function convertSpeechToText() {
  return new Promise((resolve, reject) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      reject(new Error('Speech recognition not supported'));
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    // Add a small delay before starting to ensure we capture the beginning
    setTimeout(() => {
      try {
        recognition.start();
        console.log('Speech recognition started with delay');
      } catch (error) {
        reject(error);
      }
    }, 200); // 200ms delay to capture first words
    
    let hasResult = false;
    let timeoutId = null;
    
    recognition.onresult = (event) => {
      hasResult = true;
      if (timeoutId) clearTimeout(timeoutId);
      
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      console.log('Speech recognition result:', transcript, 'confidence:', confidence);
      resolve(transcript);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (timeoutId) clearTimeout(timeoutId);
      
      if (event.error === 'no-speech') {
        resolve(''); // Resolve with empty string for no speech
      } else {
        reject(new Error(event.error));
      }
    };
    
    recognition.onend = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (!hasResult) {
        resolve(''); // Resolve with empty string if no result
      }
    };
    
    // Add timeout to prevent hanging
    timeoutId = setTimeout(() => {
      console.log('Speech recognition timeout');
      recognition.stop();
      resolve('');
    }, 10000); // 10 second timeout
  });
}

async function processAudioWithAI(text, source) {
  try {
    // Ensure we have the latest content with screenshot
    let currentContent = extractedContent;
    if (!currentContent) {
      currentContent = await extractContent();
    }
    
    // Always include screenshot data if available
    if (screenshotData) {
      currentContent.screenshot = screenshotData;
      console.log('Screenshot data included in audio processing, length:', screenshotData.length);
    }
    
    console.log('Processing audio with content:', {
      hasScreenshot: !!currentContent.screenshot,
      screenshotLength: currentContent.screenshot ? currentContent.screenshot.length : 0,
      textLength: currentContent.text?.length || 0,
      title: currentContent.title
    });
    
    // Send to background script for AI processing
    const response = await chrome.runtime.sendMessage({
      type: 'PROCESS_AUDIO_INPUT',
      text: text,
      source: source,
      content: currentContent
    });
    
    if (response && response.success) {
      return response.response;
    } else {
      throw new Error(response?.error || 'Failed to process audio with AI');
    }
  } catch (error) {
    console.error('Failed to process audio with AI:', error);
    return 'Sorry, I could not process your audio input.';
  }
}

function speakResponse(text) {
  if (!ttsEnabled || !('speechSynthesis' in window)) {
    return;
  }
  
  // Stop any current speech
  if (currentUtterance) {
    speechSynthesis.cancel();
  }
  
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = 0.9;
  currentUtterance.pitch = 1;
  currentUtterance.volume = 0.8;
  
  currentUtterance.onend = () => {
    currentUtterance = null;
  };
  
  currentUtterance.onerror = () => {
    currentUtterance = null;
  };
  
  speechSynthesis.speak(currentUtterance);
}

function stopTTS() {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    currentUtterance = null;
  }
}

function toggleTTS() {
  ttsEnabled = !ttsEnabled;
  const ttsButton = document.getElementById('ai-shura-tts-toggle');
  if (ttsButton) {
    ttsButton.textContent = ttsEnabled ? '🔊 TTS' : '🔇 TTS';
    ttsButton.style.background = ttsEnabled ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 59, 48, 0.2)';
  }
  
  if (!ttsEnabled) {
    stopTTS();
  }
}

function stopAudioListening() {
  console.log('Stopping audio listening...');
  
  if (microphoneStream) {
    microphoneStream.getTracks().forEach(track => track.stop());
    microphoneStream = null;
  }
  
  if (systemAudioStream) {
    systemAudioStream.getTracks().forEach(track => track.stop());
    systemAudioStream = null;
  }
  
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  
  audioListeningEnabled = false;
  systemAudioEnabled = false;
  
  // Hide audio indicator
  hideAudioIndicator();
  
  console.log('Audio listening stopped');
}

function showAudioIndicator() {
  const indicator = document.getElementById('ai-shura-audio-indicator');
  if (indicator) {
    indicator.style.display = 'block';
  }
}

function hideAudioIndicator() {
  const indicator = document.getElementById('ai-shura-audio-indicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

// Setup message listeners
function setupMessageListeners() {
  console.log('Setting up enhanced message listeners...');
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);
    
    switch (message.type) {
      case 'EXTRACT_CONTENT':
        extractContent().then(content => {
          sendResponse({ success: true, content: content });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true;
        
      case 'GET_CONTENT_STATUS':
        sendResponse({
          hasContent: !!extractedContent,
          content: extractedContent,
          isOverlayVisible: isOverlayVisible
        });
        return false;

      case 'SHOW_GLASS_OVERLAY':
        showGlassOverlay();
        sendResponse({ success: true });
        return false;

      case 'HIDE_GLASS_OVERLAY':
        hideGlassOverlay();
        sendResponse({ success: true });
        return false;

      case 'TOGGLE_GLASS_OVERLAY':
        if (isOverlayVisible) {
          hideGlassOverlay();
        } else {
          showGlassOverlay();
        }
        sendResponse({ success: true, visible: !isOverlayVisible });
        return false;
        
      case 'TOGGLE_AUTO_SCREENSHOT':
        autoScreenshotEnabled = !autoScreenshotEnabled;
        console.log('Auto-screenshot enabled:', autoScreenshotEnabled);
        sendResponse({ success: true, enabled: autoScreenshotEnabled });
        return false;
        
      case 'TOGGLE_AUDIO_LISTENING':
        if (audioListeningEnabled) {
          stopAudioListening();
          sendResponse({ success: true, enabled: false });
        } else {
          startMicrophoneListening().then(() => {
            sendResponse({ success: true, enabled: true });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
        }
        return true;
        
      case 'TOGGLE_SYSTEM_AUDIO':
        if (systemAudioEnabled) {
          stopAudioListening();
          sendResponse({ success: true, enabled: false });
        } else {
          startSystemAudioCapture().then(() => {
            sendResponse({ success: true, enabled: true });
          }).catch(error => {
            console.error('System audio failed, falling back to microphone:', error);
            // Fallback to microphone if system audio fails
            startMicrophoneListening().then(() => {
              addMessageToChat('system', '⚠️ System audio capture failed, using microphone instead');
              sendResponse({ success: true, enabled: true, fallback: true });
            }).catch(micError => {
              sendResponse({ success: false, error: `System audio failed: ${error.message}. Microphone also failed: ${micError.message}` });
            });
          });
        }
        return true;
    }
  });
}

// Initialize everything
function initialize() {
  console.log('Initializing enhanced AI Shura...');
  
  // Create glass overlay
  createGlassOverlay();
  
  // Setup message listeners
  setupMessageListeners();
  
  // Setup scroll listener for automatic screenshots
  setupScrollListener();
  
  console.log('Enhanced AI Shura initialized successfully');
}

// Start initialization
initialize();

// Global access for debugging
window.aiShura = {
  showGlassOverlay,
  hideGlassOverlay,
  extractContent,
  updateSidebarContent,
  createGlassOverlay,
  handleSendMessage,
  addMessageToChat,
  takeScreenshot,
  startMicrophoneListening,
  startSystemAudioCapture,
  stopAudioListening,
  showAudioIndicator,
  hideAudioIndicator,
  speakResponse,
  stopTTS,
  toggleTTS,
  extractedContent: () => extractedContent,
  conversationHistory: () => conversationHistory,
  audioStatus: () => ({ audioListeningEnabled, systemAudioEnabled, ttsEnabled }),
  screenshotData: () => screenshotData,
  panelStatus: () => ({ leftPanelCollapsed, rightPanelCollapsed })
};

console.log('=== AI SHURA ENHANCED CONTENT SCRIPT LOADED ==='); 