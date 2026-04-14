// Centralized type definitions for dashboard data models and API responses.
// Keep these in sync with the mock Cloudflare worker payloads to ensure
// components and API helpers share the same shapes.

// Business dashboard
export interface BusinessStat {
  id: string;
  label: string;
  value: number;
  unit: "usd" | "count";
  changePct: number;
}

export interface BusinessLead {
  id: string;
  name: string;
  service: string;
  value: number;
  status: "New" | "Quoted" | "Approved";
}

export interface NcsStatus {
  id: string;
  name: string;
  status: "active" | "idle" | "error";
  lastRun: string;
}

export interface BusinessStatsResponse {
  stats: BusinessStat[];
  recentLeads: BusinessLead[];
  ncsStatus: NcsStatus[];
}

// Lead management
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  location: string;
  value: number;
  status: "New" | "Contacted" | "Quoted" | "Approved" | "Completed";
  date: string;
  notes: string;
}

export interface LeadManagementResponse {
  leads: Lead[];
}

// Worker control
export type WorkerType = "automation" | "monitoring" | "processing";
export type WorkerStatus = "running" | "stopped" | "error" | "idle";

export interface WorkerMetrics {
  tasksCompleted: number;
  successRate: number;
  avgRunTimeSeconds: number;
}

export interface Worker {
  id: string;
  name: string;
  type: WorkerType;
  status: WorkerStatus;
  lastRun: string;
  nextRun?: string;
  description: string;
  metrics: WorkerMetrics;
}

export interface WorkersSummary {
  systemHealthPct: number;
  activeWorkers: number;
  totalWorkers: number;
  uptimePct: number;
  errors: number;
}

export interface WorkersResponse {
  summary: WorkersSummary;
  workers: Worker[];
}

// NCS worker runtime status
export type NcsWorkerRuntimeStatus = "idle" | "busy" | "error";
export type NcsStatusSource = "supabase" | "service" | "stub";

export interface NcsWorkerJob {
  id: string | null;
  name: string | null;
  type: string | null;
  queue: string | null;
  progressPct: number | null;
  details: Record<string, unknown> | null;
  error: string | null;
}

export interface NcsWorkerTimestamps {
  createdAt: string | null;
  updatedAt: string | null;
  pausedAt: string | null;
  lastHeartbeatAt: string | null;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
}

export interface NcsWorkerStatusRecord {
  id: string;
  workerKey: string;
  name: string;
  status: NcsWorkerRuntimeStatus;
  rawStatus: string | null;
  statusMessage: string | null;
  isPaused: boolean;
  source: NcsStatusSource;
  job: NcsWorkerJob;
  timestamps: NcsWorkerTimestamps;
}

export interface NcsStatusSummary {
  totalWorkers: number;
  idleWorkers: number;
  busyWorkers: number;
  errorWorkers: number;
  pausedWorkers: number;
}

export interface NcsStatusResponse {
  generatedAt: string;
  source: NcsStatusSource;
  summary: NcsStatusSummary;
  workers: NcsWorkerStatusRecord[];
}

export interface NcsControlWorkerActionResponse {
  ok: boolean;
  action: "pause" | "resume";
  workerId: string;
  stub: boolean;
  message: string;
}

// Business cards
export type BusinessStatus = "Active" | "Growing" | "Paused";

export interface BusinessCard {
  id: string;
  name: string;
  description: string;
  image: string;
  status: BusinessStatus;
  stats: Record<string, number | string>;
}

export interface BusinessCardsResponse {
  businesses: BusinessCard[];
}

// LeadBot
export type CampaignStatus = "ACTIVE" | "SCHEDULED" | "COMPLETED";
export type LeadBotLeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED";
export type LeadBotPlatformFilter = "all" | "meta" | "instagram" | "tiktok";
export type LeadBotDateRange = "7" | "30" | "90";

export interface LeadBotOverview {
  totalLeads: number;
  monthlyLeads: number;
  conversionRate: number;
  activeCampaigns: number;
}

export interface Campaign {
  id: string;
  platform: string;
  content: string;
  timestamp: string;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  leads: number;
  engagement: number;
  status: CampaignStatus;
  scheduledTime?: string;
}

export interface LeadBotPlatform {
  name: string;
  status: "connected" | "pending";
  posts: number;
  leads: number;
}

export interface LeadBotRecentLead {
  id: string;
  name: string;
  phone: string;
  service: string;
  source: string;
  timestamp: string;
  status: LeadBotLeadStatus;
}

export interface LeadBotResponse {
  overview: LeadBotOverview;
  campaigns: Campaign[];
  platforms: LeadBotPlatform[];
  recentLeads: LeadBotRecentLead[];
  errors?: string[];
}

// TradingBot
export type SupportedTradingExchangeId =
  | "binance"
  | "coinbase"
  | "kraken"
  | "kucoin"
  | "okx";
export type TradingProviderId = "binance" | "coinbase";
export type TradingConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error"
  | "disconnected";

export type TradeType = "BUY" | "SELL";
export type TradeStatus = "OPEN" | "CLOSED" | "PENDING";

export interface Trade {
  id: string;
  pair: string;
  type: TradeType;
  amount: number;
  price: number;
  profit: number;
  timestamp: string;
  status: TradeStatus;
  exchange?: string;
  provider?: TradingProviderId;
  marketPrice?: number;
  fee?: number;
}

export interface Signal {
  pair: string;
  direction: "UP" | "DOWN";
  strength: number;
  confidence: number;
  timeframe: string;
  exchange?: string;
  provider?: TradingProviderId;
  price?: number;
  changePct?: number;
  bid?: number | null;
  ask?: number | null;
  timestamp?: string;
}

export interface TradingBalanceUpdate {
  id: string;
  exchange: string;
  provider: TradingProviderId;
  asset: string;
  currency: string;
  totalBalance: number;
  availableBalance: number;
  lockedBalance: number;
  change: number | null;
  timestamp: string;
}

export interface TradingPlatform {
  name: string;
  provider?: TradingProviderId;
  status: TradingConnectionStatus;
  balance: number;
  currency?: string;
  message?: string;
  updatedAt?: string;
  marketStatus?: TradingConnectionStatus;
  accountStatus?: TradingConnectionStatus;
  reconnectAttempts?: number;
  subscribedSymbols?: string[];
}

export interface TradingStreamInfo {
  defaultSymbols: string[];
  providers: TradingProviderId[];
  reconnectDelayMs: number;
}

export interface TradingStreamConnectedPayload {
  connectionId: string;
  providers: TradingProviderId[];
  symbols: string[];
  heartbeatIntervalMs: number;
  reconnectDelayMs: number;
  platforms?: Array<{
    provider: TradingProviderId;
    exchange: string;
    subscribedSymbols: string[];
  }>;
}

export interface TradingProviderStatusEvent {
  provider: TradingProviderId;
  exchange: string;
  scope: "market" | "account";
  status: TradingConnectionStatus;
  message: string;
  reconnectAttempt: number;
  timestamp: string;
  subscribedSymbols: string[];
}

export interface TradingStreamErrorEvent {
  provider?: TradingProviderId;
  exchange?: string;
  scope?: "market" | "account" | "stream";
  message: string;
  recoverable: boolean;
  timestamp: string;
}

export interface TradingBotResponse {
  botStatus: { active: boolean };
  balances: { totalBalance: number; dailyProfit: number; winRate: number };
  trades: Trade[];
  signals: Signal[];
  platforms: TradingPlatform[];
  balanceUpdates?: TradingBalanceUpdate[];
  stream?: TradingStreamInfo;
}

export interface TradingExchangeKeyInput {
  exchangeId: SupportedTradingExchangeId;
  apiKey: string;
  secret: string;
}

export interface SaveTradingExchangeKeysResponse {
  ok: boolean;
  saved: SupportedTradingExchangeId[];
  message?: string;
}

export type TradingCreateOrderSide = "BUY" | "SELL";
export type TradingCreateOrderType = "MARKET" | "LIMIT";

export interface TradingCreateOrderInput {
  symbol: string;
  side: TradingCreateOrderSide;
  amount: number;
  type?: TradingCreateOrderType;
  price?: number;
}

export interface TradingExecuteOrderResponse {
  ok: boolean;
  action: "create";
  exchange: string;
  symbol: string;
  side: TradingCreateOrderSide;
  type: TradingCreateOrderType;
  amount: number;
  price: number | null;
  order: Record<string, unknown>;
  executedBy?: {
    userId: string;
    role: string;
  };
}

export interface TradingCancelOrderResponse {
  ok: boolean;
  action: "cancel";
  exchange: string;
  orderId: string;
  symbol: string | null;
  order: Record<string, unknown>;
  executedBy?: {
    userId: string;
    role: string;
  };
}

// Customer portal
export type BillingPeriod = "monthly" | "yearly";
export type SubscriberStatus = "active" | "paused" | "cancelled";

export interface ServicePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  period: BillingPeriod;
  features: string[];
  popular?: boolean;
  roi: string;
}

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  service: string;
  joinDate: string;
  revenue: number;
  status: SubscriberStatus;
}

export interface ServicePerformance {
  service: string;
  subscribers: number;
  progress: number;
}

export interface RevenueBreakdown {
  service: string;
  amount: number;
}

export interface CustomerMetrics {
  monthlyRevenue: number;
  activeSubscribers: number;
  monthlyGrowth: number;
  rating: number;
}

export interface CustomerPortalResponse {
  services: ServicePlan[];
  subscribers: Subscriber[];
  performance: ServicePerformance[];
  revenueBreakdown: RevenueBreakdown[];
  metrics: CustomerMetrics;
}

// RHNIS identity
export type IdentityIcon = "fingerprint" | "eye" | "radio" | "shield";

export interface IdentityFeature {
  icon: IdentityIcon;
  title: string;
  status: string;
  description: string;
}

export interface BeaconDatum {
  type: string;
  count: number;
  status: string;
}

export interface LegacyStats {
  voiceRecordingsMb: number;
  interactionLogsMb: number;
  digitalSignaturesMb: number;
}

export interface RHNISIdentityResponse {
  identityFeatures: IdentityFeature[];
  beaconData: BeaconDatum[];
  legacyStats: LegacyStats;
  beaconSignature: string;
}
