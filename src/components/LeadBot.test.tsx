import type { ReactNode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LeadBotResponse } from "@/lib/types";

vi.mock("@/lib/api", () => ({
  getLeadBotData: vi.fn(),
}));

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

import { getLeadBotData } from "@/lib/api";
import LeadBot from "./LeadBot";

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  onerror: ((event: Event) => void) | null = null;
  #listeners = new Map<string, Set<(event: Event) => void>>();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const normalizedListener =
      typeof listener === "function"
        ? listener
        : (event: Event) => listener.handleEvent(event);

    const listeners = this.#listeners.get(type) ?? new Set<(event: Event) => void>();
    listeners.add(normalizedListener);
    this.#listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const listeners = this.#listeners.get(type);
    if (!listeners) {
      return;
    }

    const normalizedListener =
      typeof listener === "function"
        ? listener
        : (event: Event) => listener.handleEvent(event);

    listeners.delete(normalizedListener);
  }

  close() {
    return undefined;
  }

  emit(type: string, data?: string) {
    const listeners = this.#listeners.get(type);
    const event = new MessageEvent(type, { data });
    listeners?.forEach((listener) => listener(event));
  }

  emitError() {
    this.onerror?.(new Event("error"));
  }
}

const mockedGetLeadBotData = vi.mocked(getLeadBotData);

const baseResponse: LeadBotResponse = {
  overview: {
    totalLeads: 1,
    monthlyLeads: 1,
    conversionRate: 3.1,
    activeCampaigns: 1,
  },
  campaigns: [
    {
      id: "campaign-1",
      platform: "Meta",
      content: "Fence quote campaign",
      timestamp: "2026-04-02T10:00:00.000Z",
      reach: 1000,
      impressions: 1500,
      clicks: 75,
      conversions: 10,
      leads: 10,
      engagement: 5,
      status: "ACTIVE",
      scheduledTime: "2026-04-02T09:00:00.000Z",
    },
  ],
  platforms: [
    {
      name: "Meta",
      status: "connected",
      posts: 1,
      leads: 1,
    },
  ],
  recentLeads: [
    {
      id: "lead-1",
      name: "Maria Rodriguez",
      phone: "555-1111",
      service: "Chain Link Fence",
      source: "Meta",
      timestamp: "2026-04-02T11:00:00.000Z",
      status: "NEW",
    },
  ],
  errors: [],
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("LeadBot", () => {
  beforeEach(() => {
    mockedGetLeadBotData.mockResolvedValue(baseResponse);
    MockEventSource.instances = [];

    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {
          return undefined;
        }

        unobserve() {
          return undefined;
        }

        disconnect() {
          return undefined;
        }
      }
    );

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("appends live SSE leads into the Recent Leads table and merges repeat ids", async () => {
    render(<LeadBot />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText("Maria Rodriguez")).toBeTruthy();
    });

    expect(mockedGetLeadBotData).toHaveBeenCalledWith({
      platform: "all",
      dateRange: "30",
      search: "",
    });
    expect(MockEventSource.instances[0]?.url).toBe("/api/lead-stream");

    const stream = MockEventSource.instances[0];
    expect(stream).toBeTruthy();

    act(() => {
      // The component only treats the stream as fully live after the worker sends a
      // `connected` event, mirroring the real SSE handshake used in production.
      stream.emit("connected");
    });

    await waitFor(() => {
      expect(screen.getByText("LIVE")).toBeTruthy();
    });

    act(() => {
      stream.emit(
        "lead",
        JSON.stringify({
          id: "live-lead-1",
          name: "SSE Lead",
          phone: "555-2222",
          service: "Fence Repair",
          source: "Meta",
          timestamp: "2026-04-03T12:00:00.000Z",
          status: "NEW",
        })
      );
      stream.emit(
        "lead",
        JSON.stringify({
          id: "live-lead-1",
          name: "SSE Lead",
          phone: "555-2222",
          service: "Pool Fence",
          source: "Meta",
          timestamp: "2026-04-03T12:05:00.000Z",
          status: "CONTACTED",
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText("SSE Lead")).toBeTruthy();
      expect(screen.getByText("Pool Fence")).toBeTruthy();
      expect(screen.getByText("CONTACTED")).toBeTruthy();
    });

    expect(screen.queryByText("Fence Repair")).toBeNull();
    expect(screen.getAllByText("SSE Lead")).toHaveLength(1);
  });
});
