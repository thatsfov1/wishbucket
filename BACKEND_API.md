# Backend API Documentation

This document outlines the backend API requirements for the Wish.ly Telegram Mini App.

## Base URL

All endpoints should be prefixed with `/api`

## Authentication

All requests should include the Telegram User ID in the `X-User-Id` header.

## Endpoints

### User Profile

#### GET /user/profile

Get the current user's profile.

**Response:**

```json
{
  "userId": 123456789,
  "telegramUser": {
    "id": 123456789,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe"
  },
  "birthday": "1990-01-15",
  "friends": [987654321, 111222333],
  "referralCode": "ABC123",
  "referrals": 5,
  "premiumStatus": "free",
  "premiumExpiresAt": null,
  "bonusPoints": 250,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### PUT /user/profile

Update user profile.

**Request Body:**

```json
{
  "birthday": "1990-01-15"
}
```

#### POST /user/friends

Add a friend.

**Request Body:**

```json
{
  "friendId": 987654321
}
```

#### DELETE /user/friends/:friendId

Remove a friend.

#### GET /user/referral-code

Get user's referral code.

**Response:**

```json
{
  "code": "ABC123"
}
```

#### POST /user/apply-referral

Apply a referral code.

**Request Body:**

```json
{
  "code": "ABC123"
}
```

### Wishlists

#### GET /wishlists

Get all wishlists for the current user.

**Response:**

```json
[
  {
    "id": "wl_123",
    "userId": 123456789,
    "name": "Birthday Wishlist",
    "description": "Things I want for my birthday",
    "isPublic": true,
    "isDefault": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "items": []
  }
]
```

#### GET /wishlists/:id

Get a specific wishlist.

#### POST /wishlists

Create a new wishlist.

**Request Body:**

```json
{
  "name": "Birthday Wishlist",
  "description": "Things I want for my birthday",
  "isPublic": true,
  "isDefault": false
}
```

#### PUT /wishlists/:id

Update a wishlist.

#### DELETE /wishlists/:id

Delete a wishlist.

#### GET /wishlists/:id/share

Get shareable link for a wishlist.

**Response:**

```json
{
  "link": "https://t.me/wishly_bot/wishlist?wl_123"
}
```

### Items

#### POST /wishlists/:wishlistId/items

Add an item to a wishlist.

**Request Body:**

```json
{
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone",
  "url": "https://example.com/product",
  "originalUrl": "https://example.com/product",
  "affiliateUrl": "https://example.com/product?ref=ABC123",
  "imageUrl": "https://example.com/image.jpg",
  "price": 999.99,
  "currency": "USD",
  "priority": "high",
  "status": "available"
}
```

#### PUT /items/:id

Update an item.

#### DELETE /items/:id

Delete an item.

#### POST /items/:id/reserve

Reserve an item (mark as reserved by current user).

#### POST /items/:id/purchase

Mark an item as purchased.

#### POST /items/:id/crowdfunding

Create a crowdfunding campaign for an item.

**Request Body:**

```json
{
  "targetAmount": 999.99
}
```

#### POST /items/:id/crowdfunding/contribute

Contribute to a crowdfunding campaign.

**Request Body:**

```json
{
  "amount": 50.0
}
```

### URL Processing

#### POST /url/process

Process a URL to extract product info and apply affiliate links.

**Request Body:**

```json
{
  "url": "https://example.com/product"
}
```

**Response:**

```json
{
  "url": "https://example.com/product",
  "affiliateUrl": "https://example.com/product?ref=ABC123",
  "hasAffiliate": true,
  "programName": "Amazon Associates",
  "productInfo": {
    "title": "iPhone 15 Pro",
    "imageUrl": "https://example.com/image.jpg",
    "price": 999.99,
    "currency": "USD"
  }
}
```

**Implementation Notes:**

- Parse the URL to extract domain
- Check if domain has an affiliate program
- If yes, apply your referral ID
- Optionally scrape the page for product information (title, image, price)
- Return both original and affiliate URLs

### Secret Santa

#### GET /secret-santa

Get all Secret Santa events for the current user.

**Response:**

```json
[
  {
    "id": "ss_123",
    "organizerId": 123456789,
    "name": "Christmas 2024",
    "description": "Office Secret Santa",
    "participants": [
      {
        "userId": 123456789,
        "wishlistId": "wl_123",
        "assignedTo": 987654321,
        "hasDrawn": true
      }
    ],
    "budget": 50.0,
    "exchangeDate": "2024-12-25",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /secret-santa

Create a new Secret Santa event.

**Request Body:**

```json
{
  "name": "Christmas 2024",
  "description": "Office Secret Santa",
  "budget": 50.0,
  "exchangeDate": "2024-12-25"
}
```

#### POST /secret-santa/:id/join

Join a Secret Santa event.

#### POST /secret-santa/:id/draw

Draw names for Secret Santa (randomly assign participants).

### Birthday Reminders

#### GET /birthdays/reminders

Get upcoming birthday reminders for friends.

**Response:**

```json
[
  {
    "userId": 123456789,
    "friendId": 987654321,
    "friendName": "Jane Doe",
    "birthday": "1990-06-15",
    "daysUntil": 7,
    "notified": false
  }
]
```

**Implementation Notes:**

- Get all friends
- For each friend, get their birthday from their profile
- Calculate days until birthday
- Return friends with birthdays in the next 7 days
- Mark as notified after sending reminder

## Database Schema Suggestions

### Users Table

- userId (primary key)
- telegramUser (JSON)
- birthday
- referralCode
- referrals
- premiumStatus
- premiumExpiresAt
- bonusPoints
- createdAt

### Friends Table

- userId (foreign key)
- friendId (foreign key)
- createdAt

### Wishlists Table

- id (primary key)
- userId (foreign key)
- name
- description
- isPublic
- isDefault
- createdAt
- updatedAt

### Items Table

- id (primary key)
- wishlistId (foreign key)
- name
- description
- url
- originalUrl
- affiliateUrl
- imageUrl
- price
- currency
- priority
- status
- reservedBy (foreign key, nullable)
- purchasedBy (foreign key, nullable)
- createdAt
- updatedAt

### Crowdfunding Table

- id (primary key)
- itemId (foreign key)
- targetAmount
- currentAmount
- isActive
- createdAt

### Contributors Table

- id (primary key)
- crowdfundingId (foreign key)
- userId (foreign key)
- amount
- contributedAt

### SecretSanta Table

- id (primary key)
- organizerId (foreign key)
- name
- description
- budget
- exchangeDate
- isActive
- createdAt

### SecretSantaParticipants Table

- id (primary key)
- secretSantaId (foreign key)
- userId (foreign key)
- wishlistId (foreign key, nullable)
- assignedTo (foreign key, nullable)
- hasDrawn

## Error Handling

All errors should return a JSON response with:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting

Consider implementing rate limiting for:

- URL processing endpoint
- Referral code application
- Friend addition

## Security Considerations

1. Validate all user inputs
2. Sanitize URLs before processing
3. Verify Telegram user authentication
4. Implement CORS properly
5. Use HTTPS in production
6. Validate affiliate program domains
7. Rate limit affiliate link generation
