import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Crown, TrendingUp, Users, Zap, DollarSign, Star, CheckCircle } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  roi: string;
}

interface Subscriber {
  id: string;
  name: string;
  email: string;
  service: string;
  joinDate: Date;
  revenue: number;
  status: 'active' | 'paused' | 'cancelled';
}

export default function CustomerPortal() {
  const [activeTab, setActiveTab] = useState('services');
  const [totalRevenue, setTotalRevenue] = useState(45670.25);
  const [activeSubscribers, setActiveSubscribers] = useState(127);
  const [monthlyGrowth, setMonthlyGrowth] = useState(18.5);

  const services: Service[] = [
    {
      id: '1',
      name: 'AI Trading Signals',
      description: 'Get real-time trading signals powered by our advanced AI algorithms. Perfect for crypto and forex trading.',
      price: 97,
      period: 'monthly',
      features: ['Real-time signals', '24/7 monitoring', 'Multiple platforms', 'Risk management', 'Mobile alerts'],
      roi: '15-25% monthly',
      popular: true
    },
    {
      id: '2',
      name: 'Lead Generation Pro',
      description: 'Automated lead generation for your business using AI-powered social media campaigns.',
      price: 197,
      period: 'monthly',
      features: ['Multi-platform posting', 'Lead tracking', 'CRM integration', 'Analytics dashboard', 'Custom campaigns'],
      roi: '300-500% ROI'
    },
    {
      id: '3',
      name: 'RHNIS Identity Suite',
      description: 'Complete digital identity system with voice recognition, avatar, and automation tools.',
      price: 297,
      period: 'monthly',
      features: ['Digital avatar', 'Voice commands', 'Identity tracking', 'Legacy preservation', 'Device control'],
      roi: 'Priceless digital legacy'
    },
    {
      id: '4',
      name: 'Full AI Ecosystem',
      description: 'Complete access to all Nick AI services including trading, leads, and identity management.',
      price: 497,
      period: 'monthly',
      features: ['All services included', 'Priority support', 'Custom integrations', 'Advanced analytics', 'White-label options'],
      roi: '500-1000% ROI',
      popular: true
    }
  ];

  const subscribers: Subscriber[] = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah@email.com', service: 'AI Trading Signals', joinDate: new Date('2024-01-15'), revenue: 485, status: 'active' },
    { id: '2', name: 'Mike Chen', email: 'mike@email.com', service: 'Full AI Ecosystem', joinDate: new Date('2024-02-01'), revenue: 1491, status: 'active' },
    { id: '3', name: 'Lisa Rodriguez', email: 'lisa@email.com', service: 'Lead Generation Pro', joinDate: new Date('2024-01-20'), revenue: 788, status: 'active' },
    { id: '4', name: 'David Wilson', email: 'david@email.com', service: 'RHNIS Identity Suite', joinDate: new Date('2024-02-10'), revenue: 594, status: 'paused' }
  ];

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
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
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
                <p className="text-2xl font-bold">{activeSubscribers}</p>
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
                <p className="text-2xl font-bold">+{monthlyGrowth}%</p>
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
                <p className="text-2xl font-bold">4.9/5</p>
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
                        <td className="p-2">{subscriber.joinDate.toLocaleDateString()}</td>
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
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">AI Trading Signals</span>
                      <span className="text-sm">45 subscribers</span>
                    </div>
                    <Progress value={75} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Lead Generation Pro</span>
                      <span className="text-sm">32 subscribers</span>
                    </div>
                    <Progress value={55} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">RHNIS Identity Suite</span>
                      <span className="text-sm">28 subscribers</span>
                    </div>
                    <Progress value={45} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Full AI Ecosystem</span>
                      <span className="text-sm">22 subscribers</span>
                    </div>
                    <Progress value={35} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>AI Trading Signals</span>
                    <span className="font-bold">$4,365</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Lead Generation Pro</span>
                    <span className="font-bold">$6,304</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>RHNIS Identity Suite</span>
                    <span className="font-bold">$8,316</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Full AI Ecosystem</span>
                    <span className="font-bold">$10,934</span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total Monthly Revenue</span>
                    <span>${totalRevenue.toFixed(2)}</span>
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