#!/bin/bash

# AOL Chat Room Setup Script
echo "🚀 Setting up AOL Chat Room..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env

    # Generate a random JWT secret
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)

    # Replace the default JWT secret in .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-super-secret-jwt-key-change-this-in-production/${JWT_SECRET}/g" .env
    else
        # Linux
        sed -i "s/your-super-secret-jwt-key-change-this-in-production/${JWT_SECRET}/g" .env
    fi

    echo "✅ Generated secure JWT secret"
else
    echo "⚠️  .env file already exists, skipping..."
fi

# Check if Docker is installed
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Docker detected, you can run with: docker-compose up --build"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    echo "🐳 Docker detected, you can run with: docker compose up --build"
else
    echo "📦 Docker not detected, setting up for local development..."

    # Check if Node.js is installed
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo "✅ Node.js detected: $NODE_VERSION"

        # Install server dependencies
        if [ -d "server" ]; then
            echo "📦 Installing server dependencies..."
            cd server && npm install && cd ..
        fi

        # Install client dependencies
        if [ -d "client" ]; then
            echo "📦 Installing client dependencies..."
            cd client && npm install && cd ..
        fi

        echo "🎉 Setup complete!"
        echo ""
        echo "To start the application:"
        echo "  1. Start the server: cd server && npm run dev"
        echo "  2. Start the client: cd client && npm run dev"
        echo "  3. Open http://localhost:3001 in your browser"

    else
        echo "❌ Node.js not detected. Please install Node.js 18+ first."
        echo "   Visit: https://nodejs.org/"
        exit 1
    fi
fi

echo ""
echo "🎮 AOL Chat Room is ready!"
echo "📖 Check the README.md for more information."

# Make the first user admin hint
echo ""
echo "💡 Tip: The first user to register will become the admin automatically!"
echo "🔧 You can modify settings in the .env file"