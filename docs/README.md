# 🏠 Real Estate AI Assistant with Summitly Integration

A powerful AI-powered real estate chatbot that helps users find properties using Summitly's database. Features text and voice input, property images, and direct links to view properties on Summitly.

## ✨ Features

- 💬 **Text + Voice Input**: Chat via text or speak naturally
- 📸 **Property Images**: Real property photos from Summitly
- 🔗 **Direct Links**: Click to view full details on Summitly
- 🤖 **AI-Powered**: Smart property matching and recommendations
- 📍 **Location Search**: Search by city/area (Toronto, Manhattan, etc.)
- 🎯 **Form Collection**: Collect user preferences for personalized recommendations

## 🏗️ Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **AI**: OpenAI GPT-3.5-turbo
- **Speech**: SpeechRecognition, pyttsx3
- **Database**: Summitly property integration

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Make setup script executable (if needed)
chmod +x setup.sh

# Run setup script to create virtual environment and install dependencies
./setup.sh
```

### 2. Run the Application

```bash
# Start the server
./run.sh
```

The application will be available at: **http://localhost:5050**

### 3. Manual Setup (Alternative)

If you prefer manual setup:

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python voice_assistant_repliers.py
```

## 🎯 Usage Examples

### Text Searches
- "Show me apartments in Toronto"
- "Properties in Manhattan"
- "Houses in Vancouver under $600k"
- "2 bedroom condos in Brooklyn"

### Voice Commands
- Click the 🎤 Voice button and speak naturally
- Ask questions like: "What properties do you have in Los Angeles?"

## 📁 Project Structure

```
v3/
├── voice_assistant_repliers.py    # Main Flask application
├── index_repliers.html           # Frontend interface
├── requirements.txt              # Python dependencies
├── setup.sh                     # Environment setup script
├── run.sh                       # Application run script
├── README.md                    # This file
└── venv/                        # Virtual environment (created by setup)
```

## 🔧 Configuration

### Environment Variables (Optional)

You can set these environment variables for enhanced functionality:

```bash
export OPENAI_API_KEY="your-openai-api-key"  # For AI responses
```

### Summitly Integration

The application includes sample property data for demonstration. In production, you would:

1. Replace `SUMMITLY_SAMPLE_PROPERTIES` with actual API calls
2. Implement real Summitly API endpoints
3. Add authentication if required

## 🎨 Frontend Features

- **Responsive Design**: Works on desktop and mobile
- **Property Cards**: Visual property display with images
- **Real-time Chat**: Instant responses with typing indicators
- **Voice Recording**: Built-in speech recognition
- **Direct Links**: "View on Summitly" buttons for each property

## 🔄 API Endpoints

- `GET /api/voice-init` - Initialize chat session
- `POST /api/text-chat` - Handle text messages
- `POST /api/voice-chat` - Handle voice messages
- `GET /api/health` - Health check

## 🐛 Troubleshooting

### Common Issues

1. **Port 5050 already in use**
   ```bash
   # Kill any process using port 5050
   lsof -ti:5050 | xargs kill -9
   ```

2. **Permission denied on scripts**
   ```bash
   chmod +x setup.sh run.sh
   ```

3. **Python dependencies issues**
   ```bash
   # Recreate virtual environment
   rm -rf venv
   ./setup.sh
   ```

4. **Audio/microphone issues**
   - Ensure browser has microphone permissions
   - Check system audio settings

## 📍 Supported Locations

Current sample data includes properties in:
- Toronto, Ontario
- Manhattan, New York
- Brooklyn, New York
- Vancouver, BC
- Los Angeles, CA

## 🔮 Future Enhancements

- [ ] Connect to real Summitly API
- [ ] Add property filtering (price, bedrooms, etc.)
- [ ] User authentication and saved searches
- [ ] Property favorites and comparisons
- [ ] Email notifications for new properties
- [ ] Mobile app version

## 🆘 Support

If you encounter any issues:

1. Check that all dependencies are installed: `pip list`
2. Ensure virtual environment is activated: `which python`
3. Check the console logs for error messages
4. Verify port 5050 is available

## 📄 License

This project is for demonstration purposes. Summitly integration should comply with their terms of service.

---

**Built with ❤️ for seamless real estate discovery**

lead managment backup

frontend AI UI 