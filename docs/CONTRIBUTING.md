# Contributing Guide

Thank you for your interest in contributing to Summitly Backend! This guide explains our development process and coding standards.

## Getting Started

### Prerequisites
- Python 3.8+
- Git
- GitHub account

### Setup Development Environment

```bash
# 1. Fork and clone repository
git clone https://github.com/YOUR_USERNAME/summitly-backend.git
cd summitly-backend

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# 4. Activate development mode
./scripts/dev.sh
```

## Development Workflow

### 1. Create Feature Branch

```bash
# From main branch
git checkout main
git pull origin main

# Create new branch with descriptive name
git checkout -b feature/add-new-endpoint
# or
git checkout -b bugfix/fix-chat-error
# or
git checkout -b docs/update-api-reference
```

### 2. Make Changes

- Write clean, well-commented code
- Follow PEP 8 style guide
- Keep commits atomic and focused
- Add tests for new features

### 3. Run Quality Checks

```bash
# Format code
black app/ services/ endpoints/ models/ utils/

# Sort imports
isort app/ services/ endpoints/ models/ utils/

# Lint code
flake8 app/ services/ endpoints/ models/ utils/

# Type checking
mypy app/

# Run tests
pytest tests/ --cov=app

# Or all at once
./scripts/quality-check.sh
```

### 4. Commit Changes

```bash
# Add changes
git add app/ services/ tests/

# Commit with clear message
git commit -m "feat: add new chat endpoint for real-time streaming"
```

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/add-new-endpoint

# Create PR on GitHub
# - Add description of changes
# - Link related issues
# - Request reviewers
```

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactor without feature changes
- `perf:` - Performance improvement
- `test:` - Test additions or updates
- `chore:` - Build/setup/dependency changes

### Examples

```bash
git commit -m "feat(endpoints): add streaming chat endpoint"
git commit -m "fix(nlp): handle edge case in entity extraction"
git commit -m "docs: update API reference for new endpoints"
git commit -m "test: add tests for property valuation service"
git commit -m "refactor(services): simplify response formatting logic"
```

## Code Style Guide

### Python Style (PEP 8)

```python
# Good
def process_property_data(property_id: str, criteria: Dict[str, Any]) -> Property:
    """
    Process and validate property data.
    
    Args:
        property_id: Unique property identifier
        criteria: Search criteria dictionary
        
    Returns:
        Processed Property object
        
    Raises:
        ValueError: If property not found
    """
    # Implementation
    pass

# Avoid
def process(p, c):
    # Unclear naming, no type hints
    pass
```

### Documentation

```python
# Module docstring
"""
Module for handling property valuation and analysis.

This module provides functionality for:
- Property price estimation
- Market comparison
- Investment analysis
"""

# Function docstring
def estimate_price(property_id: str) -> float:
    """
    Estimate property price using ML model.
    
    Args:
        property_id: MLS number or property identifier
        
    Returns:
        Estimated price in CAD
        
    Raises:
        PropertyNotFoundError: If property not found in database
        APIError: If valuation service unavailable
    """
    pass

# Complex logic comments
def complex_calculation():
    # Use 3x multiplier for downtown properties
    # based on historical market data analysis
    multiplier = 3.0
    pass
```

## Testing

### Writing Tests

```python
# tests/unit/test_nlp_service.py
import pytest
from services.nlp_service import nlp_service

@pytest.mark.unit
def test_extract_entities_from_query():
    """Test entity extraction from user query."""
    text = "Show me condos in Toronto under $800k"
    entities = nlp_service.extract_entities(text)
    
    assert entities['location'] == 'Toronto'
    assert entities['property_type'] == 'condo'
    assert entities['budget_max'] == 800000

@pytest.mark.unit
def test_classify_intent():
    """Test intent classification."""
    assert nlp_service.classify_intent("Find properties") == "search"
    assert nlp_service.classify_intent("Value this property") == "valuation"
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific file
pytest tests/unit/test_nlp_service.py

# Run with coverage
pytest --cov=app --cov=services --cov-report=html

# Run integration tests only
pytest -m integration

# Run specific test
pytest tests/unit/test_nlp_service.py::test_extract_entities_from_query
```

### Test Coverage

- Aim for >80% code coverage
- All public APIs must have tests
- Test edge cases and error conditions
- Use fixtures for common test data

## Pull Request Process

### Before Submitting

1. ✅ Code follows style guide (black, isort, flake8)
2. ✅ All tests pass locally
3. ✅ Coverage remains above 80%
4. ✅ Type hints added for new functions
5. ✅ Docstrings updated
6. ✅ README updated if needed

### PR Description Template

```markdown
## Description
Briefly describe what this PR does.

## Related Issues
Closes #123

## Changes
- Added new endpoint for streaming responses
- Updated NLP service to handle edge cases
- Added 15 new tests

## Breaking Changes
None / or describe changes

## Testing
Tested locally with:
- pytest tests/ --cov
- Manual API testing
- Edge case validation

## Checklist
- [x] Code follows style guide
- [x] Tests pass
- [x] No breaking changes
- [x] Documentation updated
- [x] Commit messages clear
```

### Review Process

1. Maintainer reviews code
2. Automated tests run (GitHub Actions)
3. Code quality checks pass (Codecov, etc.)
4. Minimum 1 approval required
5. Branch merged to main

## Architecture Guidelines

### When Adding New Features

1. **Services Layer** (business logic)
   ```python
   # services/new_feature/feature.py
   class NewFeatureService:
       def process_data(self, data):
           pass
   ```

2. **Endpoints Layer** (API routes)
   ```python
   # endpoints/new_feature.py
   @app.route('/api/new-feature', methods=['POST'])
   def handle_new_feature():
       pass
   ```

3. **Models Layer** (data schemas)
   ```python
   # models/schemas.py
   class NewFeatureSchema(BaseModel):
       pass
   ```

4. **Tests Layer** (validation)
   ```python
   # tests/unit/test_new_feature.py
   def test_feature():
       pass
   ```

## Common Issues

### Import Errors

```bash
# Ensure __init__.py exists in packages
touch services/__init__.py

# Ensure package in PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Virtual Environment Issues

```bash
# Reset venv
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -e ".[dev]"
```

### Port Already in Use

```bash
# Find and kill process
lsof -i :5050
kill -9 <PID>

# Or use different port
FLASK_RUN_PORT=5051 ./scripts/dev.sh
```

## Resources

- [Python PEP 8](https://www.python.org/dev/peps/pep-0008/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Project Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API_REFERENCE.md)

## Getting Help

- GitHub Issues for bugs/features
- GitHub Discussions for questions
- Code review comments on PRs
- Email: dev@summitly.ca

## Code of Conduct

Please be respectful and constructive. We welcome all contributions and aim to create an inclusive community.

---

Thank you for contributing! 🎉
