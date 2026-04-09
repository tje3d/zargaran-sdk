# zargaran-apiclient

TypeScript client for the [Moamelat Trading Platform](https://api.moamelat.com) — a gold trading API supporting authentication, real-time trading, TP/SL management, accounting, and KYC.

## Installation

```bash
npm install zargaran-apiclient
# or
bun install zargaran-apiclient
# or
yarn add zargaran-apiclient
# or
pnpm add zargaran-apiclient
```

## Quick Start

```typescript
import { MoamelatClient, ApiError } from "zargaran-apiclient";

const client = new MoamelatClient({
  baseUrl: "https://api.moamelat.com",
});

// Login
const { data: loginData } = await client.loginByIdentifier("09123456789", "password");
client.setToken(loginData.token);

// Get profile
const { data: profile } = await client.getProfile();
console.log(profile.fullname, profile.margin);

// Open a trade
const { data: trade } = await client.openTrade("buy", 5);
console.log("Trade ID:", trade.result.trade_id);
```

## API Reference

### Authentication

| Method | Description |
|---|---|
| `getTrader(identifier)` | Check if trader exists |
| `loginByIdentifier(id, password)` | Login with phone/chat_id |
| `loginByUsername(username, password)` | Login with username |
| `sendCode(traderId, type)` | Send verification code |
| `verifyCode(traderId, code, type)` | Verify SMS code |
| `setPassword(traderId, password, code)` | Set password after verification |
| `requestChangePassword(newPassword)` | Request password change |
| `changePassword(newPassword, code)` | Confirm password change |

### Profile

| Method | Description |
|---|---|
| `getProfile()` | Get trader profile |
| `getOpenTrades()` | Get all open trades |
| `getCapacity(rate?)` | Get trading capacity |
| `getReferral()` | Get referral info |
| `editNickname(nickname)` | Change nickname |

### Trading

| Method | Description |
|---|---|
| `openTrade(type, amount)` | Open market trade (buy/sell) |
| `closeTrade(tradeId)` | Close a specific trade |
| `closeAllTrades(type)` | Close multiple trades |
| `changeLeverage(leverage)` | Change leverage (1-5) |

### TP/SL Management

| Method | Description |
|---|---|
| `updateTPSL(tradeId, tp?, sl?)` | Set/update take profit & stop loss |
| `getPendingOrders(status?)` | Get pending orders |
| `cancelPendingOrder(pendingId)` | Cancel a pending order |

### History & Accounting

| Method | Description |
|---|---|
| `getHistory(filters?)` | Get trade history with pagination |
| `getMargin()` | Get margin/balance info |
| `getTransactions(page, limit)` | Get transaction history |
| `getDepositConstraints()` | Get deposit limits |
| `getWithdrawConstraints(cardNumber?)` | Get withdraw limits |
| `depositIRT(amount, gateway)` | Deposit IRT (Toman) |
| `depositUSDT(amount, txId)` | Deposit USDT |
| `withdraw(amount, type, cardNumber?)` | Withdraw funds |

### KYC

| Method | Description |
|---|---|
| `getKycStatus()` | Get KYC verification status |
| `submitKycStep1(data)` | Submit personal info |
| `submitKycStep2(data)` | Submit ID card photos |
| `submitKycStep3(data)` | Submit selfie photo |

### Card Management

| Method | Description |
|---|---|
| `listCards()` | List saved bank cards |
| `addCard(data)` | Add new bank card |
| `deleteCard(cardId)` | Delete a bank card |

## Configuration

```typescript
const client = new MoamelatClient({
  baseUrl: "https://api.moamelat.com",  // API base URL
  token: "123:abc...",                   // Optional initial token
  maxRetries: 3,                         // Max retry attempts
  retryDelayMs: 1000,                    // Base delay between retries
});
```

### Token Management

```typescript
client.setToken("123:abc...");   // Set authentication token
client.getToken();               // Get current token
client.clearToken();             // Clear token (logout)
```

## Error Handling

All API errors throw an `ApiError` with detailed information:

```typescript
import { MoamelatClient, ApiError } from "zargaran-apiclient";

try {
  await client.openTrade("buy", 5);
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.code);     // e.g., "INSUFFICIENT_CREDIT"
    console.log(error.status);   // HTTP status code
    console.log(error.response); // Full API response
  }
}
```

### Retryable Errors

The client automatically retries on:
- `RATE_LIMITED` — Too many requests
- `BOT_DISABLED` — Bot temporarily unavailable

## Testing

```bash
bun test
```

The test suite covers all API methods with mocked responses — no network connection required.

- **55 tests** across 12 categories
- Mocked `fetch` for fully offline execution
- Covers success paths, error handling, retry logic, and auth header behavior

## License

MIT
