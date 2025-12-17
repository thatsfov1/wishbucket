#!/bin/bash

# Start ngrok tunnel for Telegram Mini App
# This script starts ngrok and outputs the URL to use in BotFather

echo "🚀 Starting ngrok tunnel..."
echo ""

# Start ngrok on port 3000 (where Vite dev server runs)
ngrok http 3000

# After ngrok starts, you'll see a URL like:
# https://xxxx-xx-xx-xx-xx.ngrok-free.app
# Copy the HTTPS URL and use it in BotFather

