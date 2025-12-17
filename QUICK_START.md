# Quick Start Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm**, **yarn**, or **pnpm**
3. **Telegram Bot** (create one via [@BotFather](https://t.me/BotFather))

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001/api
```

**Note:** You'll need to set up a backend API server. See `BACKEND_API.md` for API requirements.

### 3. Configure Affiliate Programs

Edit `src/utils/affiliate.ts` and update the `AFFILIATE_PROGRAMS` array with your actual referral IDs:

```typescript
const AFFILIATE_PROGRAMS: AffiliateProgram[] = [
  {
    domain: "amazon.com",
    programName: "Amazon Associates",
    referralParam: "tag",
    referralId: "YOUR_ACTUAL_AMAZON_TAG", // Replace this!
    isActive: true,
  },
  // ... add more programs
];
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 5. Test in Telegram

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather)
2. Set the bot's web app URL to your development server (use ngrok or similar for local testing)
3. Open the bot in Telegram and click the "Open App" button

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory. Deploy these to a static hosting service (Vercel, Netlify, etc.) and update your Telegram bot's web app URL.

## Backend Setup

You'll need to implement a backend API. The frontend expects the following:

- RESTful API endpoints (see `BACKEND_API.md`)
- User authentication via Telegram User ID
- Database to store wishlists, items, users, etc.
- URL processing service for affiliate links
- Product information scraping (optional but recommended)

### Backend Technology Options

- **Node.js/Express** - Easy integration with Telegram
- **Python/FastAPI** - Good for web scraping
- **Go/Gin** - High performance
- **Ruby on Rails** - Rapid development

## Key Features to Implement

### 1. Affiliate Link Processing

The backend should:

- Parse incoming URLs
- Detect affiliate programs
- Apply your referral IDs
- Optionally scrape product information

### 2. Birthday Reminders

- Store user birthdays
- Calculate days until birthday
- Send notifications 1 week before
- Use Telegram Bot API for notifications

### 3. Secret Santa

- Random assignment algorithm
- Prevent self-assignment
- Track who has drawn names

### 4. Crowdfunding

- Track contributions
- Calculate progress
- Handle multiple contributors
- Update when goal is reached

## Testing Checklist

- [ ] User can create wishlists
- [ ] User can add items with URLs
- [ ] Affiliate links are applied correctly
- [ ] Secret Santa creation and drawing works
- [ ] Birthday reminders appear correctly
- [ ] Crowdfunding contributions work
- [ ] Referral codes can be applied
- [ ] Sharing links work
- [ ] Friends can be added/removed

## Common Issues

### Telegram WebApp not loading

- Make sure you're accessing via Telegram, not a browser
- Check that the web app URL is correctly set in BotFather
- Verify HTTPS is enabled (required for production)

### API errors

- Check that backend is running
- Verify `VITE_API_URL` is correct
- Check CORS settings on backend
- Verify `X-User-Id` header is being sent

### Affiliate links not working

- Verify referral IDs are set in `affiliate.ts`
- Check that backend URL processing is working
- Test affiliate link generation manually

## Next Steps

1. Set up backend API
2. Configure database
3. Implement URL processing
4. Set up Telegram bot
5. Deploy frontend
6. Test all features
7. Configure affiliate programs
8. Launch! 🚀

## Support

For issues or questions, check:

- `README.md` - General documentation
- `BACKEND_API.md` - API requirements
- Telegram Bot API docs: https://core.telegram.org/bots/api
- Telegram WebApp docs: https://core.telegram.org/bots/webapps
