import { apiRequest } from "./apiClient";
import { config } from "./config";
import {
  BusinessStatsResponse,
  LeadManagementResponse,
  WorkersResponse,
  BusinessCardsResponse,
  LeadBotDateRange,
  LeadBotPlatformFilter,
  LeadBotResponse,
  SaveTradingExchangeKeysResponse,
  TradingExchangeKeyInput,
  TradingBotResponse,
  TradingCancelOrderResponse,
  CustomerPortalResponse,
  RHNISIdentityResponse,
  TradingCreateOrderInput,
  TradingExecuteOrderResponse,
} from "./types";

// Re-export types so existing imports remain valid.
export type {
  BusinessStatsResponse,
  LeadManagementResponse,
  WorkersResponse,
  BusinessCardsResponse,
  LeadBotDateRange,
  LeadBotPlatformFilter,
  LeadBotResponse,
  SaveTradingExchangeKeysResponse,
  TradingExchangeKeyInput,
  TradingBotResponse,
  TradingCancelOrderResponse,
  CustomerPortalResponse,
  RHNISIdentityResponse,
  TradingCreateOrderInput,
  TradingExecuteOrderResponse,
} from "./types";

// --- Fetchers using the shared apiRequest helper ---

const tradingOrdersPath = config.apiBase ? "/trading/orders" : "/api/trading/orders";

export const getBusinessStats = () =>
  apiRequest<BusinessStatsResponse>("/businessStats");

export const getLeads = () =>
  apiRequest<LeadManagementResponse>("/leadManagement");

export const getWorkers = () =>
  apiRequest<WorkersResponse>("/workers");

export const getBusinessCards = () =>
  apiRequest<BusinessCardsResponse>("/businessCards");

export const getLeadBotData = ({
  platform = "all",
  dateRange = "30",
  search = "",
}: {
  platform?: LeadBotPlatformFilter;
  dateRange?: LeadBotDateRange;
  search?: string;
} = {}) => {
  const params = new URLSearchParams({
    platform,
    dateRange,
  });

  if (search.trim()) {
    params.set("search", search.trim());
  }

  return apiRequest<LeadBotResponse>(`/leadBot?${params.toString()}`);
};

export const getTradingBotData = ({
  symbols,
}: {
  symbols?: string[];
} = {}) => {
  const params = new URLSearchParams();

  if (symbols?.length) {
    params.set("symbols", symbols.join(","));
  }

  return apiRequest<TradingBotResponse>(
    params.size ? `/tradingBot?${params.toString()}` : "/tradingBot"
  );
};

export const saveTradingExchangeKeys = ({
  accessToken,
  exchanges,
}: {
  accessToken: string;
  exchanges: TradingExchangeKeyInput[];
}) =>
  apiRequest<SaveTradingExchangeKeysResponse>("/trading/save-keys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ exchanges }),
  });

export const placeTradingOrder = ({
  accessToken,
  order,
}: {
  accessToken: string;
  order: TradingCreateOrderInput;
}) =>
  apiRequest<TradingExecuteOrderResponse>(tradingOrdersPath, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(order),
  });

export const cancelTradingOrder = ({
  accessToken,
  orderId,
  symbol,
}: {
  accessToken: string;
  orderId: string;
  symbol?: string;
}) =>
  apiRequest<TradingCancelOrderResponse>(tradingOrdersPath, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      orderId,
      symbol,
    }),
  });

export const getCustomerPortalData = () =>
  apiRequest<CustomerPortalResponse>("/customerPortal");

export const getRHNISIdentity = () =>
  apiRequest<RHNISIdentityResponse>("/rhnisIdentity");
