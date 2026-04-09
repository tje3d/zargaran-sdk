# Moamelat API Client - Complete Guide

A detailed guide covering all API operations with practical examples.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#1-authentication)
- [Trader Profile](#2-trader-profile)
- [Trading Operations](#3-trading-operations)
- [TP/SL Management](#4-tpsl-management)
- [Trade History](#5-trade-history)
- [Accounting](#6-accounting)
- [KYC Verification](#7-kyc-verification)
- [Card Management](#8-card-management)
- [Error Handling](#error-handling)
- [Retry Logic](#retry-logic)

---

## Getting Started

### Installation

```bash
bun install
```

### Basic Setup

```typescript
import { MoamelatClient, ApiError } from "./src/client";

// Create client instance
const client = new MoamelatClient({
  baseUrl: "https://api.moamelat.com",  // Production URL
  // Optional: provide token if restoring session
  // token: "123:abc123def456...",
});
```

### Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `baseUrl` | `string` | `https://api.moamelat.com` | API base URL |
| `token` | `string` | `null` | Initial authentication token |
| `maxRetries` | `number` | `3` | Maximum retry attempts |
| `retryDelayMs` | `number` | `1000` | Base delay between retries (ms) |

### Token Management

```typescript
// Set token after login
client.setToken("123:abc123def456...");

// Get current token
const token = client.getToken();

// Clear token (logout)
client.clearToken();
```

---

## 1. Authentication

### 1.1 Check Trader Existence

Before attempting login, verify the trader exists and check if they have a password set.

```typescript
const { data } = await client.getTrader("09123456789");

console.log(data.trader);
// {
//   id: 123,
//   chat_id: "987654321",
//   tell: "09123456789",
//   fullname: "John Doe",
//   has_password: true
// }

if (!data.trader.has_password) {
  // Redirect to password setup flow
}
```

### 1.2 Login with Phone/Chat ID

```typescript
const { data } = await client.loginByIdentifier("09123456789", "userpass123");

// Store the token for subsequent requests
client.setToken(data.token);
console.log(`Welcome, ${data.trader.fullname}!`);
```

### 1.3 Login with Username

```typescript
const { data } = await client.loginByUsername("john_trader", "userpass123");
client.setToken(data.token);
```

### 1.4 Password Setup Flow

For traders who haven't set a password yet, use the verification flow:

```typescript
// Step 1: Send verification code
const { data: codeData } = await client.sendCode(123, "set_password");
console.log(`Code sent to ${codeData.mobile}`);

// Step 2: Verify the code received via SMS
const { data: verifyData } = await client.verifyCode(123, "12345", "set_password");

if (verifyData.success) {
  // Step 3: Set the password
  await client.setPassword(123, "newSecurePass123", "12345");
  console.log("Password set successfully");
}
```

### 1.5 Change Password (Authenticated)

Requires a valid token. Triggers SMS verification.

```typescript
// Step 1: Request password change
await client.requestChangePassword("newPassword456");

// Step 2: Confirm with SMS code
await client.changePassword("newPassword456", "54321");
```

---

## 2. Trader Profile

### 2.1 Get Profile

```typescript
const { data: profile } = await client.getProfile();

console.log(profile);
// {
//   id: 123,
//   tell: "09123456789",
//   nickname: "john_trader",
//   fullname: "John Doe",
//   margin: 1500.00,
//   leverage: 3,
//   commission: 0.5,
//   obligation_status: "none",
//   deposit_type: "irt",
//   unique_code: "1234",
//   sell_count: 45,
//   buy_count: 32,
//   sell_avg: 1850.50,
//   buy_avg: 1845.25,
//   call_margin_price: { sell: 1200.00, buy: 1100.00 }
// }
```

### 2.2 Get Open Trades

```typescript
const { data: trades } = await client.getOpenTrades();

console.log(`Total P&L: $${trades.totalPnl}`);
console.log(`Active trades: ${trades.trades.length}`);

// Display current market prices
console.log(`Buy price: ${trades.currentBuyPrice}`);
console.log(`Sell price: ${trades.currentSellPrice}`);

// List individual trades
trades.trades.forEach(trade => {
  const pnlSign = trade.pnl >= 0 ? "+" : "";
  console.log(`#${trade.id} ${trade.type.toUpperCase()} ${trade.amount} @ ${trade.price} [${pnlSign}${trade.pnl}]`);
});
```

### 2.3 Get Trading Capacity

```typescript
// Get capacity without specifying rate (uses current market rate)
const { data: capacity } = await client.getCapacity();

// Or check capacity at a specific price
const { data: capacityAtPrice } = await client.getCapacity(1900.00);

console.log(`Available margin: ${capacity.freeMargin}`);
console.log(`Max buy capacity: ${capacity.buy}`);
console.log(`Max sell capacity: ${capacity.sell}`);
```

### 2.4 Get Referral Info

```typescript
const { data: referral } = await client.getReferral();

if (referral.active) {
  console.log(`Referral link: ${referral.link}`);
  console.log(`Referred traders: ${referral.referralCount}`);
  console.log(`Total earnings: $${referral.totalIncome}`);
}
```

### 2.5 Edit Nickname

```typescript
await client.editNickname("gold_master_2024");
```

---

## 3. Trading Operations

### 3.1 Open Market Trade

Open an instant buy or sell position at current market price.

```typescript
// Open a buy trade (long position)
const { data: tradeResult } = await client.openTrade("buy", 10);
console.log(`Trade opened! ID: ${tradeResult.result.trade_id}`);

// Open a sell trade (short position)
const { data: sellResult } = await client.openTrade("sell", 5);
console.log(`Sell trade opened! ID: ${sellResult.result.trade_id}`);
```

**Amount constraints:** 1–500 units per trade.

### 3.2 Close a Trade

```typescript
await client.closeTrade(456);
console.log("Trade #456 closed");
```

### 3.3 Close Multiple Trades

Close trades based on criteria:

```typescript
// Close all open trades
await client.closeAllTrades("all");

// Close only buy positions
await client.closeAllTrades("buy");

// Close only sell positions
await client.closeAllTrades("sell");

// Close only profitable trades
await client.closeAllTrades("profit");

// Close only losing trades
await client.closeAllTrades("loss");
```

### 3.4 Change Leverage

Adjust leverage to control buying power and margin requirements.

```typescript
const { data } = await client.changeLeverage(3);

console.log(`New leverage: ${data.newLeverage}x`);
console.log(`Call margin (sell): ${data.callMarginSell}`);
console.log(`Call margin (buy): ${data.callMarginBuy}`);
```

**Leverage range:** 1–5 (or up to `max_users_leverage` set by platform).

---

## 4. TP/SL Management

### 4.1 Set Take Profit and Stop Loss

Attach TP/SL orders to existing trades to automate exits.

```typescript
// Set both TP and SL
await client.updateTPSL(456, 1900.00, 1800.00);
// action: "created"

// Update existing TP/SL
await client.updateTPSL(456, 1920.00, 1810.00);
// action: "updated"

// Remove TP/SL (set both to 0)
await client.updateTPSL(456, 0, 0);
// action: "deleted"

// Set only TP (remove SL)
await client.updateTPSL(456, 1900.00);

// Set only SL (remove TP)
await client.updateTPSL(456, undefined, 1800.00);
```

**Notes:**
- Prices must be multiples of 0.05
- TP/SL cannot be too close to current market price
- Passing `0` removes the respective order

### 4.2 Get Pending Orders

```typescript
// Get all pending orders
const { data: allPending } = await client.getPendingOrders();

// Get orders in specific statuses
const { data: newOrders } = await client.getPendingOrders("new");
const { data: activeOrders } = await client.getPendingOrders(["new", "step1"]);

allPending.orders.forEach(order => {
  console.log(`Order #${order.id}: ${order.type} ${order.number} @ ${order.price}`);
  console.log(`  TP: ${order.tp}, SL: ${order.sl}`);
  console.log(`  Status: ${order.status}`);
});
```

### 4.3 Cancel Pending Order

```typescript
await client.cancelPendingOrder(789);
console.log("Pending order #789 cancelled");
```

---

## 5. Trade History

### 5.1 Get Trade History

Retrieve paginated history of closed trades with optional filters.

```typescript
// Get first page (default: page 1, limit 20)
const { data: history } = await client.getHistory();

console.log(`Total trades: ${history.total}`);
console.log(`Page: ${history.page} of ${history.totalPages}`);

history.trades.forEach(trade => {
  console.log(`#${trade.id} ${trade.type} ${trade.amount} | P&L: ${trade.pnl}`);
});
```

### 5.2 Filtered History

```typescript
// Get buy trades only
const { data: buyHistory } = await client.getHistory({
  type: "buy",
  page: 1,
  limit: 50,
});

// Get trades in a date range (Unix timestamps)
const { data: dateRange } = await client.getHistory({
  from_date: 1711929600,  // April 1, 2024
  to_date: 1712016000,    // April 2, 2024
  page: 1,
  limit: 100,
});

// Combined filters
const { data: filtered } = await client.getHistory({
  type: "sell",
  page: 2,
  limit: 25,
  from_date: 1711929600,
  to_date: 1712016000,
});
```

### 5.3 History Response Structure

```typescript
{
  trades: [
    {
      id: 456,
      type: "buy",
      amount: 5,
      price: "1850.25",          // Entry price
      close_price: "1875.50",    // Exit price
      time: 1712345678,          // Open time (Unix timestamp)
      close_time: 1712432078,    // Close time (Unix timestamp)
      pnl: "125.50",             // Profit/Loss
      commission_amount: "2.50"  // Commission charged
    }
  ],
  total: 150,        // Total matching records
  page: 1,           // Current page
  limit: 20,         // Items per page
  totalPages: 8      // Total pages
}
```

---

## 6. Accounting

### 6.1 Get Margin Balance

```typescript
const { data: margin } = await client.getMargin();

console.log(`Total margin: ${margin.margin}`);
console.log(`Blocked margin: ${margin.blocked}`);
console.log(`Available: ${margin.available}`);
```

### 6.2 Get Transactions

```typescript
// Default: page 1, limit 20
const { data: transactions } = await client.getTransactions();

// Custom pagination
const { data: page2 } = await client.getTransactions(2, 50);

transactions.transactions.forEach(tx => {
  console.log(`TX #${tx.id}: ${tx.type} | Amount: ${tx.amount} | Date: ${new Date(tx.date * 1000).toLocaleString()}`);
});
```

### 6.3 Get Deposit Constraints

Check deposit limits before attempting to deposit.

```typescript
const { data: constraints } = await client.getDepositConstraints();

console.log(`Used: ${constraints.used} / ${constraints.limit}`);
console.log(`Remaining: ${constraints.remain}`);
console.log(`Deposits used: ${constraints.countUsed} / ${constraints.countLimit}`);
console.log(`Deposits remaining: ${constraints.countRemain}`);
```

### 6.4 Get Withdraw Constraints

```typescript
// Without card filter
const { data: withdrawInfo } = await client.getWithdrawConstraints();

console.log(`Min withdraw: ${withdrawInfo.minAmount}`);
console.log(`Max withdraw: ${withdrawInfo.maxAmount}`);
console.log(`Fee: ${withdrawInfo.fee}`);

// Check constraints for a specific card
const { data: cardConstraints } = await client.getWithdrawConstraints("6037991234567890");
```

### 6.5 Deposit IRT (Iranian Toman)

Initiate a deposit through the Zibal payment gateway.

```typescript
const { data: deposit } = await client.depositIRT(1_000_000, "zibal");

// Redirect user to payment gateway
if (deposit.url) {
  console.log(`Pay at: ${deposit.url}`);
}
```

### 6.6 Deposit USDT

Deposit USDT with transaction ID verification.

```typescript
const { data: usdtDeposit } = await client.depositUSDT(100.00, "0xabc123def456...");

if (usdtDeposit.success) {
  console.log("USDT deposit submitted");
}
```

### 6.7 Withdraw Funds

```typescript
// Withdraw to bank card
const { data: withdraw } = await client.withdraw(
  50.00,                           // Amount
  "send",                          // Type: "send" | "neodigi" | "usdt"
  "6037991234567890"              // Card number
);

// USDT withdraw (no card needed)
const { data: usdtWithdraw } = await client.withdraw(
  100.00,
  "usdt"
);

if (withdraw.reference) {
  console.log(`Withdrawal reference: ${withdraw.reference}`);
}
```

---

## 7. KYC Verification

### 7.1 Check KYC Status

```typescript
const { data: kycStatus } = await client.getKycStatus();

console.log(`Overall status: ${kycStatus.status}`);
// Status: "none" | "pending" | "approved" | "rejected"

console.log("Steps completed:");
console.log(`  Step 1 (Personal info): ${kycStatus.steps.step1}`);
console.log(`  Step 2 (ID card): ${kycStatus.steps.step2}`);
console.log(`  Step 3 (Selfie): ${kycStatus.steps.step3}`);
```

### 7.2 Submit Step 1: Personal Information

```typescript
await client.submitKycStep1({
  fullname: "John Doe",
  national_id: "0012345678",
  birth_date: "1370/01/01",  // Persian calendar format
});
```

### 7.3 Submit Step 2: ID Card Photos

Requires `File` objects (browser) or equivalent in Node.js.

```typescript
// Browser: files from file input
const frontFile = document.querySelector('input[name="id_card_front"]').files[0];
const backFile = document.querySelector('input[name="id_card_back"]').files[0];

await client.submitKycStep2({
  id_card_front: frontFile,
  id_card_back: backFile,
});

// Node.js example with File API
const frontFile = new File(["...image data..."], "front.png", { type: "image/png" });
const backFile = new File(["...image data..."], "back.png", { type: "image/png" });
```

### 7.4 Submit Step 3: Selfie Photo

```typescript
const selfieFile = document.querySelector('input[name="selfie"]').files[0];

await client.submitKycStep3({
  selfie: selfieFile,
});
```

---

## 8. Card Management

### 8.1 List Saved Cards

```typescript
const { data: cardsData } = await client.listCards();

cardsData.cards.forEach(card => {
  console.log(`${card.bank} - ${card.number} (${card.status})`);
  console.log(`  IBAN: ${card.shaba}`);
});
// Example output:
// Mellat - 603799****7890 (success)
//   IBAN: IR****1234567890
```

### 8.2 Add New Card

```typescript
await client.addCard({
  bank: "Mellat",
  number: "6037991234567890",
  shaba: "IR123456789012345678901234",
});
```

### 8.3 Delete Card

```typescript
await client.deleteCard(1);
console.log("Card #1 removed");
```

---

## Error Handling

All API errors throw an `ApiError` with detailed context:

```typescript
import { ApiError } from "./src/client";

try {
  await client.openTrade("buy", 5);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`Error: ${error.code}`);       // e.g., "INSUFFICIENT_CREDIT"
    console.error(`Status: ${error.status}`);     // HTTP status code
    console.error(`Message: ${error.message}`);   // Error message
    console.error(`Response:`, error.response);   // Full API response
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `MARKET_CLOSED` | 400 | Market is deactivated |
| `BOT_DISABLED` | 400 | Bot is deactivated (retryable) |
| `RATE_LIMITED` | 429 | Too many requests (retryable) |
| `INSUFFICIENT_CREDIT` | 400 | Not enough margin |
| `INVALID_TYPE` | 400 | Invalid trade type |
| `INVALID_AMOUNT` | 400 | Invalid trade amount |
| `AMOUNT_TOO_LARGE` | 400 | Amount exceeds 500 limit |
| `OPEN_TRADES_LIMIT` | 400 | Max open trades reached |
| `TRADE_NOT_FOUND` | 404 | Trade doesn't exist |
| `TP_TOO_CLOSE` | 400 | TP too close to current price |
| `SL_TOO_CLOSE` | 400 | SL too close to current price |
| `INVALID_DECIMAL` | 400 | Price not multiple of 0.05 |

---

## Retry Logic

The client automatically retries requests with specific error codes using exponential backoff.

### Retryable Errors

| Code | Behavior |
|---|---|
| `RATE_LIMITED` | Retries with 1s, 2s, 4s, 8s... delays |
| `BOT_DISABLED` | Retries with exponential backoff |

### Configuring Retries

```typescript
// Custom retry configuration
const client = new MoamelatClient({
  baseUrl: "https://api.moamelat.com",
  maxRetries: 5,       // Maximum retry attempts (default: 3)
  retryDelayMs: 2000,  // Base delay in milliseconds (default: 1000)
});
```

Retry delay formula: `retryDelayMs * 2^attempt`
- Attempt 0: 2000ms
- Attempt 1: 4000ms
- Attempt 2: 8000ms
- ...

### Network Error Retries

The client also retries on network errors (`TypeError`) such as:
- Connection failures
- DNS resolution errors
- Network timeouts

```typescript
// Example: client handles temporary network issues automatically
try {
  await client.getProfile();
  // If network fails, retries happen transparently
} catch (error) {
  // Only reached after all retries exhausted
  console.error("Request failed after retries:", error);
}
```

---

## Real-Time Prices (WebSocket)

The client doesn't include WebSocket support by default, but you can connect separately for live price updates:

```typescript
const ws = new WebSocket("wss://api.moamelat.com/ws");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`Buy: ${data.buy} | Sell: ${data.sell} | Avg: ${data.avg}`);
};

ws.onclose = () => {
  // Reconnect logic
  setTimeout(() => {
    // ws = new WebSocket(...)
  }, 5000);
};
```
