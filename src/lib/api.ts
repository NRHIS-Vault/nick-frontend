import { apiRequest } from "./apiClient";
import {
  BusinessStatsResponse,
  LeadManagementResponse,
  WorkersResponse,
  BusinessCardsResponse,
  LeadBotDateRange,
  LeadBotPlatformFilter,
  LeadBotResponse,
  TradingBotResponse,
  CustomerPortalResponse,
  RHNISIdentityResponse,
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
  TradingBotResponse,
  CustomerPortalResponse,
  RHNISIdentityResponse,
} from "./types";

// --- Fetchers using the shared apiRequest helper ---

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

export const getTradingBotData = () =>
  apiRequest<TradingBotResponse>("/tradingBot");

export const getCustomerPortalData = () =>
  apiRequest<CustomerPortalResponse>("/customerPortal");

export const getRHNISIdentity = () =>
  apiRequest<RHNISIdentityResponse>("/rhnisIdentity");
