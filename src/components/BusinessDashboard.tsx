import React from 'react';
import { TrendingUp, Users, DollarSign, Activity, ShoppingCart, Home, UtensilsCrossed } from 'lucide-react';

const BusinessDashboard: React.FC = () => {
  const stats = [
    { label: 'EcoGen Sales', value: '$12,450', change: '+15%', icon: ShoppingCart, color: 'text-emerald-500' },
    { label: 'Fencing Leads', value: '23', change: '+8%', icon: Home, color: 'text-blue-500' },
    { label: 'Island Bwoy Orders', value: '156', change: '+22%', icon: UtensilsCrossed, color: 'text-amber-500' },
    { label: 'Total Revenue', value: '$45,230', change: '+18%', icon: DollarSign, color: 'text-violet-500' }
  ];

  const recentLeads = [
    { name: 'John Smith', service: 'Privacy Fence', value: '$2,500', status: 'New' },
    { name: 'Maria Garcia', service: 'Chain Link', value: '$1,800', status: 'Quoted' },
    { name: 'David Wilson', service: 'Vinyl Fence', value: '$3,200', status: 'Approved' }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-foreground text-2xl font-bold mt-1">{stat.value}</p>
                <p className={`text-sm mt-1 ${stat.color}`}>{stat.change} from last month</p>
              </div>
              <div className={`p-3 rounded-full bg-surface-muted ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Business Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-foreground text-lg font-semibold mb-4">Recent Fencing Leads</h3>
          <div className="space-y-3">
            {recentLeads.map((lead, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                <div>
                  <p className="text-foreground font-medium">{lead.name}</p>
                  <p className="text-muted-foreground text-sm">{lead.service}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-semibold">{lead.value}</p>
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
          </div>
        </div>

        {/* Worker Status */}
        <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-foreground text-lg font-semibold mb-4">Nick Control System (NCS)</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-foreground">Shopify Worker</span>
              </div>
              <span className="text-emerald-400 text-sm">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-foreground">Lead Generator</span>
              </div>
              <span className="text-emerald-400 text-sm">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-foreground">Social Media Bot</span>
              </div>
              <span className="text-amber-400 text-sm">Idle</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;
