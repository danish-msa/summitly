#!/usr/bin/env python3
"""
Setup script for Exa AI integration
Run this script to install and configure Exa AI for real-time property data
"""

import os
import sys
import subprocess

def install_exa():
    """Install exa_py package"""
    print("🔧 Installing Exa AI package...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "exa_py"])
        print("✅ Exa AI package installed successfully!")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install exa_py. Please run: pip install exa_py")
        return False

def setup_environment():
    """Help user set up environment variables"""
    print("\n🔑 Setting up Exa AI API Key...")
    print("1. Get your Exa API key from: https://exa.ai/")
    print("2. Set the environment variable:")
    print("   - On macOS/Linux: export EXA_API_KEY='your-api-key-here'")
    print("   - On Windows: set EXA_API_KEY=your-api-key-here")
    print("   - Or add it to your .env file: EXA_API_KEY=your-api-key-here")
    
    api_key = input("\n📝 Enter your Exa API key (or press Enter to skip): ").strip()
    
    if api_key:
        # Try to create/update .env file
        env_file = os.path.join(os.path.dirname(__file__), '.env')
        try:
            # Read existing .env content
            existing_content = ""
            if os.path.exists(env_file):
                with open(env_file, 'r') as f:
                    existing_content = f.read()
            
            # Add or update EXA_API_KEY
            lines = existing_content.split('\n')
            exa_key_found = False
            
            for i, line in enumerate(lines):
                if line.startswith('EXA_API_KEY='):
                    lines[i] = f'EXA_API_KEY={api_key}'
                    exa_key_found = True
                    break
            
            if not exa_key_found:
                lines.append(f'EXA_API_KEY={api_key}')
            
            # Write back to .env file
            with open(env_file, 'w') as f:
                f.write('\n'.join(lines))
            
            print(f"✅ API key saved to {env_file}")
            
            # Set environment variable for current session
            os.environ['EXA_API_KEY'] = api_key
            print("✅ Environment variable set for current session")
            
        except Exception as e:
            print(f"⚠️ Could not save to .env file: {e}")
            print(f"Please manually set: export EXA_API_KEY='{api_key}'")
    else:
        print("⏭️ Skipped API key setup. Remember to set EXA_API_KEY environment variable!")

def test_exa_connection():
    """Test Exa AI connection"""
    print("\n🧪 Testing Exa AI connection...")
    try:
        from exa_py import Exa
        
        api_key = os.environ.get('EXA_API_KEY')
        if not api_key:
            print("❌ EXA_API_KEY not found. Please set your API key first.")
            return False
        
        exa = Exa(api_key)
        
        # Test search
        results = exa.search_and_contents(
            "Toronto real estate market test",
            num_results=1,
            text=True
        )
        
        if results and results.results:
            print("✅ Exa AI connection successful!")
            print(f"   Test search returned {len(results.results)} result(s)")
            return True
        else:
            print("⚠️ Exa AI connected but no results returned")
            return True
            
    except ImportError:
        print("❌ exa_py not installed. Run: pip install exa_py")
        return False
    except Exception as e:
        print(f"❌ Exa AI connection failed: {e}")
        return False

def main():
    print("🏠 Exa AI Real Estate Integration Setup")
    print("=" * 50)
    
    # Step 1: Install package
    if not install_exa():
        return
    
    # Step 2: Setup environment
    setup_environment()
    
    # Step 3: Test connection
    if test_exa_connection():
        print("\n🎉 Exa AI integration setup complete!")
        print("\nFeatures now available:")
        print("• Real-time property listings search")
        print("• Current market trends and data")
        print("• Neighborhood information and statistics")
        print("• School ratings and area insights")
        print("• Recent sales data and comparisons")
        
        print("\nAPI Endpoints:")
        print("• /api/exa-search - Direct Exa AI search")
        print("• /api/intelligent-chat-sync - Enhanced with real-time data")
        
        print("\nUsage Examples:")
        print('• "What are Toronto condo prices?"')
        print('• "Show me market trends in Vancouver"')
        print('• "Tell me about downtown Calgary neighborhoods"')
        print('• "Are Toronto housing prices going up?"')
        
    else:
        print("\n❌ Setup incomplete. Please check your API key and try again.")

if __name__ == "__main__":
    main()