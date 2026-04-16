import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { MoamelatClient, ApiError } from "./client";

// Helper to create mocked fetch response
function createMockResponse(data: unknown, status = 200, ok = true) {
  const response = {
    ok,
    status,
    statusText: ok ? "OK" : "Bad Request",
    json: mock().mockResolvedValue(data),
    headers: new Headers(),
  };
  return response;
}

describe("MoamelatClient", () => {
  let client: MoamelatClient;
  let fetchMock: ReturnType<typeof mock>;

  beforeEach(() => {
    client = new MoamelatClient({
      baseUrl: "https://api.test.com",
      maxRetries: 0, // Disable retries for most tests to keep them fast
    });
    fetchMock = mock(createMockResponse);
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    mock.restore();
  });

  // ==================== Initialization ====================

  describe("initialization", () => {
    it("should use default values", () => {
      const defaultClient = new MoamelatClient();
      expect(defaultClient.getToken()).toBeNull();
    });

    it("should accept custom options", () => {
      const customClient = new MoamelatClient({
        baseUrl: "https://custom.api.com",
        token: "test:token123",
        maxRetries: 5,
        retryDelayMs: 500,
      });
      expect(customClient.getToken()).toBe("test:token123");
    });
  });

  // ==================== Token Management ====================

  describe("token management", () => {
    it("should set token", () => {
      client.setToken("123:abc123");
      expect(client.getToken()).toBe("123:abc123");
    });

    it("should clear token", () => {
      client.setToken("123:abc123");
      client.clearToken();
      expect(client.getToken()).toBeNull();
    });
  });

  // ==================== Auth Methods ====================

  describe("auth methods", () => {
    it("getTrader should send GET request with identifier", async () => {
      const mockData = {
        success: true,
        data: {
          trader: {
            id: 123,
            chat_id: "987654321",
            tell: "09123456789",
            fullname: "John Doe",
            has_password: true,
          },
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.getTrader("09123456789");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/auth/trader?identifier=09123456789");
      expect(options.method).toBe("GET");
      expect(result).toEqual(mockData);
    });

    it("loginByIdentifier should send POST request with body", async () => {
      const mockData = {
        success: true,
        data: {
          token: "123:abc123def456",
          trader: {
            id: 123,
            tell: "09123456789",
            fullname: "John Doe",
            nickname: "john_trader",
          },
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.loginByIdentifier("09123456789", "pass123");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/auth/login/password");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ id: "09123456789", password: "pass123" });
      expect(result).toEqual(mockData);
    });

    it("loginByUsername should send POST request with body", async () => {
      const mockData = {
        success: true,
        data: {
          token: "123:abc123",
          trader: { id: 123, tell: "09123456789", fullname: "John", nickname: "john" },
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.loginByUsername("john", "pass123");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/auth/login/username");
      expect(JSON.parse(options.body)).toEqual({ username: "john", password: "pass123" });
      expect(result).toEqual(mockData);
    });

    it("sendCode should send POST request", async () => {
      const mockData = { success: true, data: { mobile: "0912***6789", trader_id: 123 } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.sendCode(123, "set_password");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/auth/send-code");
      expect(JSON.parse(options.body)).toEqual({ trader_id: 123, type: "set_password" });
      expect(result).toEqual(mockData);
    });

    it("verifyCode should send POST request", async () => {
      const mockData = { success: true, data: { success: true } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.verifyCode(123, "12345", "set_password");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/auth/verify-code");
      expect(JSON.parse(options.body)).toEqual({ trader_id: 123, code: "12345", type: "set_password" });
      expect(result).toEqual(mockData);
    });

    it("setPassword should send POST request", async () => {
      const mockData = { success: true, data: undefined };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.setPassword(123, "newpass", "12345");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/auth/set-password");
      expect(JSON.parse(options.body)).toEqual({ trader_id: 123, password: "newpass", code: "12345" });
      expect(result).toEqual(mockData);
    });

    it("requestChangePassword should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: undefined };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.requestChangePassword("newpass");

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/auth/change-password/request");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(JSON.parse(options.body)).toEqual({ new_password: "newpass" });
    });

    it("changePassword should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: undefined };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.changePassword("newpass", "54321");

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/auth/change-password");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(JSON.parse(options.body)).toEqual({ new_password: "newpass", code: "54321" });
    });
  });

  // ==================== Profile Methods ====================

  describe("profile methods", () => {
    it("getProfile should send GET request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: {
          id: 123,
          tell: "09123456789",
          nickname: "john_trader",
          fullname: "John Doe",
          margin: 1500.0,
          leverage: 3,
          commission: 0.5,
          obligation_status: "none",
          deposit_type: "irt",
          unique_code: "1234",
          sell_count: 45,
          buy_count: 32,
          sell_avg: 1850.5,
          buy_avg: 1845.25,
          call_margin_price: { sell: 1200.0, buy: 1100.0 },
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.getProfile();

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/profile");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(options.method).toBe("GET");
      expect(result).toEqual(mockData);
    });

    it("getOpenTrades should send GET request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: {
          trades: [
            { id: 456, type: "buy" as const, amount: 5, price: 1850.25, remain_amount: 5, pnl: 125.5 },
          ],
          totalPnl: 125.5,
          buyCount: 32,
          sellCount: 45,
          buyAvg: 1845.25,
          sellAvg: 1850.5,
          currentBuyPrice: 1875.0,
          currentSellPrice: 1870.0,
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.getOpenTrades();

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/open-trades");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(result).toEqual(mockData);
    });

    it("getCapacity without rate should send GET request", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { rate: 0, loss: 0, freeMargin: 500, leverage: 3, buy: 150, sell: 150 },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getCapacity();

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/capacity");
    });

    it("getCapacity with rate should include query param", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { rate: 1875.0, loss: 0, freeMargin: 500, leverage: 3, buy: 150, sell: 150 },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getCapacity(1875.0);

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/capacity?rate=1875");
    });

    it("getReferral should send GET request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: {
          active: true,
          referralCount: 5,
          totalIncome: 250.0,
          link: "https://t.me/bot?start=dGoxMzQ1Njc4OQ==",
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.getReferral();

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/referral");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(result).toEqual(mockData);
    });

    it("editNickname should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: undefined };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.editNickname("new_nickname");

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/edit-nickname");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(JSON.parse(options.body)).toEqual({ nickname: "new_nickname" });
    });
  });

  // ==================== Trading Methods ====================

  describe("trading methods", () => {
    it("openTrade should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true, result: { trade_id: 789 } } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.openTrade("buy", 5);

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/trade");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(JSON.parse(options.body)).toEqual({ type: "buy", amount: 5 });
      expect(result).toEqual(mockData);
    });

    it("closeTrade should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.closeTrade(456);

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/close");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(JSON.parse(options.body)).toEqual({ trade_id: 456 });
    });

    it("closeAllTrades should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true, closed: 5 } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.closeAllTrades("all");

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/close-all");
      expect(JSON.parse(options.body)).toEqual({ type: "all" });
    });

    it("changeLeverage should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { success: true, newLeverage: 3, callMarginSell: 1200, callMarginBuy: 1100 },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.changeLeverage(3);

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/leverage");
      expect(JSON.parse(options.body)).toEqual({ leverage: 3 });
    });
  });

  // ==================== TP/SL Methods ====================

  describe("TP/SL methods", () => {
    it("updateTPSL should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true, action: "created" } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.updateTPSL(456, 1900, 1800);

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/tpsl");
      expect(JSON.parse(options.body)).toEqual({ trade_id: 456, tp: 1900, sl: 1800 });
    });

    it("updateTPSL should default tp and sl to 0 when undefined", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true, action: "deleted" } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.updateTPSL(456);

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(JSON.parse(options.body)).toEqual({ trade_id: 456, tp: 0, sl: 0 });
    });

    it("getPendingOrders without status should send GET request", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: {
          orders: [
            {
              id: 789,
              trade_id: 456,
              type: "buy" as const,
              order_type: "tpsl" as const,
              number: 5,
              price: 1850.0,
              base_price: 1875.0,
              tp: 1900.0,
              sl: 1800.0,
              status: "step1" as const,
              date: 1712345678,
            },
          ],
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getPendingOrders();

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/pending");
    });

    it("getPendingOrders with single status should include query param", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { orders: [] } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getPendingOrders("new");

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/pending?status=new");
    });

    it("getPendingOrders with multiple statuses should include comma-separated query", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { orders: [] } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getPendingOrders(["new", "step1"]);

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/pending?status=new,step1");
    });

    it("cancelPendingOrder should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.cancelPendingOrder(789);

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/pending/cancel");
      expect(JSON.parse(options.body)).toEqual({ pending_id: 789 });
    });
  });

  // ==================== History Methods ====================

  describe("history methods", () => {
    it("getHistory without filters should send GET request", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { trades: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getHistory();

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/trader/history");
    });

    it("getHistory with filters should include query params", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { trades: [], total: 50, page: 2, limit: 10, totalPages: 5 },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getHistory({ page: 2, limit: 10, type: "buy", from_date: 1711929600, to_date: 1712016000 });

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toContain("/trader/history?");
      expect(url).toContain("page=2");
      expect(url).toContain("limit=10");
      expect(url).toContain("type=buy");
      expect(url).toContain("from_date=1711929600");
      expect(url).toContain("to_date=1712016000");
    });
  });

  // ==================== Accounting Methods ====================

  describe("accounting methods", () => {
    it("getServicesStatus should send GET request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: {
          deposit: {
            irt: { active: true, timeAllowed: true, timeMessage: null },
            usdt: { active: true },
            neodigi: { active: false },
            schedule: { start: "08:00", end: "22:00", days: "1,2,3,4,5" },
          },
          withdraw: {
            irt: { active: true, timeAllowed: true, timeMessage: null },
            usdt: { active: true, timeAllowed: true, timeMessage: null },
            neodigi: { active: false },
            schedule_irt: { start: "09:00", end: "21:00", days: "1,2,3,4,5" },
            schedule_usdt: { start: "00:00", end: "24:00", days: null },
          },
          rates: { dollar_sell: "980000", dollar_buy: "978000" },
          balance: { margin: "1500.00", usdt_available: 1300.00 },
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.getServicesStatus();

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/services-status");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(result).toEqual(mockData);
    });

    it("getMargin should send GET request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { margin: 1500, leverage: 3 } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.getMargin();

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/margin");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(result).toEqual(mockData);
    });

    it("getTransactions should send GET request with pagination", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { transactions: [], total: 100, page: 1, limit: 20, totalPages: 5 },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getTransactions(2, "deposit");

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/transactions?page=2&type=deposit");
    });

    it("getTransactions should use default page and omit type when not provided", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { transactions: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getTransactions();

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/transactions?page=1");
    });

    it("getDepositConstraints should send GET request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { used: 5000000, limit: 50000000, remain: 45000000, countUsed: 2, countLimit: 5, countRemain: 3 },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getDepositConstraints();

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/deposit/constraints");
      expect(options.headers["x-token"]).toBe("123:abc");
    });

    it("getWithdrawConstraints without params should send GET request", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { minAmount: 10, maxAmount: 1000, fee: 1, cards: [] },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getWithdrawConstraints();

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/withdraw/constraints?withdrawType=irt");
    });

    it("getWithdrawConstraints with cardNumber should include cardnumber query param", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { minAmount: 10, maxAmount: 1000, fee: 1, cards: [] },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getWithdrawConstraints("6037991234567890");

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/withdraw/constraints?cardnumber=6037991234567890&withdrawType=irt");
    });

    it("getWithdrawConstraints with withdrawType should include withdrawType query param", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { minAmount: 10, maxAmount: 1000, fee: 1, cards: [] },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getWithdrawConstraints(undefined, "usdt");

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/withdraw/constraints?withdrawType=usdt");
    });

    it("getWithdrawConstraints with both params should include both query params", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { minAmount: 10, maxAmount: 1000, fee: 1, cards: [] },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getWithdrawConstraints("6037991234567890", "irt");

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toContain("cardnumber=6037991234567890");
      expect(url).toContain("withdrawType=irt");
    });

    it("depositIRT should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { paymentId: 1234, link: "https://gateway.example.com/pay/...", amount: 1000000, dollarSell: 980000, commission: 1.02, wage: 10000 },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.depositIRT(1000000, "6037991234567890");

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/deposit/irt");
      expect(JSON.parse(options.body)).toEqual({ amount: 1000000, cardnumber: "6037991234567890" });
    });

    it("depositUSDT should send GET request with network query param", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { address: "TJxR4f8QV...", network: "trc20" },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.depositUSDT("trc20");

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/deposit/usdt?network=trc20");
      expect(options.method).toBe("GET");
      expect(options.headers["x-token"]).toBe("123:abc");
    });

    it("depositUSDT should default to trc20 network", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { address: "TJxR4f8QV...", network: "trc20" },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.depositUSDT();

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/deposit/usdt?network=trc20");
    });

    it("depositUSDT with bep20 should include correct query param", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { address: "0xabc...", network: "bep20" },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.depositUSDT("bep20");

      const [url] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/deposit/usdt?network=bep20");
    });

    it("withdraw with irt type should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { settleId: 9012, margin: 1450.00, callMarginSell: 1200.00, callMarginBuy: 1100.00, irtValue: 48900000, wage: 50000 },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.withdraw({ withdrawType: "irt", amount: 50.00, cardnumber: "6037991234567890" });

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/withdraw");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(JSON.parse(options.body)).toEqual({ withdrawType: "irt", amount: 50.00, cardnumber: "6037991234567890" });
    });

    it("withdraw with usdt type should include wallet and network", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { settleId: 9012, margin: 1450.00 } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.withdraw({ withdrawType: "usdt", amount: 100.00, wallet: "TJxR4f8QV...", network: "trc20" });

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(JSON.parse(options.body)).toEqual({ withdrawType: "usdt", amount: 100.00, wallet: "TJxR4f8QV...", network: "trc20" });
    });

    it("withdraw with neodigi type should include neodigiAccount and neodigiName", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { settleId: 9012 } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.withdraw({ withdrawType: "neodigi", amount: 75.00, neodigiAccount: "12345", neodigiName: "John Doe" });

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(JSON.parse(options.body)).toEqual({ withdrawType: "neodigi", amount: 75.00, neodigiAccount: "12345", neodigiName: "John Doe" });
    });

    it("depositManual should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { settleId: 5678, dollarRate: 980000, usdtAmount: 1.02 },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.depositManual({ amount: "1000000", fishNumber: "TX123456", image: "base64_or_url" });

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/deposit/manual");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(JSON.parse(options.body)).toEqual({ amount: "1000000", fishNumber: "TX123456", image: "base64_or_url" });
    });

    it("getNeodigiDepositInfo should send GET request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { unique_code: "1234", fullname: "John Doe" },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.getNeodigiDepositInfo();

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/deposit/neodigi");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(result).toEqual(mockData);
    });

    it("checkPendingDepositVerify should send GET request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { hasPending: false },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.checkPendingDepositVerify();

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/deposit/pending-verify");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(result).toEqual(mockData);
    });

    it("validateWallet should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { valid: true, address: "TJxR4f8QV...", network: "trc20" },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.validateWallet("TJxR4f8QV...", "trc20");

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/accounting/wallet/validate");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(JSON.parse(options.body)).toEqual({ address: "TJxR4f8QV...", network: "trc20" });
    });

    it("validateWallet should default to trc20 network", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: { valid: true, address: "TJxR4f8QV...", network: "trc20" },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.validateWallet("TJxR4f8QV...");

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(JSON.parse(options.body)).toEqual({ address: "TJxR4f8QV...", network: "trc20" });
    });
  });

  // ==================== KYC Methods ====================

  describe("KYC methods", () => {
    it("getKycStatus should send GET request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: {
          status: "pending",
          steps: { step1: true, step2: true, step3: false },
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.getKycStatus();

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/kyc/status");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(result).toEqual(mockData);
    });

    it("submitKycStep1 should send FormData POST request", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.submitKycStep1({
        fullname: "John Doe",
        national_id: "0012345678",
        birth_date: "1370/01/01",
      });

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/kyc/step1");
      expect(options.method).toBe("POST");
      expect(options.headers["x-token"]).toBe("123:abc");
      // FormData body should be present
      expect(options.body).toBeInstanceOf(FormData);
    });

    it("submitKycStep2 should send FormData POST request", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const mockFile = new File(["test"], "card.png", { type: "image/png" });

      await client.submitKycStep2({
        id_card_front: mockFile,
        id_card_back: mockFile,
      });

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/kyc/step2");
      expect(options.body).toBeInstanceOf(FormData);
    });

    it("submitKycStep3 should send FormData POST request", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const mockFile = new File(["test"], "selfie.png", { type: "image/png" });

      await client.submitKycStep3({ selfie: mockFile });

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/kyc/step3");
      expect(options.body).toBeInstanceOf(FormData);
    });

    it("should throw ApiError on KYC FormData non-OK response", async () => {
      client.setToken("123:abc");
      const errorResponse = {
        success: false,
        message: "KYC_UPLOAD_FAILED",
        data: {},
        errors: {},
      };
      fetchMock.mockReturnValueOnce(createMockResponse(errorResponse, 400, false));

      const mockFile = new File(["test"], "selfie.png", { type: "image/png" });

      await expect(client.submitKycStep3({ selfie: mockFile })).rejects.toThrow(ApiError);

      try {
        await client.submitKycStep3({ selfie: mockFile });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).code).toBe("KYC_UPLOAD_FAILED");
      }
    });
  });

  // ==================== Card Methods ====================

  describe("card methods", () => {
    it("listCards should send GET request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: {
          cards: [
            { id: 1, bank: "Mellat", number: "603799****7890", shaba: "IR****1234567890", status: "success" },
          ],
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.listCards();

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/card/list");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(result).toEqual(mockData);
    });

    it("addCard should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: {
          success: true,
          card: { id: 1, bank: "Mellat", number: "603799****7890", shaba: "IR123...", status: "success" },
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.addCard({
        bank: "Mellat",
        number: "6037991234567890",
        shaba: "IR123456789012345678901234",
      });

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/card/add");
      expect(JSON.parse(options.body)).toEqual({
        bank: "Mellat",
        number: "6037991234567890",
        shaba: "IR123456789012345678901234",
      });
    });

    it("deleteCard should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.deleteCard(1);

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/card/delete");
      expect(JSON.parse(options.body)).toEqual({ card_id: 1 });
    });
  });

  // ==================== Error Handling ====================

  describe("error handling", () => {
    it("should throw ApiError on non-OK response", async () => {
      const errorResponse = {
        success: false,
        message: "INVALID_TYPE",
        data: {},
        errors: {},
      };
      fetchMock.mockReturnValueOnce(createMockResponse(errorResponse, 400, false));

      await expect(client.openTrade("invalid" as any, 5)).rejects.toThrow(ApiError);

      try {
        await client.openTrade("invalid" as any, 5);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).code).toBe("INVALID_TYPE");
        expect((error as ApiError).message).toBe("INVALID_TYPE");
      }
    });

    it("ApiError should contain response data", async () => {
      const errorResponse = {
        success: false,
        message: "INSUFFICIENT_CREDIT",
        data: {},
        errors: {},
      };
      fetchMock.mockReturnValueOnce(createMockResponse(errorResponse, 400, false));

      try {
        await client.openTrade("buy", 5);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).response).toEqual(errorResponse);
      }
    });
  });

  // ==================== Retry Logic ====================

  describe("retry logic", () => {
    it("should retry on RATE_LIMITED error", async () => {
      const retryClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        maxRetries: 2,
        retryDelayMs: 10, // Fast retries for testing
      });

      const errorResponse = { success: false, message: "RATE_LIMITED", data: {} };
      const successResponse = { success: true, data: { trades: [], total: 0, page: 1, limit: 20, totalPages: 0 } };

      // First two calls fail, third succeeds
      fetchMock
        .mockReturnValueOnce(createMockResponse(errorResponse, 429, false))
        .mockReturnValueOnce(createMockResponse(errorResponse, 429, false))
        .mockReturnValueOnce(createMockResponse(successResponse, 200, true));

      client.setToken("123:abc");

      const result = await retryClient.getHistory();

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
    });

    it("should retry on BOT_DISABLED error", async () => {
      const retryClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        maxRetries: 1,
        retryDelayMs: 10,
      });

      const errorResponse = { success: false, message: "BOT_DISABLED", data: {} };
      const successResponse = { success: true, data: { trades: [], total: 0, page: 1, limit: 20, totalPages: 0 } };

      fetchMock
        .mockReturnValueOnce(createMockResponse(errorResponse, 400, false))
        .mockReturnValueOnce(createMockResponse(successResponse, 200, true));

      client.setToken("123:abc");

      const result = await retryClient.getHistory();

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });

    it("should retry on network TypeError", async () => {
      const retryClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        maxRetries: 1,
        retryDelayMs: 10,
      });

      const successResponse = { success: true, data: { trades: [], total: 0, page: 1, limit: 20, totalPages: 0 } };

      fetchMock
        .mockImplementationOnce(() => {
          throw new TypeError("fetch failed");
        })
        .mockReturnValueOnce(createMockResponse(successResponse, 200, true));

      client.setToken("123:abc");

      const result = await retryClient.getHistory();

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });

    it("should throw after max retries exhausted", async () => {
      const retryClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        maxRetries: 2,
        retryDelayMs: 10,
      });

      const errorResponse = { success: false, message: "RATE_LIMITED", data: {} };

      // All calls fail
      fetchMock
        .mockReturnValueOnce(createMockResponse(errorResponse, 429, false))
        .mockReturnValueOnce(createMockResponse(errorResponse, 429, false))
        .mockReturnValueOnce(createMockResponse(errorResponse, 429, false));

      client.setToken("123:abc");

      await expect(retryClient.getHistory()).rejects.toThrow();
      expect(fetchMock).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it("should not retry on non-retryable errors", async () => {
      const retryClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        maxRetries: 3,
        retryDelayMs: 10,
      });

      const errorResponse = { success: false, message: "INVALID_TYPE", data: {} };
      fetchMock.mockReturnValueOnce(createMockResponse(errorResponse, 400, false));

      await expect(retryClient.openTrade("buy", 5)).rejects.toThrow(ApiError);
      expect(fetchMock).toHaveBeenCalledTimes(1); // Should not retry
    });
  });

  // ==================== Auth Header Behavior ====================

  describe("auth header behavior", () => {
    it("should send x-token header when auth=true", async () => {
      client.setToken("123:token");
      const mockData = { success: true, data: { margin: 100, blocked: 0, available: 100 } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getMargin();

      const [, options] = fetchMock.mock.calls[0]!;
      expect(options.headers["x-token"]).toBe("123:token");
    });

    it("should NOT send x-token header when auth=false", async () => {
      const mockData = {
        success: true,
        data: {
          trader: {
            id: 123,
            chat_id: "987654321",
            tell: "09123456789",
            fullname: "John Doe",
            has_password: true,
          },
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getTrader("09123456789");

      const [, options] = fetchMock.mock.calls[0]!;
      expect(options.headers["x-token"]).toBeUndefined();
    });

    it("should NOT send x-token header when token is null even if auth=true", async () => {
      const mockData = { success: true, data: { margin: 100, blocked: 0, available: 100 } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getMargin();

      const [, options] = fetchMock.mock.calls[0]!;
      expect(options.headers["x-token"]).toBeUndefined();
    });

    it("should NOT send x-token header when token is null for other protected endpoints", async () => {
      const mockData = { success: true, data: { trades: [] } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getOpenTrades();

      const [, options] = fetchMock.mock.calls[0]!;
      expect(options.headers["x-token"]).toBeUndefined();
    });
  });
});
