import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Phone, Mail, MapPin, Calendar, DollarSign, Filter, Search, Plus } from 'lucide-react';
import { getLeads, type LeadManagementResponse } from '@/lib/api';

type Lead = LeadManagementResponse['leads'][number];

const LeadManagement: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['lead-management'],
    queryFn: getLeads,
  });

  const leads = data?.leads ?? [];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-primary/15 text-primary';
      case 'Contacted': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-100';
      case 'Quoted': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-100';
      case 'Approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100';
      case 'Completed': return 'bg-surface-muted text-muted-foreground';
      default: return 'bg-surface-muted text-muted-foreground';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="bg-card p-6 rounded-lg border border-border text-muted-foreground">
        Loading leads...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-destructive/10 p-6 rounded-lg border border-destructive/40">
        <p className="text-destructive mb-3">Could not load leads.</p>
        <button
          className="px-3 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
          onClick={() => refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="bg-card p-6 rounded-lg border border-border text-muted-foreground">
        No leads available yet. Click retry to fetch again.
        <div className="mt-3">
          <button
            className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Lead Management</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          <Plus size={16} />
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-muted border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-surface-muted border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
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
          <div key={lead.id} className="bg-card rounded-lg p-6 border border-border hover:border-primary/50 transition-colors shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-foreground font-semibold text-lg">{lead.name}</h3>
                <p className="text-muted-foreground text-sm">{lead.service}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone size={14} />
                {lead.phone}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail size={14} />
                {lead.email}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin size={14} />
                {lead.location}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <DollarSign size={14} />
                ${lead.value.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar size={14} />
                {new Date(lead.date).toLocaleDateString()}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-muted-foreground text-sm">{lead.notes}</p>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                Contact
              </button>
              <button className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm">
                Quote
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No leads found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default LeadManagement;
