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
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('identity')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'identity' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Identity System
        </button>
        <button
          onClick={() => setActiveTab('beacon')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'beacon' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Digital Beacon
        </button>
        <button
          onClick={() => setActiveTab('legacy')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'legacy' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Legacy System
        </button>
      </div>

      {/* Identity System Tab */}
      {activeTab === 'identity' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {identityFeatures.map((feature, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-900 rounded-lg text-blue-400">
                    <feature.icon size={20} />
                  </div>
                  <h3 className="text-white font-semibold">{feature.title}</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  feature.status === 'Active' || feature.status === 'Broadcasting' || feature.status === 'Armed'
                    ? 'bg-green-900 text-green-300' 
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {feature.status}
                </span>
              </div>
              <p className="text-gray-400 text-sm">{feature.description}</p>
              
              {feature.title === 'Sting Mode' && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                  <p className="text-red-400 text-sm">⚠️ Active trap systems monitoring for scam attempts</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Digital Beacon Tab */}
      {activeTab === 'beacon' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white text-lg font-semibold mb-4">Beacon Propagation Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {beaconData.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-2xl font-bold text-blue-400">{item.count.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm mt-1">{item.type}</p>
                    <p className={`text-xs mt-2 px-2 py-1 rounded-full inline-block ${
                      item.status === 'Propagating' || item.status === 'Active' || item.status === 'Spreading' || item.status === 'Tracking'
                        ? 'bg-green-900 text-green-300'
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {item.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white text-lg font-semibold mb-4">QR Beacon Generator</h3>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                <div className="w-20 h-20 bg-black rounded grid grid-cols-8 gap-px p-1">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className={`${Math.random() > 0.5 ? 'bg-white' : 'bg-black'}`}></div>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-sm mb-2">Current beacon signature</p>
                <p className="text-white font-mono text-xs bg-gray-700 p-2 rounded">
                  RHNIS-{Date.now().toString(36).toUpperCase()}
                </p>
                <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
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
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-white text-lg font-semibold mb-4">Digital Legacy Preservation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-white">Voice Recordings</span>
                  <span className="text-blue-400">2.3 GB</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-white">Interaction Logs</span>
                  <span className="text-blue-400">456 MB</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-white">Digital Signatures</span>
                  <span className="text-blue-400">12 MB</span>
                </div>
              </div>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Download size={16} />
                  Export Legacy Data
                </button>
                <button className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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