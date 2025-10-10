#!/bin/bash
# Simple test runner that starts dev server and runs tests

echo "🚀 Starting development server..."
npm run dev &
DEV_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
sleep 5

# Check if server is running
if curl -s http://localhost:3001/ui/ > /dev/null; then
    echo "✅ Server is ready!"
    
    # Run tests
    echo "🧪 Running Playwright tests..."
    npx playwright test "$@"
    TEST_EXIT=$?
    
    # Cleanup
    echo "🧹 Stopping dev server..."
    kill $DEV_PID 2>/dev/null
    
    exit $TEST_EXIT
else
    echo "❌ Server failed to start"
    kill $DEV_PID 2>/dev/null
    exit 1
fi
