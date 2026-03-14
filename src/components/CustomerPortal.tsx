import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Crown, TrendingUp, Users, Zap, DollarSign, Star, CheckCircle } from 'lucide-react';
import { getCustomerPortalData, type CustomerPortalResponse } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

type Service = CustomerPortalResponse['services'][number];
type Subscriber = CustomerPortalResponse['subscribers'][number];

export default function CustomerPortal() {
  const [activeTab, setActiveTab] = useState('services');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customer-portal'],
    queryFn: getCustomerPortalData,
  });

  const services: Service[] = data?.services ?? [];
  const subscribers: Subscriber[] = data?.subscribers ?? [];
  const performance = data?.performance ?? [];
  const revenueBreakdown = data?.revenueBreakdown ?? [];
  const metrics = data?.metrics ?? {
    monthlyRevenue: 0,
    activeSubscribers: 0,
    monthlyGrowth: 0,
    rating: 0,
  };
  const revenueTotal = revenueBreakdown.length
    ? revenueBreakdown.reduce((sum, entry) => sum + entry.amount, 0)
    : metrics.monthlyRevenue;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Could not load customer portal data." onRetry={() => refetch()} />;
  }

  if (!services.length && !subscribers.length) {
    return (
      <EmptyState
        title="No customer data yet"
        description="Add services or subscribers, then refresh."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Customer Portal</h2>
        <Badge variant="default" className="px-3 py-1">
          Income Stream Services
        </Badge>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">${metrics.monthlyRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Subscribers</p>
                <p className="text-2xl font-bold">{metrics.activeSubscribers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <p className="text-2xl font-bold">+{metrics.monthlyGrowth}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">{metrics.rating}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Service Plans</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <Card key={service.id} className={`relative ${service.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {service.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Crown className="h-5 w-5" />
                      <span>{service.name}</span>
                    </CardTitle>
                    <div className="text-right">
                      <p className="text-2xl font-bold">${service.price}</p>
                      <p className="text-sm text-muted-foreground">/{service.period}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">{service.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">Expected ROI:</span>
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        {service.roi}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {service.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full">
                      Subscribe Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Customer</th>
                      <th className="text-left p-2">Service</th>
                      <th className="text-left p-2">Join Date</th>
                      <th className="text-left p-2">Revenue</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="border-b">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{subscriber.name}</p>
                            <p className="text-sm text-muted-foreground">{subscriber.email}</p>
                          </div>
                        </td>
                        <td className="p-2">{subscriber.service}</td>
                        <td className="p-2">{new Date(subscriber.joinDate).toLocaleDateString()}</td>
                        <td className="p-2 font-medium">${subscriber.revenue}</td>
                        <td className="p-2">
                          <Badge variant={
                            subscriber.status === 'active' ? "default" :
                            subscriber.status === 'paused' ? "secondary" : "destructive"
                          }>
                            {subscriber.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performance.map((item) => (
                    <div key={item.service}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">{item.service}</span>
                        <span className="text-sm">{item.subscribers} subscribers</span>
                      </div>
                      <Progress value={item.progress} />
                    </div>
                  ))}
                  {!performance.length && (
                    <p className="text-sm text-muted-foreground">No performance data yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueBreakdown.map((entry) => (
                    <div key={entry.service} className="flex justify-between items-center">
                      <span>{entry.service}</span>
                      <span className="font-bold">${entry.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {!revenueBreakdown.length && (
                    <p className="text-sm text-muted-foreground">No revenue breakdown yet.</p>
                  )}
                  <hr />
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total Monthly Revenue</span>
                    <span>${revenueTotal.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
