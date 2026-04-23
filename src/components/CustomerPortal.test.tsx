import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  CustomerPortalAnalyticsResponse,
  CustomerPortalPlansResponse,
} from "@/lib/types";
import { renderWithProviders } from "@/test/render";
import { installMockFetch, jsonResponse } from "@/test/mockApi";
import CustomerPortal from "./CustomerPortal";

vi.mock("@/lib/config", () => ({
  config: {
    apiBase: "",
    supabaseUrl: "",
    supabaseAnonKey: "",
    stripePublishableKey: "",
    devAuthEmail: "",
    devAuthPassword: "",
    e2eMockMode: false,
  },
}));

const plansResponse: CustomerPortalPlansResponse = {
  source: "supabase",
  updatedAt: "2026-04-16T09:00:00.000Z",
  plans: [
    {
      id: "rhnis-identity-suite",
      name: "RHNIS Identity Suite",
      description: "Identity automation with voice, beacon, and archive tooling.",
      price: 799,
      currency: "usd",
      billingInterval: "month",
      billingIntervalCount: 1,
      billingPeriodLabel: "monthly",
      monthlyPriceEquivalent: 799,
      features: ["Voiceprint archive", "Beacon routing", "Audit exports"],
      popular: true,
      roi: "Cuts manual audit time by 72%",
    },
    {
      id: "enterprise-operators",
      name: "Enterprise Operators",
      description: "Higher-touch orchestration for larger support teams.",
      price: 2499,
      currency: "usd",
      billingInterval: "month",
      billingIntervalCount: 1,
      billingPeriodLabel: "monthly",
      monthlyPriceEquivalent: 2499,
      features: ["Runbooks", "Priority queue routing", "Weekly reviews"],
      popular: false,
      roi: "Consolidates three manual reporting steps",
    },
  ],
};

const analyticsResponse: CustomerPortalAnalyticsResponse = {
  source: "mixed",
  computedAt: "2026-04-16T09:05:00.000Z",
  overview: {
    activeSubscribers: 34,
    totalSubscribers: 42,
    mrr: 12450,
    arr: 149400,
    averageRevenuePerActiveSubscriber: 366.18,
    trialSubscribers: 5,
    atRiskSubscribers: 3,
  },
  statusBreakdown: [
    { status: "active", count: 29 },
    { status: "trialing", count: 5 },
    { status: "past_due", count: 3 },
    { status: "cancelled", count: 5 },
  ],
  planBreakdown: [
    {
      planId: "rhnis-identity-suite",
      planName: "RHNIS Identity Suite",
      activeSubscribers: 16,
      mrr: 9200,
      averageMrr: 575,
    },
    {
      planId: "enterprise-operators",
      planName: "Enterprise Operators",
      activeSubscribers: 18,
      mrr: 3250,
      averageMrr: 180.56,
    },
  ],
  monthlySeries: [
    { month: "2026-02", label: "Feb", newSubscribers: 6, newMrr: 2100 },
    { month: "2026-03", label: "Mar", newSubscribers: 11, newMrr: 4800 },
    { month: "2026-04", label: "Apr", newSubscribers: 8, newMrr: 3550 },
  ],
  subscribers: [
    {
      id: "sub-1",
      name: "Alice Carter",
      email: "alice@example.com",
      planId: "rhnis-identity-suite",
      planName: "RHNIS Identity Suite",
      joinDate: "2026-02-11T00:00:00.000Z",
      status: "active",
      amount: 799,
      currency: "usd",
      quantity: 1,
      billingInterval: "month",
      billingIntervalCount: 1,
      monthlyRecurringRevenue: 799,
      items: [
        {
          planId: "rhnis-identity-suite",
          planName: "RHNIS Identity Suite",
          quantity: 1,
          amount: 799,
          currency: "usd",
          billingInterval: "month",
          billingIntervalCount: 1,
          monthlyRecurringRevenue: 799,
        },
      ],
    },
    {
      id: "sub-2",
      name: "Northwind Ops",
      email: "ops@northwind.example",
      planId: "enterprise-operators",
      planName: "Enterprise Operators",
      joinDate: "2026-03-04T00:00:00.000Z",
      status: "past_due",
      amount: 2499,
      currency: "usd",
      quantity: 1,
      billingInterval: "month",
      billingIntervalCount: 1,
      monthlyRecurringRevenue: 2499,
      items: [
        {
          planId: "enterprise-operators",
          planName: "Enterprise Operators",
          quantity: 1,
          amount: 2499,
          currency: "usd",
          billingInterval: "month",
          billingIntervalCount: 1,
          monthlyRecurringRevenue: 2499,
        },
      ],
    },
  ],
  notes: [
    "Analytics sourced from mirrored Stripe subscription snapshots.",
    "Plan metadata is enriched with internal ROI copy from Supabase.",
  ],
};

describe("CustomerPortal", () => {
  it("renders customer portal metrics from the mocked worker endpoints", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const fetchMock = installMockFetch({
      "GET /customerPortal/plans": () => jsonResponse(plansResponse),
      // Keep the payload realistic enough to exercise cards, badges, charts, and table rows
      // from the same analytics response instead of asserting against unrelated fragments.
      "GET /customerPortal/analytics": () => jsonResponse(analyticsResponse),
    });

    renderWithProviders(<CustomerPortal />);

    await waitFor(() => {
      expect(screen.getByText("Customer Portal")).toBeTruthy();
      expect(screen.getByText("$12,450")).toBeTruthy();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Plans: Supabase")).toBeTruthy();
    expect(screen.getByText("Analytics: Mixed")).toBeTruthy();
    expect(screen.getByText("Total subscribers: 42")).toBeTruthy();
    expect(screen.getAllByText("Trialing: 5").length).toBeGreaterThan(0);
    expect(screen.getByText("At risk: 3")).toBeTruthy();
    expect(screen.getAllByText("RHNIS Identity Suite").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Enterprise Operators").length).toBeGreaterThan(0);
    expect(screen.getByText("Alice Carter")).toBeTruthy();
    expect(screen.getByText("Northwind Ops")).toBeTruthy();
    expect(
      screen.getByText("Analytics sourced from mirrored Stripe subscription snapshots.")
    ).toBeTruthy();
  });
});
