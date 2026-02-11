# Summitly AI - Quick Start Guide

## ONE COMMAND TO START EVERYTHING

```powershell
.\start.ps1
```

That's it! This single command will:
- ✅ Check Python and Node.js
- ✅ Create environment files if missing
- ✅ Install dependencies ONLY when needed (not every time!)
- ✅ Generate Prisma Client automatically
- ✅ Start Python backend (port 5050)
- ✅ Start Next.js frontend (port 3000)

## Access Points

- **Frontend**: http://localhost:3000
- **AI Chatbot**: http://localhost:3000/ai
- **Backend API**: http://localhost:5050
- **Admin Dashboard**: http://localhost:5050/manager

## First Time Setup

### 1. Configure API Keys

Edit `.env.local` in the project root:
```env
# Update these with your actual keys
REPLIERS_API_KEY_SERVER=your_repliers_server_key
NEXT_PUBLIC_REPLIERS_API_KEY_CLIENT=your_repliers_client_key
```

Edit `Summitly-AI-/config/.env`:
```env
REPLIERS_API_KEY=your_repliers_key
OPENAI_API_KEY=your_openai_key
EXA_API_KEY=your_exa_key_optional
```

### 2. Configure Database (If Using Real Database)

Update `.env.local`:
```env
DATABASE_URL="postgresql://username:password@host:5432/database_name?schema=public"
```

## Smart Features

The startup script is intelligent:
- **Dependencies**: Only installs when package.json/requirements.txt changes
- **Prisma**: Only generates when needed
- **Environment**: Auto-creates .env files on first run
- **Windows**: Opens backend and frontend in separate windows

## Stopping Services

Simply close the two PowerShell windows that opened (Backend and Frontend)

Or press `Ctrl+C` in each window

## Troubleshooting

### "Execution policy" error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Prisma errors
The script handles this automatically, but if issues persist:
```powershell
$env:DATABASE_URL="postgresql://user:password@localhost:5432/summitly?schema=public"
npx prisma generate
```

### Backend not responding
Check that API keys are configured in `Summitly-AI-/config/.env`

### Port already in use
Kill processes on ports 3000 and 5050:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
Get-Process -Id (Get-NetTCPConnection -LocalPort 5050).OwningProcess | Stop-Process -Force
```

## Testing AI Chatbot Integration

1. Start services: `.\start.ps1`
2. Open http://localhost:3000/ai
3. Try these queries:
   - "Show me properties in Toronto"
   - "Find condos under $500k"
   - "What's the market trend in Vancouver?"
   - "Analyze property MLS123456"

## Files Created/Modified

- `start.ps1` - Smart startup script
- `.env.local` - Frontend environment variables
- `Summitly-AI-/config/.env` - Backend API keys
- Prisma Client auto-generated in `node_modules/.prisma/client`

## Architecture

```
┌─────────────────────────────────────────────────┐
│              BROWSER (localhost:3000)           │
│  ┌──────────────────────────────────────────┐   │
│  │  Next.js Frontend (React + TypeScript)   │   │
│  │  - UI Components                          │   │
│  │  - AI Chat Interface at /ai               │   │
│  └──────────────┬───────────────────────────┘   │
└─────────────────┼───────────────────────────────┘
                  │ HTTP Requests
                  ▼
┌─────────────────────────────────────────────────┐
│     Next.js API Routes (Proxy Layer)            │
│  /api/ai/chat → Python Backend                  │
│  /api/ai/search → Python Backend                │
│  /api/ai/analysis → Python Backend              │
└─────────────────┬───────────────────────────────┘
                  │ HTTP
                  ▼
┌─────────────────────────────────────────────────┐
│   Python Flask Backend (localhost:5050)         │
│  voice_assistant_clean.py                       │
│  ┌──────────────────────────────────────────┐   │
│  │  - OpenAI GPT-4 Integration               │   │
│  │  - Repliers MLS API                       │   │
│  │  - Property Search & Analysis             │   │
│  │  - NLP Processing                         │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## Next Steps

1. **Configure API Keys** (see above)
2. **Run**: `.\start.ps1`
3. **Test**: Visit http://localhost:3000/ai
4. **Deploy**: When ready, see deployment docs

---

**Made with ❤️ for Summitly Real Estate Platform**
