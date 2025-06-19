#!/bin/bash

# Deployment script for Nexa Bilingual App

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Ensure we have the latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Install dependencies and build
echo "📦 Installing dependencies..."
cd client
npm install

echo "🔨 Building the application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    cd ..
    
    echo "🌐 Deploying to Vercel..."
    # Deploy to Vercel
    npx vercel --prod --confirm
    
    echo "🎉 Deployment completed!"
    echo "💡 Check your Vercel dashboard for the deployment status."
else
    echo "❌ Build failed! Please check the error messages above."
    exit 1
fi
