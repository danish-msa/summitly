# 🏠 Summitly Backend - Comprehensive Setup & Deployment Guide

## Table of Contents
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Reference](#-api-reference)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip or pip3
- Virtual environment tool (venv)
- Git

### 5-Minute Setup

```bash
# 1. Clone/Navigate to project
cd Summitly\ Backend

# 2. Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Start the application
./scripts/run.sh

# 4. Open browser
open http://localhost:5050
```

---

## 📁 Project Structure

```
Summitly Backend/
├── app/                           # Main Flask application (entry point)
│   ├── voice_assistant_clean.py  # Primary Flask app (6814 lines)
│   ├── voice_assistant_repliers.py
│   └── webhook_handler.py
│
├── services/                      # Business logic & integrations
│   ├── config.py                 # Core configuration
│   ├── repliers_client.py        # Repliers API client
│   ├── listings_service.py       # Property management
│   ├── nlp_service.py            # NLP processing
│   ├── chatbot_formatter.py      # Response formatting
│   ├── estimates_service.py      # Property valuations
│   ├── saved_search_service.py   # Search preferences
│   ├── valuation_engine.py       # Valuation logic
│   └── [+20 more service files]
│
├── endpoints/                     # API routes
│   ├── chat.py                   # Chat endpoints
│   └── multimodal.py             # Multimodal processing
│
├── models/                        # Data models & schemas
│   ├── schemas.py                # Pydantic schemas
│   └── valuation_models.py       # Valuation models
│
├── utils/                         # Utility functions
│   ├── logging_metrics.py        # Logging system
│   └── prompt_templates.py       # LLM prompts
│
├── Frontend/                      # User interfaces
│   ├── current/                  # Active frontend
│   │   └── index_repliers.html
│   └── legacy/                   # Older versions
│       ├── index_huggingface_enhanced.html
│       ├── main_frontend.html
│       └── [+4 more]
│
├── tests/                         # Test suite
│   ├── conftest.py               # Pytest configuration
│   ├── test_endpoints.py         # API tests
│   ├── test_integration.py       # Integration tests
│   └── [+12 more test files]
│
├── config/                        # Environment variables
│   ├── .env                      # Environment secrets
│   └── .env.example              # Template
│
├── scripts/                       # Automation scripts
│   ├── setup.sh                  # Environment setup
│   ├── run.sh                    # Start application
│   ├── dev.sh                    # Development mode
│   └── README.md                 # Scripts documentation
│
├── logs/                          # Application logs
│   ├── app.log
│   ├── conversations.log
│   ├── errors.log
│   └── [+3 more]
│
├── docs/                          # Documentation
│   ├── README.md                 # This file
│   ├── API_REFERENCE.md          # API documentation
│   ├── SETUP.md                  # Detailed setup
│   ├── ARCHITECTURE.md           # System design
│   └── archived/                 # Old documentation
│
├── requirements/                  # Dependencies
│   ├── requirements.txt          # Main dependencies
│   └── repliers_requirements.txt # Repliers-specific
│
├── Data/                          # Sample/test data
│   ├── leads_data.xlsx
│   └── combined_test_report.json
│
├── temp_audio/                    # Temporary audio files
│
├── .gitignore                     # Git ignore rules
├── .env.example                   # Environment template
├── pyproject.toml                 # Modern Python packaging
├── setup.cfg                      # Setup configuration
├── pytest.ini                     # Pytest configuration
├── FOLDER_STRUCTURE_REVIEW.md    # Structure review
└── README.md                      # This file
```

---

## 📦 Installation

### Option 1: Automated Setup (Recommended)

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This script will:
- Create virtual environment
- Install dependencies
- Set up environment variables
- Run initial tests

### Option 2: Manual Setup

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements/requirements.txt

# Install optional dependencies (choose as needed)
pip install -r requirements/repliers_requirements.txt

# For development:
pip install -e ".[dev]"
```

### Option 3: Using Docker

```bash
docker-compose up -d
open http://localhost:5050
```

---

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and update:

```bash
cp config/.env.example config/.env
```

**Required variables:**

```env
# Flask Configuration
FLASK_ENV=development
FLASK_APP=app/voice_assistant_clean.py
SECRET_KEY=your-secret-key-here

# APIs
OPENAI_API_KEY=sk-your-key
EXA_API_KEY=your-exa-api-key
REPLIERS_API_KEY=your-repliers-key

# Database
DATABASE_URL=optional-db-connection-string

# Email (optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### Application Configuration

Edit `services/config.py` for:
- API endpoints
- Model selections
- Timeout values
- Cache settings
- Feature flags

---

## 🏃 Running the Application

### Development Mode

```bash
./scripts/dev.sh
```

Features:
- Auto-reload on file changes
- Debug mode enabled
- Verbose logging
- Interactive debugger on errors

### Production Mode

```bash
./scripts/run.sh
```

Or manually:

```bash
source venv/bin/activate
python -m flask run --host=0.0.0.0 --port=5050
```

### Access the Application

- **Frontend**: http://localhost:5050
- **API Docs**: http://localhost:5050/api/docs (if available)
- **Health Check**: http://localhost:5050/api/health

---

## 📡 API Reference

### Chat Endpoint

```bash
curl -X POST http://localhost:5050/api/intelligent-chat-sync \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about properties in Toronto",
    "session_id": "user-session-123"
  }'
```

### Property Analysis

```bash
curl -X POST http://localhost:5050/api/property-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "quick_insights",
    "mls_number": "N12584160"
  }'
```

### Voice Input (multimodal)

```bash
curl -X POST http://localhost:5050/api/multimodal \
  -F "audio=@voice_message.wav" \
  -F "session_id=user-session-123"
```

**Full API Reference**: See `docs/API_REFERENCE.md`

---

## 👨‍💻 Development

### Code Style

This project uses:
- **Black** for code formatting
- **isort** for import sorting
- **flake8** for linting
- **mypy** for type checking

### Setup Development Environment

```bash
# Install development dependencies
pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install

# Format code
black app/ services/ endpoints/ models/ utils/

# Check code quality
flake8 app/ services/ endpoints/ models/ utils/
isort app/ services/ endpoints/ models/ utils/

# Type checking
mypy app/
```

### Project Structure for Developers

```
When adding new features:

1. Services layer: app/services/[feature_name]/
   - Business logic
   - External API integration
   - Data processing

2. Endpoints layer: app/endpoints/
   - Add routes here
   - Request validation
   - Response formatting

3. Models layer: app/models/
   - Data schemas
   - Pydantic models
   - Type definitions

4. Tests layer: tests/
   - Unit tests for services
   - Integration tests for endpoints
   - End-to-end tests
```

---

## 🧪 Testing

### Run All Tests

```bash
pytest
```

### Run Specific Test Categories

```bash
# Unit tests only
pytest -m unit

# Integration tests only
pytest -m integration

# Tests for specific service
pytest tests/test_repliers*.py

# With coverage report
pytest --cov=app --cov=services --cov-report=html
```

### Coverage Report

```bash
pytest --cov=app --cov=services --cov-report=term-missing
open htmlcov/index.html
```

---

## 🚀 Deployment

### Render.com Deployment

1. **Create Render service**
   ```bash
   git push origin main
   # Render auto-deploys from GitHub
   ```

2. **Configure environment variables** in Render dashboard:
   - Copy all from `.env` to Render environment

3. **Set build command**:
   ```bash
   pip install -r requirements/requirements.txt
   ```

4. **Set start command**:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5050 "app.voice_assistant_clean:app"
   ```

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
      - run: pip install -e ".[dev]"
      - run: pytest
      - run: black --check .
      - run: flake8 .
```

### Docker Deployment

```bash
# Build image
docker build -t summitly-backend .

# Run container
docker run -p 5050:5050 --env-file .env summitly-backend

# Or with docker-compose
docker-compose up -d
```

---

## 🐛 Troubleshooting

### Virtual Environment Issues

```bash
# Reset virtual environment
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements/requirements.txt
```

### Import Errors

```bash
# Ensure you're in virtual environment
which python  # Should show venv path

# Verify package structure
python -c "import app; print(app.__file__)"
```

### API Connection Issues

```bash
# Test Repliers API
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.repliers.io/v1/listings

# Test OpenAI API
python -c "import openai; print(openai.__version__)"
```

### Port Already in Use

```bash
# Find process using port 5050
lsof -i :5050

# Kill process
kill -9 <PID>

# Or use different port
FLASK_ENV=development python -m flask run --port=5051
```

### Logging Issues

```bash
# Check logs directory
tail -f logs/app.log
tail -f logs/errors.log

# Enable debug logging
export FLASK_DEBUG=1
./scripts/dev.sh
```

---

## 📝 Contributing

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** and test locally
   ```bash
   pytest
   black .
   flake8 .
   ```

3. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new chat endpoint"
   ```

4. **Push and create Pull Request**
   ```bash
   git push origin feature/my-feature
   ```

---

## 📞 Support & Resources

- **Documentation**: See `docs/` folder
- **API Reference**: `docs/API_REFERENCE.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

## 📄 License

MIT License - See LICENSE file for details

---

**Last Updated**: November 28, 2025  
**Version**: 3.0.0  
**Status**: Production Ready ✅
