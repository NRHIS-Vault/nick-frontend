import React, { useState } from 'react';
import { Shield, Eye, Fingerprint, Radio, Download, Upload } from 'lucide-react';

const RHNISIdentity: React.FC = () => {
  const [activeTab, setActiveTab] = useState('identity');

  const identityFeatures = [
    { icon: Fingerprint, title: 'Voice Signature', status: 'Active', description: 'Unique voice pattern recognition' },
    { icon: Eye, title: 'Face Recognition', status: 'Active', description: 'Facial identity verification' },
    { icon: Radio, title: 'Digital Beacon', status: 'Broadcasting', description: 'Traceable digital footprint' },
    { icon: Shield, title: 'Sting Mode', status: 'Armed', description: 'Scammer detection & trapping' }
  ];

  const beaconData = [
    { type: 'Social Media', count: 1247, status: 'Propagating' },
    { type: 'Comments', count: 892, status: 'Active' },
    { type: 'Posts', count: 156, status: 'Spreading' },
    { type: 'Interactions', count: 3421, status: 'Tracking' }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-surface-muted p-1 rounded-lg border border-border">
        <button
          onClick={() => setActiveTab('identity')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'identity' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Identity System
        </button>
        <button
          onClick={() => setActiveTab('beacon')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'beacon' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Digital Beacon
        </button>
        <button
          onClick={() => setActiveTab('legacy')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'legacy' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Legacy System
        </button>
      </div>

      {/* Identity System Tab */}
      {activeTab === 'identity' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {identityFeatures.map((feature, index) => (
            <div key={index} className="bg-card rounded-lg p-6 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary">
                    <feature.icon size={20} />
                  </div>
                  <h3 className="text-foreground font-semibold">{feature.title}</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  feature.status === 'Active' || feature.status === 'Broadcasting' || feature.status === 'Armed'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100' 
                    : 'bg-surface-muted text-muted-foreground'
                }`}>
                  {feature.status}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
              
              {feature.title === 'Sting Mode' && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/40 rounded-lg">
                  <p className="text-destructive text-sm">⚠️ Active trap systems monitoring for scam attempts</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Digital Beacon Tab */}
      {activeTab === 'beacon' && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <h3 className="text-foreground text-lg font-semibold mb-4">Beacon Propagation Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {beaconData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="bg-surface-muted rounded-lg p-4 border border-border/60">
                    <p className="text-2xl font-bold text-primary">{item.count.toLocaleString()}</p>
                    <p className="text-muted-foreground text-sm mt-1">{item.type}</p>
                    <p className={`text-xs mt-2 px-2 py-1 rounded-full inline-block ${
                      item.status === 'Propagating' || item.status === 'Active' || item.status === 'Spreading' || item.status === 'Tracking'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100'
                        : 'bg-surface text-muted-foreground border border-border'
                    }`}>
                      {item.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <h3 className="text-foreground text-lg font-semibold mb-4">QR Beacon Generator</h3>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-background rounded-lg flex items-center justify-center border border-border">
                <div className="w-20 h-20 bg-foreground rounded grid grid-cols-8 gap-px p-1">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className={`${Math.random() > 0.5 ? 'bg-background' : 'bg-foreground'}`}></div>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground text-sm mb-2">Current beacon signature</p>
                <p className="text-foreground font-mono text-xs bg-surface-muted p-2 rounded border border-border">
                  RHNIS-{Date.now().toString(36).toUpperCase()}
                </p>
                <button className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                  Generate New Beacon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legacy System Tab */}
      {activeTab === 'legacy' && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <h3 className="text-foreground text-lg font-semibold mb-4">Digital Legacy Preservation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg border border-border">
                  <span className="text-foreground">Voice Recordings</span>
                  <span className="text-primary">2.3 GB</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg border border-border">
                  <span className="text-foreground">Interaction Logs</span>
                  <span className="text-primary">456 MB</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg border border-border">
                  <span className="text-foreground">Digital Signatures</span>
                  <span className="text-primary">12 MB</span>
                </div>
              </div>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-center gap-2 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <Download size={16} />
                  Export Legacy Data
                </button>
                <button className="w-full flex items-center justify-center gap-2 p-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                  <Upload size={16} />
                  Import Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RHNISIdentity;
