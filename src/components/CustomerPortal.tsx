import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  Crown,
  DollarSign,
  LineChart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';

import { getCustomerPortalAnalytics, getCustomerPortalPlans, type CustomerPortalAnalyticsResponse, type CustomerPortalPlansResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

type Plan = CustomerPortalPlansResponse['plans'][number];
type Analytics = CustomerPortalAnalyticsResponse;
type Subscriber = Analytics['subscribers'][number];
type SubscriberStatus = Analytics['statusBreakdown'][number]['status'];

const planChartConfig = {
  mrr: {
    label: 'MRR',
    color: 'hsl(var(--chart-1))',
  },
};

const growthChartConfig = {
  newSubscribers: {
    label: 'New Subscribers',
    color: 'hsl(var(--chart-2))',
  },
};

const statusChartConfig = {
  active: { label: 'Active', color: '#16a34a' },
  trialing: { label: 'Trialing', color: '#2563eb' },
  past_due: { label: 'Past Due', color: '#f59e0b' },
  paused: { label: 'Paused', color: '#64748b' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
  unpaid: { label: 'Unpaid', color: '#dc2626' },
  incomplete: { label: 'Incomplete', color: '#a855f7' },
} satisfies Record<SubscriberStatus, { label: string; color: string }>;

const formatCurrency = (value: number, currency = 'usd') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);

const formatStatusLabel = (status: SubscriberStatus) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatBillingLabel = (intervalCount: number, interval: Plan['billingInterval']) =>
  intervalCount === 1 ? interval : `${intervalCount} ${interval}s`;

const formatSourceLabel = (source?: string) => {
  if (!source) {
    return 'Unavailable';
  }

  return source.charAt(0).toUpperCase() + source.slice(1);
};

const statusBadgeClassName: Record<SubscriberStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
  past_due: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  paused: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
  unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
  incomplete: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200',
};

const metricCards = ({
  currency,
  analytics,
}: {
  currency: string;
  analytics: Analytics | undefined;
}) => {
  const overview = analytics?.overview;

  return [
    {
      id: 'mrr',
      label: 'Monthly Recurring Revenue',
      value: overview ? formatCurrency(overview.mrr, currency) : formatCurrency(0, currency),
      description: 'Normalized monthly run rate',
      icon: DollarSign,
      accent: 'text-emerald-500',
    },
    {
      id: 'arr',
      label: 'Annual Run Rate',
      value: overview ? formatCurrency(overview.arr, currency) : formatCurrency(0, currency),
      description: 'MRR multiplied by 12',
      icon: TrendingUp,
      accent: 'text-cyan-500',
    },
    {
      id: 'active',
      label: 'Active Subscribers',
      value: overview?.activeSubscribers.toLocaleString() ?? '0',
      description: 'Active, trialing, and past-due subscriptions',
      icon: Users,
      accent: 'text-blue-500',
    },
    {
      id: 'arpa',
      label: 'Avg Revenue Per Active Subscriber',
      value: overview
        ? formatCurrency(overview.averageRevenuePerActiveSubscriber, currency)
        : formatCurrency(0, currency),
      description: 'MRR divided by active subscriber count',
      icon: BarChart3,
      accent: 'text-violet-500',
    },
  ];
};

export default function CustomerPortal() {
  const plansQuery = useQuery({
    queryKey: ['customer-portal', 'plans'],
    queryFn: getCustomerPortalPlans,
  });
  const analyticsQuery = useQuery({
    queryKey: ['customer-portal', 'analytics'],
    queryFn: getCustomerPortalAnalytics,
  });

  const plans = plansQuery.data?.plans ?? [];
  const analytics = analyticsQuery.data;
  const subscribers = analytics?.subscribers ?? [];
  const defaultCurrency = plans[0]?.currency ?? subscribers[0]?.currency ?? 'usd';

  // Merge plan metadata from the plans endpoint with live rollups from analytics so card content
  // stays descriptive while subscriber and revenue counters remain real-time.
  const planMetrics = new Map((analytics?.planBreakdown ?? []).map((entry) => [entry.planId, entry]));
  const statusChartData = (analytics?.statusBreakdown ?? []).map((entry) => ({
    ...entry,
    fill: statusChartConfig[entry.status].color,
    label: statusChartConfig[entry.status].label,
  }));
  const retryAll = () => {
    void Promise.all([plansQuery.refetch(), analyticsQuery.refetch()]);
  };

  const isLoading = (plansQuery.isLoading || analyticsQuery.isLoading) && !plans.length && !analytics;
  const hasAnyError = plansQuery.isError || analyticsQuery.isError;
  const hasData = plans.length > 0 || subscribers.length > 0 || (analytics?.planBreakdown.length ?? 0) > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="h-80 xl:col-span-2" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (hasAnyError && !hasData) {
    return <ErrorState message="Could not load customer portal plans or analytics." onRetry={retryAll} />;
  }

  if (!hasData) {
    return (
      <EmptyState
        title="No customer portal data yet"
        description="Connect a plans source and subscription analytics source to populate this view."
        action={<Button onClick={retryAll}>Retry</Button>}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Customer Portal</h2>
          <p className="text-muted-foreground max-w-2xl">
            Subscription plans, active subscriber counts, and recurring-revenue analytics pulled from Worker endpoints.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Plans: {formatSourceLabel(plansQuery.data?.source)}</Badge>
          <Badge variant="outline">Analytics: {formatSourceLabel(analytics?.source)}</Badge>
          {analytics?.computedAt && (
            <Badge variant="secondary">
              Updated {new Date(analytics.computedAt).toLocaleString()}
            </Badge>
          )}
        </div>
      </div>

      {hasAnyError && (
        <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Part of the customer portal data failed to refresh.
                </p>
                <p className="text-sm text-amber-700/90 dark:text-amber-300/90">
                  The UI is showing the latest successful query results for the sections that still have data.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={retryAll}>
              Retry Refresh
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards({ currency: defaultCurrency, analytics }).map((metric) => {
          const Icon = metric.icon;

          return (
            <Card key={metric.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                  <div className={`rounded-full bg-muted p-3 ${metric.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary" className="px-3 py-1">
          Total subscribers: {analytics?.overview.totalSubscribers ?? 0}
        </Badge>
        <Badge variant="secondary" className="px-3 py-1">
          Trialing: {analytics?.overview.trialSubscribers ?? 0}
        </Badge>
        <Badge variant="secondary" className="px-3 py-1">
          At risk: {analytics?.overview.atRiskSubscribers ?? 0}
        </Badge>
        {(analytics?.statusBreakdown ?? []).map((entry) => (
          <Badge key={entry.status} variant="outline" className="px-3 py-1">
            {formatStatusLabel(entry.status)}: {entry.count}
          </Badge>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Plan Cards</h3>
            <p className="text-sm text-muted-foreground">
              Plans come from `/customerPortal/plans`; subscriber and MRR badges come from `/customerPortal/analytics`.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const metric = planMetrics.get(plan.id);

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden ${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute right-4 top-4">
                    <Badge>Popular</Badge>
                  </div>
                )}
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Crown className="h-5 w-5 text-primary" />
                        {plan.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">
                        {formatCurrency(plan.price, plan.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        / {formatBillingLabel(plan.billingIntervalCount, plan.billingInterval)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {formatCurrency(plan.monthlyPriceEquivalent, plan.currency)}/month equivalent
                    </Badge>
                    <Badge variant="outline">{plan.roi}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">Active Subscribers</p>
                      <p className="mt-1 text-xl font-semibold">
                        {metric?.activeSubscribers ?? 0}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/60 p-3">
                      <p className="text-xs text-muted-foreground">Plan MRR</p>
                      <p className="mt-1 text-xl font-semibold">
                        {formatCurrency(metric?.mrr ?? 0, plan.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {!plan.features.length && (
                      <p className="text-sm text-muted-foreground">No features listed for this plan yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              MRR by Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.planBreakdown.length ? (
              <ChartContainer config={planChartConfig} className="h-80 w-full">
                <BarChart data={analytics.planBreakdown} margin={{ left: 12, right: 12, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="planName" tickLine={false} axisLine={false} interval={0} angle={-12} textAnchor="end" height={64} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(Number(value), defaultCurrency)}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent labelFormatter={(value) => String(value)} />}
                  />
                  <Bar dataKey="mrr" radius={[8, 8, 0, 0]} fill="var(--color-mrr)" />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No plan revenue data available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Subscriber Status Mix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusChartData.length ? (
              <>
                <ChartContainer config={statusChartConfig} className="h-72 w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                    <Pie
                      data={statusChartData}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={60}
                      outerRadius={92}
                      paddingAngle={4}
                    >
                      {statusChartData.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap gap-2">
                  {statusChartData.map((entry) => (
                    <div key={entry.status} className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span>{entry.label}</span>
                      <span className="text-muted-foreground">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No subscriber status data available yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-blue-500" />
              New Subscribers by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.monthlySeries.length ? (
              <ChartContainer config={growthChartConfig} className="h-72 w-full">
                <AreaChart data={analytics.monthlySeries} margin={{ left: 12, right: 12, top: 8 }}>
                  <defs>
                    <linearGradient id="customer-portal-growth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-newSubscribers)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-newSubscribers)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="newSubscribers"
                    stroke="var(--color-newSubscribers)"
                    fill="url(#customer-portal-growth)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No monthly subscriber trend available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscribers.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="px-2 py-3 font-medium">Subscriber</th>
                      <th className="px-2 py-3 font-medium">Plan</th>
                      <th className="px-2 py-3 font-medium">Status</th>
                      <th className="px-2 py-3 font-medium">Started</th>
                      <th className="px-2 py-3 font-medium">Billing</th>
                      <th className="px-2 py-3 font-medium">Monthly Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((subscriber: Subscriber) => (
                      <tr key={subscriber.id} className="border-b last:border-0">
                        <td className="px-2 py-3">
                          <div>
                            <p className="font-medium">{subscriber.name}</p>
                            <p className="text-sm text-muted-foreground">{subscriber.email}</p>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <div>
                            <p className="font-medium">{subscriber.planName}</p>
                            {subscriber.items.length > 1 && (
                              <p className="text-sm text-muted-foreground">
                                {subscriber.items.length} billable items
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClassName[subscriber.status]}`}>
                            {formatStatusLabel(subscriber.status)}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-sm">
                          {new Date(subscriber.joinDate).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-3 text-sm">
                          {formatCurrency(subscriber.amount, subscriber.currency)}
                          <span className="text-muted-foreground">
                            {' '}
                            / {formatBillingLabel(subscriber.billingIntervalCount, subscriber.billingInterval)}
                          </span>
                        </td>
                        <td className="px-2 py-3 font-medium">
                          {formatCurrency(subscriber.monthlyRecurringRevenue, subscriber.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No subscriber records available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(analytics?.notes ?? []).map((note) => (
              <p key={note} className="text-sm text-muted-foreground">
                {note}
              </p>
            ))}
            {!analytics?.notes.length && (
              <p className="text-sm text-muted-foreground">No analytics notes are available yet.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
