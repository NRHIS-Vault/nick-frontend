import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import NickAvatar from './NickAvatar';
import { Menu, X, Bot, BarChart3, Shield, Building2, Settings, Bell, Users, Cpu, TrendingUp, Share2, Crown, Sun, Moon } from 'lucide-react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { Toaster } from './ui/toaster';
import { Toaster as Sonner } from './ui/sonner';

const heroImage = "https://d64gsuwffb70l.cloudfront.net/68b924f79c49746e335d84b0_1756964132097_f184388e.webp";

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
  { id: 'trading', label: 'Trading Bot', icon: TrendingUp, path: '/trading' },
  { id: 'leadbot', label: 'Lead Bot', icon: Share2, path: '/leadbot' },
  { id: 'portal', label: 'Customer Portal', icon: Crown, path: '/portal' },
  { id: 'rhnis', label: 'RHNIS Identity', icon: Shield, path: '/rhnis' },
  { id: 'businesses', label: 'Businesses', icon: Building2, path: '/businesses' },
  { id: 'leads', label: 'Lead Manager', icon: Users, path: '/leads' },
  { id: 'workers', label: 'NCS Workers', icon: Cpu, path: '/workers' },
  { id: 'chat', label: 'Nick Chat', icon: Bot, path: '/chat' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
];

const LayoutShell: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  const handleNavSelect = () => {
    if (isMobile && sidebarOpen) {
      toggleSidebar();
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
                <Link 
                  to="/chat"
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold shadow-lg shadow-primary/30"
                >
                  Talk to Nick
                </Link>
                <Link 
                  to="/rhnis"
                  className="px-6 py-3 bg-background text-foreground rounded-lg hover:bg-surface-muted transition-colors font-semibold border border-border"
                >
                  View Identity
                </Link>
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
                    <Link
                      key={item.id}
                      to={item.path}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        isActivePath(item.path)
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/40'
                          : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'
                      }`}
                      aria-current={isActivePath(item.path) ? 'page' : undefined}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </Link>
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
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={handleNavSelect}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActivePath(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted'
                  }`}
                  aria-current={isActivePath(item.path) ? 'page' : undefined}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
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
        <Outlet />
      </div>

      {/* Floating Nick Avatar */}
      <NickAvatar isFloating={true} />

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
