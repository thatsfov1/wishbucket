# How to Test Your App in Telegram

## The Problem

When you open the ngrok URL in a browser, you're just viewing the web version. To test it **inside Telegram**, you need to:

1. Configure your bot to use the ngrok URL
2. Open your bot in Telegram
3. Click the "Open App" button in the bot

## Step-by-Step Instructions

### Step 1: Start Your Dev Server

```bash
npm run dev
```

Keep this terminal running. The server should be on `http://localhost:3000`

### Step 2: Start ngrok (in a NEW terminal)

```bash
ngrok http 3000
```

You'll see something like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

**Copy the HTTPS URL** (the one starting with `https://`)

### Step 3: Configure Your Bot in BotFather

1. Open Telegram
2. Search for **@BotFather**
3. Send the command: `/newapp`
4. Select your bot from the list
5. Follow the prompts:
   - **App title**: `Wish.ly`
   - **Description**: `Your personal wishlist manager`
   - **Photo**: (optional, you can skip)
   - **Web App URL**: Paste your ngrok HTTPS URL here
     ```
     https://abc123.ngrok-free.app
     ```
   - **Short name**: `wishly` (or any unique name)

### Step 4: Test in Telegram

1. **Open your bot in Telegram** (search for your bot's username)
2. You should see a button at the bottom that says **"Open App"** or **"Launch"**
3. **Click that button** - the app will open inside Telegram!

## Important Notes

### ⚠️ Common Mistakes

1. **Don't just open the ngrok URL in a browser** - that's just the web version
2. **You MUST configure the bot first** - the URL needs to be set in BotFather
3. **Use the HTTPS URL** - Telegram requires HTTPS
4. **Access via your bot** - not directly via URL

### 🔄 When ngrok URL Changes

If you restart ngrok, you'll get a new URL. You need to:

1. Get the new ngrok URL
2. Go to BotFather
3. Send `/myapps`
4. Select your bot
5. Choose "Edit Web App URL"
6. Paste the new URL

### 🐛 Troubleshooting

**"Web App not available" error:**
- Make sure ngrok is running
- Make sure dev server is running
- Check that you used HTTPS URL in BotFather
- Try restarting both

**App loads but shows errors:**
- Check browser console (if accessible)
- Make sure backend API is configured
- Check `.env` file for correct API URL

**Can't see "Open App" button:**
- Make sure you configured the web app in BotFather
- Try restarting Telegram
- Make sure you're using the latest version of Telegram

## Quick Test

1. ✅ Dev server running: `npm run dev`
2. ✅ ngrok running: `ngrok http 3000`
3. ✅ Bot configured in BotFather with ngrok URL
4. ✅ Bot opened in Telegram
5. ✅ "Open App" button clicked
6. ✅ App opens inside Telegram!

## Visual Guide

```
Terminal 1: npm run dev          → Server on localhost:3000
Terminal 2: ngrok http 3000      → Creates https://xxx.ngrok-free.app
BotFather:  /newapp → Set URL    → Links bot to ngrok URL
Telegram:   Open bot → Click     → App opens in Telegram!
```

## Alternative: Static ngrok Domain (Paid)

If you have ngrok paid plan, you can use a static domain:

```bash
ngrok http 3000 --domain=wishly.ngrok.app
```

This way the URL never changes and you don't need to update BotFather each time.

