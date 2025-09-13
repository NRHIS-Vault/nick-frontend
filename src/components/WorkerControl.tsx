import React, { useState } from 'react';
import { Play, Pause, Square, Settings, Activity, Clock, Cpu, AlertTriangle } from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  type: 'automation' | 'monitoring' | 'processing';
  status: 'running' | 'stopped' | 'error' | 'idle';
  lastRun: Date;
  nextRun?: Date;
  description: string;
  metrics: {
    tasksCompleted: number;
    successRate: number;
    avgRunTime: string;
  };
}

const WorkerControl: React.FC = () => {
  const [workers] = useState<Worker[]>([
    {
      id: '1',
      name: 'Shopify Product Sync',
      type: 'automation',
      status: 'running',
      lastRun: new Date('2024-01-15T14:30:00'),
      nextRun: new Date('2024-01-15T15:30:00'),
      description: 'Syncs products, inventory, and orders with EcoGen Market',
      metrics: { tasksCompleted: 1247, successRate: 98.5, avgRunTime: '2.3s' }
    },
    {
      id: '2',
      name: 'Lead Generator',
      type: 'automation',
      status: 'running',
      lastRun: new Date('2024-01-15T14:25:00'),
      nextRun: new Date('2024-01-15T14:35:00'),
      description: 'Processes fencing leads and sends auto-responses',
      metrics: { tasksCompleted: 89, successRate: 100, avgRunTime: '1.8s' }
    },
    {
      id: '3',
      name: 'Social Media Bot',
      type: 'automation',
      status: 'idle',
      lastRun: new Date('2024-01-15T12:00:00'),
      nextRun: new Date('2024-01-15T18:00:00'),
      description: 'Posts content and engages on social platforms',
      metrics: { tasksCompleted: 45, successRate: 95.6, avgRunTime: '5.2s' }
    },
    {
      id: '4',
      name: 'System Monitor',
      type: 'monitoring',
      status: 'running',
      lastRun: new Date('2024-01-15T14:32:00'),
      nextRun: new Date('2024-01-15T14:33:00'),
      description: 'Monitors system health and performance',
      metrics: { tasksCompleted: 8640, successRate: 99.9, avgRunTime: '0.5s' }
    },
    {
      id: '5',
      name: 'Data Processor',
      type: 'processing',
      status: 'error',
      lastRun: new Date('2024-01-15T14:20:00'),
      description: 'Processes and analyzes business data',
      metrics: { tasksCompleted: 234, successRate: 87.2, avgRunTime: '12.1s' }
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400 bg-green-900';
      case 'stopped': return 'text-gray-400 bg-gray-700';
      case 'error': return 'text-red-400 bg-red-900';
      case 'idle': return 'text-yellow-400 bg-yellow-900';
      default: return 'text-gray-400 bg-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity size={12} className="animate-pulse" />;
      case 'stopped': return <Square size={12} />;
      case 'error': return <AlertTriangle size={12} />;
      case 'idle': return <Clock size={12} />;
      default: return <Square size={12} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'automation': return 'text-blue-400 bg-blue-900';
      case 'monitoring': return 'text-purple-400 bg-purple-900';
      case 'processing': return 'text-orange-400 bg-orange-900';
      default: return 'text-gray-400 bg-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Nick Control System (NCS)</h2>
        <div className="flex items-center gap-2 text-sm">
          <Cpu className="text-blue-400" size={16} />
          <span className="text-gray-300">5 Workers Active</span>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">System Health</span>
          </div>
          <p className="text-2xl font-bold text-green-400">98.5%</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-blue-400" size={16} />
            <span className="text-white font-medium">Active Workers</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">3/5</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-purple-400" size={16} />
            <span className="text-white font-medium">Uptime</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">99.9%</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-400" size={16} />
            <span className="text-white font-medium">Errors</span>
          </div>
          <p className="text-2xl font-bold text-red-400">1</p>
        </div>
      </div>

      {/* Workers List */}
      <div className="space-y-4">
        {workers.map((worker) => (
          <div key={worker.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-white font-semibold text-lg">{worker.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(worker.status)} flex items-center gap-1`}>
                    {getStatusIcon(worker.status)}
                    {worker.status}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(worker.type)}`}>
                    {worker.type}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-3">{worker.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Tasks Completed</p>
                    <p className="text-white font-semibold">{worker.metrics.tasksCompleted.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Success Rate</p>
                    <p className="text-white font-semibold">{worker.metrics.successRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Avg Runtime</p>
                    <p className="text-white font-semibold">{worker.metrics.avgRunTime}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Last Run</p>
                    <p className="text-white font-semibold">{worker.lastRun.toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                {worker.status === 'running' ? (
                  <button className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <Pause size={16} />
                  </button>
                ) : (
                  <button className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Play size={16} />
                  </button>
                )}
                <button className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <Settings size={16} />
                </button>
              </div>
            </div>
            
            {worker.nextRun && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock size={14} />
                Next run: {worker.nextRun.toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkerControl;