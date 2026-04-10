import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  DollarSign,
  Radio,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { cancelTradingOrder, getTradingBotData, placeTradingOrder } from "@/lib/api";
import type {
  Trade,
  Signal,
  TradingBalanceUpdate,
  TradingCreateOrderSide,
  TradingPlatform,
  TradingProviderStatusEvent,
  TradingStreamConnectedPayload,
  TradingStreamErrorEvent,
} from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { resolveApiUrl } from "@/lib/apiClient";
import { config } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const DEFAULT_STREAM_SYMBOLS = ["BTC/USDT", "ETH/USD"];
const STREAM_HEARTBEAT_TIMEOUT_MS = 45_000;
const STREAM_RECONNECT_BASE_MS = 2_000;
const STREAM_RECONNECT_MAX_MS = 15_000;
const MAX_SIGNAL_ROWS = 8;
const MAX_TRADE_ROWS = 14;
const MAX_BALANCE_ROWS = 10;
const DEFAULT_EXECUTION_AMOUNT = "0.01";
const STABLE_VALUE_ASSETS = new Set(["USD", "USDT", "USDC", "BUSD", "FDUSD", "TUSD"]);

const parseRequestedSymbols = (value: string) => {
  const symbols = value
    .split(/[,\n]+/)
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);

  return symbols.length ? symbols : DEFAULT_STREAM_SYMBOLS;
};

const getPlatformKey = (platform: Pick<TradingPlatform, "provider" | "name">) =>
  platform.provider || platform.name.toLowerCase();

const sortByTimestamp = <T extends { timestamp?: string; updatedAt?: string }>(
  left: T,
  right: T
) => {
  const leftValue = Date.parse(left.timestamp || left.updatedAt || "");
  const rightValue = Date.parse(right.timestamp || right.updatedAt || "");
  return rightValue - leftValue;
};

const mergeTrades = (baseTrades: Trade[], liveTrades: Trade[]) =>
  Array.from(
    [...liveTrades, ...baseTrades].reduce<Map<string, Trade>>((tradeMap, trade) => {
      tradeMap.set(trade.id, trade);
      return tradeMap;
    }, new Map<string, Trade>()).values()
  )
    .sort(sortByTimestamp)
    .slice(0, MAX_TRADE_ROWS);

const mergeSignals = (baseSignals: Signal[], liveSignals: Signal[]) =>
  Array.from(
    [...liveSignals, ...baseSignals].reduce<Map<string, Signal>>((signalMap, signal) => {
      const signalKey = `${signal.provider || signal.exchange || "signal"}:${signal.pair}`;
      signalMap.set(signalKey, signal);
      return signalMap;
    }, new Map<string, Signal>()).values()
  )
    .sort(sortByTimestamp)
    .slice(0, MAX_SIGNAL_ROWS);

const mergeBalanceUpdates = (
  baseUpdates: TradingBalanceUpdate[],
  liveUpdates: TradingBalanceUpdate[]
) =>
  Array.from(
    [...liveUpdates, ...baseUpdates].reduce<Map<string, TradingBalanceUpdate>>(
      (balanceMap, balanceUpdate) => {
        balanceMap.set(balanceUpdate.id, balanceUpdate);
        return balanceMap;
      },
      new Map<string, TradingBalanceUpdate>()
    ).values()
  )
    .sort(sortByTimestamp)
    .slice(0, MAX_BALANCE_ROWS);

const mergePlatforms = (
  basePlatforms: TradingPlatform[],
  livePlatformMap: Record<string, TradingPlatform>
) =>
  Array.from(
    [...basePlatforms, ...Object.values(livePlatformMap)].reduce<Map<string, TradingPlatform>>(
      (platformMap, platform) => {
        const platformKey = getPlatformKey(platform);
        const existingPlatform = platformMap.get(platformKey);

        platformMap.set(platformKey, {
          ...existingPlatform,
          ...platform,
          status: platform.status || existingPlatform?.status || "disconnected",
          marketStatus: platform.marketStatus || existingPlatform?.marketStatus,
          accountStatus: platform.accountStatus || existingPlatform?.accountStatus,
          message: platform.message || existingPlatform?.message,
          subscribedSymbols: platform.subscribedSymbols || existingPlatform?.subscribedSymbols,
        });
        return platformMap;
      },
      new Map<string, TradingPlatform>()
    ).values()
  ).sort((left, right) => left.name.localeCompare(right.name));

const upsertTrade = (currentTrades: Trade[], incomingTrade: Trade) =>
  mergeTrades([], [incomingTrade, ...currentTrades]);

const upsertSignal = (currentSignals: Signal[], incomingSignal: Signal) =>
  mergeSignals([], [incomingSignal, ...currentSignals]);

const upsertBalanceUpdate = (
  currentUpdates: TradingBalanceUpdate[],
  incomingUpdate: TradingBalanceUpdate
) => mergeBalanceUpdates([], [incomingUpdate, ...currentUpdates]);

const resolveOverallPlatformStatus = (
  marketStatus?: TradingPlatform["marketStatus"],
  accountStatus?: TradingPlatform["accountStatus"],
  fallbackStatus: TradingPlatform["status"] = "disconnected"
) => {
  if (marketStatus && marketStatus !== "connected") {
    return marketStatus;
  }

  if (marketStatus === "connected") {
    return "connected";
  }

  if (accountStatus) {
    return accountStatus;
  }

  return fallbackStatus;
};

const upsertPlatformFromStatus = (
  currentPlatforms: Record<string, TradingPlatform>,
  statusEvent: TradingProviderStatusEvent
) => {
  const platformKey = statusEvent.provider;
  const existingPlatform = currentPlatforms[platformKey];
  const nextPlatform: TradingPlatform = {
    name: statusEvent.exchange,
    provider: statusEvent.provider,
    status:
      statusEvent.scope === "market"
        ? statusEvent.status
        : resolveOverallPlatformStatus(
            existingPlatform?.marketStatus,
            statusEvent.status,
            existingPlatform?.status || "disconnected"
          ),
    balance: existingPlatform?.balance || 0,
    currency: existingPlatform?.currency,
    message: statusEvent.message,
    updatedAt: statusEvent.timestamp,
    reconnectAttempts: statusEvent.reconnectAttempt,
    subscribedSymbols: statusEvent.subscribedSymbols,
    marketStatus:
      statusEvent.scope === "market"
        ? statusEvent.status
        : existingPlatform?.marketStatus,
    accountStatus:
      statusEvent.scope === "account"
        ? statusEvent.status
        : existingPlatform?.accountStatus,
  };

  nextPlatform.status = resolveOverallPlatformStatus(
    nextPlatform.marketStatus,
    nextPlatform.accountStatus,
    nextPlatform.status
  );

  return {
    ...currentPlatforms,
    [platformKey]: {
      ...existingPlatform,
      ...nextPlatform,
    },
  };
};

const upsertPlatformFromBalance = (
  currentPlatforms: Record<string, TradingPlatform>,
  balanceUpdate: TradingBalanceUpdate
) => {
  const platformKey = balanceUpdate.provider;
  const existingPlatform = currentPlatforms[platformKey];
  const shouldPromoteBalance =
    isStableValueAsset(balanceUpdate.asset) || !existingPlatform?.balance;

  return {
    ...currentPlatforms,
    [platformKey]: {
      name: balanceUpdate.exchange,
      provider: balanceUpdate.provider,
      status: existingPlatform?.status || "connected",
      balance: shouldPromoteBalance
        ? balanceUpdate.totalBalance
        : existingPlatform?.balance || balanceUpdate.totalBalance,
      currency: balanceUpdate.currency,
      message:
        existingPlatform?.message ||
        `Latest ${balanceUpdate.asset} balance update received from ${balanceUpdate.exchange}.`,
      updatedAt: balanceUpdate.timestamp,
      marketStatus: existingPlatform?.marketStatus,
      accountStatus: existingPlatform?.accountStatus || "connected",
      reconnectAttempts: existingPlatform?.reconnectAttempts || 0,
      subscribedSymbols: existingPlatform?.subscribedSymbols,
    },
  };
};

const isStableValueAsset = (asset: string) => STABLE_VALUE_ASSETS.has(asset.toUpperCase());

const normalizeTradingSymbol = (value: string) => value.trim().toUpperCase();

const buildTradingStreamUrl = (symbols: string[]) => {
  const params = new URLSearchParams({
    symbols: symbols.join(","),
  });
  const streamPath = `/trading/stream?${params.toString()}`;

  return config.apiBase ? resolveApiUrl(streamPath) : `/api${streamPath}`;
};

const formatUsd = (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

const formatAssetBalance = (value: number, currency: string) =>
  isStableValueAsset(currency)
    ? `${value.toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })} ${currency}`
    : `${value.toLocaleString(undefined, {
        maximumFractionDigits: 6,
        minimumFractionDigits: 2,
      })} ${currency}`;

const formatSignedUsd = (value: number | null | undefined) => {
  if (value === null || value === undefined) {
    return "n/a";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatUsd(value)}`;
};

const getStatusVariant = (status: TradingPlatform["status"]) => {
  if (status === "connected") {
    return "default";
  }

  if (status === "error") {
    return "destructive";
  }

  return "secondary";
};

const renderSignalIcon = (direction: Signal["direction"]) =>
  direction === "UP" ? (
    <TrendingUp className="h-4 w-4 text-emerald-500" />
  ) : (
    <TrendingDown className="h-4 w-4 text-rose-500" />
  );

const renderTradingActionButton = ({
  button,
  tooltip,
}: {
  button: React.ReactElement;
  tooltip: string | null;
}) => {
  if (!tooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-not-allowed" tabIndex={0}>
          {button}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

export default function TradingBot() {
  const { role, session } = useAuth();
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [symbolInput, setSymbolInput] = useState(DEFAULT_STREAM_SYMBOLS.join(", "));
  const [executionSymbol, setExecutionSymbol] = useState(DEFAULT_STREAM_SYMBOLS[0]);
  const [executionAmount, setExecutionAmount] = useState(DEFAULT_EXECUTION_AMOUNT);
  const [liveTrades, setLiveTrades] = useState<Trade[]>([]);
  const [liveSignals, setLiveSignals] = useState<Signal[]>([]);
  const [liveBalanceUpdates, setLiveBalanceUpdates] = useState<TradingBalanceUpdate[]>([]);
  const [livePlatforms, setLivePlatforms] = useState<Record<string, TradingPlatform>>({});
  const [streamStatus, setStreamStatus] = useState<
    "connecting" | "connected" | "reconnecting" | "error"
  >("connecting");
  const [streamError, setStreamError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const heartbeatTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const debouncedSymbolInput = useDebounce(symbolInput, 400);
  const requestedSymbols = parseRequestedSymbols(debouncedSymbolInput);
  const tradingStreamUrl = buildTradingStreamUrl(requestedSymbols);

  // The initial worker fetch seeds the table/cards immediately while the SSE connection warms up.
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["trading-bot", requestedSymbols.join(",")],
    queryFn: () => getTradingBotData({ symbols: requestedSymbols }),
  });

  useEffect(() => {
    if (data?.botStatus) {
      setIsActive(data.botStatus.active);
    }
  }, [data?.botStatus]);

  useEffect(() => {
    setExecutionSymbol((currentSymbol) =>
      currentSymbol.trim() ? currentSymbol : requestedSymbols[0] || DEFAULT_STREAM_SYMBOLS[0]
    );
  }, [requestedSymbols]);

  useEffect(() => {
    let isUnmounted = false;

    setLiveTrades([]);
    setLiveSignals([]);
    setLiveBalanceUpdates([]);
    setLivePlatforms({});
    setStreamError(null);

    const clearReconnectTimeout = () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const clearHeartbeatTimeout = () => {
      if (heartbeatTimeoutRef.current !== null) {
        window.clearTimeout(heartbeatTimeoutRef.current);
        heartbeatTimeoutRef.current = null;
      }
    };

    // The worker emits a heartbeat every 15 seconds. If the browser stops seeing those events,
    // it likely landed on a half-open TCP connection, so we tear down the EventSource and start
    // a clean reconnect cycle instead of letting the dashboard silently freeze.
    const scheduleHeartbeatDeadline = () => {
      clearHeartbeatTimeout();
      heartbeatTimeoutRef.current = window.setTimeout(() => {
        if (isUnmounted) {
          return;
        }

        eventSourceRef.current?.close();
        eventSourceRef.current = null;
        reconnectAttemptRef.current += 1;
        setStreamStatus("reconnecting");
        setStreamError("Trading stream heartbeat timed out. Reconnecting.");
        scheduleReconnect();
      }, STREAM_HEARTBEAT_TIMEOUT_MS);
    };

    const scheduleReconnect = () => {
      if (isUnmounted || reconnectTimeoutRef.current !== null) {
        return;
      }

      const reconnectDelay = Math.min(
        STREAM_RECONNECT_BASE_MS * 2 ** Math.max(reconnectAttemptRef.current - 1, 0),
        STREAM_RECONNECT_MAX_MS
      );

      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connectToTradingStream();
      }, reconnectDelay);
    };

    function connectToTradingStream() {
      if (isUnmounted) {
        return;
      }

      clearReconnectTimeout();
      clearHeartbeatTimeout();
      eventSourceRef.current?.close();
      setStreamStatus(reconnectAttemptRef.current > 0 ? "reconnecting" : "connecting");

      const stream = new EventSource(tradingStreamUrl);
      eventSourceRef.current = stream;
      scheduleHeartbeatDeadline();

      stream.addEventListener("connected", (event) => {
        if (isUnmounted || eventSourceRef.current !== stream) {
          return;
        }

        reconnectAttemptRef.current = 0;
        setStreamStatus("connected");
        setStreamError(null);

        try {
          const connectedPayload = JSON.parse(
            (event as MessageEvent<string>).data
          ) as TradingStreamConnectedPayload;

          if (Array.isArray(connectedPayload.platforms)) {
            setLivePlatforms((currentPlatforms) =>
              connectedPayload.platforms.reduce<Record<string, TradingPlatform>>(
                (platformMap, platform) => ({
                  ...platformMap,
                  ...currentPlatforms,
                  [platform.provider || platform.exchange.toLowerCase()]: {
                    name: platform.exchange,
                    provider: platform.provider,
                    status: "connecting",
                    balance: 0,
                    message: "Opening exchange stream.",
                    subscribedSymbols: platform.subscribedSymbols,
                  },
                }),
                {}
              )
            );
          }
        } catch (_error) {
          // The `connected` event is informational; ignore parse issues and keep the socket open.
        }

        scheduleHeartbeatDeadline();
      });

      stream.addEventListener("heartbeat", () => {
        if (isUnmounted || eventSourceRef.current !== stream) {
          return;
        }

        scheduleHeartbeatDeadline();
      });

      stream.addEventListener("provider-status", (event) => {
        if (isUnmounted || eventSourceRef.current !== stream) {
          return;
        }

        try {
          const statusPayload = JSON.parse(
            (event as MessageEvent<string>).data
          ) as TradingProviderStatusEvent;

          setLivePlatforms((currentPlatforms) =>
            upsertPlatformFromStatus(currentPlatforms, statusPayload)
          );

          if (statusPayload.status === "error") {
            setStreamError(statusPayload.message);
          }
          scheduleHeartbeatDeadline();
        } catch (error) {
          console.error("Failed to parse trading provider status event", error);
        }
      });

      stream.addEventListener("balance", (event) => {
        if (isUnmounted || eventSourceRef.current !== stream) {
          return;
        }

        try {
          const balancePayload = JSON.parse(
            (event as MessageEvent<string>).data
          ) as TradingBalanceUpdate;

          setLiveBalanceUpdates((currentUpdates) =>
            upsertBalanceUpdate(currentUpdates, balancePayload)
          );
          setLivePlatforms((currentPlatforms) =>
            upsertPlatformFromBalance(currentPlatforms, balancePayload)
          );
          scheduleHeartbeatDeadline();
        } catch (error) {
          console.error("Failed to parse trading balance event", error);
        }
      });

      stream.addEventListener("trade", (event) => {
        if (isUnmounted || eventSourceRef.current !== stream) {
          return;
        }

        try {
          const tradePayload = JSON.parse((event as MessageEvent<string>).data) as Trade;
          setLiveTrades((currentTrades) => upsertTrade(currentTrades, tradePayload));
          scheduleHeartbeatDeadline();
        } catch (error) {
          console.error("Failed to parse trading trade event", error);
        }
      });

      stream.addEventListener("signal", (event) => {
        if (isUnmounted || eventSourceRef.current !== stream) {
          return;
        }

        try {
          const signalPayload = JSON.parse((event as MessageEvent<string>).data) as Signal;
          setLiveSignals((currentSignals) => upsertSignal(currentSignals, signalPayload));
          scheduleHeartbeatDeadline();
        } catch (error) {
          console.error("Failed to parse trading signal event", error);
        }
      });

      stream.addEventListener("stream-error", (event) => {
        if (isUnmounted || eventSourceRef.current !== stream) {
          return;
        }

        try {
          const errorPayload = JSON.parse(
            (event as MessageEvent<string>).data
          ) as TradingStreamErrorEvent;

          setStreamError(errorPayload.message);

          if (!errorPayload.recoverable) {
            setStreamStatus("error");
          }
        } catch (error) {
          console.error("Failed to parse trading stream error event", error);
        }
      });

      stream.onerror = () => {
        if (isUnmounted || eventSourceRef.current !== stream) {
          return;
        }

        clearHeartbeatTimeout();
        stream.close();
        eventSourceRef.current = null;
        reconnectAttemptRef.current += 1;
        setStreamStatus("reconnecting");
        setStreamError("Trading stream connection dropped. Retrying.");
        scheduleReconnect();
      };
    }

    connectToTradingStream();

    return () => {
      isUnmounted = true;
      clearReconnectTimeout();
      clearHeartbeatTimeout();
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [tradingStreamUrl]);

  const balances = data?.balances ?? { totalBalance: 0, dailyProfit: 0, winRate: 0 };
  const trades = mergeTrades(data?.trades ?? [], liveTrades);
  const signals = mergeSignals(data?.signals ?? [], liveSignals);
  const balanceUpdates = mergeBalanceUpdates(data?.balanceUpdates ?? [], liveBalanceUpdates);
  const platforms = mergePlatforms(data?.platforms ?? [], livePlatforms);
  const openTrades = trades.filter((trade) => trade.status === "OPEN");
  const aggregatedPlatformBalance = platforms.reduce(
    (sum, platform) => sum + (Number.isFinite(platform.balance) ? platform.balance : 0),
    0
  );
  const totalBalance =
    aggregatedPlatformBalance > 0 ? aggregatedPlatformBalance : balances.totalBalance;
  const normalizedRole = role?.trim().toLowerCase() ?? null;
  const hasTradingActionRole = normalizedRole === "admin" || normalizedRole === "paid";
  const hasTradingAccessToken = Boolean(session?.access_token);
  const tradingActionTooltip = !hasTradingAccessToken
    ? "Trading actions require a real Supabase bearer token."
    : hasTradingActionRole
      ? null
      : "Only paid and admin users can place or cancel live orders.";
  const normalizedExecutionSymbol = normalizeTradingSymbol(executionSymbol);
  const parsedExecutionAmount = Number(executionAmount);
  const isExecutionAmountValid =
    Number.isFinite(parsedExecutionAmount) && parsedExecutionAmount > 0;
  const canSubmitExecutionForm = Boolean(normalizedExecutionSymbol) && isExecutionAmountValid;
  const isTradingActionBlocked = Boolean(tradingActionTooltip);
  const hasData =
    Boolean(trades.length) ||
    Boolean(signals.length) ||
    Boolean(platforms.length) ||
    Boolean(balanceUpdates.length);

  const placeOrderMutation = useMutation({
    mutationFn: async (side: TradingCreateOrderSide) => {
      if (!session?.access_token) {
        throw new Error("Trading actions require a real Supabase bearer token.");
      }

      return placeTradingOrder({
        accessToken: session.access_token,
        order: {
          symbol: normalizedExecutionSymbol,
          side,
          amount: parsedExecutionAmount,
        },
      });
    },
    onSuccess: (_response, side) => {
      toast({
        title: `${side} order submitted`,
        description: `${side} market order sent for ${normalizedExecutionSymbol} via the trading worker.`,
      });
      void refetch();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Order submission failed",
        description:
          error instanceof Error ? error.message : "Unable to submit the order right now.",
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (trade: Trade) => {
      if (!session?.access_token) {
        throw new Error("Trading actions require a real Supabase bearer token.");
      }

      return cancelTradingOrder({
        accessToken: session.access_token,
        orderId: trade.id,
        symbol: normalizeTradingSymbol(trade.pair),
      });
    },
    onSuccess: (_response, trade) => {
      toast({
        title: "Cancel request submitted",
        description: `Cancellation sent for ${trade.pair} (${trade.id}).`,
      });
      void refetch();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Cancel request failed",
        description:
          error instanceof Error ? error.message : "Unable to cancel the order right now.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-24" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Could not load trading data." onRetry={() => refetch()} />;
  }

  if (!hasData) {
    return (
      <EmptyState
        title="No trading data yet"
        description="Connect an exchange stream or retry with another symbol list."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">AI Trading Bot</h2>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "ACTIVE" : "INACTIVE"}
            </Badge>
            <Badge variant={streamStatus === "connected" ? "default" : "secondary"}>
              {streamStatus === "connected" ? "LIVE" : streamStatus.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Streaming Binance and Coinbase market data through SSE for{" "}
            {requestedSymbols.join(", ")}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsActive((currentValue) => !currentValue)}
          >
            {isActive ? "Bot Enabled" : "Bot Disabled"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing..." : "Refresh Snapshot"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* The EventSource reconnects whenever this debounced symbol list changes, so the worker
            can rebuild the upstream Binance/Coinbase subscriptions without refreshing the page. */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Stream Symbols</p>
              <Input
                value={symbolInput}
                onChange={(event) => setSymbolInput(event.target.value)}
                placeholder="BTC/USDT, ETH/USD, SOL/USD"
              />
              <p className="text-xs text-muted-foreground">
                Use comma-separated pairs. The worker normalizes them for Binance and Coinbase
                before opening the upstream WebSockets.
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Radio className="h-4 w-4" />
                Stream State: {streamStatus}
              </div>
              <p className="mt-1 text-muted-foreground">
                Snapshot API loads first, then live SSE updates append balance events, trades, and
                generated price signals in place.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execution Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Order Symbol</p>
                <Input
                  value={executionSymbol}
                  onChange={(event) => setExecutionSymbol(event.target.value)}
                  placeholder="BTC/USDT"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Order Amount</p>
                <Input
                  value={executionAmount}
                  onChange={(event) => setExecutionAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="0.01"
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              {/* Keep execution controls visible so users understand the capability and the
                  authorization boundary, but do not let unauthorized users send mutations. */}
              The worker checks the Supabase bearer token and profile role before it signs any
              live order request. Only <code className="font-mono">paid</code> and{" "}
              <code className="font-mono">admin</code> accounts can place or cancel orders.
            </div>

            <div className="flex flex-wrap gap-3">
              {renderTradingActionButton({
                tooltip: tradingActionTooltip,
                button: (
                  <Button
                    onClick={() => placeOrderMutation.mutate("BUY")}
                    disabled={
                      isTradingActionBlocked ||
                      !canSubmitExecutionForm ||
                      placeOrderMutation.isPending
                    }
                  >
                    {placeOrderMutation.isPending ? "Submitting..." : "Place Buy Order"}
                  </Button>
                ),
              })}
              {renderTradingActionButton({
                tooltip: tradingActionTooltip,
                button: (
                  <Button
                    variant="outline"
                    onClick={() => placeOrderMutation.mutate("SELL")}
                    disabled={
                      isTradingActionBlocked ||
                      !canSubmitExecutionForm ||
                      placeOrderMutation.isPending
                    }
                  >
                    {placeOrderMutation.isPending ? "Submitting..." : "Place Sell Order"}
                  </Button>
                ),
              })}
            </div>

            {!canSubmitExecutionForm ? (
              <p className="text-xs text-muted-foreground">
                Enter a normalized symbol and a positive amount before submitting a market order.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Market orders route through <code className="font-mono">POST /trading/orders</code>{" "}
                and use server-side exchange credentials.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {streamError && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{streamError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold">{formatUsd(totalBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <ArrowUpRight className="h-5 w-5 text-sky-500" />
              <div>
                <p className="text-sm text-muted-foreground">Daily P&amp;L</p>
                <p className={`text-2xl font-bold ${balances.dailyProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {formatSignedUsd(balances.dailyProfit)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-fuchsia-500" />
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">{balances.winRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Open Positions</p>
                <p className="text-2xl font-bold">{openTrades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Live Signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {signals.map((signal) => (
              <div
                key={`${signal.provider || signal.exchange || "signal"}-${signal.pair}`}
                className="rounded-lg border p-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {renderSignalIcon(signal.direction)}
                    <div>
                      <p className="font-medium">{signal.pair}</p>
                      <p className="text-sm text-muted-foreground">
                        {signal.exchange || "Exchange"} · {signal.timeframe}
                      </p>
                    </div>
                  </div>
                  <Badge variant={signal.direction === "UP" ? "default" : "destructive"}>
                    {signal.direction}
                  </Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div>
                    Price:{" "}
                    <span className="font-medium text-foreground">
                      {signal.price ? formatUsd(signal.price) : "n/a"}
                    </span>
                  </div>
                  <div>
                    24h Move:{" "}
                    <span className="font-medium text-foreground">
                      {signal.changePct !== undefined
                        ? `${signal.changePct > 0 ? "+" : ""}${signal.changePct.toFixed(2)}%`
                        : "n/a"}
                    </span>
                  </div>
                  <div>
                    Strength: <span className="font-medium text-foreground">{signal.strength}</span>
                  </div>
                  <div>
                    Confidence:{" "}
                    <span className="font-medium text-foreground">{signal.confidence}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Connected Platforms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {platforms.map((platform) => (
              <div key={getPlatformKey(platform)} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{platform.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {platform.currency
                        ? formatAssetBalance(platform.balance, platform.currency)
                        : formatUsd(platform.balance)}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(platform.status)}>
                    {platform.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>{platform.message || "Waiting for stream status."}</p>
                  <p>
                    Market: {platform.marketStatus || "n/a"} · Account:{" "}
                    {platform.accountStatus || "n/a"}
                  </p>
                  {platform.subscribedSymbols?.length ? (
                    <p>Symbols: {platform.subscribedSymbols.join(", ")}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Balance Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balanceUpdates.map((balanceUpdate) => (
                  <TableRow key={balanceUpdate.id}>
                    <TableCell className="font-medium">{balanceUpdate.exchange}</TableCell>
                    <TableCell>{balanceUpdate.asset}</TableCell>
                    <TableCell>
                      {formatAssetBalance(balanceUpdate.totalBalance, balanceUpdate.currency)}
                    </TableCell>
                    <TableCell>
                      {formatAssetBalance(
                        balanceUpdate.availableBalance,
                        balanceUpdate.currency
                      )}
                    </TableCell>
                    <TableCell
                      className={
                        balanceUpdate.change && balanceUpdate.change < 0
                          ? "text-rose-500"
                          : "text-emerald-500"
                      }
                    >
                      {balanceUpdate.change === null
                        ? "n/a"
                        : formatSignedUsd(balanceUpdate.change)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Trades &amp; Fills</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pair</TableHead>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.pair}</TableCell>
                    <TableCell>{trade.exchange || "Worker snapshot"}</TableCell>
                    <TableCell>
                      <Badge variant={trade.type === "BUY" ? "default" : "destructive"}>
                        {trade.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{trade.amount}</TableCell>
                    <TableCell>{formatUsd(trade.price)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{trade.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {trade.status === "OPEN"
                        ? renderTradingActionButton({
                            tooltip: tradingActionTooltip,
                            button: (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cancelOrderMutation.mutate(trade)}
                                disabled={
                                  isTradingActionBlocked || cancelOrderMutation.isPending
                                }
                              >
                                {cancelOrderMutation.isPending
                                  ? "Canceling..."
                                  : "Cancel Order"}
                              </Button>
                            ),
                          })
                        : (
                          <span className="text-xs text-muted-foreground">n/a</span>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
