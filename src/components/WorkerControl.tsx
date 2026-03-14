import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, Square, Settings, Activity, Clock, Cpu, AlertTriangle } from 'lucide-react';
import { getWorkers, type WorkersResponse } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

type Worker = WorkersResponse['workers'][number];

const WorkerControl: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['workers'],
    queryFn: getWorkers,
  });

  const workers = data?.workers ?? [];
  const summary = data?.summary ?? {
    systemHealthPct: 0,
    activeWorkers: 0,
    totalWorkers: 0,
    uptimePct: 0,
    errors: 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-emerald-700 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-900/40';
      case 'stopped': return 'text-muted-foreground bg-surface-muted';
      case 'error': return 'text-red-700 bg-red-100 dark:text-red-200 dark:bg-red-900/40';
      case 'idle': return 'text-amber-700 bg-amber-100 dark:text-amber-200 dark:bg-amber-900/40';
      default: return 'text-muted-foreground bg-surface-muted';
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
      case 'automation': return 'text-blue-700 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/40';
      case 'monitoring': return 'text-purple-700 bg-purple-100 dark:text-purple-200 dark:bg-purple-900/40';
      case 'processing': return 'text-amber-700 bg-amber-100 dark:text-amber-200 dark:bg-amber-900/40';
      default: return 'text-muted-foreground bg-surface-muted';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-20" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Could not load worker status." onRetry={() => refetch()} />;
  }

  if (!workers.length) {
    return (
      <EmptyState
        title="No workers reported"
        description="Connect your automations to see worker status."
        action={
          <button
            className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            onClick={() => refetch()}
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Nick Control System (NCS)</h2>
        <div className="flex items-center gap-2 text-sm">
          <Cpu className="text-primary" size={16} />
          <span className="text-muted-foreground">
            {summary.activeWorkers}/{summary.totalWorkers} Workers Active
          </span>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-foreground font-medium">System Health</span>
          </div>
          <p className="text-2xl font-bold text-emerald-500">{summary.systemHealthPct}%</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-primary" size={16} />
            <span className="text-foreground font-medium">Active Workers</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {summary.activeWorkers}/{summary.totalWorkers}
          </p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-purple-500" size={16} />
            <span className="text-foreground font-medium">Uptime</span>
          </div>
          <p className="text-2xl font-bold text-purple-500">{summary.uptimePct}%</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-400" size={16} />
            <span className="text-foreground font-medium">Errors</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{summary.errors}</p>
        </div>
      </div>

      {/* Workers List */}
      <div className="space-y-4">
        {workers.map((worker) => (
          <div key={worker.id} className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-foreground font-semibold text-lg">{worker.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(worker.status)} flex items-center gap-1`}>
                    {getStatusIcon(worker.status)}
                    {worker.status}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(worker.type)}`}>
                    {worker.type}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mb-3">{worker.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tasks Completed</p>
                    <p className="text-foreground font-semibold">{worker.metrics.tasksCompleted.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Success Rate</p>
                    <p className="text-foreground font-semibold">{worker.metrics.successRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Runtime</p>
                    <p className="text-foreground font-semibold">{worker.metrics.avgRunTimeSeconds}s</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Run</p>
                    <p className="text-foreground font-semibold">{new Date(worker.lastRun).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                {worker.status === 'running' ? (
                  <button className="p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">
                    <Pause size={16} />
                  </button>
                ) : (
                  <button className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    <Play size={16} />
                  </button>
                )}
                <button className="p-2 bg-surface-muted text-foreground rounded-lg hover:bg-surface transition-colors border border-border">
                  <Settings size={16} />
                </button>
              </div>
            </div>
            
            {worker.nextRun && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={14} />
                Next run: {new Date(worker.nextRun).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkerControl;
