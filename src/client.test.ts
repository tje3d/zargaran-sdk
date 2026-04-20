import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { MoamelatClient, ApiError, createMemoryStorageAdapter } from "./client";

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
      persistAuth: false,
      autoRefreshProfile: false,
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

  // ==================== Client Info Management ====================

  describe("client info management", () => {
    it("should set and get clientIp", () => {
      client.setClientIp("192.168.1.100");
      expect(client.getClientIp()).toBe("192.168.1.100");
    });

    it("should set and get userAgent", () => {
      client.setUserAgent("Mozilla/5.0 Custom");
      expect(client.getUserAgent()).toBe("Mozilla/5.0 Custom");
    });

    it("should accept clientIp and userAgent in constructor", () => {
      const customClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        clientIp: "10.0.0.1",
        userAgent: "TestAgent/1.0",
        persistAuth: false,
        autoRefreshProfile: false,
      });
      expect(customClient.getClientIp()).toBe("10.0.0.1");
      expect(customClient.getUserAgent()).toBe("TestAgent/1.0");
    });

    it("should default clientIp and userAgent to null", () => {
      expect(client.getClientIp()).toBeNull();
      expect(client.getUserAgent()).toBeNull();
    });

    it("should send x-client-ip and x-client-user-agent headers on requests", async () => {
      client.setToken("123:abc");
      client.setClientIp("192.168.1.100");
      client.setUserAgent("Mozilla/5.0");
      const mockData = { success: true, data: { id: 123, tell: "09123456789", nickname: "john", margin: 1500.0, leverage: 3, commission: 0.5, obligation_status: "none", deposit_type: "irt", unique_code: "1234", sell_count: 45, buy_count: 32, sell_avg: 1850.5, buy_avg: 1845.25, call_margin_price: { sell: 1200.0, buy: 1100.0 } } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getProfile();

      const [, options] = fetchMock.mock.calls[0]!;
      expect(options.headers["x-client-ip"]).toBe("192.168.1.100");
      expect(options.headers["x-client-user-agent"]).toBe("Mozilla/5.0");
    });

    it("should send x-client-ip and x-client-user-agent headers on FormData requests", async () => {
      client.setToken("123:abc");
      client.setClientIp("192.168.1.100");
      client.setUserAgent("Mozilla/5.0");
      const mockData = { success: true, data: { success: true } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.submitKycStep3({ commitmentSelfi: new File(["test"], "selfie.png", { type: "image/png" }) });

      const [, options] = fetchMock.mock.calls[0]!;
      expect(options.headers["x-client-ip"]).toBe("192.168.1.100");
      expect(options.headers["x-client-user-agent"]).toBe("Mozilla/5.0");
    });

    it("should omit client info headers when not set", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { id: 123, tell: "09123456789", nickname: "john", margin: 1500.0, leverage: 3, commission: 0.5, obligation_status: "none", deposit_type: "irt", unique_code: "1234", sell_count: 45, buy_count: 32, sell_avg: 1850.5, buy_avg: 1845.25, call_margin_price: { sell: 1200.0, buy: 1100.0 } } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.getProfile();

      const [, options] = fetchMock.mock.calls[0]!;
      expect(options.headers["x-client-ip"]).toBeUndefined();
      expect(options.headers["x-client-user-agent"]).toBeUndefined();
    });
  });

  // ==================== Auth Methods ====================

  describe("auth methods", () => {
    it("login should send POST request with body", async () => {
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

      const result = await client.login("09123456789", "pass123");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/auth/login");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ id: "09123456789", password: "pass123" });
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

    it("logout should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { message: "خروج با موفقیت انجام شد" } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.logout();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/auth/logout");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(options.method).toBe("POST");
      expect(result).toEqual(mockData);
    });

    it("listDevices should send GET request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: {
          devices: [
            {
              id: 1,
              device_id: "550e8400-e29b-41d4-a716-446655440000",
              device_name: "iPhone 14",
              device_type: "ios",
              user_agent: "Mozilla/5.0",
              ip_address: "192.168.1.1",
              last_activity: 1712345678,
              created_at: 1712345678,
              is_active: 1,
              is_current: true,
            },
          ],
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.listDevices();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/auth/devices");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(options.method).toBe("GET");
      expect(result).toEqual(mockData);
    });

    it("deleteDevice should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: undefined };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.deleteDevice("550e8400-e29b-41d4-a716-446655440000");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/auth/devices/delete");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(JSON.parse(options.body)).toEqual({ device_id: "550e8400-e29b-41d4-a716-446655440000" });
    });

    it("deleteOtherDevices should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: undefined };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.deleteOtherDevices();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/auth/devices/delete-others");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(options.method).toBe("POST");
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
      expect(url).toBe("https://api.test.com/order/open-trades");
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
      expect(url).toBe("https://api.test.com/order/capacity");
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
      expect(url).toBe("https://api.test.com/order/capacity?rate=1875");
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
      expect(url).toBe("https://api.test.com/order/trade");
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
      expect(url).toBe("https://api.test.com/order/close");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(JSON.parse(options.body)).toEqual({ id: 456 });
    });

    it("closeAllTrades should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true, closed: 5 } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.closeAllTrades("all");

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/order/closeAll");
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
      expect(url).toBe("https://api.test.com/trader/changeLeverage");
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
      expect(url).toBe("https://api.test.com/order/setTpSl");
      expect(JSON.parse(options.body)).toEqual({ id: 456, tp: 1900, sl: 1800 });
    });

    it("updateTPSL should default tp and sl to 0 when undefined", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true, action: "deleted" } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.updateTPSL(456);

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(JSON.parse(options.body)).toEqual({ id: 456, tp: 0, sl: 0 });
    });

    it("createLimitOrder should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { id: 789 } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.createLimitOrder("buy", 5, 1850, 1900, 1800);

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/order/pending");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(JSON.parse(options.body)).toEqual({ type: "buy", amount: 5, price: 1850, tp: 1900, sl: 1800 });
      expect(result).toEqual(mockData);
    });

    it("createLimitOrder should omit optional tp and sl when undefined", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { id: 789 } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.createLimitOrder("sell", 3, 1860);

      const [, options] = fetchMock.mock.calls[0]!;
      expect(JSON.parse(options.body)).toEqual({ type: "sell", amount: 3, price: 1860 });
    });

    it("cancelPendingOrder should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.cancelPendingOrder(789);

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/order/deleteOrder");
      expect(JSON.parse(options.body)).toEqual({ id: 789 });
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
      expect(url).toBe("https://api.test.com/order/history");
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
      expect(url).toContain("/order/history?");
      expect(url).toContain("page=2");
      expect(url).toContain("limit=10");
      expect(url).toContain("type=buy");
      expect(url).toContain("from_date=1711929600");
      expect(url).toContain("to_date=1712016000");
    });
  });

  describe("getTradingData", () => {
    it("should send GET request with auth", async () => {
      client.setToken("123:abc");
      const mockData = {
        success: true,
        data: {
          trader: { id: 123, tell: "09123456789", nickname: "john", margin: "1000.00", leverage: 1, open_trades: 2 },
          trades: [{ id: 456, type: "buy", amount: 5, price: "1850.25", remain_amount: 5, time: 1712345678 }],
          pendings: [{ id: 789, type: "buy", number: 3, price: 1840, status: "new" }],
          wsServerUrl: "wss://test",
          chartToken: "token123",
          chartLink: "https://chart.test",
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.getTradingData();

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/order/load");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(options.method).toBe("GET");
      expect(result).toEqual(mockData);
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
        data: { used: 0, limit: 100000000, remain: 100000000, countUsed: 0, countLimit: 3, countRemain: 3 },
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
        data: { used: 0, limit: 100000000, remain: 100000000, countUsed: 0, countLimit: 3, countRemain: 3 },
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
        data: { used: 0, limit: -1, remain: -1, countUsed: 0, countLimit: -1, countRemain: -1 },
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
        data: { used: 5000000, limit: 50000000, remain: 45000000, countUsed: 2, countLimit: 5, countRemain: 3 },
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
        message: "ok",
        data: {
          status: "step2_pending_review",
          level: "در انتظار بررسی احراز هویت سطح دوم",
          isActive: false,
          pendingLevel: "step2",
          steps: { step1: true, step2: false, step3: false },
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const result = await client.getKycStatus();

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/kyc/status");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(result).toEqual(mockData);
    });

    it("submitKycStep1 should send JSON POST request", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.submitKycStep1({
        fullname: "John Doe",
        nid: "0012345678",
        mobile: "09123456789",
        year: "1370",
        month: "01",
        day: "01",
      });

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/kyc/step1");
      expect(options.method).toBe("POST");
      expect(options.headers["x-token"]).toBe("123:abc");
      expect(options.headers["Content-Type"]).toContain("application/json");
      expect(JSON.parse(options.body)).toEqual({
        fullname: "John Doe",
        nid: "0012345678",
        mobile: "09123456789",
        year: "1370",
        month: "01",
        day: "01",
      });
    });

    it("submitKycStep2 should send FormData POST request with nidPic and commitment", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const mockFile = new File(["test"], "card.png", { type: "image/png" });

      await client.submitKycStep2({
        nidPic: mockFile,
        commitment: mockFile,
      });

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/kyc/step2");
      expect(options.body).toBeInstanceOf(FormData);
    });

    it("submitKycStep3 should send FormData POST request with commitmentSelfi", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      const mockFile = new File(["test"], "selfie.png", { type: "image/png" });

      await client.submitKycStep3({ commitmentSelfi: mockFile });

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

      await expect(client.submitKycStep3({ commitmentSelfi: mockFile })).rejects.toThrow(ApiError);

      try {
        await client.submitKycStep3({ commitmentSelfi: mockFile });
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

      await client.addCard("6037991234567890");

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/card/add");
      expect(JSON.parse(options.body)).toEqual({ cardnumber: "6037991234567890" });
    });

    it("deleteCard should send POST request with auth", async () => {
      client.setToken("123:abc");
      const mockData = { success: true, data: { success: true } };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.deleteCard(1);

      const [url, options] = fetchMock.mock.calls[0]!;
      expect(url).toBe("https://api.test.com/card/delete");
      expect(JSON.parse(options.body)).toEqual({ id: 1 });
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

    it("should use nested errors msg as message when available", async () => {
      const errorResponse = {
        success: false,
        message: "Bad request",
        data: {},
        errors: {
          general: {
            msg: "کاربر یافت نشد",
          },
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(errorResponse, 401, false));

      try {
        await client.login("baduser", "badpass");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
        expect((error as ApiError).message).toBe("کاربر یافت نشد");
        expect((error as ApiError).code).toBe("Bad request");
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
          token: "123:abc",
          trader: { id: 123, tell: "09123456789", fullname: "John", nickname: "john" },
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(mockData));

      await client.login("09123456789", "pass123");

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

  // ==================== Persistence ====================

  describe("persistence", () => {
    it("should restore token and trader from storage on init", () => {
      const storage = createMemoryStorageAdapter();
      storage.setItem(
        "moamelat:auth",
        JSON.stringify({ token: "stored:token", trader: { id: 99, tell: "0912", fullname: "Ali", nickname: "ali" } })
      );
      storage.setItem(
        "moamelat:profile",
        JSON.stringify({ id: 99, tell: "0912", nickname: "ali", fullname: "Ali", margin: 100, leverage: 1, commission: 0, obligation_status: "none", deposit_type: "irt", unique_code: "1", sell_count: 0, buy_count: 0, sell_avg: 0, buy_avg: 0, call_margin_price: { sell: 0, buy: 0 } })
      );

      const persistedClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        persistAuth: true,
        autoRefreshProfile: false,
        storage,
      });

      expect(persistedClient.getToken()).toBe("stored:token");
      expect(persistedClient.getTrader()).toEqual({ id: 99, tell: "0912", fullname: "Ali", nickname: "ali" });
      expect(persistedClient.getCachedProfile()?.id).toBe(99);
    });

    it("should persist auth after login", async () => {
      const storage = createMemoryStorageAdapter();
      const testClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        persistAuth: true,
        autoRefreshProfile: false,
        storage,
      });

      const loginData = {
        success: true,
        data: {
          token: "persisted:token",
          trader: { id: 77, tell: "0935", fullname: "Sara", nickname: "sara" },
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(loginData));

      await testClient.login("0935", "pass");

      const stored = JSON.parse(storage.getItem("moamelat:auth")!);
      expect(stored.token).toBe("persisted:token");
      expect(stored.trader.nickname).toBe("sara");
    });

    it("should clear storage on logout", async () => {
      const storage = createMemoryStorageAdapter();
      storage.setItem("moamelat:auth", JSON.stringify({ token: "t", trader: {} }));
      storage.setItem("moamelat:profile", JSON.stringify({ id: 1 }));

      const testClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        persistAuth: true,
        autoRefreshProfile: false,
        storage,
      });
      fetchMock.mockReturnValueOnce(createMockResponse({ success: true, data: { message: "ok" } }));

      await testClient.logout();

      expect(storage.getItem("moamelat:auth")).toBeNull();
      expect(storage.getItem("moamelat:profile")).toBeNull();
    });

    it("should not use storage when persistAuth is false", () => {
      const storage = createMemoryStorageAdapter();
      storage.setItem("moamelat:auth", JSON.stringify({ token: "t" }));

      const noPersistClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        persistAuth: false,
        storage,
      });

      expect(noPersistClient.getToken()).toBeNull();
    });
  });

  // ==================== Events ====================

  describe("events", () => {
    it("should emit login and authChange on successful login", async () => {
      const testClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        persistAuth: false,
        autoRefreshProfile: false,
      });
      const loginData = {
        success: true,
        data: {
          token: "evt:token",
          trader: { id: 1, tell: "0911", fullname: "A", nickname: "a" },
        },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(loginData));

      let loginPayload: any;
      let authChangePayload: any;
      testClient.on("login", (p) => { loginPayload = p; });
      testClient.on("authChange", (p) => { authChangePayload = p; });

      await testClient.login("0911", "pass");

      expect(loginPayload?.token).toBe("evt:token");
      expect(authChangePayload?.token).toBe("evt:token");
      expect(authChangePayload?.trader?.nickname).toBe("a");
    });

    it("should emit logout and authChange on logout", async () => {
      const testClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        persistAuth: false,
        autoRefreshProfile: false,
      });
      testClient.setToken("tok");
      fetchMock.mockReturnValueOnce(createMockResponse({ success: true, data: { message: "ok" } }));

      let logoutFired = false;
      let authChangePayload: any;
      testClient.on("logout", () => { logoutFired = true; });
      testClient.on("authChange", (p) => { authChangePayload = p; });

      await testClient.logout();

      expect(logoutFired).toBe(true);
      expect(authChangePayload?.token).toBeNull();
    });

    it("should allow unsubscribing via returned function", async () => {
      const testClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        persistAuth: false,
        autoRefreshProfile: false,
      });
      let count = 0;
      const unsub = testClient.on("login", () => { count++; });
      unsub();

      const loginData = {
        success: true,
        data: { token: "t", trader: { id: 1, tell: "09", fullname: "X", nickname: "x" } },
      };
      fetchMock.mockReturnValueOnce(createMockResponse(loginData));
      await testClient.login("09", "pass");

      expect(count).toBe(0);
    });
  });

  // ==================== Invalid Token Handling ====================

  describe("invalid token handling", () => {
    it("should emit invalidToken and clear auth on 401", async () => {
      const testClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        persistAuth: false,
        autoRefreshProfile: false,
        maxRetries: 0,
      });
      testClient.setToken("bad:token");

      const errorResponse = { success: false, message: "UNAUTHORIZED", data: {} };
      fetchMock.mockReturnValueOnce(createMockResponse(errorResponse, 401, false));

      let invalidPayload: ApiError | undefined;
      let authChangePayload: any;
      testClient.on("invalidToken", (e) => { invalidPayload = e; });
      testClient.on("authChange", (p) => { authChangePayload = p; });

      await expect(testClient.getMargin()).rejects.toThrow(ApiError);

      expect(testClient.getToken()).toBeNull();
      expect(invalidPayload?.status).toBe(401);
      expect(authChangePayload?.token).toBeNull();
    });

    it("should NOT emit invalidToken or clear auth on 403", async () => {
      const testClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        persistAuth: false,
        autoRefreshProfile: false,
        maxRetries: 0,
      });
      testClient.setToken("bad:token");

      const errorResponse = { success: false, message: "FORBIDDEN", data: {} };
      fetchMock.mockReturnValueOnce(createMockResponse(errorResponse, 403, false));

      let fired = false;
      testClient.on("invalidToken", () => { fired = true; });

      await expect(testClient.getMargin()).rejects.toThrow(ApiError);
      expect(fired).toBe(false);
      expect(testClient.getToken()).toBe("bad:token");
    });

    it("should emit invalidToken when error code contains TOKEN", async () => {
      const testClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        persistAuth: false,
        autoRefreshProfile: false,
        maxRetries: 0,
      });
      testClient.setToken("bad:token");

      const errorResponse = { success: false, message: "INVALID_TOKEN", data: {} };
      fetchMock.mockReturnValueOnce(createMockResponse(errorResponse, 400, false));

      let fired = false;
      testClient.on("invalidToken", () => { fired = true; });

      await expect(testClient.getMargin()).rejects.toThrow(ApiError);
      expect(fired).toBe(true);
    });
  });

  // ==================== Profile Refresh Timer ====================

  describe("profile refresh timer", () => {
    it("should auto-fetch profile after login and emit profileChange when data differs", async () => {
      const testClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        persistAuth: false,
        autoRefreshProfile: true,
        profileRefreshIntervalMs: 50,
      });

      const loginData = {
        success: true,
        data: {
          token: "timer:token",
          trader: { id: 10, tell: "0910", fullname: "Timer", nickname: "timer" },
        },
      };

      const profileV1 = {
        success: true,
        data: {
          id: 10,
          tell: "0910",
          nickname: "timer",
          fullname: "Timer",
          margin: 100,
          leverage: 1,
          commission: 0,
          obligation_status: "none",
          deposit_type: "irt",
          unique_code: "1",
          sell_count: 0,
          buy_count: 0,
          sell_avg: 0,
          buy_avg: 0,
          call_margin_price: { sell: 0, buy: 0 },
        },
      };

      const profileV2 = {
        success: true,
        data: {
          id: 10,
          tell: "0910",
          nickname: "timer",
          fullname: "Timer",
          margin: 200,
          leverage: 1,
          commission: 0,
          obligation_status: "none",
          deposit_type: "irt",
          unique_code: "1",
          sell_count: 0,
          buy_count: 0,
          sell_avg: 0,
          buy_avg: 0,
          call_margin_price: { sell: 0, buy: 0 },
        },
      };

      fetchMock
        .mockReturnValueOnce(createMockResponse(loginData))
        .mockReturnValueOnce(createMockResponse(profileV1))
        .mockReturnValueOnce(createMockResponse(profileV2));

      const changes: any[] = [];
      testClient.on("profileChange", (p) => { changes.push(p); });

      await testClient.login("0910", "pass");
      expect(testClient.getCachedProfile()?.margin).toBe(100);

      await new Promise((r) => setTimeout(r, 80));

      expect(changes.length).toBe(2);
      expect(changes[0].previous).toBeNull();
      expect(changes[0].current.margin).toBe(100);
      expect(changes[1].previous.margin).toBe(100);
      expect(changes[1].current.margin).toBe(200);
      expect(testClient.getCachedProfile()?.margin).toBe(200);

      // Cleanup timer so it doesn't leak into the next test
      testClient.clearToken();
    });

    it("should stop refreshing after logout", async () => {
      const testClient = new MoamelatClient({
        baseUrl: "https://api.test.com",
        persistAuth: false,
        autoRefreshProfile: true,
        profileRefreshIntervalMs: 50,
      });

      const loginData = {
        success: true,
        data: {
          token: "timer:token",
          trader: { id: 10, tell: "0910", fullname: "Timer", nickname: "timer" },
        },
      };

      const profile = {
        success: true,
        data: {
          id: 10,
          tell: "0910",
          nickname: "timer",
          fullname: "Timer",
          margin: 100,
          leverage: 1,
          commission: 0,
          obligation_status: "none",
          deposit_type: "irt",
          unique_code: "1",
          sell_count: 0,
          buy_count: 0,
          sell_avg: 0,
          buy_avg: 0,
          call_margin_price: { sell: 0, buy: 0 },
        },
      };

      fetchMock
        .mockReturnValueOnce(createMockResponse(loginData))
        .mockReturnValueOnce(createMockResponse(profile))
        .mockReturnValueOnce(createMockResponse({ success: true, data: { message: "ok" } }));

      await testClient.login("0910", "pass");
      await testClient.logout();

      const callCountAfterLogout = fetchMock.mock.calls.length;
      await new Promise((r) => setTimeout(r, 100));
      expect(fetchMock.mock.calls.length).toBe(callCountAfterLogout);
    });
  });
});
