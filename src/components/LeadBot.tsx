import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import { Share2, Users, MessageSquare, TrendingUp, Target, Zap, Calendar } from 'lucide-react';
import { getLeadBotData, type LeadBotResponse } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

type Campaign = LeadBotResponse['campaigns'][number];
type Lead = LeadBotResponse['recentLeads'][number];
type Platform = LeadBotResponse['platforms'][number];

export default function LeadBot() {
  const [isActive, setIsActive] = useState(true);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['lead-bot'],
    queryFn: getLeadBotData,
  });

  const overview = data?.overview;
  const campaigns = data?.campaigns ?? [];
  const recentLeads = data?.recentLeads ?? [];
  const platforms = data?.platforms ?? [];

  const totalLeads = overview?.totalLeads ?? 0;
  const monthlyLeads = overview?.monthlyLeads ?? 0;
  const conversionRate = overview?.conversionRate ?? 0;

  const handleCreateCampaign = () => {
    // For now, re-fetch sample data to emulate a refresh after creation.
    refetch();
  };

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
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Could not load LeadBot data." onRetry={() => refetch()} />;
  }

  if (!campaigns.length && !platforms.length && !recentLeads.length) {
    return (
      <EmptyState
        title="No LeadBot data yet"
        description="Connect social platforms or try again."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

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
                      <span>Scheduled: {new Date(campaign.scheduledTime).toLocaleTimeString()}</span>
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
                      {new Date(lead.timestamp).toLocaleTimeString()}
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
