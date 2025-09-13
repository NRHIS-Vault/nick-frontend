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
import { Menu, X, Bot, BarChart3, Shield, Building2, Settings, Bell, Users, Cpu, TrendingUp, Share2, Crown } from 'lucide-react';


const AppLayout: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showChat, setShowChat] = useState(false);

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
              <h2 className="text-white text-2xl font-bold mt-4">Nick AI Assistant</h2>
              <p className="text-gray-400 mt-2">Your Right Hand Nick Identity System</p>
            </div>
            <ChatInterface />
          </div>
        );
      default:
        return <BusinessDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={heroImage} 
          alt="RHNIS Command Center"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-gray-900/40"></div>
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                RHNIS Control Center
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                Right Hand Nick Identity System - Your AI-powered business automation platform
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveSection('chat')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Talk to Nick
                </button>
                <button 
                  onClick={() => setActiveSection('rhnis')}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold border border-gray-600"
                >
                  View Identity
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Bot className="text-white" size={20} />
                </div>
                <span className="text-white font-bold text-lg">RHNIS</span>
              </div>
              
              {!isMobile && (
                <nav className="flex gap-6">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        activeSection === item.id 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </button>
                  ))}
                </nav>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Bell size={20} />
              </button>
              
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
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
        <div className="fixed inset-0 z-50 bg-gray-900">
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <span className="text-white font-bold text-lg">Menu</span>
              <button onClick={toggleSidebar} className="text-gray-400">
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
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {renderContent()}
      </div>

      {/* Floating Nick Avatar */}
      <NickAvatar isFloating={true} onToggleChat={() => setShowChat(!showChat)} />

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300">System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">Nick Active</span>
            </div>
          </div>
          <div className="text-gray-400 text-sm">
            Last sync: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;