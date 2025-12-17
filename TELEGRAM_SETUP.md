# Telegram Mini App Setup Guide

This guide will help you test your Wish.ly app inside Telegram.

## Prerequisites

1. ✅ Telegram bot created via [@BotFather](https://t.me/BotFather)
2. ✅ ngrok installed
3. ✅ Development server running

## Step-by-Step Setup

### 1. Start Your Development Server

In one terminal, start your Vite dev server:

```bash
npm run dev
```

The server should be running on `http://localhost:3000`

### 2. Start ngrok Tunnel

In a **new terminal**, start ngrok:

```bash
ngrok http 3000
```

Or use the helper script:

```bash
chmod +x start-ngrok.sh
./start-ngrok.sh
```

You'll see output like:

```
Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:3000
```

**Important:** Copy the **HTTPS URL** (the one starting with `https://`)

### 3. Configure Bot in BotFather

1. Open Telegram and go to [@BotFather](https://t.me/BotFather)
2. Send `/newapp` command
3. Select your bot from the list
4. When asked for the app title, enter: `Wish.ly`
5. When asked for a short description, enter: `Your personal wishlist manager`
6. When asked for a photo, you can skip it or upload one
7. When asked for the **Web App URL**, paste your ngrok HTTPS URL:
   ```
   https://xxxx-xx-xx-xx-xx.ngrok-free.app
   ```
8. When asked for a short name, enter something like: `wishly` (must be unique)

### 4. Test in Telegram

1. Open your bot in Telegram (search for your bot's username)
2. Click the **"Open App"** or **"Launch"** button (usually at the bottom of the chat)
3. The app should open inside Telegram!

## Troubleshooting

### App shows "Web App not available"

- Make sure ngrok is running and the URL is correct
- Make sure your dev server is running on port 3000
- Check that you used the HTTPS URL (not HTTP) in BotFather
- Try restarting ngrok and updating the URL in BotFather

### App loads but shows errors

- Open browser DevTools (if possible) or check the terminal for errors
- Make sure the backend API URL is correct in `.env`
- Check that CORS is properly configured if you have a backend

### ngrok shows "This site can't be reached"

- Make sure your Vite dev server is running
- Check that ngrok is forwarding to port 3000
- Try restarting both the dev server and ngrok

### "Invalid Web App URL" in BotFather

- Make sure you're using the HTTPS URL from ngrok
- The URL must start with `https://`
- Make sure there are no trailing slashes
- Try using a fresh ngrok URL

## Quick Test Checklist

- [ ] Dev server running on `http://localhost:3000`
- [ ] ngrok tunnel active and showing HTTPS URL
- [ ] Bot configured in BotFather with ngrok URL
- [ ] Bot opened in Telegram
- [ ] "Open App" button clicked
- [ ] App loads inside Telegram

## Alternative: Using ngrok with Custom Domain

If you have a paid ngrok account, you can use a static domain:

```bash
ngrok http 3000 --domain=your-custom-domain.ngrok.app
```

This way, the URL won't change every time you restart ngrok.

## Production Deployment

For production, you'll need to:

1. Build your app: `npm run build`
2. Deploy to a hosting service (Vercel, Netlify, etc.)
3. Update the Web App URL in BotFather to your production URL
4. Make sure the URL uses HTTPS (required by Telegram)

## Notes

- **Free ngrok URLs change every time** you restart ngrok. You'll need to update BotFather each time.
- **ngrok free tier** has limitations (request limits, session timeouts)
- For **production**, use a proper hosting service with a static domain
- The app **must use HTTPS** - Telegram requires it for security

## Next Steps

Once the app is working in Telegram:

1. Test all features (wishlists, items, sharing, etc.)
2. Set up your backend API
3. Configure affiliate programs
4. Deploy to production
5. Share with friends! 🎉

