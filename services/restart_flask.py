#!/usr/bin/env python3
"""
Restart script for Flask app with Exa AI integration
"""
import os
import subprocess
import time
import signal

def kill_flask_processes():
    """Kill any existing Flask processes"""
    try:
        result = subprocess.run(['pgrep', '-f', 'voice_assistant_clean.py'], 
                              capture_output=True, text=True)
        if result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            for pid in pids:
                if pid:
                    print(f"Killing Flask process {pid}")
                    os.kill(int(pid), signal.SIGTERM)
                    time.sleep(1)
        else:
            print("No Flask processes found")
    except Exception as e:
        print(f"Error killing processes: {e}")

def start_flask_app():
    """Start the Flask app with environment loaded"""
    os.chdir('/Users/shreyashdanke/Desktop/Main/v3')
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Check if Exa is available
    exa_key = os.environ.get('EXA_API_KEY')
    print(f"EXA_API_KEY present: {bool(exa_key)}")
    
    if exa_key:
        print(f"API Key: {exa_key[:10]}...")
    
    # Test exa_py import
    try:
        import exa_py
        print("✅ exa_py package available")
    except ImportError:
        print("❌ exa_py package not found")
    
    print("Starting Flask app...")
    subprocess.run(['python', 'voice_assistant_clean.py'])

if __name__ == "__main__":
    print("🔄 Restarting Flask app with Exa AI integration...")
    kill_flask_processes()
    time.sleep(2)
    start_flask_app()                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            