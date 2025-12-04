#!/usr/bin/env python3
"""
🚀 Summitly AI Production Deployment Validator
Validates that the system is ready for Render deployment
"""

import os
import sys
import json
import requests
from datetime import datetime

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_status(message, status='info'):
    timestamp = datetime.now().strftime('%H:%M:%S')
    if status == 'success':
        print(f"{Colors.GREEN}✅ [{timestamp}] {message}{Colors.END}")
    elif status == 'error':
        print(f"{Colors.RED}❌ [{timestamp}] {message}{Colors.END}")
    elif status == 'warning':
        print(f"{Colors.YELLOW}⚠️  [{timestamp}] {message}{Colors.END}")
    elif status == 'info':
        print(f"{Colors.CYAN}ℹ️  [{timestamp}] {message}{Colors.END}")
    else:
        print(f"📋 [{timestamp}] {message}")

def check_environment_variables():
    """Check for required environment variables"""
    print_status("Checking environment variables...", 'info')
    
    required_vars = [
        'OPENAI_API_KEY',
        'REPLIERS_API_KEY'
    ]
    
    optional_vars = [
        'HUGGINGFACE_API_TOKEN',
        'EXA_API_KEY',
        'FLASK_ENV',
        'PORT'
    ]
    
    missing_required = []
    missing_optional = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_required.append(var)
        else:
            print_status(f"✓ {var} is set", 'success')
    
    for var in optional_vars:
        if not os.getenv(var):
            missing_optional.append(var)
        else:
            print_status(f"✓ {var} is set", 'success')
    
    if missing_required:
        print_status(f"Missing required environment variables: {', '.join(missing_required)}", 'error')
        return False
    
    if missing_optional:
        print_status(f"Missing optional environment variables: {', '.join(missing_optional)}", 'warning')
    
    return True

def check_security_issues():
    """Check for hardcoded API keys and secrets"""
    print_status("Scanning for security issues...", 'info')
    
    security_patterns = [
        ('API Key', r'[\'"](?:sk-|pk_|hf_)[A-Za-z0-9_-]{32,}[\'"]'),
        ('Generic Secret', r'[\'"][A-Za-z0-9]{20,}[\'"].*(?:api|key|token|secret)'),
    ]
    
    risky_files = [
        'app/voice_assistant_clean.py',
        'services/openai_service.py',
        'services/config.py',
        'Frontend/legacy/Summitly_main.html'
    ]
    
    issues_found = 0
    
    for file_path in risky_files:
        full_path = os.path.join('/', 'Users', 'shreyashdanke', 'Desktop', 'Main', 'Summitly Backend', file_path)
        if os.path.exists(full_path):
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for hardcoded API keys (actual key patterns, not variable names)
                import re
                
                # Look for actual hardcoded API key patterns
                openai_key_pattern = r'[\'"]sk-[A-Za-z0-9]{48}[\'"]'
                hf_token_pattern = r'[\'"]hf_[A-Za-z0-9]{37}[\'"]'
                
                openai_matches = re.findall(openai_key_pattern, content)
                hf_matches = re.findall(hf_token_pattern, content)
                
                file_has_issues = False
                
                if openai_matches:
                    print_status(f"⚠️  Hardcoded OpenAI API key found in {file_path}", 'warning')
                    issues_found += 1
                    file_has_issues = True
                
                if hf_matches:
                    print_status(f"⚠️  Hardcoded HuggingFace token found in {file_path}", 'warning')
                    issues_found += 1
                    file_has_issues = True
                    
                if not file_has_issues:
                    print_status(f"✓ {file_path} looks secure", 'success')
                    
            except Exception as e:
                print_status(f"Could not scan {file_path}: {e}", 'warning')
        else:
            print_status(f"File not found: {file_path}", 'warning')
    
    if issues_found == 0:
        print_status("Security scan complete - no obvious issues found", 'success')
    else:
        print_status(f"Found {issues_found} potential security issues", 'warning')
    
    return issues_found == 0

def check_file_structure():
    """Verify required files exist"""
    print_status("Checking file structure...", 'info')
    
    required_files = [
        'app/voice_assistant_clean.py',
        'Frontend/legacy/Summitly_main.html',
        'services/openai_service.py',
        'requirements/requirements.txt',
        '.gitignore'
    ]
    
    base_path = os.path.join('/', 'Users', 'shreyashdanke', 'Desktop', 'Main', 'Summitly Backend')
    missing_files = []
    
    for file_path in required_files:
        full_path = os.path.join(base_path, file_path)
        if os.path.exists(full_path):
            print_status(f"✓ {file_path} exists", 'success')
        else:
            missing_files.append(file_path)
            print_status(f"✗ {file_path} missing", 'error')
    
    if missing_files:
        print_status(f"Missing files: {', '.join(missing_files)}", 'error')
        return False
    
    return True

def test_openai_integration():
    """Test OpenAI API connectivity"""
    print_status("Testing OpenAI integration...", 'info')
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print_status("OPENAI_API_KEY not set, skipping test", 'warning')
        return False
    
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        # Simple test request
        response = requests.get('https://api.openai.com/v1/models', headers=headers, timeout=10)
        
        if response.status_code == 200:
            print_status("OpenAI API connection successful", 'success')
            return True
        else:
            print_status(f"OpenAI API returned status {response.status_code}", 'error')
            return False
            
    except Exception as e:
        print_status(f"OpenAI API test failed: {e}", 'error')
        return False

def main():
    """Main validation function"""
    print(f"\n{Colors.PURPLE}{Colors.BOLD}")
    print("🚀 SUMMITLY AI - PRODUCTION DEPLOYMENT VALIDATOR")
    print("=" * 60)
    print(f"{Colors.END}\n")
    
    print_status("Starting production readiness validation", 'info')
    
    # Run all checks
    checks = [
        ("Environment Variables", check_environment_variables),
        ("Security Issues", check_security_issues), 
        ("File Structure", check_file_structure),
        ("OpenAI Integration", test_openai_integration)
    ]
    
    results = {}
    for check_name, check_func in checks:
        print(f"\n{Colors.BLUE}{'='*40}{Colors.END}")
        print_status(f"Running {check_name} check", 'info')
        results[check_name] = check_func()
        print(f"{Colors.BLUE}{'='*40}{Colors.END}")
    
    # Summary
    print(f"\n{Colors.BOLD}{Colors.PURPLE}📊 VALIDATION SUMMARY{Colors.END}\n")
    
    passed = sum(results.values())
    total = len(results)
    
    for check_name, passed in results.items():
        status = 'success' if passed else 'error'
        print_status(f"{check_name}: {'PASSED' if passed else 'FAILED'}", status)
    
    print(f"\n{Colors.BOLD}Overall Result: {passed}/{total} checks passed{Colors.END}")
    
    if passed == total:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 DEPLOYMENT READY!{Colors.END}")
        print(f"{Colors.GREEN}Your Summitly AI system is ready for production deployment.{Colors.END}")
        return True
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}⚠️  ISSUES FOUND{Colors.END}")
        print(f"{Colors.RED}Please fix the issues above before deploying.{Colors.END}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)