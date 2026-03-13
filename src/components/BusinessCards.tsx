import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, TrendingUp } from 'lucide-react';
import { getBusinessCards } from '@/lib/api';

const statusClass = (status: string) => {
  if (status === 'Active') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100';
  if (status === 'Growing') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-100';
  return 'bg-surface-muted text-muted-foreground';
};

const borderClass = (status: string) => {
  if (status === 'Active') return 'border-emerald-400';
  if (status === 'Growing') return 'border-amber-400';
  return 'border-border';
};

const formatStatValue = (key: string, value: number | string) => {
  if (typeof value !== 'number') return value;
  return /revenue|quoted|amount/i.test(key)
    ? `$${value.toLocaleString()}`
    : value.toLocaleString();
};

const BusinessCards: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['business-cards'],
    queryFn: getBusinessCards,
  });

  const businesses = data?.businesses ?? [];

  if (isLoading) {
    return <div className="bg-card p-6 rounded-lg border border-border text-muted-foreground">Loading businesses...</div>;
  }

  if (isError) {
    return (
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/40">
        <p className="text-destructive mb-3">Could not load businesses.</p>
        <button
          className="px-3 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
          onClick={() => refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!businesses.length) {
    return <div className="bg-card p-6 rounded-lg border border-border text-muted-foreground">No businesses to display yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {businesses.map((business) => (
        <div key={business.id} className={`bg-card rounded-lg overflow-hidden border-2 ${borderClass(business.status)} hover:shadow-lg transition-all duration-300`}>
          <div className="relative h-48 overflow-hidden">
            <img 
              src={business.image} 
              alt={business.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-4 right-4">
              <span className={`px-2 py-1 text-xs rounded-full ${statusClass(business.status)}`}>
                {business.status}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-foreground text-lg font-semibold mb-2">{business.name}</h3>
            <p className="text-muted-foreground text-sm mb-4">{business.description}</p>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              {Object.entries(business.stats).map(([key, value]) => (
                <div key={key} className="text-center">
                  <p className="text-foreground font-semibold">{formatStatValue(key, value)}</p>
                  <p className="text-muted-foreground text-xs capitalize">{key}</p>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                <TrendingUp size={14} />
                Analytics
              </button>
              <button className="flex items-center justify-center px-3 py-2 bg-surface-muted text-foreground rounded-lg hover:bg-surface transition-colors border border-border">
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BusinessCards;
