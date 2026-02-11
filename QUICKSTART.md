# 🚀 QUICK START GUIDE - Summitly AI Chatbot

## ONE COMMAND TO START EVERYTHING:

### Option 1: Using PowerShell Script (Recommended)
```powershell
.\start-summitly-ai.ps1
```

### Option 2: Using npm
```bash
npm run ai:start
```

## ✅ What This Does:
1. Checks Python & Node.js installation
2. Installs all dependencies automatically
3. Starts Python backend (port 5050)
4. Starts Next.js frontend (port 3000)
5. Opens everything in separate windows

## 📍 Access Your Application:

| What | URL |
|------|-----|
| **AI Chatbot** | http://localhost:3000/ai |
| **Main Site** | http://localhost:3000 |
| **Backend API** | http://localhost:5050 |

## 🎯 Try These Commands in the Chat:

```
"Show me properties in Toronto under $800k"
"Find 3-bedroom condos in Mississauga"
"Tell me about the Toronto market"
"Show me pre-construction projects"
"Analyze this property for investment"
```

## 🔑 Before First Run:

### 1. Configure API Keys

Create `.env` file in `Summitly-AI-/config/` directory:
```bash
REPLIERS_API_KEY=your_repliers_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
EXA_API_KEY=your_exa_api_key_here  # Optional
```

### 2. Configure Frontend

Copy `.env.local.example` to `.env.local`:
```bash
copy .env.local.example .env.local
```

## ⚠️ Troubleshooting:

### Python Not Found?
Install Python 3.9+ from https://www.python.org/downloads/

### Node.js Not Found?
Install Node.js 18+ from https://nodejs.org/

### Port Already in Use?
Kill the process using the port:
```powershell
# Kill process on port 5050
netstat -ano | findstr :5050
taskkill /PID <PID_NUMBER> /F

# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

### Backend Connection Failed?
1. Check if backend is running: http://localhost:5050/health
2. Verify API keys in `.env` file
3. Check backend terminal for error messages

## 📖 Full Documentation:
See [INTEGRATION_README.md](./INTEGRATION_README.md) for complete details.

## 🎉 Success Indicators:

You'll see these messages if everything works:
- ✅ "Python Backend Starting..."
- ✅ "Next.js Frontend Starting..."
- ✅ "Frontend: http://localhost:3000"
- ✅ "Backend API: http://localhost:5050"

## 💡 Pro Tips:

1. **Keep both terminal windows open** - they show real-time logs
2. **Refresh browser** if chat doesn't respond immediately
3. **Check backend logs** for API errors
4. **Check browser console** (F12) for frontend errors

## 🛑 Stopping Services:

Just close the terminal windows or press `Ctrl+C` in each terminal.

---

**Need Help?** Check the full INTEGRATION_README.md file or backend logs.
