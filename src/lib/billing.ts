import { apiRequest } from "./apiClient";

export type BillingCheckoutSessionResponse = {
  ok: boolean;
  mode: "mock" | "stripe";
  sessionId: string;
  checkoutUrl: string;
  publishableKey: string;
  plan?: {
    id: string;
    name: string;
    price: number;
    currency: string;
    billingInterval: "day" | "week" | "month" | "year";
    billingIntervalCount: number;
  };
};

export const createBillingCheckoutSession = ({
  accessToken,
  planId,
  successUrl,
  cancelUrl,
}: {
  accessToken: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}) =>
  apiRequest<BillingCheckoutSessionResponse>("/billing/checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      planId,
      successUrl,
      cancelUrl,
    }),
  });

export type BillingCheckoutConfirmationResponse = {
  ok: boolean;
  sessionId: string;
  profile: {
    role: string;
    subscriptionStatus: string;
  };
};

export const confirmBillingCheckoutSession = ({
  accessToken,
  sessionId,
}: {
  accessToken: string;
  sessionId: string;
}) =>
  apiRequest<BillingCheckoutConfirmationResponse>("/billing/checkout-confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      sessionId,
    }),
  });
