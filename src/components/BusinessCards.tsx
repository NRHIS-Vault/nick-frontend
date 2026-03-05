import React from 'react';
import { ExternalLink, TrendingUp, Users, MapPin } from 'lucide-react';

const BusinessCards: React.FC = () => {
  const businesses = [
    {
      name: 'EcoGen Market',
      description: 'Global dropshipping store with AI-powered product research',
      image: 'https://d64gsuwffb70l.cloudfront.net/68b924f79c49746e335d84b0_1756964139845_b445f52f.webp',
      stats: { revenue: '$12,450', products: '2,340', customers: '890' },
      status: 'Active',
      color: 'border-emerald-400'
    },
    {
      name: 'Real Fencing & Home Improvement',
      description: 'Professional fencing services with automated lead generation',
      image: 'https://d64gsuwffb70l.cloudfront.net/68b924f79c49746e335d84b0_1756964132851_80107075.webp',
      stats: { leads: '23', quoted: '$45K', completed: '12' },
      status: 'Active',
      color: 'border-primary'
    },
    {
      name: 'Island Bwoy',
      description: 'Caribbean restaurant & natural juice factory',
      image: 'https://d64gsuwffb70l.cloudfront.net/68b924f79c49746e335d84b0_1756964137192_06f138ba.webp',
      stats: { orders: '156', revenue: '$8,920', rating: '4.8' },
      status: 'Growing',
      color: 'border-amber-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {businesses.map((business, index) => (
        <div key={index} className={`bg-card rounded-lg overflow-hidden border-2 ${business.color} hover:shadow-lg transition-all duration-300`}>
          <div className="relative h-48 overflow-hidden">
            <img 
              src={business.image} 
              alt={business.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-4 right-4">
              <span className={`px-2 py-1 text-xs rounded-full ${
                business.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100' :
                business.status === 'Growing' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-100' :
                'bg-surface-muted text-muted-foreground'
              }`}>
                {business.status}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-foreground text-lg font-semibold mb-2">{business.name}</h3>
            <p className="text-muted-foreground text-sm mb-4">{business.description}</p>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              {Object.entries(business.stats).map(([key, value], statIndex) => (
                <div key={statIndex} className="text-center">
                  <p className="text-foreground font-semibold">{value}</p>
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
