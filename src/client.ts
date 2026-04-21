// ==================== Types ====================

type TradeType = 'buy' | 'sell';
type CloseType = 'all' | 'buy' | 'sell' | 'profit' | 'loss';

type KycStatus = string;
type ObligationStatus = 'none' | string;
type DepositType = 'irt' | string;
type CardStatus = 'success' | 'pending' | 'rejected' | string;
type OrderType = 'tpsl' | string;
type TpslAction = 'created' | 'updated' | 'deleted';
type WithdrawType = 'irt' | 'usdt' | 'neodigi';
type UsdtNetwork = 'trc20' | 'bep20';
type GatewayType = 'zibal' | string;

// --- Auth ---

export interface LoginResponse {
  token: string;
  device_id?: string;
  trader: {
    id: number;
    tell: string;
    fullname: string;
    nickname: string;
  };
}

export interface SendCodeResponse {
  mobile?: string;
  trader_id?: number;
}

export interface SetPasswordResponse {
  message?: string;
}

export interface ChangePasswordRequestResponse {
  mobile?: string;
  trader_id?: number;
}

export interface ChangePasswordResponse {
  message?: string;
}

export interface Device {
  id: number;
  device_id: string;
  device_name: string;
  device_type: string;
  user_agent: string;
  ip_address: string;
  last_activity: number;
  created_at: number;
  is_active: number;
  is_current: boolean;
}

export interface DeviceListResponse {
  devices: Device[];
}

export interface DeleteDeviceResponse {
  message?: string;
}

export interface DeleteOtherDevicesResponse {
  message?: string;
  deleted_count?: number;
}

export interface LogoutResponse {
  message?: string;
}

// --- Profile ---

export interface ProfileResponse {
  id: number;
  tell: string;
  nickname: string;
  fullname: string;
  nid?: string;
  birthdate?: string;
  margin: number;
  leverage: number;
  commission: number;
  obligation_status: ObligationStatus;
  deposit_type: DepositType;
  unique_code: string;
  sell_count: number;
  buy_count: number;
  sell_avg: number;
  buy_avg: number;
  call_margin_price: {
    sell: number;
    buy: number;
  };
}

// --- Trades ---

export interface OpenTrade {
  id: number;
  type: TradeType;
  amount: number;
  price: number;
  remain_amount: number;
  pnl: number;
}

export interface OpenTradesResponse {
  trades: OpenTrade[];
  totalPnl: number;
  buyCount: number;
  sellCount: number;
  buyAvg: number;
  sellAvg: number;
  currentBuyPrice: number;
  currentSellPrice: number;
}

export interface CapacityResponse {
  rate: number;
  loss: number;
  freeMargin: number;
  leverage: number;
  buy: number;
  sell: number;
}

export interface ReferralResponse {
  active: boolean;
  referralCount: number;
  totalIncome: number;
  link: string;
}

export interface OpenTradeResponse {
  success: boolean;
  result: {
    trade_id: number;
  };
}

export interface CloseTradeResponse {
  // Empty response data
}

export interface CloseAllTradesResponse {
  // Empty response data
}

export interface LeverageResponse {
  success: boolean;
  newLeverage: number;
  callMarginSell: number;
  callMarginBuy: number;
}

// --- TP/SL ---

export interface TpslResponse {
  success: boolean;
  action: TpslAction;
}

export interface CreateLimitOrderResponse {
  id: number;
}

export interface OrderLoadResponse {
  trader: {
    id: number;
    tell: string;
    nickname: string;
    margin: string;
    leverage: number;
    open_trades: number;
  };
  trades: Array<{
    id: number;
    type: TradeType;
    amount: number;
    price: string;
    remain_amount: number;
    time: number;
  }>;
  pendings: Array<{
    id: number;
    type: TradeType;
    number: number;
    price: number;
    status: string;
  }>;
  wsServerUrl: string;
  chartToken: string;
  chartLink: string;
}

export interface CancelPendingResponse {
  // Empty response data
}

// --- History ---

export interface TradeHistoryItem {
  id: number;
  type: TradeType;
  amount: number;
  price: string;
  close_price: string;
  time: number;
  close_time: number;
  pnl: string;
  commission_amount: string;
}

export interface TradeHistoryResponse {
  trades: TradeHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HistoryFilters {
  page?: number;
  limit?: number;
  type?: TradeType;
  from_date?: number;
  to_date?: number;
}

// --- Accounting ---

export interface MarginResponse {
  margin: number;
  leverage: number;
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  balance: number;
  date: number;
  description: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DepositConstraintsResponse {
  used: number;
  limit: number;
  remain: number;
  countUsed: number;
  countLimit: number;
  countRemain: number;
}

export interface WithdrawConstraintsResponse {
  used: number;
  limit: number;
  remain: number;
  countUsed: number;
  countLimit: number;
  countRemain: number;
}

// --- Accounting v2: Services Status ---

interface TimeStatus {
  active: boolean;
  timeAllowed: boolean;
  timeMessage: string | null;
}

interface SimpleStatus {
  active: boolean;
}

interface ScheduleInfo {
  start: string;
  end: string;
  days: string | null;
}

export interface ServicesStatusResponse {
  deposit: {
    irt: TimeStatus;
    usdt: SimpleStatus;
    neodigi: SimpleStatus;
    schedule: ScheduleInfo;
  };
  withdraw: {
    irt: TimeStatus;
    usdt: TimeStatus;
    neodigi: SimpleStatus;
    schedule_irt: ScheduleInfo;
    schedule_usdt: ScheduleInfo;
  };
  rates: {
    dollar_sell: string;
    dollar_buy: string;
  };
  balance: {
    margin: string;
    usdt_available: number;
  };
}

// --- Accounting v2: Deposit responses ---

export interface IrtDepositResponse {
  paymentId: number;
  link: string;
  amount: number;
  dollarSell: number;
  commission: number;
  wage: number;
}

export interface UsdtDepositResponse {
  address: string;
  network: string;
}

export interface NeodigiDepositResponse {
  unique_code: string;
  fullname: string;
}

export interface PendingVerifyResponse {
  hasPending: boolean;
}

export interface ManualDepositResponse {
  settleId: number;
  dollarRate: number;
  usdtAmount: number;
}

export interface WalletValidationResponse {
  valid: boolean;
  address: string;
  network: string;
}

interface ManualDepositData {
  amount: string;
  fishNumber: string;
  image: string;
}

// --- Accounting v2: Deposit/Withdraw ---

interface DepositResponse {
  success: boolean;
  url?: string;
  reference?: string;
  paymentId?: number;
  link?: string;
  amount?: number;
  dollarSell?: string;
  commission?: number;
  wage?: number;
}

export interface WithdrawResponse {
  reference?: string;
  settleId?: number;
  margin?: number;
  callMarginSell?: number;
  callMarginBuy?: number;
  irtValue?: number;
  wage?: number;
}

// --- KYC ---

export interface KycStatusResponse {
  status: KycStatus;
  level: string;
  isActive: boolean;
  pendingLevel: 'step1' | 'step2' | 'step3' | null;
  steps: {
    step1: boolean;
    step2: boolean;
    step3: boolean;
  };
}

export interface KycStep1Data {
  fullname: string;
  nid: string;
  mobile?: string;
  year?: string;
  month?: string;
  day?: string;
}

export interface KycStep2Data {
  nidPic?: File | string;
  commitment?: File | string;
}

export interface KycStep3Data {
  commitmentSelfi?: File | string;
}

export interface KycStep1Response {
  success: boolean;
  nextLevel?: string;
}

export interface KycResponse {
  success: boolean;
  message?: string;
}

// --- Cards ---

export interface Card {
  id: number;
  bank: string;
  number: string;
  shaba: string;
  status: CardStatus;
}

interface CardListResponse {
  cards: Card[];
}

export interface PendingOrder {
  id: number;
  trade_id: number;
  type: TradeType;
  order_type: string;
  number: number;
  price: number;
  base_price: number;
  tp?: number;
  sl?: number;
  status: string;
  date: number;
}

export interface GetPendingOrdersResponse {
  orders: PendingOrder[];
}

export interface AiChatResponse {
  text: string;
  conversation_id: number;
}

export interface AiConversation {
  id: number;
  channel: 'telegram' | 'api';
  title: string | null;
  created_at: number;
  last_activity: number;
}

export interface AiConversationsResponse {
  conversations: AiConversation[];
}

export interface AiMessage {
  id: number;
  role: 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_name: string | null;
  tool_args: Record<string, unknown> | null;
  created_at: number;
}

export interface AiMessagesResponse {
  messages: AiMessage[];
}

interface AddCardResponse extends Card {}

interface DeleteCardResponse {
  deleted?: boolean;
}

interface EditNicknameResponse {
  success?: boolean;
  message?: string;
}

// --- Generic API Response ---

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, any>;
}

// ==================== Error Class ====================

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
    public readonly code?: string,
    public readonly response?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ==================== Storage Adapters ====================

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createLocalStorageAdapter(): StorageAdapter | null {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.localStorage !== 'undefined'
  ) {
    return {
      getItem: (key) => globalThis.localStorage.getItem(key),
      setItem: (key, value) => globalThis.localStorage.setItem(key, value),
      removeItem: (key) => globalThis.localStorage.removeItem(key),
    };
  }
  return null;
}

export function createMemoryStorageAdapter(): StorageAdapter {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };
}

// ==================== Events ====================

export type ClientEvent = 'login' | 'logout' | 'invalidToken' | 'authChange' | 'profileChange';

export interface AuthState {
  token: string | null;
  trader: LoginResponse['trader'] | null;
  profile: ProfileResponse | null;
}

export interface ProfileChangePayload {
  previous: ProfileResponse | null;
  current: ProfileResponse;
}

interface ClientEventMap {
  login: LoginResponse;
  logout: void;
  invalidToken: ApiError;
  authChange: AuthState;
  profileChange: ProfileChangePayload;
}

// ==================== Client ====================

interface ClientOptions {
  baseUrl?: string;
  token?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  persistAuth?: boolean;
  autoRefreshProfile?: boolean;
  profileRefreshIntervalMs?: number;
  storage?: StorageAdapter;
  storageKeyPrefix?: string;
  clientIp?: string;
  userAgent?: string;
}

const RETRYABLE_CODES = ['RATE_LIMITED', 'BOT_DISABLED'];
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;
const DEFAULT_STORAGE_KEY_PREFIX = 'moamelat';
const DEFAULT_PROFILE_REFRESH_INTERVAL_MS = 60000;

export class MoamelatClient {
  private baseUrl: string;
  private token: string | null;
  private maxRetries: number;
  private retryDelayMs: number;

  // Auth state
  private trader: LoginResponse['trader'] | null = null;
  private cachedProfile: ProfileResponse | null = null;

  // Persistence
  private persistAuth: boolean;
  private autoRefreshProfile: boolean;
  private profileRefreshIntervalMs: number;
  private profileRefreshTimer: ReturnType<typeof setInterval> | null = null;
  private storage: StorageAdapter | null;
  private storageKeyPrefix: string;

  // Original client info (for server-side proxying)
  private clientIp: string | null;
  private userAgent: string | null;

  // Events
  private events = new Map<ClientEvent, Set<(payload: any) => void>>();

  constructor(options: ClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'https://api.moamelat.com';
    this.token = options.token ?? null;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY;
    this.persistAuth = options.persistAuth ?? true;
    this.autoRefreshProfile = options.autoRefreshProfile ?? true;
    this.profileRefreshIntervalMs =
      options.profileRefreshIntervalMs ?? DEFAULT_PROFILE_REFRESH_INTERVAL_MS;
    this.storageKeyPrefix = options.storageKeyPrefix ?? DEFAULT_STORAGE_KEY_PREFIX;
    this.clientIp = options.clientIp ?? null;
    this.userAgent = options.userAgent ?? null;

    if (this.persistAuth) {
      this.storage = options.storage ?? createLocalStorageAdapter() ?? createMemoryStorageAdapter();
      this._restoreFromStorage();
    } else {
      this.storage = null;
    }

    if (this.token && this.autoRefreshProfile) {
      this.startProfileRefresh();
    }
  }

  // --- Event Management ---

  on<E extends keyof ClientEventMap>(
    event: E,
    listener: (payload: ClientEventMap[E]) => void,
  ): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off<E extends keyof ClientEventMap>(
    event: E,
    listener: (payload: ClientEventMap[E]) => void,
  ): void {
    this.events.get(event)?.delete(listener);
  }

  private emit<E extends keyof ClientEventMap>(event: E, payload: ClientEventMap[E]): void {
    this.events.get(event)?.forEach((listener) => {
      try {
        listener(payload);
      } catch {
        // Ignore listener errors
      }
    });
  }

  // --- Storage Helpers ---

  private _authKey(): string {
    return `${this.storageKeyPrefix}:auth`;
  }

  private _profileKey(): string {
    return `${this.storageKeyPrefix}:profile`;
  }

  private _persistAuth(): void {
    if (!this.persistAuth || !this.storage) return;
    const payload = JSON.stringify({ token: this.token, trader: this.trader });
    this.storage.setItem(this._authKey(), payload);
  }

  private _persistProfile(): void {
    if (!this.persistAuth || !this.storage) return;
    if (this.cachedProfile) {
      this.storage.setItem(this._profileKey(), JSON.stringify(this.cachedProfile));
    } else {
      this.storage.removeItem(this._profileKey());
    }
  }

  private _restoreFromStorage(): void {
    if (!this.persistAuth || !this.storage) return;
    try {
      const authRaw = this.storage.getItem(this._authKey());
      if (authRaw) {
        const parsed = JSON.parse(authRaw) as { token?: string; trader?: LoginResponse['trader'] };
        if (parsed.token) {
          this.token = parsed.token;
        }
        if (parsed.trader) {
          this.trader = parsed.trader;
        }
      }
    } catch {
      // Ignore parse errors
    }

    try {
      const profileRaw = this.storage.getItem(this._profileKey());
      if (profileRaw) {
        this.cachedProfile = JSON.parse(profileRaw) as ProfileResponse;
      }
    } catch {
      // Ignore parse errors
    }
  }

  private _clearStorage(): void {
    if (!this.persistAuth || !this.storage) return;
    this.storage.removeItem(this._authKey());
    this.storage.removeItem(this._profileKey());
  }

  // --- Profile Refresh Timer ---

  private startProfileRefresh(): void {
    this.stopProfileRefresh();
    if (!this.autoRefreshProfile || !this.token) return;
    this.profileRefreshTimer = setInterval(() => {
      this._fetchAndCacheProfile().catch(() => {
        // Ignore background refresh errors
      });
    }, this.profileRefreshIntervalMs);
  }

  private stopProfileRefresh(): void {
    if (this.profileRefreshTimer) {
      clearInterval(this.profileRefreshTimer);
      this.profileRefreshTimer = null;
    }
  }

  private async _fetchAndCacheProfile(): Promise<void> {
    const result = await this.getProfile();
    const profile = result.data;
    const changed = JSON.stringify(profile) !== JSON.stringify(this.cachedProfile);
    if (changed) {
      const previous = this.cachedProfile;
      this.cachedProfile = profile;
      this._persistProfile();
      this.emit('profileChange', { previous, current: profile });
      this.emit('authChange', this.getAuthState());
    }
  }

  // --- Token Management ---

  setToken(token: string): void {
    this.token = token;
    this._persistAuth();
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken(): void {
    this.stopProfileRefresh();
    this.token = null;
    this.trader = null;
    this.cachedProfile = null;
    this._clearStorage();
  }

  // --- Auth Getters ---

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getTrader(): LoginResponse['trader'] | null {
    return this.trader;
  }

  getCachedProfile(): ProfileResponse | null {
    return this.cachedProfile;
  }

  getAuthState(): AuthState {
    return {
      token: this.token,
      trader: this.trader,
      profile: this.cachedProfile,
    };
  }

  // --- Client Info Management ---

  setClientIp(ip: string | null): void {
    this.clientIp = ip;
  }

  getClientIp(): string | null {
    return this.clientIp;
  }

  setUserAgent(userAgent: string | null): void {
    this.userAgent = userAgent;
  }

  getUserAgent(): string | null {
    return this.userAgent;
  }

  // --- Auth Methods ---

  async login(mobile: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const result = await this.request<LoginResponse>('POST', '/auth/login', {
      body: { id: mobile, password },
    });
    if (result.success && result.data) {
      this.token = result.data.token;
      this.trader = result.data.trader;
      this._persistAuth();
      this.emit('login', result.data);
      this.emit('authChange', this.getAuthState());
      if (this.autoRefreshProfile) {
        await this._fetchAndCacheProfile().catch(() => {
          // Ignore initial profile fetch errors
        });
        this.startProfileRefresh();
      }
    }
    return result;
  }

  async signupVerify(tell: string, code: string): Promise<ApiResponse<LoginResponse>> {
    const result = await this.request<LoginResponse>('POST', '/auth/signup/verify', {
      body: { tell, code },
    });
    if (result.success && result.data) {
      this.token = result.data.token;
      this.trader = result.data.trader;
      this._persistAuth();
      this.emit('login', result.data);
      this.emit('authChange', this.getAuthState());
      if (this.autoRefreshProfile) {
        await this._fetchAndCacheProfile().catch(() => {
          // Ignore initial profile fetch errors
        });
        this.startProfileRefresh();
      }
    }
    return result;
  }

  async sendCode(
    tell: string,
    chat_id?: string,
    type?: 'set_password' | 'reset_password' | 'signup',
  ): Promise<ApiResponse<SendCodeResponse>> {
    const body: Record<string, unknown> = { tell };
    if (chat_id) body.chat_id = chat_id;
    if (type) body.type = type;
    return this.request<SendCodeResponse>('POST', '/auth/send-code', { body });
  }

  async setPassword(
    trader_id: number,
    password: string,
    code: string,
  ): Promise<ApiResponse<SetPasswordResponse>> {
    return this.request<SetPasswordResponse>('POST', '/auth/set-password', {
      body: { trader_id, password, code },
    });
  }

  async requestChangePassword(
    newPassword: string,
  ): Promise<ApiResponse<ChangePasswordRequestResponse>> {
    return this.request<ChangePasswordRequestResponse>('POST', '/auth/change-password/request', {
      body: { new_password: newPassword },
      auth: true,
    });
  }

  async changePassword(
    newPassword: string,
    code: string,
  ): Promise<ApiResponse<ChangePasswordResponse>> {
    return this.request<ChangePasswordResponse>('POST', '/auth/change-password', {
      body: { new_password: newPassword, code },
      auth: true,
    });
  }

  async logout(): Promise<ApiResponse<LogoutResponse>> {
    const result = await this.request<LogoutResponse>('POST', '/auth/logout', { auth: true });
    this.stopProfileRefresh();
    this.token = null;
    this.trader = null;
    this.cachedProfile = null;
    this._clearStorage();
    this.emit('logout', undefined);
    this.emit('authChange', this.getAuthState());
    return result;
  }

  async listDevices(): Promise<ApiResponse<DeviceListResponse>> {
    return this.request<DeviceListResponse>('GET', '/auth/devices', { auth: true });
  }

  async deleteDevice(deviceId: string): Promise<ApiResponse<DeleteDeviceResponse>> {
    return this.request<DeleteDeviceResponse>('POST', '/auth/devices/delete', {
      body: { device_id: deviceId },
      auth: true,
    });
  }

  async deleteOtherDevices(): Promise<ApiResponse<DeleteOtherDevicesResponse>> {
    return this.request<DeleteOtherDevicesResponse>('POST', '/auth/devices/delete-others', {
      auth: true,
    });
  }

  // --- Profile Methods ---

  async getProfile(): Promise<ApiResponse<ProfileResponse>> {
    return this.request<ProfileResponse>('GET', '/trader/profile', { auth: true });
  }

  async getOpenTrades(): Promise<ApiResponse<OpenTradesResponse>> {
    return this.request<OpenTradesResponse>('GET', '/order/open-trades', { auth: true });
  }

  async getCapacity(rate?: number): Promise<ApiResponse<CapacityResponse>> {
    const query = rate !== undefined ? `?rate=${rate}` : '';
    return this.request<CapacityResponse>('GET', `/order/capacity${query}`, { auth: true });
  }

  async getReferral(): Promise<ApiResponse<ReferralResponse>> {
    return this.request<ReferralResponse>('GET', '/trader/referral', { auth: true });
  }

  async editNickname(nickname: string): Promise<ApiResponse<EditNicknameResponse>> {
    return this.request<EditNicknameResponse>('POST', '/trader/edit-nickname', {
      body: { nickname },
      auth: true,
    });
  }

  // --- Trading Methods ---

  async openTrade(type: TradeType, amount: number): Promise<ApiResponse<OpenTradeResponse>> {
    return this.request<OpenTradeResponse>('POST', '/order/trade', {
      body: { type, amount },
      auth: true,
    });
  }

  async closeTrade(tradeId: number): Promise<ApiResponse<CloseTradeResponse>> {
    return this.request<CloseTradeResponse>('POST', '/order/close', {
      body: { id: tradeId },
      auth: true,
    });
  }

  async closeAllTrades(type: CloseType): Promise<ApiResponse<CloseAllTradesResponse>> {
    return this.request<CloseAllTradesResponse>('POST', '/order/closeAll', {
      body: { type },
      auth: true,
    });
  }

  async changeLeverage(leverage: number): Promise<ApiResponse<LeverageResponse>> {
    return this.request<LeverageResponse>('POST', '/trader/changeLeverage', {
      body: { leverage },
      auth: true,
    });
  }

  // --- TP/SL & Limit Orders ---

  async updateTPSL(tradeId: number, tp?: number, sl?: number): Promise<ApiResponse<TpslResponse>> {
    return this.request<TpslResponse>('POST', '/order/setTpSl', {
      body: { id: tradeId, tp: tp ?? 0, sl: sl ?? 0 },
      auth: true,
    });
  }

  async createLimitOrder(
    type: TradeType,
    amount: number,
    price: number,
    tp?: number,
    sl?: number,
  ): Promise<ApiResponse<CreateLimitOrderResponse>> {
    const body: Record<string, unknown> = { type, amount, price };
    if (tp !== undefined) body.tp = tp;
    if (sl !== undefined) body.sl = sl;
    return this.request<CreateLimitOrderResponse>('POST', '/order/pending', { body, auth: true });
  }

  async getPendingOrders(status?: string): Promise<ApiResponse<GetPendingOrdersResponse>> {
    const query = status !== undefined ? `?status=${encodeURIComponent(status)}` : '';
    return this.request<GetPendingOrdersResponse>('GET', `/order/pending${query}`, {
      auth: true,
    });
  }

  async cancelPendingOrder(pendingId: number): Promise<ApiResponse<CancelPendingResponse>> {
    return this.request<CancelPendingResponse>('POST', '/order/deleteOrder', {
      body: { id: pendingId },
      auth: true,
    });
  }

  // --- History Methods ---

  async getHistory(filters?: HistoryFilters): Promise<ApiResponse<TradeHistoryResponse>> {
    const params = new URLSearchParams();
    if (filters?.page !== undefined) params.set('page', String(filters.page));
    if (filters?.limit !== undefined) params.set('limit', String(filters.limit));
    if (filters?.type) params.set('type', filters.type);
    if (filters?.from_date) params.set('from_date', String(filters.from_date));
    if (filters?.to_date) params.set('to_date', String(filters.to_date));
    const query = params.toString();
    return this.request<TradeHistoryResponse>(
      'GET',
      `/order/history${query ? `?${query}` : ''}`,
      { auth: true },
    );
  }

  async getTradingData(): Promise<ApiResponse<OrderLoadResponse>> {
    return this.request<OrderLoadResponse>('GET', '/order/load', { auth: true });
  }

  // --- Accounting Methods ---

  async getServicesStatus(): Promise<ApiResponse<ServicesStatusResponse>> {
    return this.request<ServicesStatusResponse>('GET', '/accounting/services-status', {
      auth: true,
    });
  }

  async getMargin(): Promise<ApiResponse<MarginResponse>> {
    return this.request<MarginResponse>('GET', '/accounting/margin', { auth: true });
  }

  async getTransactions(page = 1, type?: string): Promise<ApiResponse<TransactionsResponse>> {
    const query = type ? `&type=${type}` : '';
    return this.request<TransactionsResponse>(
      'GET',
      `/accounting/transactions?page=${page}${query}`,
      { auth: true },
    );
  }

  async getDepositConstraints(): Promise<ApiResponse<DepositConstraintsResponse>> {
    return this.request<DepositConstraintsResponse>('GET', '/accounting/deposit/constraints', {
      auth: true,
    });
  }

  async getWithdrawConstraints(
    cardNumber?: string,
    withdrawType: 'irt' | 'usdt' = 'irt',
  ): Promise<ApiResponse<WithdrawConstraintsResponse>> {
    const params = new URLSearchParams();
    if (cardNumber) params.set('cardnumber', cardNumber);
    params.set('withdrawType', withdrawType);
    const query = params.toString();
    return this.request<WithdrawConstraintsResponse>(
      'GET',
      `/accounting/withdraw/constraints${query ? `?${query}` : ''}`,
      { auth: true },
    );
  }

  async depositIRT(amount: number, cardnumber: string): Promise<ApiResponse<IrtDepositResponse>> {
    return this.request<IrtDepositResponse>('POST', '/accounting/deposit/irt', {
      body: { amount, cardnumber },
      auth: true,
    });
  }

  async depositManual(data: ManualDepositData): Promise<ApiResponse<ManualDepositResponse>> {
    return this.request<ManualDepositResponse>('POST', '/accounting/deposit/manual', {
      body: { amount: data.amount, fishNumber: data.fishNumber, image: data.image },
      auth: true,
    });
  }

  async depositUSDT(network: UsdtNetwork = 'trc20'): Promise<ApiResponse<UsdtDepositResponse>> {
    return this.request<UsdtDepositResponse>(
      'GET',
      `/accounting/deposit/usdt?network=${network}`,
      { auth: true },
    );
  }

  async getNeodigiDepositInfo(): Promise<ApiResponse<NeodigiDepositResponse>> {
    return this.request<NeodigiDepositResponse>('GET', '/accounting/deposit/neodigi', {
      auth: true,
    });
  }

  async checkPendingDepositVerify(): Promise<ApiResponse<PendingVerifyResponse>> {
    return this.request<PendingVerifyResponse>('GET', '/accounting/deposit/pending-verify', {
      auth: true,
    });
  }

  async validateWallet(address: string, network: UsdtNetwork = 'trc20'): Promise<ApiResponse<WalletValidationResponse>> {
    return this.request<WalletValidationResponse>('POST', '/accounting/wallet/validate', {
      body: { address, network },
      auth: true,
    });
  }

  async withdraw(options: {
    withdrawType: WithdrawType;
    amount: number;
    cardnumber?: string;
    wallet?: string;
    network?: UsdtNetwork;
    neodigiAccount?: string;
    neodigiName?: string;
  }): Promise<ApiResponse<WithdrawResponse>> {
    const body: Record<string, unknown> = {
      withdrawType: options.withdrawType,
      amount: options.amount,
    };
    if (options.cardnumber) body.cardnumber = options.cardnumber;
    if (options.wallet) body.wallet = options.wallet;
    if (options.network) body.network = options.network;
    if (options.neodigiAccount) body.neodigiAccount = options.neodigiAccount;
    if (options.neodigiName) body.neodigiName = options.neodigiName;
    return this.request<WithdrawResponse>('POST', '/accounting/withdraw', { body, auth: true });
  }

  // --- KYC Methods ---

  async getKycStatus(): Promise<ApiResponse<KycStatusResponse>> {
    return this.request<KycStatusResponse>('GET', '/kyc/status', { auth: true });
  }

  async submitKycStep1(data: KycStep1Data): Promise<ApiResponse<KycStep1Response>> {
    return this.request<KycStep1Response>('POST', '/kyc/step1', { body: data, auth: true });
  }

  async submitKycStep2(data: KycStep2Data): Promise<ApiResponse<KycResponse>> {
    return this.requestFormData<KycResponse>('POST', '/kyc/step2', data as Record<string, string | File>, {
      auth: true,
    });
  }

  async submitKycStep3(data: KycStep3Data): Promise<ApiResponse<KycResponse>> {
    return this.requestFormData<KycResponse>('POST', '/kyc/step3', data as Record<string, string | File>, {
      auth: true,
    });
  }

  // --- Card Methods ---

  async listCards(): Promise<ApiResponse<CardListResponse>> {
    return this.request<CardListResponse>('GET', '/card/list', { auth: true });
  }

  async addCard(cardnumber: string): Promise<ApiResponse<AddCardResponse>> {
    return this.request<AddCardResponse>('POST', '/card/add', { body: { cardnumber }, auth: true });
  }

  async deleteCard(cardId: number): Promise<ApiResponse<DeleteCardResponse>> {
    return this.request<DeleteCardResponse>('POST', '/card/delete', {
      body: { id: cardId },
      auth: true,
    });
  }

  // --- AI Methods ---

  async aiChat(message: string, conversation_id?: number): Promise<ApiResponse<AiChatResponse>> {
    const body: Record<string, unknown> = { message };
    if (conversation_id !== undefined) body.conversation_id = conversation_id;
    return this.request<AiChatResponse>('POST', '/ai/chat', { body, auth: true });
  }

  async listAiConversations(limit = 20): Promise<ApiResponse<AiConversationsResponse>> {
    return this.request<AiConversationsResponse>('GET', `/ai/conversations?limit=${limit}`, {
      auth: true,
    });
  }

  async getAiConversationMessages(
    id: number,
    limit = 50,
  ): Promise<ApiResponse<AiMessagesResponse>> {
    return this.request<AiMessagesResponse>(
      'GET',
      `/ai/conversations/${id}/messages?limit=${limit}`,
      { auth: true },
    );
  }

  // --- Internal Request Methods ---

  private _extractErrorMessage(data: any): string {
    if (data && typeof data.errors === 'object' && data.errors !== null) {
      for (const value of Object.values(data.errors)) {
        if (typeof value === 'string') return value;
        if (value && typeof (value as any).msg === 'string') return (value as any).msg;
      }
    }
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    return 'Request failed';
  }

  private _extractErrorCode(data: any): string | undefined {
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    return undefined;
  }

  private async request<T>(
    method: string,
    path: string,
    options: { body?: object; auth?: boolean } = {},
  ): Promise<ApiResponse<T>> {
    const { body, auth } = options;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.maxRetries) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (auth && this.token) {
          headers['x-token'] = this.token;
        }

        if (this.clientIp) {
          headers['x-client-ip'] = this.clientIp;
        }

        if (this.userAgent) {
          headers['x-client-user-agent'] = this.userAgent;
        }

        const url = `${this.baseUrl}${path}`;
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        const data = (await response.json()) as ApiResponse<T>;

        if (!response.ok) {
          const errorMessage = this._extractErrorMessage(data) || response.statusText;
          const errorCode = this._extractErrorCode(data);

          if (RETRYABLE_CODES.includes(errorCode ?? '') && attempt < this.maxRetries) {
            const delay = this.retryDelayMs * Math.pow(2, attempt);
            await this.sleep(delay);
            attempt++;
            lastError = new Error(`Retryable error: ${errorCode}`);
            continue;
          }

          throw new ApiError(errorMessage, response.status, response.statusText, errorCode, data);
        }

        return data;
      } catch (error) {
        if (error instanceof ApiError) {
          if (auth && this._isInvalidTokenError(error)) {
            this.clearToken();
            this.emit('invalidToken', error);
            this.emit('authChange', this.getAuthState());
          }
          throw error;
        }

        if (error instanceof TypeError && attempt < this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt);
          await this.sleep(delay);
          attempt++;
          lastError = error;
          continue;
        }

        throw error;
      }
    }

    throw lastError ?? new ApiError('Request failed after retries', 0, 'Unknown');
  }

  private async requestFormData<T>(
    method: string,
    path: string,
    data: Record<string, string | File>,
    options: { auth?: boolean } = {},
  ): Promise<ApiResponse<T>> {
    const { auth } = options;
    const formData = new FormData();

    for (const [key, value] of Object.entries(data)) {
      formData.append(key, value);
    }

    const headers: Record<string, string> = {};
    if (auth && this.token) {
      headers['x-token'] = this.token;
    }

    if (this.clientIp) {
      headers['x-client-ip'] = this.clientIp;
    }

    if (this.userAgent) {
      headers['x-client-user-agent'] = this.userAgent;
    }

    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers,
      body: formData,
    });

    const responseData = (await response.json()) as ApiResponse<T>;

    if (!response.ok) {
      const errorMessage = this._extractErrorMessage(responseData) || response.statusText;
      const errorCode = this._extractErrorCode(responseData);
      const error = new ApiError(errorMessage, response.status, response.statusText, errorCode, responseData);
      if (auth && this._isInvalidTokenError(error)) {
        this.clearToken();
        this.emit('invalidToken', error);
        this.emit('authChange', this.getAuthState());
      }
      throw error;
    }

    return responseData;
  }

  private _isInvalidTokenError(error: ApiError): boolean {
    return (
      error.status === 401 ||
      (error.code != null && error.code.toUpperCase().includes('TOKEN'))
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
