# 🚀 START HERE - One Command to Run Everything

## ⚡ SINGLE COMMAND TO START THE ENTIRE CHATBOT:

Open PowerShell in the project root directory and run:

```powershell
.\start-summitly-ai.ps1
```

**That's it!** This one script will:
1. ✅ Install all Python dependencies
2. ✅ Install all Node.js dependencies  
3. ✅ Start Python backend (port 5050)
4. ✅ Start Next.js frontend (port 3000)
5. ✅ Open both in separate terminal windows

---

## 🎯 After Running the Command:

### Wait 30-60 seconds, then open your browser to:

```
http://localhost:3000/ai
```

You'll see the **AI chatbot interface** ready to use!

---

## 💬 Try These Sample Queries:

```
"Show me properties in Toronto"
"Find condos under $500k"  
"What's the market like in Vancouver?"
"Tell me about pre-construction projects"
"Analyze this property for investment"
```

---

## ⚠️ Before First Run:

### 1. **Install Python 3.9+**
   - Download: https://www.python.org/downloads/

### 2. **Install Node.js 18+**
   - Download: https://nodejs.org/

### 3. **Configure API Keys**

Create `.env` file in `Summitly-AI-/config/` directory:

```bash
REPLIERS_API_KEY=your_repliers_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
EXA_API_KEY=your_exa_api_key_here  # Optional
```

Copy `.env.local.example` to `.env.local`:

```powershell
copy .env.local.example .env.local
```

---

## 🔍 How to Know It's Working:

You should see these messages in the terminal windows:

**Backend Window:**
```
🚀 SUMMITLY AI - PRODUCTION REAL ESTATE ASSISTANT
✨ Features: OpenAI Enhanced, Live MLS Data, Investment Analysis
📍 Server: http://0.0.0.0:5050
Running on http://127.0.0.1:5050
```

**Frontend Window:**
```
▲ Next.js 15.x.x
- Local: http://localhost:3000
✓ Ready in X.Xs
```

---

## 🆘 Troubleshooting:

### Script Won't Run?
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use?
Kill the process:
```powershell
# Backend (port 5050)
netstat -ano | findstr :5050
taskkill /PID <PID> /F

# Frontend (port 3000)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Python/Node Not Found?
- Install Python: https://www.python.org/downloads/
- Install Node.js: https://nodejs.org/

---

## 📚 Full Documentation:

- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
- **Complete Guide**: [INTEGRATION_README.md](./INTEGRATION_README.md)
- **Architecture**: [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)
- **Checklist**: [INTEGRATION_CHECKLIST.md](./INTEGRATION_CHECKLIST.md)
- **Summary**: [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)

---

## 🎉 That's Everything!

**Your complete AI real estate chatbot is ready with ONE command:**

```powershell
.\start-summitly-ai.ps1
```

Then visit: **http://localhost:3000/ai**

**Happy chatting! 🏠✨**
