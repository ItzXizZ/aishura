# AI Shura - ChatGPT Browser Assistant

An intelligent browser extension powered by ChatGPT that can analyze web pages, capture screenshots, and provide AI-powered insights about any website content.

## ✨ Features

- **🔍 Smart Content Analysis**: Automatically extracts and analyzes web page content including text, images, and links
- **📸 Screenshot Capture**: Uses Chrome's tab capture API to take visual snapshots of web pages
- **💬 AI Chat Interface**: Beautiful fullscreen glass interface for asking questions about page content
- **🤖 ChatGPT Integration**: Powered by OpenAI's GPT-4o-mini for intelligent responses
- **🎨 Modern UI**: Sleek glass-morphism design with smooth animations
- **⚡ Real-time Processing**: Instant content extraction and AI responses

## 🚀 Installation

### Prerequisites
- Google Chrome browser (version 88 or later)
- OpenAI API key (included in the extension)

### Steps to Install

1. **Download the Extension**
   ```bash
   git clone <repository-url>
   cd AIShura2
   ```

2. **Open Chrome Extensions Page**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `AIShura2` folder containing the extension files

4. **Verify Installation**
   - The AI Shura extension should appear in your extensions list
   - You should see the extension icon in your Chrome toolbar

## 📖 Usage

### Basic Usage

1. **Navigate to any website** you want to analyze
2. **Click the AI Shura extension icon** in your Chrome toolbar
3. **Choose an action**:
   - **Analyze Current Page**: Extracts and analyzes page content
   - **Take Screenshot**: Captures a visual snapshot of the page
   - **Open Chat Interface**: Opens the AI chat overlay

### Advanced Features

#### Content Analysis
- Automatically extracts main content, images, and links
- Filters out navigation, ads, and other non-content elements
- Provides word count and content statistics

#### Screenshot Capture
- Uses Chrome's tab capture API for high-quality screenshots
- Integrates with content analysis for comprehensive page understanding
- Screenshots are included in AI context for visual analysis

#### AI Chat Interface
- Beautiful fullscreen overlay with glass-morphism design
- Real-time conversation with ChatGPT about page content
- Supports conversation history and context awareness
- Keyboard shortcuts (Esc to close)

## 🛠️ Technical Details

### Architecture
- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Background processing and API communication
- **Content Scripts**: Page interaction and content extraction
- **Tab Capture API**: Screenshot functionality
- **OpenAI API**: ChatGPT integration

### Files Structure
```
AIShura2/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API calls
├── content.js            # Content script with UI
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

### API Integration
- **OpenAI GPT-4o-mini**: For intelligent responses
- **Chrome Tab Capture**: For screenshot functionality
- **Chrome Storage**: For settings and conversation history

## 🔧 Configuration

### API Key Setup
The extension requires an OpenAI API key to function. Here's how to set it up:

1. **Get an API key** from [OpenAI](https://platform.openai.com/api-keys)
2. **Open `background.js`** in the extension folder
3. **Replace `YOUR_OPENAI_API_KEY_HERE`** with your actual API key
4. **Reload the extension** in Chrome

**Example:**
```javascript
const OPENAI_API_KEY = 'sk-your-actual-api-key-here';
```

**Security Note:** Never commit your API key to version control. The `.gitignore` file is configured to prevent accidental commits of sensitive files.

### Settings
The extension automatically manages:
- Conversation history (last 20 exchanges)
- Content extraction preferences
- UI preferences

## 🎨 UI Features

### Glass Interface
- **Backdrop blur effects** for modern glass-morphism design
- **Smooth animations** with CSS transitions
- **Responsive layout** that adapts to different screen sizes
- **Collapsible panels** for better space utilization

### Chat Interface
- **Real-time messaging** with typing indicators
- **Message history** with user and AI message styling
- **Error handling** with user-friendly error messages
- **Keyboard shortcuts** for quick navigation

## 🔒 Privacy & Security

- **Local Processing**: Content extraction happens locally in your browser
- **Secure API Calls**: All OpenAI API calls are made securely
- **No Data Storage**: No personal data is stored on external servers
- **Permission Minimal**: Only requests necessary permissions for functionality

## 🐛 Troubleshooting

### Common Issues

1. **Extension not loading**
   - Ensure Developer mode is enabled
   - Check that all files are present in the extension folder
   - Reload the extension from chrome://extensions/

2. **Content analysis not working**
   - Make sure you're on a regular website (not chrome:// pages)
   - Refresh the page and try again
   - Check browser console for error messages

3. **Screenshot capture fails**
   - Ensure the tab is active and visible
   - Check that tab capture permission is granted
   - Try refreshing the page

4. **AI responses not working**
   - Check your internet connection
   - Verify the API key is valid
   - Check browser console for API errors

### Debug Mode
Open Chrome DevTools and check the console for detailed error messages and debugging information.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for providing the ChatGPT API
- Chrome Extensions team for the excellent documentation
- The open-source community for inspiration and tools

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Create an issue in the repository

---

**Made with ❤️ for the AI community** 