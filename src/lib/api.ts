import { config } from "./config";

// Build a safe URL regardless of whether VITE_API_BASE is set.
const baseUrl = (config.apiBase || "").replace(/\/$/, "");
const buildUrl = (path: string) =>
  `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

const fetchJson = async <T>(path: string): Promise<T> => {
  const url = buildUrl(path);
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Request failed (${res.status})${text ? `: ${text}` : ""}`
    );
  }

  return res.json() as Promise<T>;
};

// --- Types & fetchers ---

export type BusinessStatsResponse = {
  stats: { id: string; label: string; value: number; unit: "usd" | "count"; changePct: number }[];
  recentLeads: { id: string; name: string; service: string; value: number; status: "New" | "Quoted" | "Approved" }[];
  ncsStatus: { id: string; name: string; status: "active" | "idle" | "error"; lastRun: string }[];
};

export const getBusinessStats = () =>
  fetchJson<BusinessStatsResponse>("/businessStats");

export type LeadManagementResponse = {
  leads: {
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
  }[];
};

export const getLeads = () => fetchJson<LeadManagementResponse>("/leadManagement");

export type WorkersResponse = {
  summary: {
    systemHealthPct: number;
    activeWorkers: number;
    totalWorkers: number;
    uptimePct: number;
    errors: number;
  };
  workers: {
    id: string;
    name: string;
    type: "automation" | "monitoring" | "processing";
    status: "running" | "stopped" | "error" | "idle";
    lastRun: string;
    nextRun?: string;
    description: string;
    metrics: { tasksCompleted: number; successRate: number; avgRunTimeSeconds: number };
  }[];
};

export const getWorkers = () => fetchJson<WorkersResponse>("/workers");

export type BusinessCardsResponse = {
  businesses: {
    id: string;
    name: string;
    description: string;
    image: string;
    status: "Active" | "Growing" | "Paused";
    stats: Record<string, number | string>;
  }[];
};

export const getBusinessCards = () =>
  fetchJson<BusinessCardsResponse>("/businessCards");

export type LeadBotResponse = {
  overview: { totalLeads: number; monthlyLeads: number; conversionRate: number; activeCampaigns: number };
  campaigns: {
    id: string;
    platform: string;
    content: string;
    reach: number;
    leads: number;
    engagement: number;
    status: "ACTIVE" | "SCHEDULED" | "COMPLETED";
    scheduledTime?: string;
  }[];
  platforms: { name: string; status: "connected" | "pending"; posts: number; leads: number }[];
  recentLeads: {
    id: string;
    name: string;
    phone: string;
    service: string;
    source: string;
    timestamp: string;
    status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED";
  }[];
};

export const getLeadBotData = () => fetchJson<LeadBotResponse>("/leadBot");

export type TradingBotResponse = {
  botStatus: { active: boolean };
  balances: { totalBalance: number; dailyProfit: number; winRate: number };
  trades: {
    id: string;
    pair: string;
    type: "BUY" | "SELL";
    amount: number;
    price: number;
    profit: number;
    timestamp: string;
    status: "OPEN" | "CLOSED" | "PENDING";
  }[];
  signals: {
    pair: string;
    direction: "UP" | "DOWN";
    strength: number;
    confidence: number;
    timeframe: string;
  }[];
  platforms: { name: string; status: "connected" | "disconnected"; balance: number }[];
};

export const getTradingBotData = () => fetchJson<TradingBotResponse>("/tradingBot");

export type CustomerPortalResponse = {
  services: {
    id: string;
    name: string;
    description: string;
    price: number;
    period: "monthly" | "yearly";
    features: string[];
    popular?: boolean;
    roi: string;
  }[];
  subscribers: {
    id: string;
    name: string;
    email: string;
    service: string;
    joinDate: string;
    revenue: number;
    status: "active" | "paused" | "cancelled";
  }[];
  performance: { service: string; subscribers: number; progress: number }[];
  revenueBreakdown: { service: string; amount: number }[];
  metrics: { monthlyRevenue: number; activeSubscribers: number; monthlyGrowth: number; rating: number };
};

export const getCustomerPortalData = () =>
  fetchJson<CustomerPortalResponse>("/customerPortal");

export type RHNISIdentityResponse = {
  identityFeatures: {
    icon: "fingerprint" | "eye" | "radio" | "shield";
    title: string;
    status: string;
    description: string;
  }[];
  beaconData: { type: string; count: number; status: string }[];
  legacyStats: { voiceRecordingsMb: number; interactionLogsMb: number; digitalSignaturesMb: number };
  beaconSignature: string;
};

export const getRHNISIdentity = () =>
  fetchJson<RHNISIdentityResponse>("/rhnisIdentity");
