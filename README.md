# Wish.ly - Telegram Mini App

A comprehensive wishlist management application built specifically for Telegram, featuring affiliate link automation, Secret Santa, crowdfunding, birthday reminders, and more.

## Features

### Core Features
- **Multiple Wishlists**: Create and manage multiple wishlists
- **Easy Item Addition**: Simply paste a URL and the app automatically:
  - Parses product information
  - Detects affiliate programs
  - Applies your referral links automatically
- **Affiliate Link Automation**: Automatically detects and applies affiliate links for:
  - Amazon
  - eBay
  - Etsy
  - Shopify stores
  - AliExpress
  - ASOS
  - Zara
  - And more...

### Social Features
- **Secret Santa**: Organize Secret Santa gift exchanges with friends
- **Birthday Reminders**: Automatically reminds friends 1 week before birthdays (uses Telegram profile data)
- **Friend System**: Add friends and view their wishlists
- **Easy Sharing**: One-click sharing of wishlist profiles

### Advanced Features
- **Crowdfunding**: Enable crowdfunding for expensive items - friends can contribute together
- **Referral System**: Get bonus points for referring friends
- **Freemium Model**: Free tier with premium features available
- **Item Status Tracking**: Track available, reserved, and purchased items

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Routing**: React Router
- **Styling**: CSS with Telegram theme variables
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Telegram Bot Token (for backend integration)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wishly
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
VITE_API_URL=http://localhost:3001/api
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Project Structure

```
wishly/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── pages/            # Page components
│   │   ├── HomePage.tsx
│   │   ├── WishlistsPage.tsx
│   │   ├── WishlistDetailPage.tsx
│   │   ├── AddItemPage.tsx
│   │   ├── SecretSantaPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── FriendsPage.tsx
│   │   └── CrowdfundingPage.tsx
│   ├── services/         # API services
│   │   └── api.ts
│   ├── store/            # State management
│   │   └── useStore.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── utils/            # Utility functions
│   │   ├── telegram.ts
│   │   └── affiliate.ts
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Backend Requirements

This frontend requires a backend API with the following endpoints:

### User Endpoints
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/user/friends` - Add friend
- `DELETE /api/user/friends/:id` - Remove friend
- `GET /api/user/referral-code` - Get referral code
- `POST /api/user/apply-referral` - Apply referral code

### Wishlist Endpoints
- `GET /api/wishlists` - Get all wishlists
- `GET /api/wishlists/:id` - Get wishlist by ID
- `POST /api/wishlists` - Create wishlist
- `PUT /api/wishlists/:id` - Update wishlist
- `DELETE /api/wishlists/:id` - Delete wishlist
- `GET /api/wishlists/:id/share` - Get share link

### Item Endpoints
- `POST /api/wishlists/:id/items` - Add item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `POST /api/items/:id/reserve` - Reserve item
- `POST /api/items/:id/purchase` - Mark as purchased
- `POST /api/items/:id/crowdfunding` - Create crowdfunding
- `POST /api/items/:id/crowdfunding/contribute` - Contribute to crowdfunding

### Other Endpoints
- `POST /api/url/process` - Process URL and get affiliate link
- `GET /api/secret-santa` - Get all Secret Santa events
- `POST /api/secret-santa` - Create Secret Santa
- `POST /api/secret-santa/:id/join` - Join Secret Santa
- `POST /api/secret-santa/:id/draw` - Draw names
- `GET /api/birthdays/reminders` - Get birthday reminders

## Telegram Integration

The app uses Telegram WebApp SDK for:
- User authentication
- Theme adaptation
- Haptic feedback
- Native sharing
- Back button handling

## Affiliate Link System

The app automatically:
1. Parses product URLs
2. Detects known affiliate programs
3. Applies your referral IDs
4. Returns the affiliate link

To configure your affiliate IDs, update the `AFFILIATE_PROGRAMS` array in `src/utils/affiliate.ts`.

## Premium Features

Premium users get:
- Unlimited wishlists
- Custom themes
- Advanced analytics
- Priority support
- Early access to new features
- Ad-free experience

## Development

### Code Style
- TypeScript strict mode enabled
- ESLint configured
- Component-based architecture
- Functional components with hooks

### Adding New Features

1. Create types in `src/types/index.ts`
2. Add API methods in `src/services/api.ts`
3. Update store in `src/store/useStore.ts`
4. Create page/component in `src/pages/` or `src/components/`
5. Add route in `src/App.tsx`

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

