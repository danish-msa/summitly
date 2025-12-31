# Scripts Guide

This directory contains automation scripts for setup, development, and deployment.

## Quick Reference

| Script | Purpose | Environment |
|--------|---------|-------------|
| `setup.sh` | Initial project setup | First-time setup |
| `run.sh` | Run production server | Production/Staging |
| `dev.sh` | Development with auto-reload | Local development |
| `setup_repliers.sh` | Repliers API configuration | Development |
| `setup_huggingface.sh` | HuggingFace model setup | Development |

---

## setup.sh - Environment Setup

**Purpose**: Create virtual environment and install all dependencies

**Usage:**
```bash
chmod +x setup.sh
./setup.sh
```

**What it does:**
1. Creates Python virtual environment
2. Activates virtual environment
3. Upgrades pip/setuptools
4. Installs all dependencies from `requirements/requirements.txt`
5. Creates necessary directories
6. Sets up .env file from example
7. Runs initial tests

**Options:**
```bash
./setup.sh --no-test          # Skip tests
./setup.sh --dev              # Include development tools
./setup.sh --all              # Include all optional dependencies
```

---

## run.sh - Production Server

**Purpose**: Start the Flask application in production mode

**Usage:**
```bash
./run.sh
```

**Configuration:**
- Port: 5050
- Host: 0.0.0.0 (accessible from network)
- Debug: OFF
- Reload: OFF

**Output:**
```
✅ Activating virtual environment...
✅ Starting Summitly Backend...
 * Running on http://0.0.0.0:5050
```

**Access:** http://localhost:5050

**Stop the server:** Press `Ctrl+C`

---

## dev.sh - Development Server

**Purpose**: Start Flask in development mode with auto-reload

**Usage:**
```bash
./dev.sh
```

**Features:**
- ✅ Auto-reload on code changes
- ✅ Debug mode enabled
- ✅ Interactive debugger
- ✅ Detailed error pages
- ✅ Verbose logging

**Configuration:**
- Port: 5050
- Host: 0.0.0.0
- Debug: ON
- Reload: ON

**Output:**
```
✅ Activating virtual environment...
✅ Starting Summitly Backend in development mode...
 * Running on http://0.0.0.0:5050 (Press CTRL+C to quit)
 * Restarting with reloader
 * Debugger is active!
```

**Debugging:**
- Errors show interactive debugger
- Breakpoints work with debugpy
- Check terminal for detailed logs

**Stop:** Press `Ctrl+C`

---

## setup_repliers.sh - Repliers Integration

**Purpose**: Configure Repliers API integration

**Usage:**
```bash
./setup_repliers.sh
```

**What it does:**
1. Installs Repliers-specific dependencies
2. Prompts for REPLIERS_API_KEY
3. Tests API connectivity
4. Updates .env file
5. Verifies integration

**Requirements:**
- Repliers API key (from Repliers dashboard)
- Active internet connection

**Troubleshooting:**
```bash
# Test Repliers connection
python -c "from services.repliers_client import repliers_client; print(repliers_client.test_connection())"
```

---

## setup_huggingface.sh - HuggingFace Models

**Purpose**: Download and configure HuggingFace models

**Usage:**
```bash
./setup_huggingface.sh
```

**What it does:**
1. Installs HuggingFace dependencies
2. Downloads model files (~2GB)
3. Configures model settings
4. Tests model loading

**Requirements:**
- 5GB+ disk space (for models)
- 30+ minutes for download
- HUGGINGFACE_API_TOKEN (optional, for private models)

**Note:** Models are cached after first download

---

## Common Tasks

### Create Virtual Environment Only
```bash
python3 -m venv venv
source venv/bin/activate
```

### Install Dependencies Only
```bash
source venv/bin/activate
pip install -r requirements/requirements.txt
```

### Install Development Tools
```bash
source venv/bin/activate
pip install -e ".[dev]"
```

### Run Tests
```bash
source venv/bin/activate
pytest
```

### Format Code
```bash
source venv/bin/activate
black app/ services/ endpoints/ models/ utils/
```

### Check Code Quality
```bash
source venv/bin/activate
flake8 app/ services/ endpoints/ models/ utils/
isort app/ services/ endpoints/ models/ utils/
```

### Deploy to Render
```bash
git push origin main
# Render auto-deploys with:
# - Build command: pip install -r requirements/requirements.txt
# - Start command: gunicorn -w 4 -b 0.0.0.0:5050 "app.voice_assistant_clean:app"
```

---

## Environment Variables

### Essential Variables
```bash
# Flask
FLASK_ENV=development          # or production
FLASK_APP=app/voice_assistant_clean.py
SECRET_KEY=your-secret-key

# APIs
OPENAI_API_KEY=sk-...
REPLIERS_API_KEY=...
EXA_API_KEY=...

# Optional
MAIL_SERVER=smtp.gmail.com
DATABASE_URL=...
```

### Load Variables
```bash
# From .env file
source venv/bin/activate  # venv automatically loads .env

# Manual
export FLASK_ENV=development
```

---

## Troubleshooting

### Virtual Environment Issues
```bash
# Deactivate current
deactivate

# Reset venv
rm -rf venv
python3 -m venv venv
source venv/bin/activate

# Reinstall
pip install -r requirements/requirements.txt
```

### Port Already in Use
```bash
# Find process on port 5050
lsof -i :5050

# Kill process
kill -9 <PID>

# Use different port
export FLASK_ENV=development
python -m flask run --port=5051
```

### Import Errors
```bash
# Check Python path
which python
python -c "import sys; print(sys.path)"

# Verify package structure
python -c "import app; print(app.__file__)"
```

### Permission Denied
```bash
# Make scripts executable
chmod +x *.sh
ls -la *.sh  # Should show x (execute) permission
```

### Dependencies Won't Install
```bash
# Update pip
pip install --upgrade pip setuptools wheel

# Try installing again
pip install -r requirements/requirements.txt

# Or with specific Python version
python3.11 -m pip install -r requirements/requirements.txt
```

---

## Advanced Usage

### Run with Custom Configuration
```bash
# Custom port
FLASK_RUN_PORT=8000 ./run.sh

# Custom host (local only)
FLASK_RUN_HOST=127.0.0.1 ./dev.sh

# Custom log level
LOG_LEVEL=DEBUG ./dev.sh
```

### Using Different Python Version
```bash
# Use Python 3.11 specifically
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements/requirements.txt
```

### Debugging
```bash
# Run with Python debugger
python -m pdb app/voice_assistant_clean.py

# Or use in code:
# import pdb; pdb.set_trace()

# Run with verbose logging
export FLASK_DEBUG=1
export WERKZEUG_DEBUG_PIN=off
./dev.sh
```

### Performance Testing
```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 http://localhost:5050/api/health

# With curl
for i in {1..100}; do
  curl http://localhost:5050/api/health &
done
wait
```

---

## Platform-Specific Notes

### macOS
```bash
# M1/M2 Macs might need specific python version
brew install python@3.11
python3.11 -m venv venv

# Sometimes need to install libsndfile for audio
brew install libsndfile
```

### Linux (Ubuntu/Debian)
```bash
# Install system dependencies
sudo apt-get install python3-venv python3-dev libsndfile1

# Then run setup.sh
```

### Windows
```bash
# Use .bat versions or WSL2
# Or manually:
python -m venv venv
venv\Scripts\activate
pip install -r requirements/requirements.txt
python -m flask run
```

---

## Cron Jobs (for scheduled tasks)

### Run daily tests
```bash
# Add to crontab
0 2 * * * cd /path/to/summitly && source venv/bin/activate && pytest
```

### Backup database daily
```bash
0 3 * * * cd /path/to/summitly && ./scripts/backup.sh
```

---

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run setup and tests
  run: |
    chmod +x scripts/setup.sh
    ./scripts/setup.sh
```

### GitLab CI
```yaml
before_script:
  - chmod +x scripts/setup.sh
  - ./scripts/setup.sh
```

---

**Last Updated:** November 28, 2025  
**Version:** 3.0.0
