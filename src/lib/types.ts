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
