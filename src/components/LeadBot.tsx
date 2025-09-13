import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import { Share2, Users, MessageSquare, TrendingUp, Target, Zap, Calendar } from 'lucide-react';

interface Campaign {
  id: string;
  platform: string;
  content: string;
  reach: number;
  leads: number;
  engagement: number;
  status: 'ACTIVE' | 'SCHEDULED' | 'COMPLETED';
  scheduledTime?: Date;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  service: string;
  source: string;
  timestamp: Date;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED';
}

export default function LeadBot() {
  const [isActive, setIsActive] = useState(true);
  const [totalLeads, setTotalLeads] = useState(847);
  const [monthlyLeads, setMonthlyLeads] = useState(156);
  const [conversionRate, setConversionRate] = useState(23.5);
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      platform: 'Facebook',
      content: 'Professional fence installation - Free estimates! Transform your property with quality fencing.',
      reach: 12500,
      leads: 28,
      engagement: 8.5,
      status: 'ACTIVE'
    },
    {
      id: '2',
      platform: 'Instagram',
      content: 'Before & After: Amazing fence transformations in your area. See the difference quality makes!',
      reach: 8900,
      leads: 19,
      engagement: 12.3,
      status: 'ACTIVE'
    },
    {
      id: '3',
      platform: 'TikTok',
      content: 'Quick fence repair tips & when to call the pros. Don\'t let damaged fences hurt your property value!',
      reach: 15600,
      leads: 34,
      engagement: 15.8,
      status: 'SCHEDULED',
      scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000)
    }
  ]);

  const [recentLeads, setRecentLeads] = useState<Lead[]>([
    { id: '1', name: 'Maria Rodriguez', phone: '(555) 123-4567', service: 'Chain Link Fence', source: 'Facebook', timestamp: new Date(), status: 'NEW' },
    { id: '2', name: 'John Smith', phone: '(555) 987-6543', service: 'Privacy Fence', source: 'Instagram', timestamp: new Date(Date.now() - 30 * 60 * 1000), status: 'CONTACTED' },
    { id: '3', name: 'Lisa Johnson', phone: '(555) 456-7890', service: 'Fence Repair', source: 'TikTok', timestamp: new Date(Date.now() - 60 * 60 * 1000), status: 'QUALIFIED' }
  ]);

  const [platforms] = useState([
    { name: 'Facebook', status: 'connected', posts: 45, leads: 128 },
    { name: 'Instagram', status: 'connected', posts: 38, leads: 94 },
    { name: 'TikTok', status: 'connected', posts: 22, leads: 67 },
    { name: 'LinkedIn', status: 'pending', posts: 0, leads: 0 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isActive) {
        // Simulate new leads coming in
        if (Math.random() > 0.8) {
          setTotalLeads(prev => prev + 1);
          setMonthlyLeads(prev => prev + 1);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isActive]);

  const handleCreateCampaign = () => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      platform: 'Auto-Selected',
      content: 'AI-Generated: Quality fencing solutions for your home. Professional installation, competitive prices!',
      reach: 0,
      leads: 0,
      engagement: 0,
      status: 'SCHEDULED',
      scheduledTime: new Date(Date.now() + 30 * 60 * 1000)
    };
    setCampaigns(prev => [newCampaign, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Lead Generation Bot</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">Auto-Posting</span>
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
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{monthlyLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Share2 className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'ACTIVE').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Campaigns */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Active Campaigns</span>
              </CardTitle>
              <Button onClick={handleCreateCampaign} size="sm">
                Create Campaign
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{campaign.platform}</Badge>
                    <Badge variant={
                      campaign.status === 'ACTIVE' ? "default" : 
                      campaign.status === 'SCHEDULED' ? "secondary" : "outline"
                    }>
                      {campaign.status}
                    </Badge>
                  </div>
                  <p className="text-sm mb-3">{campaign.content}</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Reach</p>
                      <p className="font-medium">{campaign.reach.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Leads</p>
                      <p className="font-medium">{campaign.leads}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Engagement</p>
                      <p className="font-medium">{campaign.engagement}%</p>
                    </div>
                  </div>
                  {campaign.scheduledTime && (
                    <div className="mt-2 flex items-center space-x-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Scheduled: {campaign.scheduledTime.toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Status */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platforms.map((platform, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{platform.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {platform.posts} posts • {platform.leads} leads
                    </p>
                  </div>
                  <Badge variant={platform.status === 'connected' ? "default" : "secondary"}>
                    {platform.status}
                  </Badge>
                </div>
              ))}
              <Button className="w-full" variant="outline">
                + Connect Platform
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Recent Leads</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-left p-2">Service</th>
                  <th className="text-left p-2">Source</th>
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b">
                    <td className="p-2 font-medium">{lead.name}</td>
                    <td className="p-2">{lead.phone}</td>
                    <td className="p-2">{lead.service}</td>
                    <td className="p-2">
                      <Badge variant="outline">{lead.source}</Badge>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {lead.timestamp.toLocaleTimeString()}
                    </td>
                    <td className="p-2">
                      <Badge variant={
                        lead.status === 'NEW' ? "default" :
                        lead.status === 'CONTACTED' ? "secondary" :
                        lead.status === 'QUALIFIED' ? "outline" : "destructive"
                      }>
                        {lead.status}
                      </Badge>
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