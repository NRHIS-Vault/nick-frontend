import type { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TradingBotResponse } from "@/lib/types";
import { TooltipProvider } from "@/components/ui/tooltip";

vi.mock("@/lib/api", () => ({
  getTradingBotData: vi.fn(),
  placeTradingOrder: vi.fn(),
  cancelTradingOrder: vi.fn(),
}));

vi.mock("@/lib/config", () => ({
  config: {
    apiBase: "",
    supabaseUrl: "",
    supabaseAnonKey: "",
    stripePublishableKey: "",
    devAuthEmail: "",
    devAuthPassword: "",
  },
}));

import { getTradingBotData } from "@/lib/api";
import { placeTradingOrder } from "@/lib/api";
import { cancelTradingOrder } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import TradingBot from "./TradingBot";

const authState = vi.hoisted(() => ({
  role: "paid",
  session: {
    access_token: "test-access-token",
  },
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(() => authState),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  onerror: ((event: Event) => void) | null = null;
  private listeners = new Map<string, Set<(event: Event) => void>>();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const normalizedListener =
      typeof listener === "function"
        ? listener
        : (event: Event) => listener.handleEvent(event);

    const listeners = this.listeners.get(type) ?? new Set<(event: Event) => void>();
    listeners.add(normalizedListener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const listeners = this.listeners.get(type);
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
    const listeners = this.listeners.get(type);
    const event = new MessageEvent(type, { data });
    listeners?.forEach((listener) => listener(event));
  }

  emitError() {
    this.onerror?.(new Event("error"));
  }
}

const mockedGetTradingBotData = vi.mocked(getTradingBotData);
const mockedPlaceTradingOrder = vi.mocked(placeTradingOrder);
const mockedCancelTradingOrder = vi.mocked(cancelTradingOrder);
const mockedUseAuth = vi.mocked(useAuth);

const baseResponse: TradingBotResponse = {
  botStatus: { active: true },
  balances: {
    totalBalance: 24347.32,
    dailyProfit: 624.18,
    winRate: 71.4,
  },
  trades: [
    {
      id: "trade-1",
      pair: "BTC/USDT",
      type: "BUY",
      amount: 0.18,
      price: 68325,
      profit: 145.2,
      timestamp: "2026-04-08T10:00:00.000Z",
      status: "OPEN",
      exchange: "Binance",
      provider: "binance",
    },
  ],
  signals: [
    {
      pair: "BTC/USDT",
      direction: "UP",
      strength: 72,
      confidence: 84,
      timeframe: "24H",
      exchange: "Binance",
      provider: "binance",
      price: 68450,
      changePct: 2.7,
      bid: 68440,
      ask: 68460,
      timestamp: "2026-04-08T10:00:00.000Z",
    },
  ],
  platforms: [
    {
      name: "Binance",
      provider: "binance",
      status: "connected",
      balance: 15420.5,
      currency: "USDT",
      message: "Snapshot loaded.",
      updatedAt: "2026-04-08T10:00:00.000Z",
      marketStatus: "connected",
      accountStatus: "connected",
      reconnectAttempts: 0,
      subscribedSymbols: ["BTC/USDT", "ETH/USD"],
    },
    {
      name: "Coinbase",
      provider: "coinbase",
      status: "connected",
      balance: 8926.82,
      currency: "USD",
      message: "Snapshot loaded.",
      updatedAt: "2026-04-08T10:00:00.000Z",
      marketStatus: "connected",
      accountStatus: "connected",
      reconnectAttempts: 0,
      subscribedSymbols: ["BTC/USDT", "ETH/USD"],
    },
  ],
  balanceUpdates: [
    {
      id: "balance-1",
      exchange: "Binance",
      provider: "binance",
      asset: "USDT",
      currency: "USDT",
      totalBalance: 15420.5,
      availableBalance: 14320.5,
      lockedBalance: 1100,
      change: 125.35,
      timestamp: "2026-04-08T10:00:00.000Z",
    },
  ],
  stream: {
    defaultSymbols: ["BTC/USDT", "ETH/USD"],
    providers: ["binance", "coinbase"],
    reconnectDelayMs: 3000,
  },
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </QueryClientProvider>
  );
};

describe("TradingBot", () => {
  beforeEach(() => {
    mockedGetTradingBotData.mockReset();
    mockedPlaceTradingOrder.mockReset();
    mockedCancelTradingOrder.mockReset();
    mockedUseAuth.mockReset();

    mockedGetTradingBotData.mockResolvedValue(baseResponse);
    mockedPlaceTradingOrder.mockResolvedValue({
      ok: true,
      action: "create",
      exchange: "binance",
      symbol: "BTC/USDT",
      side: "BUY",
      type: "MARKET",
      amount: 0.01,
      price: null,
      order: {
        id: "order-1",
      },
    });
    mockedCancelTradingOrder.mockResolvedValue({
      ok: true,
      action: "cancel",
      exchange: "binance",
      orderId: "trade-1",
      symbol: "BTC/USDT",
      order: {
        id: "trade-1",
      },
    });
    authState.role = "paid";
    authState.session = {
      access_token: "test-access-token",
    };
    MockEventSource.instances = [];
    mockedUseAuth.mockImplementation(() => authState);

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

  it("subscribes to the trading SSE feed and renders live balance, signal, trade, and error updates", async () => {
    render(<TradingBot />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText("AI Trading Bot")).toBeTruthy();
    });

    expect(mockedGetTradingBotData).toHaveBeenCalledWith({
      symbols: ["BTC/USDT", "ETH/USD"],
    });
    expect(MockEventSource.instances[0]?.url).toBe(
      "/api/trading/stream?symbols=BTC%2FUSDT%2CETH%2FUSD"
    );

    const stream = MockEventSource.instances[0];
    expect(stream).toBeTruthy();

    act(() => {
      stream.emit(
        "connected",
        JSON.stringify({
          connectionId: "stream-1",
          providers: ["binance", "coinbase"],
          symbols: ["BTC/USDT", "ETH/USD"],
          heartbeatIntervalMs: 15000,
          reconnectDelayMs: 3000,
          platforms: [
            {
              provider: "binance",
              exchange: "Binance",
              subscribedSymbols: ["BTC/USDT", "ETH/USD"],
            },
          ],
        })
      );
      stream.emit(
        "provider-status",
        JSON.stringify({
          provider: "binance",
          exchange: "Binance",
          scope: "market",
          status: "connected",
          message: "Binance market data stream connected.",
          reconnectAttempt: 0,
          timestamp: "2026-04-08T10:01:00.000Z",
          subscribedSymbols: ["BTC/USDT", "ETH/USD"],
        })
      );
      stream.emit(
        "balance",
        JSON.stringify({
          id: "balance-live-1",
          exchange: "Binance",
          provider: "binance",
          asset: "USDT",
          currency: "USDT",
          totalBalance: 19876.54,
          availableBalance: 19440.14,
          lockedBalance: 436.4,
          change: 210.12,
          timestamp: "2026-04-08T10:01:00.000Z",
        })
      );
      stream.emit(
        "signal",
        JSON.stringify({
          pair: "SOL/USD",
          direction: "UP",
          strength: 88,
          confidence: 91,
          timeframe: "24H",
          exchange: "Coinbase",
          provider: "coinbase",
          price: 195.42,
          changePct: 4.82,
          bid: 195.4,
          ask: 195.45,
          timestamp: "2026-04-08T10:01:10.000Z",
        })
      );
      stream.emit(
        "trade",
        JSON.stringify({
          id: "trade-live-1",
          pair: "SOL/USD",
          type: "SELL",
          amount: 2.5,
          price: 195.1,
          profit: 0,
          timestamp: "2026-04-08T10:01:15.000Z",
          status: "CLOSED",
          exchange: "Coinbase",
          provider: "coinbase",
        })
      );
      stream.emit(
        "stream-error",
        JSON.stringify({
          provider: "coinbase",
          exchange: "Coinbase",
          scope: "market",
          message: "Temporary stream warning",
          recoverable: true,
          timestamp: "2026-04-08T10:01:20.000Z",
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText("LIVE")).toBeTruthy();
      expect(screen.getAllByText("SOL/USD").length).toBeGreaterThan(0);
      expect(screen.getAllByText("19,876.54 USDT").length).toBeGreaterThan(0);
      expect(screen.getByText("Temporary stream warning")).toBeTruthy();
    });

    expect(screen.getAllByText("Coinbase").length).toBeGreaterThan(0);
    expect(screen.getByText("SELL")).toBeTruthy();
  });

  it("submits a buy order for authorized users", async () => {
    render(<TradingBot />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Place Buy Order" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Place Buy Order" }));

    await waitFor(() => {
      expect(mockedPlaceTradingOrder).toHaveBeenCalledWith({
        accessToken: "test-access-token",
        order: {
          symbol: "BTC/USDT",
          side: "BUY",
          amount: 0.01,
        },
      });
    });
  });

  it("disables order execution buttons for unauthorized users and shows a tooltip", async () => {
    authState.role = "member";

    render(<TradingBot />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Place Buy Order" })).toBeTruthy();
    });

    const placeBuyButton = screen.getByRole("button", { name: "Place Buy Order" });
    const cancelOrderButton = screen.getByRole("button", { name: "Cancel Order" });

    expect((placeBuyButton as HTMLButtonElement).disabled).toBe(true);
    expect((cancelOrderButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.focus(placeBuyButton.parentElement as HTMLElement);

    await waitFor(() => {
      expect(screen.getByRole("tooltip").textContent).toContain(
        "Only paid and admin users can place or cancel live orders."
      );
    });

    expect(mockedPlaceTradingOrder).toHaveBeenCalledTimes(0);
  });
});
