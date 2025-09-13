import React, { useState } from 'react';
import { Phone, Mail, MapPin, Calendar, DollarSign, Filter, Search, Plus } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  location: string;
  value: number;
  status: 'New' | 'Contacted' | 'Quoted' | 'Approved' | 'Completed';
  date: Date;
  notes: string;
}

const LeadManagement: React.FC = () => {
  const [leads] = useState<Lead[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john@email.com',
      phone: '(555) 123-4567',
      service: 'Privacy Fence',
      location: 'Miami, FL',
      value: 2500,
      status: 'New',
      date: new Date('2024-01-15'),
      notes: 'Needs 150ft privacy fence, cedar preferred'
    },
    {
      id: '2',
      name: 'Maria Garcia',
      email: 'maria@email.com',
      phone: '(555) 987-6543',
      service: 'Chain Link',
      location: 'Orlando, FL',
      value: 1800,
      status: 'Quoted',
      date: new Date('2024-01-14'),
      notes: 'Commercial property, 200ft chain link'
    },
    {
      id: '3',
      name: 'David Wilson',
      email: 'david@email.com',
      phone: '(555) 456-7890',
      service: 'Vinyl Fence',
      location: 'Tampa, FL',
      value: 3200,
      status: 'Approved',
      date: new Date('2024-01-13'),
      notes: 'White vinyl, 180ft with gates'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-900 text-blue-300';
      case 'Contacted': return 'bg-yellow-900 text-yellow-300';
      case 'Quoted': return 'bg-purple-900 text-purple-300';
      case 'Approved': return 'bg-green-900 text-green-300';
      case 'Completed': return 'bg-gray-700 text-gray-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Lead Management</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
        >
          <option value="All">All Status</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Quoted">Quoted</option>
          <option value="Approved">Approved</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <div key={lead.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">{lead.name}</h3>
                <p className="text-gray-400 text-sm">{lead.service}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Phone size={14} />
                {lead.phone}
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Mail size={14} />
                {lead.email}
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <MapPin size={14} />
                {lead.location}
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <DollarSign size={14} />
                ${lead.value.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <Calendar size={14} />
                {lead.date.toLocaleDateString()}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-400 text-sm">{lead.notes}</p>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Contact
              </button>
              <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                Quote
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No leads found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default LeadManagement;