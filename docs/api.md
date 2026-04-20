# Moamelat Trading Platform - API Documentation

## Overview
Build a modern, responsive frontend for a gold trading platform. The platform allows traders to:
- Authenticate via phone/password
- View real-time gold prices
- Open/close trades (buy/sell gold)
- Manage TP/SL (Take Profit/Stop Loss)
- View trade history
- Manage pending orders
- Deposit/withdraw funds
- KYC verification

## Base URL
```
Production: https://api.moamelat.com
Development: http://localhost:3000
```

## Authentication
All protected routes require `x-token` header:
```
x-token: {trader_id}:{random_hash}
```

---

## TypeScript Client (`MoamelatClient`)

### Quick Start
```typescript
import { MoamelatClient } from "./src/client";

const client = new MoamelatClient({
  baseUrl: "https://api.moamelat.com",
});

// Listen to auth events
client.on("login", (data) => {
  console.log("Logged in as", data.trader.nickname);
});

client.on("profileChange", ({ previous, current }) => {
  console.log("Margin updated from", previous?.margin, "to", current.margin);
});

client.on("invalidToken", (error) => {
  console.warn("Session expired", error.message);
});

// Login
await client.loginByIdentifier("09123456789", "password123");
```

### Constructor Options
```typescript
interface ClientOptions {
  baseUrl?: string;                    // default: https://api.moamelat.com
  token?: string;                      // initial token
  maxRetries?: number;                 // default: 3
  retryDelayMs?: number;               // default: 1000
  persistAuth?: boolean;               // default: true
  autoRefreshProfile?: boolean;        // default: true
  profileRefreshIntervalMs?: number;   // default: 60000 (1 minute)
  storage?: StorageAdapter;            // custom storage override
  storageKeyPrefix?: string;           // default: "moamelat"
}
```

### Persistent Authentication
By default, the client automatically persists the token, trader info, and cached profile so the session survives page reloads.

- **Browser**: uses `localStorage` when available.
- **Node.js / test environments**: falls back to an in-memory adapter.

You can provide a custom `StorageAdapter`:
```typescript
import { MoamelatClient, StorageAdapter } from "./src/client";

const myStorage: StorageAdapter = {
  getItem: (key) => /* ... */,
  setItem: (key, value) => /* ... */,
  removeItem: (key) => /* ... */,
};

const client = new MoamelatClient({ storage: myStorage });
```

### Events
Subscribe to lifecycle events with `.on(event, listener)`. The returned function unsubscribes the listener.

| Event            | Payload                                    | Description                                      |
|------------------|--------------------------------------------|--------------------------------------------------|
| `login`          | `LoginResponse`                            | Emitted after a successful login.                |
| `logout`         | `void`                                     | Emitted after logout.                            |
| `invalidToken`   | `ApiError`                                 | Emitted when a request returns `401`/`403` or a token-related error. |
| `authChange`     | `AuthState`                                | Emitted whenever token/trader/profile changes.   |
| `profileChange`  | `{ previous: ProfileResponse \| null, current: ProfileResponse }` | Emitted when the background profile refresh detects a change. |

```typescript
const unsubscribe = client.on("authChange", (state) => {
  console.log("Authenticated:", state.token != null);
});

// Later...
unsubscribe();
```

### Auth State Helpers
```typescript
client.isAuthenticated();      // boolean
client.getToken();             // string | null
client.getTrader();            // LoginResponse['trader'] | null
client.getCachedProfile();     // ProfileResponse | null
client.getAuthState();         // { token, trader, profile }
```

### Profile Auto-Refresh
When `autoRefreshProfile` is `true` (default), the client:
1. Immediately fetches `/trader/profile` after login and caches it.
2. Starts a background timer (default every 60 seconds) to keep the profile updated.
3. Emits `profileChange` **only** when the profile data actually differs from the cached version.
4. Stops the timer on logout or when the token becomes invalid.

---

## API Endpoints

### 1. Authentication (`/auth`)

#### 1.1 Login with Identifier
```
POST /auth/login
Content-Type: application/json

{
  "id": "09123456789",     // phone number or chat_id
  "password": "userpass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "123:abc123def456...",
    "trader": {
      "id": 123,
      "tell": "09123456789",
      "fullname": "John Doe",
      "nickname": "john_trader"
    }
  }
}
```

#### 1.2 Login with Username
```
POST /auth/login
Content-Type: application/json

{
  "id": "john_trader",     // username mapped to id internally
  "password": "userpass123"
}
```

#### 1.3 Send Verification Code
```
POST /auth/send-code
Content-Type: application/json

{
  "tell": "09123456789",
  "chat_id": "987654321",
  "type": "set_password"   // set_password | reset_password
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mobile": "0912***6789",
    "trader_id": 123
  }
}
```

#### 1.4 Set Password (with verification)
```
POST /auth/set-password
Content-Type: application/json

{
  "trader_id": 123,
  "password": "newpass123",
  "code": "12345"
}
```

#### 1.5 Request Change Password (Protected)
```
POST /auth/change-password/request
x-token: {token}
Content-Type: application/json

{
  "new_password": "newpass456"
}
```

#### 1.6 Change Password (Protected)
```
POST /auth/change-password
x-token: {token}
Content-Type: application/json

{
  "new_password": "newpass456",
  "code": "54321"
}
```

#### 1.7 Logout
```
POST /auth/logout
x-token: {token}
```

#### 1.8 Device Management
```
GET  /auth/devices
POST /auth/devices/delete
POST /auth/devices/delete-others
```

---

### 2. Trader Profile (`/trader`)

#### 2.1 Get Profile
```
GET /trader/profile
x-token: {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "tell": "09123456789",
    "nickname": "john_trader",
    "fullname": "John Doe",
    "margin": 1500.00,
    "leverage": 3,
    "commission": 0.5,
    "obligation_status": "none",
    "deposit_type": "irt",
    "unique_code": "1234",
    "sell_count": 45,
    "buy_count": 32,
    "sell_avg": 1850.50,
    "buy_avg": 1845.25,
    "call_margin_price": {
      "sell": 1200.00,
      "buy": 1100.00
    }
  }
}
```

#### 2.2 Get Open Trades
```
GET /order/open-trades
x-token: {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trades": [
      {
        "id": 456,
        "type": "buy",
        "amount": 5,
        "price": 1850.25,
        "remain_amount": 5,
        "pnl": 125.50
      }
    ],
    "totalPnl": 125.50,
    "buyCount": 32,
    "sellCount": 45,
    "buyAvg": 1845.25,
    "sellAvg": 1850.50,
    "currentBuyPrice": 1875.00,
    "currentSellPrice": 1870.00
  }
}
```

#### 2.3 Get Capacity
```
GET /order/capacity?rate={optional_price}
x-token: {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rate": 1875.00,
    "loss": 0,
    "freeMargin": 500.00,
    "leverage": 3,
    "buy": 150,
    "sell": 150
  }
}
```

#### 2.4 Get Referral Info
```
GET /trader/referral
x-token: {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "active": true,
    "referralCount": 5,
    "totalIncome": 250.00,
    "link": "https://t.me/bot?start=dGoxMzQ1Njc4OQ=="
  }
}
```

#### 2.5 Edit Nickname
```
POST /trader/edit-nickname
x-token: {token}
Content-Type: application/json

{
  "nickname": "new_nickname"
}
```

---

### 3. Trading (`/order`)

#### 3.1 Open Market Trade (Instant)
```
POST /order/trade
x-token: {token}
Content-Type: application/json

{
  "type": "buy",      // buy | sell
  "amount": 5         // 1-500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "result": {
      "trade_id": 789
    }
  }
}
```

**Error Codes:**
- `MARKET_CLOSED` - Market is deactivated
- `BOT_DISABLED` - Bot is deactivated
- `BROKER_CLOSED` - Broker is closed
- `RATE_LIMITED` - Too many requests (1 min cooldown)
- `ACCOUNT_CLOSE_ONLY` - Account can only close trades
- `INVALID_TYPE` - Type must be 'buy' or 'sell'
- `INVALID_AMOUNT` - Amount must be positive
- `AMOUNT_TOO_LARGE` - Max 500 per trade
- `INSUFFICIENT_CREDIT` - Not enough margin (includes allowed amount)
- `OPEN_TRADES_LIMIT` - Max open trades reached
- `TRADE_FAILED` - General failure

#### 3.2 Close Trade
```
POST /order/close
x-token: {token}
Content-Type: application/json

{
  "id": 456
}
```

#### 3.3 Close All Trades
```
POST /order/closeAll
x-token: {token}
Content-Type: application/json

{
  "type": "all"     // all | buy | sell | profit | loss
}
```

#### 3.4 Change Leverage
```
POST /trader/changeLeverage
x-token: {token}
Content-Type: application/json

{
  "leverage": 3     // 1-5 (or max_users_leverage)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "newLeverage": 3,
    "callMarginSell": 1200.00,
    "callMarginBuy": 1100.00
  }
}
```

---

### 4. TP/SL & Limit Orders (`/order`)

#### 4.1 Update TP/SL
```
POST /order/setTpSl
x-token: {token}
Content-Type: application/json

{
  "id": 456,
  "tp": 1900.00,     // 0 to remove
  "sl": 1800.00      // 0 to remove
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "action": "created"   // created | updated | deleted
  }
}
```

**Error Codes:**
- `TRADE_NOT_FOUND` - Trade doesn't exist or closed
- `NO_PRICE_AVAILABLE` - Real-time price unavailable
- `INVALID_DECIMAL` - Decimals must be multiple of 5
- `TP_TOO_CLOSE` - TP too close to current price
- `SL_TOO_CLOSE` - SL too close to current price
- `PENDING_DISABLED` - Pending orders disabled

#### 4.2 Create Limit Order
```
POST /order/pending
x-token: {token}
Content-Type: application/json

{
  "type": "buy",
  "amount": 5,
  "price": 1850.00,
  "tp": 1900.00,      // optional
  "sl": 1800.00       // optional
}
```

#### 4.3 Cancel Pending Order
```
POST /order/deleteOrder
x-token: {token}
Content-Type: application/json

{
  "id": 789
}
```

---

### 5. Trade History & Trading Data (`/order`)

#### 5.1 Get Trade History
```
GET /order/history?page=1&limit=20&type=buy&from_date=1711929600&to_date=1712016000
x-token: {token}
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `type` - Filter by type: `buy` | `sell`
- `from_date` - Unix timestamp
- `to_date` - Unix timestamp

**Response:**
```json
{
  "success": true,
  "data": {
    "trades": [
      {
        "id": 456,
        "type": "buy",
        "amount": 5,
        "price": "1850.25",
        "close_price": "1875.50",
        "time": 1712345678,
        "close_time": 1712432078,
        "pnl": "125.50",
        "commission_amount": "2.50"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

#### 5.2 Get Trading Data (Order Load)
```
GET /order/load
x-token: {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trader": {
      "id": 123,
      "tell": "09123456789",
      "nickname": "john",
      "margin": "1000.00",
      "leverage": 1,
      "open_trades": 2
    },
    "trades": [
      {
        "id": 456,
        "type": "buy",
        "amount": 5,
        "price": "1850.25",
        "remain_amount": 5,
        "time": 1712345678
      }
    ],
    "pendings": [
      {
        "id": 789,
        "type": "buy",
        "number": 3,
        "price": 1840,
        "status": "new"
      }
    ],
    "wsServerUrl": "wss://api.moamelat.com/ws",
    "chartToken": "token123",
    "chartLink": "https://chart.test"
  }
}
```

---

### 6. Accounting (`/accounting`)

#### 6.1 Get Services Status
Returns comprehensive deposit/withdraw status, time limits, schedules, rates, and balance for the authenticated trader.

```
GET /accounting/services-status
x-token: {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deposit": {
      "irt": {
        "active": true,
        "timeAllowed": true,
        "timeMessage": null
      },
      "usdt": { "active": true },
      "neodigi": { "active": false },
      "schedule": {
        "start": "08:00",
        "end": "22:00",
        "days": "1,2,3,4,5"
      }
    },
    "withdraw": {
      "irt": {
        "active": true,
        "timeAllowed": true,
        "timeMessage": null
      },
      "usdt": {
        "active": true,
        "timeAllowed": true,
        "timeMessage": null
      },
      "neodigi": { "active": false },
      "schedule_irt": {
        "start": "09:00",
        "end": "21:00",
        "days": "1,2,3,4,5"
      },
      "schedule_usdt": {
        "start": "00:00",
        "end": "24:00",
        "days": null
      }
    },
    "rates": {
      "dollar_sell": "980000",
      "dollar_buy": "978000"
    },
    "balance": {
      "margin": "1500.00",
      "usdt_available": 1300.00
    }
  }
}
```

#### 6.2 Get Margin/Balance
```
GET /accounting/margin
x-token: {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "margin": 1500.00,
    "leverage": 3
  }
}
```

#### 6.3 Get Transactions
```
GET /accounting/transactions?page=1&type=deposit
x-token: {token}
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `type` - Filter by type (optional)

#### 6.4 Get Deposit Constraints
```
GET /accounting/deposit/constraints
x-token: {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "used": 5000000,
    "limit": 50000000,
    "remain": 45000000,
    "countUsed": 2,
    "countLimit": 5,
    "countRemain": 3
  }
}
```

#### 6.5 Get Withdraw Constraints
```
GET /accounting/withdraw/constraints?cardnumber={optional}&withdrawType=irt
x-token: {token}
```

**Query Parameters:**
- `cardnumber` - Card number for card-level limits (optional)
- `withdrawType` - Type: `irt` | `usdt` (default: `irt`)

#### 6.6 Deposit IRT (Gateway)
Initiates a payment gateway deposit. The service checks time limits, payment status, KYC, pending verifications, deposit limits, and card validity.

```
POST /accounting/deposit/irt
x-token: {token}
Content-Type: application/json

{
  "amount": 1000000,
  "cardnumber": "6037991234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": 1234,
    "link": "https://gateway.example.com/pay/...",
    "amount": 1000000,
    "dollarSell": 980000,
    "commission": 1.02,
    "wage": 10000
  }
}
```

**Error Codes:**
- `TIME_LIMIT_DEPOSIT` - Outside deposit schedule
- `PAYMENT_DISABLED` - Deposit disabled (system or trader level)
- `KYC_REQUIRED` - KYC not completed
- `PENDING_VERIFY_EXISTS` - Awaiting verification of previous deposit
- `DEPOSIT_LIMIT_EXCEEDED` - Daily deposit limit exceeded
- `INVALID_CARD` - Card not found or not verified
- `PAYMENT_CREATE_FAILED` - Failed to create payment record
- `PAYMENT_GATEWAY_FAILED` - Gateway rejected the request

#### 6.7 Deposit IRT (Manual)
Submits a manual deposit with receipt image. The service checks time limits, payment status, KYC, and deposit limits.

```
POST /accounting/deposit/manual
x-token: {token}
Content-Type: application/json

{
  "amount": "1000000",
  "fishNumber": "TX123456",
  "image": "base64_or_url"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "settleId": 5678,
    "dollarRate": 980000,
    "usdtAmount": 1.02
  }
}
```

#### 6.8 Check Pending Deposit Verification
Checks if the trader has a pending deposit awaiting verification.

```
GET /accounting/deposit/pending-verify
x-token: {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasPending": false
  }
}
```

#### 6.9 Deposit USDT
Returns the USDT deposit wallet address for the trader. Generates address if not exists.

```
GET /accounting/deposit/usdt?network=trc20
x-token: {token}
```

**Query Parameters:**
- `network` - `trc20` | `bep20` (default: `trc20`)

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "TJxR4f8QV...",
    "network": "trc20"
  }
}
```

**Error Codes:**
- `INVALID_NETWORK` - Network not supported
- `USDT_DEPOSIT_DISABLED` - USDT deposit deactivated
- `KYC_REQUIRED` - KYC not completed
- `WALLET_CREATE_FAILED` - Failed to generate wallet address

#### 6.10 Deposit Neodigi
Returns Neodigi deposit info (unique code and fullname).

```
GET /accounting/deposit/neodigi
x-token: {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unique_code": "1234",
    "fullname": "John Doe"
  }
}
```

**Error Codes:**
- `NEODIGI_DEPOSIT_DISABLED` - Neodigi deposit deactivated (whitelisted traders bypass)

#### 6.11 Withdraw
Processes a withdrawal request. The service checks time limits, KYC, status flags, limits, open trade blocking, and card validation.

```
POST /accounting/withdraw
x-token: {token}
Content-Type: application/json

{
  "withdrawType": "irt",       // irt | usdt | neodigi
  "amount": 50.00,
  "cardnumber": "6037991234567890",   // required for irt
  "wallet": "TJxR4f8QV...",           // required for usdt
  "network": "trc20",                 // required for usdt
  "neodigiAccount": "12345",          // required for neodigi
  "neodigiName": "John Doe"           // required for neodigi
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "settleId": 9012,
    "margin": 1450.00,
    "callMarginSell": 1200.00,
    "callMarginBuy": 1100.00,
    "irtValue": 48900000,
    "wage": 50000
  }
}
```

**Error Codes:**
- `TIME_LIMIT_WITHDRAW` - Outside withdrawal schedule
- `KYC_REQUIRED` - KYC not completed
- `WITHDRAW_DISABLED` - IRT withdrawal disabled
- `USDT_WITHDRAW_DISABLED` - USDT withdrawal disabled
- `NEODIGI_WITHDRAW_DISABLED` - Neodigi withdrawal disabled
- `NEODIGI_INFO_REQUIRED` - Missing neodigi account/name
- `INVALID_AMOUNT` - Invalid amount
- `INVALID_NETWORK` - Invalid network for USDT
- `WALLET_REQUIRED` - Missing wallet address
- `WITHDRAW_LIMIT_EXCEEDED` - Daily withdrawal limit exceeded
- `INSUFFICIENT_MARGIN` - Amount exceeds margin
- `INSUFFICIENT_USDT_BALANCE` - Amount exceeds available USDT
- `WITHDRAW_OPEN_TRADE_DISABLED` - Withdrawal with open trades not allowed
- `BLOCKED_BY_OPEN_TRADES` - Amount blocked by open trades
- `CARD_REQUIRED` - Missing card number for IRT
- `INVALID_CARD` - Card not found or not verified

#### 6.12 Validate Wallet Address
Validates a wallet address format and checks if it's an internal (same-platform) address.

```
POST /accounting/wallet/validate
x-token: {token}
Content-Type: application/json

{
  "address": "TJxR4f8QV...",
  "network": "trc20"       // trc20 | bep20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "address": "TJxR4f8QV...",
    "network": "trc20"
  }
}
```

**Error Codes:**
- `400` - Invalid address format or internal address detected

---

### 7. KYC (`/kyc`)

#### 7.1 Get KYC Status
```
GET /kyc/status
x-token: {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "step2_pending_review",
    "level": "در انتظار بررسی احراز هویت سطح دوم",
    "isActive": false,
    "pendingLevel": "step2",
    "steps": {
      "step1": true,
      "step2": false,
      "step3": false
    }
  }
}
```

**Fields:**
- `status` - Current KYC status string (e.g. `step1_pending_review`, `step2_pending_review`, `approved`, `rejected`)
- `level` - Human-readable status description in Persian
- `isActive` - `true` when KYC is fully completed and approved
- `pendingLevel` - Which step is currently pending (`step1` | `step2` | `step3`); `null` means no KYC started yet
- `steps` - Completion state of each individual step

#### 7.2 Submit KYC Step 1 (Personal Info)
```
POST /kyc/step1
x-token: {token}
Content-Type: application/json

{
  "fullname": "John Doe",
  "nid": "0012345678",
  "mobile": "09123456789",
  "year": "1370",
  "month": "01",
  "day": "01"
}
```

#### 7.3 Submit KYC Step 2 (ID Card)
```
POST /kyc/step2
x-token: {token}
Content-Type: multipart/form-data

{
  "nidPic": <file>,
  "commitment": <file>
}
```

#### 7.4 Submit KYC Step 3 (Selfie)
```
POST /kyc/step3
x-token: {token}
Content-Type: multipart/form-data

{
  "commitmentSelfi": <file>
}
```

---

### 8. Cards (`/card`)

#### 8.1 List Cards
```
GET /card/list
x-token: {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cards": [
      {
        "id": 1,
        "bank": "Mellat",
        "number": "603799****7890",
        "shaba": "IR****1234567890",
        "status": "success"
      }
    ]
  }
}
```

#### 8.2 Add Card
```
POST /card/add
x-token: {token}
Content-Type: application/json

{
  "cardnumber": "6037991234567890"
}
```

#### 8.3 Delete Card
```
POST /card/delete
x-token: {token}
Content-Type: application/json

{
  "id": 1
}
```

---

## Real-Time Data

### WebSocket Connection
Connect to receive real-time price updates:

```javascript
const ws = new WebSocket('wss://api.moamelat.com/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data = { buy: 1875.00, sell: 1870.00, avg: 1872.50 }
};
```

### Redis Pub/Sub (Alternative)
Prices are published to Redis channel `ounce_rate`:
```json
{
  "rate_buy": "1875.00",
  "rate_sell": "1870.00",
  "price": "1872.50"
}
```

---

## Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "message": "ERROR_CODE",
  "data": {},
  "errors": {}
}
```

Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (invalid/expired token)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Frontend Requirements

### 1. Authentication Flow
- Login page with phone/chat_id + password
- Password setup flow with SMS verification
- Password reset flow
- Session management with token storage

### 2. Dashboard
- Real-time gold price display (buy/sell)
- Account summary (margin, PnL, leverage)
- Quick trade buttons (buy/sell)
- Open trades list with PnL

### 3. Trading Interface
- Open trade modal (type, amount)
- Close trade confirmation
- TP/SL management interface
- Trade history with filters and pagination

### 4. Account Management
- Profile editing (nickname)
- Leverage adjustment
- Referral link sharing

### 5. Financial Operations
- Deposit (IRT gateway, USDT)
- Withdraw (card selection, amount)
- Transaction history

### 6. KYC Verification
- Multi-step form
- Document upload
- Status tracking

### 7. Card Management
- Add/remove bank cards
- Card list display

---

## UI/UX Guidelines

### Design System
- Modern, clean interface
- RTL support for Persian/Farsi
- Responsive design (mobile-first)
- Dark/Light theme support

### Color Coding
- **Buy/Long**: Green (#22c55e)
- **Sell/Short**: Red (#ef4444)
- **Profit**: Green text
- **Loss**: Red text
- **Warning**: Yellow/Orange
- **Success**: Green

### Key Components
- Price ticker with live updates
- Trade cards with PnL indicators
- Action buttons with loading states
- Toast notifications for feedback
- Confirmation modals for destructive actions
- Form validation with Persian error messages

### Persian Number Formatting
Display all numbers in Persian numerals (1234567890 -> 1234567890) using a utility function.

---

## State Management

### Required State
```typescript
interface AppState {
  auth: {
    token: string | null;
    trader: Trader | null;
    isAuthenticated: boolean;
  };
  prices: {
    buy: number;
    sell: number;
    avg: number;
    lastUpdate: Date;
  };
  trades: {
    openTrades: Trade[];
    history: PaginatedResult<Trade>;
    pendingOrders: PendingOrder[];
  };
  account: {
    margin: number;
    transactions: PaginatedResult<Transaction>;
  };
  kyc: {
    status: KycStatus;
  };
  cards: Card[];
}
```

---

## Implementation Notes

1. **Token Storage**: The client handles this automatically via `persistAuth` (uses `localStorage` in browsers and memory fallback in Node.js)
2. **Profile Refresh**: The client auto-refreshes `/trader/profile` on a timer when `autoRefreshProfile` is enabled
3. **Error Handling**: Show Persian error messages from API
4. **Rate Limiting**: Handle 429 errors with retry logic
5. **Price Updates**: Reconnect WebSocket on disconnect
6. **Form Validation**: Validate on client before API calls
7. **Loading States**: Show spinners during API calls
8. **Optimistic Updates**: Update UI immediately, revert on error

---

## Tech Stack Recommendations

- **Framework**: React 18+ or Next.js 14+
- **State**: Zustand or React Query
- **UI**: TailwindCSS + shadcn/ui
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios or Fetch
- **WebSocket**: Native WebSocket or Socket.io
- **i18n**: next-intl or react-intl (Persian locale)
