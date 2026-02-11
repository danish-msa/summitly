# Summitly AI - Full Stack Real Estate Assistant Integration

## 🎯 Overview

This integration connects the **Summitly Next.js UI** (summitly-main) with the **Python AI Backend** (Summitly-AI-/voice_assistant_clean.py), providing a complete real estate assistant with:

- ✅ **AI-Powered Chat Interface** - Natural language property search
- ✅ **Live MLS Data** - Real-time property listings via Repliers API
- ✅ **Property Analysis** - AI valuations, market trends, and investment insights
- ✅ **Pre-Construction Properties** - Specialized pre-con property search
- ✅ **Location Insights** - Neighborhood analysis, schools, amenities
- ✅ **Market Analysis** - ROI calculations, mortgage estimates, comparables
- ✅ **Multi-Property Types** - Residential, commercial, condos, rentals

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (Next.js)                     │
│                                                         │
│  ┌───────────────────────────────────────────────┐   │
│  │  /ai - AI Chat Interface                      │   │
│  │  • AiChatAppIntegrated.tsx                   │   │
│  │  • Real-time property search                 │   │
│  │  • Conversational AI responses               │   │
│  └───────────────────────────────────────────────┘   │
│                        ↓                              │
│  ┌───────────────────────────────────────────────┐   │
│  │  API Layer (Next.js API Routes)              │   │
│  │  • /api/ai/chat - Chat proxy                 │   │
│  │  • /api/ai/search - Property search          │   │
│  │  • /api/ai/analysis - Property analysis      │   │
│  └───────────────────────────────────────────────┘   │
│                        ↓                              │
│  ┌───────────────────────────────────────────────┐   │
│  │  Service Layer                                │   │
│  │  • summitly-ai-service.ts                    │   │
│  │  • Type-safe API calls                       │   │
│  │  • Session management                        │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP
┌─────────────────────────────────────────────────────────┐
│           Backend (Python Flask - Port 5050)            │
│                                                         │
│  ┌───────────────────────────────────────────────┐   │
│  │  voice_assistant_clean.py                    │   │
│  │  • AI Chat endpoints                         │   │
│  │  • Property search (Repliers API)            │   │
│  │  • OpenAI integration                        │   │
│  │  • Investment analysis                       │   │
│  │  • Market trend analysis                     │   │
│  │  • Exa AI for real-time data                │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

### Required Software
- **Python 3.9+** - Backend runtime
- **Node.js 18+** - Frontend runtime
- **npm or yarn** - Package manager

### Required API Keys
Create `.env` file in `Summitly-AI-/config/` directory:

```bash
# Repliers MLS API (Required for property search)
REPLIERS_API_KEY=your_repliers_api_key

# OpenAI API (Required for AI features)
OPENAI_API_KEY=your_openai_api_key

# Exa AI (Optional - for enhanced real-time data)
EXA_API_KEY=your_exa_api_key

# Email Configuration (Optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_email_password
```

### Frontend Configuration
Create `.env.local` in the root directory:

```bash
# Python Backend URL
NEXT_PUBLIC_AI_BACKEND_URL=http://localhost:5050

# Next.js App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚀 Quick Start - ONE COMMAND

### Windows (PowerShell)
```powershell
.\start-summitly-ai.ps1
```

This single script will:
1. ✅ Check Python and Node.js installation
2. ✅ Install all dependencies (Python + Node.js)
3. ✅ Start the Python backend (port 5050)
4. ✅ Start the Next.js frontend (port 3000)
5. ✅ Open both services in separate terminal windows

## 🛠️ Manual Setup (Alternative)

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd Summitly-AI-

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend
python app/voice_assistant_clean.py
```

Backend will run on: **http://localhost:5050**

### Step 2: Frontend Setup

```bash
# Navigate to project root
cd ..

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on: **http://localhost:3000**

## 📍 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **AI Chat Interface** | http://localhost:3000/ai | Main AI chatbot interface |
| **Frontend** | http://localhost:3000 | Next.js application |
| **Backend API** | http://localhost:5050 | Python Flask API |
| **Manager Dashboard** | http://localhost:5050/manager | Lead management dashboard |
| **Health Check** | http://localhost:5050/health | Backend health status |

## 💬 Available Features

### Chat Commands Examples

```
🔍 Property Search:
- "Show me properties in Toronto under $800k"
- "Find 3-bedroom condos in Mississauga"
- "Rentals near CN Tower with parking"

📊 Market Analysis:
- "What's the market trend in Vancouver?"
- "Tell me about the Toronto real estate market"
- "Compare prices in Downtown vs North York"

🏢 Pre-Construction:
- "Show me pre-construction projects in Toronto"
- "New developments in Mississauga"
- "Pre-con properties near subway"

💰 Investment Analysis:
- "Analyze this property for investment"
- "Calculate ROI for $800k property"
- "Compare rental potential"

📍 Location Insights:
- "Tell me about Yorkville neighborhood"
- "Schools near this property"
- "What amenities are nearby?"
```

## 🎨 UI Components

### Main Components
- **AiChatAppIntegrated.tsx** - Main integrated chat interface
- **AiComposer.tsx** - Message input component
- **AiThread.tsx** - Chat message display
- **AiSidebar.tsx** - Chat history sidebar
- **AiTopBar.tsx** - Navigation and controls

### Service Layer
- **summitly-ai-service.ts** - API communication layer
- Type-safe API calls
- Session management
- Error handling

### API Routes
- **/api/ai/chat** - Chat message proxy
- **/api/ai/search** - Property search proxy
- **/api/ai/analysis** - Property analysis proxy

## 🔧 Backend Endpoints

### Chat Endpoints
- `POST /api/chat-gpt4` - Enhanced AI chat
- `POST /api/text-chat` - Simple text chat
- `POST /api/intelligent-chat` - Context-aware chat

### Property Search
- `POST /api/search-properties` - MLS property search
- `POST /api/repliers-nlp-search` - Natural language search
- `GET /api/repliers-property-details/<id>` - Property details

### Analysis & Insights
- `POST /api/property-analysis` - AI property analysis
- `POST /api/location-insights` - Location information
- `POST /api/openai/market-analysis` - Market trends
- `POST /api/openai/investment-analysis` - Investment ROI

### Calculations
- `POST /api/mortgage-calculator` - Mortgage estimates
- `POST /api/roi-analysis` - ROI calculations
- `POST /api/property-comparison` - Compare properties

### Pre-Construction
- Automatically detected when user mentions "pre-construction", "new development", or "pre-con"

## 🔍 Troubleshooting

### Backend Not Starting
```bash
# Check Python installation
python --version

# Verify virtual environment
cd Summitly-AI-
.\venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend Connection Issues
```bash
# Verify backend is running
curl http://localhost:5050/health

# Check environment variables
cat .env.local

# Restart frontend
npm run dev
```

### API Key Issues
- Ensure all API keys are set in `Summitly-AI-/config/.env`
- Verify Repliers API key is valid
- Check OpenAI API key has sufficient credits

### Port Conflicts
If ports 3000 or 5050 are in use:

```bash
# Change frontend port
PORT=3001 npm run dev

# Change backend port in voice_assistant_clean.py (line ~10258):
app.run(debug=True, host='0.0.0.0', port=5051)
# Then update .env.local:
NEXT_PUBLIC_AI_BACKEND_URL=http://localhost:5051
```

## 📦 Project Structure

```
summitly-main/
├── src/
│   ├── app/
│   │   ├── ai/
│   │   │   └── page.tsx              # AI chat page (integrated)
│   │   └── api/
│   │       └── ai/
│   │           ├── chat/route.ts     # Chat API proxy
│   │           ├── search/route.ts   # Search API proxy
│   │           └── analysis/route.ts # Analysis API proxy
│   ├── components/
│   │   └── summitly-ai/
│   │       ├── ui/
│   │       │   ├── AiChatAppIntegrated.tsx  # Main integrated component
│   │       │   ├── AiComposer.tsx           # Message input
│   │       │   ├── AiThread.tsx             # Message display
│   │       │   └── ...
│   │       ├── types.ts              # TypeScript types
│   │       └── index.ts              # Exports
│   └── lib/
│       └── services/
│           └── summitly-ai-service.ts  # API service layer
├── Summitly-AI-/
│   ├── app/
│   │   ├── voice_assistant_clean.py  # Main Flask backend
│   │   └── routes/                   # API routes
│   ├── services/                     # Backend services
│   └── config/
│       └── .env                      # Backend environment variables
├── .env.local                        # Frontend environment variables
├── start-summitly-ai.ps1            # Startup script
└── package.json                      # Frontend dependencies
```

## 🎯 Development Tips

### Testing the Integration
1. Start both services using `start-summitly-ai.ps1`
2. Navigate to http://localhost:3000/ai
3. Try a sample query: "Show me properties in Toronto"
4. Check browser console and backend logs for debugging

### Adding New Features
1. Add endpoint in `voice_assistant_clean.py`
2. Add method in `summitly-ai-service.ts`
3. Update types in `types.ts` if needed
4. Use the new method in `AiChatAppIntegrated.tsx`

### Debugging
```bash
# Backend logs
# Check the terminal running voice_assistant_clean.py

# Frontend logs
# Check browser console (F12)

# API calls
# Use browser Network tab to inspect requests
```

## 📈 Performance Optimization

- **Caching**: API responses are cached in session
- **Lazy Loading**: Properties load on demand
- **Debouncing**: Input is debounced to reduce API calls
- **Error Handling**: Graceful fallbacks for API failures

## 🔒 Security Notes

- Never commit `.env` or `.env.local` files
- API keys should be kept secret
- Backend runs on localhost by default
- Use HTTPS in production
- Implement rate limiting for production

## 🚢 Production Deployment

### Backend Deployment
```bash
# Use Gunicorn for production
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5050 app.voice_assistant_clean:app
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables
Update both `.env` and `.env.local` with production URLs and keys.

## 📞 Support & Contact

For issues or questions:
1. Check troubleshooting section above
2. Review backend logs for API errors
3. Check browser console for frontend errors
4. Ensure all API keys are valid

## 🎉 Success!

If everything is working, you should see:
- ✅ Backend running on port 5050
- ✅ Frontend running on port 3000
- ✅ AI chat responding to queries
- ✅ Properties loading from MLS data
- ✅ Analysis and insights generating

**Happy coding! 🚀**
