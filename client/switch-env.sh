#!/bin/bash
# Development environment switcher script

echo "🔧 Nexa Development Environment Setup"
echo "======================================"

# Check if we're in the client directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the client directory"
    exit 1
fi

echo ""
echo "Select your development environment:"
echo "1) Local development (backend on localhost:5002)"
echo "2) Production testing (backend on nexa-v1.onrender.com)"
echo "3) Show current configuration"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "REACT_APP_API_URL=http://localhost:5002/api" > .env.local
        echo "✅ Switched to LOCAL development mode"
        echo "📍 API calls will go to: http://localhost:5002/api"
        echo "🚀 Make sure your local server is running on port 5002"
        ;;
    2)
        echo "REACT_APP_API_URL=https://nexa-v1.onrender.com/api" > .env.local
        echo "✅ Switched to PRODUCTION testing mode"
        echo "📍 API calls will go to: https://nexa-v1.onrender.com/api"
        echo "🌐 Testing against live production backend"
        ;;
    3)
        if [ -f ".env.local" ]; then
            echo "📋 Current configuration:"
            cat .env.local
        else
            echo "📋 No local configuration found (.env.local doesn't exist)"
            echo "🔄 Will use default from .env.development: http://localhost:5002/api"
        fi
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "💡 Remember to restart your development server for changes to take effect!"
echo "   Run: npm start"
