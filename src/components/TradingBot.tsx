import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Activity, Zap, Target } from 'lucide-react';
import { getTradingBotData, type TradingBotResponse } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

type Trade = TradingBotResponse['trades'][number];
type Signal = TradingBotResponse['signals'][number];
type Platform = TradingBotResponse['platforms'][number];

export default function TradingBot() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['trading-bot'],
    queryFn: getTradingBotData,
  });

  const [isActive, setIsActive] = useState(false);

  const balances = data?.balances ?? { totalBalance: 0, dailyProfit: 0, winRate: 0 };
  const trades = data?.trades ?? [];
  const signals = data?.signals ?? [];
  const platforms = data?.platforms ?? [];
  const openTrades = trades.filter((trade) => trade.status === 'OPEN');

  useEffect(() => {
    if (data?.botStatus) {
      setIsActive(data.botStatus.active);
    }
  }, [data?.botStatus]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Could not load trading data." onRetry={() => refetch()} />;
  }

  if (!trades.length && !signals.length && !platforms.length) {
    return (
      <EmptyState
        title="No trading data yet"
        description="Connect an exchange or retry."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">AI Trading Bot</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Bot Status</span>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold">${balances.totalBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Daily P&L</p>
                <p className="text-2xl font-bold text-green-500">+${balances.dailyProfit.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">{balances.winRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Trades</p>
                <p className="text-2xl font-bold">{openTrades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Signals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Live Signals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {signals.map((signal, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {signal.direction === 'UP' ? 
                      <TrendingUp className="h-4 w-4 text-green-500" /> : 
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    }
                    <div>
                      <p className="font-medium">{signal.pair}</p>
                      <p className="text-sm text-muted-foreground">{signal.timeframe}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={signal.direction === 'UP' ? "default" : "destructive"}>
                      {signal.direction}
                    </Badge>
                    <p className="text-sm mt-1">Conf: {signal.confidence}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Connections */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platforms.map((platform, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{platform.name}</p>
                    <p className="text-sm text-muted-foreground">${platform.balance.toFixed(2)}</p>
                  </div>
                  <Badge variant={platform.status === 'connected' ? "default" : "secondary"}>
                    {platform.status}
                  </Badge>
                </div>
              ))}
              <Button className="w-full" variant="outline">
                + Add Platform
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Active Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Pair</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Entry Price</th>
                  <th className="text-left p-2">P&L</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.map((trade) => (
                  <tr key={trade.id} className="border-b">
                    <td className="p-2 font-medium">{trade.pair}</td>
                    <td className="p-2">
                      <Badge variant={trade.type === 'BUY' ? "default" : "destructive"}>
                        {trade.type}
                      </Badge>
                    </td>
                    <td className="p-2">{trade.amount}</td>
                    <td className="p-2">${trade.price.toFixed(2)}</td>
                    <td className={`p-2 font-medium ${trade.profit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)}
                    </td>
                    <td className="p-2">
                      <Badge variant="outline">{trade.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
