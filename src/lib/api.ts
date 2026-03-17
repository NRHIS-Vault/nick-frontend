import { apiRequest } from "./apiClient";
import {
  BusinessStatsResponse,
  LeadManagementResponse,
  WorkersResponse,
  BusinessCardsResponse,
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

export const getLeadBotData = () =>
  apiRequest<LeadBotResponse>("/leadBot");

export const getTradingBotData = () =>
  apiRequest<TradingBotResponse>("/tradingBot");

export const getCustomerPortalData = () =>
  apiRequest<CustomerPortalResponse>("/customerPortal");

export const getRHNISIdentity = () =>
  apiRequest<RHNISIdentityResponse>("/rhnisIdentity");
