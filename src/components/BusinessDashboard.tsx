import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, DollarSign, Activity, ShoppingCart, Home, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { getBusinessStats } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

const BusinessDashboard: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['business-stats'],
    queryFn: getBusinessStats,
  });

  const stats = data?.stats ?? [];
  const recentLeads = data?.recentLeads ?? [];
  const ncsStatus = data?.ncsStatus ?? [];

  const iconByStat: Record<string, LucideIcon> = {
    ecogen_sales: ShoppingCart,
    fencing_leads: Home,
    island_bwoy_orders: UtensilsCrossed,
    total_revenue: DollarSign,
  };

  const colorByStat: Record<string, string> = {
    ecogen_sales: 'text-emerald-500',
    fencing_leads: 'text-blue-500',
    island_bwoy_orders: 'text-amber-500',
    total_revenue: 'text-violet-500',
  };

  const formatValue = (value: number, unit: 'usd' | 'count') =>
    unit === 'usd'
      ? `$${value.toLocaleString()}`
      : value.toLocaleString();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Could not load business stats." onRetry={() => refetch()} />;
  }

  if (!stats.length && !recentLeads.length && !ncsStatus.length) {
    return <EmptyState title="No business data yet" description="Connect sources to see stats and leads." />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = iconByStat[stat.id] ?? Activity;
          const color = colorByStat[stat.id] ?? 'text-primary';
          const changeLabel = `${stat.changePct > 0 ? '+' : ''}${stat.changePct}%`;

          return (
            <div key={stat.id} className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                  <p className="text-foreground text-2xl font-bold mt-1">
                    {formatValue(stat.value, stat.unit)}
                  </p>
                  <p className={`text-sm mt-1 ${color}`}>{changeLabel} from last month</p>
                </div>
                <div className={`p-3 rounded-full bg-surface-muted ${color}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Business Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-foreground text-lg font-semibold mb-4">Recent Fencing Leads</h3>
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                <div>
                  <p className="text-foreground font-medium">{lead.name}</p>
                  <p className="text-muted-foreground text-sm">{lead.service}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-semibold">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lead.value)}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    lead.status === 'New' ? 'bg-primary/15 text-primary' :
                    lead.status === 'Quoted' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                  }`}>
                    {lead.status}
                  </span>
                </div>
              </div>
            ))}
            {!recentLeads.length && (
              <div className="text-sm text-muted-foreground text-center py-6">
                No recent leads yet.
              </div>
            )}
          </div>
        </div>

        {/* Worker Status */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-foreground text-lg font-semibold mb-4">Nick Control System (NCS)</h3>
          <div className="space-y-3">
            {ncsStatus.map((worker) => {
              const statusColor =
                worker.status === 'active'
                  ? 'text-emerald-400'
                  : worker.status === 'idle'
                  ? 'text-amber-400'
                  : 'text-red-400';
              const dotColor =
                worker.status === 'active'
                  ? 'bg-green-500'
                  : worker.status === 'idle'
                  ? 'bg-yellow-500'
                  : 'bg-red-500';

              return (
                <div key={worker.id} className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 ${dotColor} rounded-full ${worker.status === 'active' ? 'animate-pulse' : ''}`}></div>
                    <span className="text-foreground">{worker.name}</span>
                  </div>
                  <span className={`${statusColor} text-sm capitalize`}>{worker.status}</span>
                </div>
              );
            })}
            {!ncsStatus.length && (
              <div className="text-sm text-muted-foreground text-center py-4">No worker status available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
