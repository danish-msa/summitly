#!/usr/bin/env python3
"""
🚀 Summitly AI Production Deployment Validator
Validates that the system is ready for Render deployment
"""

import os
import sys

def check_essential_files():
    """Check that all essential files exist"""
    essential_files = [
        'app/voice_assistant_clean.py',
        'requirements/requirements.prod.txt',
        'Dockerfile',
        '.gitignore',
        'Frontend/legacy/Summitly_main.html',
        'RENDER_DEPLOYMENT_GUIDE.md',
        'README.md',
        '.env.example'
    ]
    
    print("✅ Checking Essential Files:")
    all_exist = True
    
    for file_path in essential_files:
        if os.path.exists(file_path):
            print(f"   ✓ {file_path}")
        else:
            print(f"   ❌ Missing: {file_path}")
            all_exist = False
    
    return all_exist

def check_file_structure():
    """Check that the project structure is correct"""
    required_dirs = [
        'app',
        'services',
        'endpoints',
        'Frontend/legacy',
        'config',
        'requirements',
        'logs',
        'temp_audio'
    ]
    
    print("✅ Checking Directory Structure:")
    all_exist = True
    
    for dir_path in required_dirs:
        if os.path.exists(dir_path):
            print(f"   ✓ {dir_path}/")
        else:
            print(f"   ❌ Missing: {dir_path}/")
            all_exist = False
    
    return all_exist

def check_deployment_config():
    """Check deployment configuration"""
    print("✅ Checking Deployment Configuration:")
    
    # Check Dockerfile
    if os.path.exists('Dockerfile'):
        with open('Dockerfile', 'r') as f:
            dockerfile_content = f.read()
            if 'requirements.prod.txt' in dockerfile_content:
                print("   ✓ Dockerfile uses production requirements")
            else:
                print("   ⚠️  Dockerfile should use requirements.prod.txt")
                return False
            
            if 'gunicorn' in dockerfile_content:
                print("   ✓ Dockerfile configured for production server")
            else:
                print("   ❌ Dockerfile missing production server config")
                return False
    
    # Check .env.example
    if os.path.exists('.env.example'):
        print("   ✓ Environment template exists")
    else:
        print("   ❌ Missing .env.example file")
        return False
    
    return True

def main():
    print("\n🚀 SUMMITLY AI - PRODUCTION READINESS CHECK")
    print("=" * 60)
    
    # Change to the correct directory
    os.chdir('/Users/shreyashdanke/Desktop/Main/Summitly Backend')
    
    checks = [
        ("Essential Files", check_essential_files),
        ("Directory Structure", check_file_structure),
        ("Deployment Config", check_deployment_config)
    ]
    
    all_passed = True
    results = []
    
    for check_name, check_func in checks:
        print(f"\n🔍 Running {check_name} check...")
        result = check_func()
        results.append((check_name, result))
        if not result:
            all_passed = False
    
    print("\n📊 VALIDATION SUMMARY")
    print("=" * 30)
    
    for check_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{check_name}: {status}")
    
    if all_passed:
        print("\n🎉 ALL CHECKS PASSED - READY FOR DEPLOYMENT!")
        print("\nNext steps:")
        print("1. Initialize git repository")
        print("2. Commit all files")
        print("3. Push to GitHub")
        print("4. Deploy to Render using the repository URL")
        return 0
    else:
        print("\n⚠️  SOME CHECKS FAILED - REVIEW ISSUES ABOVE")
        return 1

if __name__ == "__main__":
    sys.exit(main())