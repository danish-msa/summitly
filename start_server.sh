#!/bin/bash
# Start Flask server for Summitly Backend

cd "/Users/shreyashdanke/Desktop/Main/Summitly Backend"

echo "🔍 Checking for existing Flask processes..."
pkill -9 -f "voice_assistant_clean.py" 2>/dev/null && echo "   ✅ Killed existing process" || echo "   ℹ️  No existing process"

echo ""
echo "🚀 Starting Flask server..."
echo "   Port: 5050"
echo "   Logs: server.log"
echo ""

nohup python app/voice_assistant_clean.py > server.log 2>&1 &
SERVER_PID=$!

echo "   Process ID: $SERVER_PID"
echo ""
echo "⏳ Waiting for server to start..."

sleep 8

if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "   ✅ Server is running!"
    echo ""
    echo "📝 Recent logs:"
    tail -15 server.log
    echo ""
    echo "🔗 Server URL: http://localhost:5050"
    echo "🔗 GPT-4 Endpoint: http://localhost:5050/api/chat-gpt4"
    echo ""
    echo "🧪 To test:"
    echo "   python test_gpt4_endpoint.py"
    echo ""
    echo "📋 To view logs:"
    echo "   tail -f server.log"
    echo ""
else
    echo "   ❌ Server failed to start!"
    echo ""
    echo "📋 Error logs:"
    cat server.log
fi
