# AI Shura - ChatGPT Browser Assistant

An intelligent browser assistant powered by ChatGPT that can analyze web pages, answer questions about content, and provide real-time audio interaction capabilities.

## Features

### Core Features
- **Page Analysis**: Extract and analyze web page content
- **Screenshot Capture**: Take screenshots for visual context
- **AI Chat Interface**: Full-screen glass overlay chat interface
- **Auto-Screenshots**: Automatic screenshot capture on page scroll

### New Audio Features
- **Microphone Listening**: Real-time microphone audio processing
- **System Audio Capture**: Capture and process system audio
- **Voice-to-Text**: Convert speech to text using Web Speech API
- **Text-to-Speech**: AI responses are spoken back to the user
- **Real-time Processing**: Continuous audio monitoring and response

### Screenshot Notifications
- **Visual Notifications**: Screenshot events displayed in left panel
- **Timestamp Tracking**: Each screenshot event is timestamped
- **Auto and Manual**: Tracks both automatic and manual screenshots
- **History**: Maintains recent screenshot history

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. Configure your OpenAI API key in `background.js`

## Configuration

### OpenAI API Key
1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Replace `YOUR_OPENAI_API_KEY_HERE` in `background.js` with your actual API key

## Usage

### Basic Usage
1. Navigate to any web page
2. Click the AI Shura extension icon
3. Use the popup to analyze pages, take screenshots, or open the chat interface

### Audio Features
1. **Start Microphone Listening**: Click "Start Audio Listening" to enable microphone input
2. **Start System Audio**: Click "Start System Audio" to capture system audio
3. **Voice Commands**: Speak naturally - the AI will respond with voice
4. **Stop Audio**: Click the same button again to stop audio capture

### Screenshot Features
1. **Manual Screenshots**: Click "Take Screenshot" for immediate capture
2. **Auto-Screenshots**: Enable "Auto-Screenshots" for automatic capture on scroll
3. **Notifications**: View screenshot history in the left panel of the chat interface

## Permissions

The extension requires the following permissions:
- `activeTab`: Access to current tab content
- `tabCapture`: Screenshot capture capabilities
- `tabs`: Tab management
- `storage`: Local data storage
- `scripting`: Content script injection
- `desktopCapture`: System audio capture
- `microphone`: Microphone access

## Technical Details

### Audio Processing
- Uses Web Audio API for real-time audio analysis
- Speech recognition via Web Speech API
- Audio synthesis for AI responses
- Threshold-based speech detection

### Screenshot System
- Chrome tab capture API for screenshots
- Automatic capture on scroll events
- Visual notification system
- Timestamp tracking

### AI Integration
- OpenAI GPT-4o-mini for text processing
- Context-aware responses based on page content
- Conversation history management
- Multi-modal input support (text + audio)

## Troubleshooting

### Audio Issues
- Ensure microphone permissions are granted
- Check browser audio settings
- Verify system audio capture permissions

### Screenshot Issues
- Ensure tab capture permissions are granted
- Check if page is fully loaded before capturing
- Verify extension has access to the current tab

### AI Response Issues
- Verify OpenAI API key is correctly configured
- Check internet connection
- Ensure API key has sufficient credits

## Development

### File Structure
- `manifest.json`: Extension configuration
- `popup.html/js`: Extension popup interface
- `content.js`: Content script with overlay and audio processing
- `background.js`: Background service worker and AI integration
- `icons/`: Extension icons

### Key Functions
- `startMicrophoneListening()`: Initialize microphone capture
- `startSystemAudioCapture()`: Initialize system audio capture
- `addScreenshotNotification()`: Add screenshot event to history
- `processAudioWithAI()`: Send audio input to AI for processing

## License

This project is open source and available under the MIT License. 