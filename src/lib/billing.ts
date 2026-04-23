import { apiRequest } from "./apiClient";

export type BillingCheckoutSessionResponse = {
  ok: boolean;
  mode: "mock" | "stripe";
  sessionId: string;
  checkoutUrl: string;
  publishableKey: string;
};

export const createBillingCheckoutSession = ({
  accessToken,
  successUrl,
  cancelUrl,
}: {
  accessToken: string;
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
      successUrl,
      cancelUrl,
    }),
  });
