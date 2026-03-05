import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import NickAvatar from './NickAvatar';
import ChatInterface from './ChatInterface';
import BusinessDashboard from './BusinessDashboard';
import RHNISIdentity from './RHNISIdentity';
import BusinessCards from './BusinessCards';
import LeadManagement from './LeadManagement';
import WorkerControl from './WorkerControl';
import TradingBot from './TradingBot';
import LeadBot from './LeadBot';
import CustomerPortal from './CustomerPortal';
import { Menu, X, Bot, BarChart3, Shield, Building2, Settings, Bell, Users, Cpu, TrendingUp, Share2, Crown, Sun, Moon } from 'lucide-react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { Toaster } from './ui/toaster';
import { Toaster as Sonner } from './ui/sonner';

const heroImage = "https://d64gsuwffb70l.cloudfront.net/68b924f79c49746e335d84b0_1756964132097_f184388e.webp";

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'trading', label: 'Trading Bot', icon: TrendingUp },
  { id: 'leadbot', label: 'Lead Bot', icon: Share2 },
  { id: 'portal', label: 'Customer Portal', icon: Crown },
  { id: 'rhnis', label: 'RHNIS Identity', icon: Shield },
  { id: 'businesses', label: 'Businesses', icon: Building2 },
  { id: 'leads', label: 'Lead Manager', icon: Users },
  { id: 'workers', label: 'NCS Workers', icon: Cpu },
  { id: 'chat', label: 'Nick Chat', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings }
];

const LayoutShell: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <BusinessDashboard />;
      case 'trading':
        return <TradingBot />;
      case 'leadbot':
        return <LeadBot />;
      case 'portal':
        return <CustomerPortal />;
      case 'rhnis':
        return <RHNISIdentity />;
      case 'businesses':
        return <BusinessCards />;
      case 'leads':
        return <LeadManagement />;
      case 'workers':
        return <WorkerControl />;
      case 'chat':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <NickAvatar />
              <h2 className="text-2xl font-bold mt-4">Nick AI Assistant</h2>
              <p className="text-muted-foreground mt-2">Your Right Hand Nick Identity System</p>
            </div>
            <ChatInterface />
          </div>
        );
      default:
        return <BusinessDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={heroImage} 
          alt="RHNIS Command Center"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-strong/85 to-brand/70"></div>
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-sm">
                RHNIS Control Center
              </h1>
              <p className="text-lg text-foreground/80">
                Right Hand Nick Identity System - Your AI-powered business automation platform
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveSection('chat')}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-lg shadow-primary/30"
                >
                  Talk to Nick
                </button>
                <button 
                  onClick={() => setActiveSection('rhnis')}
                  className="px-6 py-3 bg-background text-foreground rounded-lg hover:bg-surface-muted transition-colors font-semibold border border-border"
                >
                  View Identity
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Bot className="text-primary-foreground" size={20} />
                </div>
                <span className="text-foreground font-bold text-lg">RHNIS</span>
              </div>
              
              {!isMobile && (
                <nav className="flex gap-2">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        activeSection === item.id 
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/40' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'
                      }`}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </button>
                  ))}
                </nav>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Bell size={20} />
              </button>
              
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-foreground font-bold text-lg">Menu</span>
              <button onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground">
                <X size={24} />
              </button>
            </div>
            <nav className="space-y-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    toggleSidebar();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeSection === item.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => {
                  toggleTheme();
                  toggleSidebar();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                {theme === 'light' ? 'Dark theme' : 'Light theme'}
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {renderContent()}
      </div>

      {/* Floating Nick Avatar */}
      <NickAvatar isFloating={true} onToggleChat={() => setActiveSection('chat')} />

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4">
        <div className="container mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-muted-foreground">System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-muted-foreground">Nick Active</span>
            </div>
          </div>
          <div className="text-muted-foreground">
            Last sync: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => (
  <ThemeProvider>
    <LayoutShell />
    {/* Toasts live inside the theme provider so they match the active palette. */}
    <Toaster />
    <Sonner />
  </ThemeProvider>
);

export default AppLayout;
