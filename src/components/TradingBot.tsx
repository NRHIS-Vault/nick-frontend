import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import { TrendingUp, TrendingDown, DollarSign, Activity, Zap, Target } from 'lucide-react';

interface Trade {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  profit: number;
  timestamp: Date;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
}

interface Signal {
  pair: string;
  direction: 'UP' | 'DOWN';
  strength: number;
  confidence: number;
  timeframe: string;
}

export default function TradingBot() {
  const [isActive, setIsActive] = useState(false);
  const [balance, setBalance] = useState(25847.32);
  const [dailyProfit, setDailyProfit] = useState(1247.85);
  const [winRate, setWinRate] = useState(78.5);
  const [activeTrades, setActiveTrades] = useState<Trade[]>([
    { id: '1', pair: 'BTC/USDT', type: 'BUY', amount: 0.5, price: 43250, profit: 125.50, timestamp: new Date(), status: 'OPEN' },
    { id: '2', pair: 'ETH/USDT', type: 'SELL', amount: 2.1, price: 2650, profit: -45.20, timestamp: new Date(), status: 'OPEN' },
    { id: '3', pair: 'ADA/USDT', type: 'BUY', amount: 1000, price: 0.45, profit: 78.90, timestamp: new Date(), status: 'OPEN' }
  ]);

  const [signals, setSignals] = useState<Signal[]>([
    { pair: 'BTC/USDT', direction: 'UP', strength: 85, confidence: 92, timeframe: '1H' },
    { pair: 'ETH/USDT', direction: 'DOWN', strength: 72, confidence: 88, timeframe: '4H' },
    { pair: 'SOL/USDT', direction: 'UP', strength: 68, confidence: 75, timeframe: '15M' }
  ]);

  const [platforms] = useState([
    { name: 'Binance', status: 'connected', balance: 15420.50 },
    { name: 'Coinbase', status: 'connected', balance: 8926.82 },
    { name: 'KuCoin', status: 'disconnected', balance: 1500.00 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isActive) {
        // Simulate real-time updates
        setBalance(prev => prev + (Math.random() - 0.4) * 50);
        setDailyProfit(prev => prev + (Math.random() - 0.3) * 20);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isActive]);

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
                <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
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
                <p className="text-2xl font-bold text-green-500">+${dailyProfit.toFixed(2)}</p>
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
                <p className="text-2xl font-bold">{winRate}%</p>
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
                <p className="text-2xl font-bold">{activeTrades.length}</p>
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
                {activeTrades.map((trade) => (
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