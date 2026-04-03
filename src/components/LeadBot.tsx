import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  MessageSquare,
  MousePointerClick,
  Search,
  Share2,
  Users,
} from "lucide-react";
import { getLeadBotData, type LeadBotResponse } from "@/lib/api";
import type { LeadBotDateRange, LeadBotPlatformFilter } from "@/lib/types";
import { useDebounce } from "@/hooks/useDebounce";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { resolveApiUrl } from "@/lib/apiClient";
import { config } from "@/lib/config";

type Campaign = LeadBotResponse["campaigns"][number];
type Lead = LeadBotResponse["recentLeads"][number];

const PLATFORM_OPTIONS: Array<{
  label: string;
  value: LeadBotPlatformFilter;
}> = [
  { label: "All", value: "all" },
  { label: "Meta", value: "meta" },
  { label: "Instagram", value: "instagram" },
  { label: "TikTok", value: "tiktok" },
];

const DATE_RANGE_OPTIONS: Array<{
  label: string;
  value: LeadBotDateRange;
}> = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
];

const LEADS_PER_PAGE = 8;
const LIVE_LEAD_BUFFER_SIZE = 50;
const STREAM_HEARTBEAT_TIMEOUT_MS = 45_000;
const STREAM_RECONNECT_BASE_MS = 2_000;
const STREAM_RECONNECT_MAX_MS = 15_000;

const renderCampaignStatus = (campaign: Campaign) => {
  if (campaign.status === "ACTIVE") {
    return "default";
  }

  if (campaign.status === "SCHEDULED") {
    return "secondary";
  }

  return "outline";
};

const renderLeadStatus = (lead: Lead) => {
  if (lead.status === "NEW") {
    return "default";
  }

  if (lead.status === "CONTACTED") {
    return "secondary";
  }

  if (lead.status === "QUALIFIED") {
    return "outline";
  }

  return "destructive";
};

const formatNumber = (value: number) => value.toLocaleString();

const normalizeSearchFilter = (value: string) => value.trim().toLowerCase();

const isLeadWithinRange = (timestamp: string, dateRange: LeadBotDateRange) =>
  Date.now() - Date.parse(timestamp) <= Number(dateRange) * 24 * 60 * 60 * 1000;

const leadMatchesPlatformFilter = (
  lead: Lead,
  platformFilter: LeadBotPlatformFilter
) =>
  platformFilter === "all" || lead.source.toLowerCase() === platformFilter;

const leadMatchesSearch = (lead: Lead, searchFilter: string) =>
  !searchFilter ||
  [
    lead.name,
    lead.phone,
    lead.service,
    lead.source,
    lead.status,
  ].some((value) => value.toLowerCase().includes(searchFilter));

const mergeRecentLeads = (baseLeads: Lead[], liveLeads: Lead[]) =>
  Array.from(
    [...baseLeads, ...liveLeads].reduce<Map<string, Lead>>((leadMap, lead) => {
      leadMap.set(lead.id, lead);
      return leadMap;
    }, new Map<string, Lead>()).values()
  )
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
    .slice(0, LIVE_LEAD_BUFFER_SIZE);

export default function LeadBot() {
  const [autoPostingEnabled, setAutoPostingEnabled] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<LeadBotPlatformFilter>("all");
  const [dateRange, setDateRange] = useState<LeadBotDateRange>("30");
  const [searchInput, setSearchInput] = useState("");
  const [leadPage, setLeadPage] = useState(1);
  const [streamLeads, setStreamLeads] = useState<Lead[]>([]);
  const [streamStatus, setStreamStatus] = useState<
    "connecting" | "connected" | "reconnecting"
  >("connecting");
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const heartbeatTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);

  // Search input changes immediately for typing feedback, but the network request only updates
  // after the debounce interval so the worker is not hit on every single keypress.
  const debouncedSearch = useDebounce(searchInput, 350);
  const normalizedSearch = normalizeSearchFilter(debouncedSearch);

  // React Query owns the worker fetch lifecycle. Any change to the filter key triggers a fresh
  // request to `/leadBot` with matching query parameters, and the worker returns filtered data.
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["lead-bot", platformFilter, dateRange, debouncedSearch],
    queryFn: () =>
      getLeadBotData({
        platform: platformFilter,
        dateRange,
        search: debouncedSearch,
      }),
  });

  useEffect(() => {
    setLeadPage(1);
  }, [platformFilter, dateRange, debouncedSearch]);

  useEffect(() => {
    const streamUrl = config.apiBase ? resolveApiUrl("/lead-stream") : "/api/lead-stream";
    let isUnmounted = false;

    const clearReconnectTimeout = () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const clearHeartbeatTimeout = () => {
      if (heartbeatTimeoutRef.current !== null) {
        window.clearTimeout(heartbeatTimeoutRef.current);
        heartbeatTimeoutRef.current = null;
      }
    };

    // The worker sends a `heartbeat` event every 15 seconds. If that heartbeat stops arriving,
    // we assume the browser is stuck on a half-open socket and force a reconnect so the lead
    // table does not silently freeze.
    const scheduleHeartbeatDeadline = () => {
      clearHeartbeatTimeout();
      heartbeatTimeoutRef.current = window.setTimeout(() => {
        if (isUnmounted) {
          return;
        }

        eventSourceRef.current?.close();
        eventSourceRef.current = null;
        reconnectAttemptRef.current += 1;
        setStreamStatus("reconnecting");
        scheduleReconnect();
      }, STREAM_HEARTBEAT_TIMEOUT_MS);
    };

    const scheduleReconnect = () => {
      if (isUnmounted || reconnectTimeoutRef.current !== null) {
        return;
      }

      const reconnectDelay = Math.min(
        STREAM_RECONNECT_BASE_MS * 2 ** Math.max(reconnectAttemptRef.current - 1, 0),
        STREAM_RECONNECT_MAX_MS
      );

      reconnectTimeoutRef.current = window.setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connectToLeadStream();
      }, reconnectDelay);
    };

    function connectToLeadStream() {
      if (isUnmounted) {
        return;
      }

      clearReconnectTimeout();
      clearHeartbeatTimeout();
      eventSourceRef.current?.close();
      setStreamStatus(reconnectAttemptRef.current > 0 ? "reconnecting" : "connecting");

      const stream = new EventSource(streamUrl);
      eventSourceRef.current = stream;
      scheduleHeartbeatDeadline();

      stream.addEventListener("connected", () => {
        if (isUnmounted || eventSourceRef.current !== stream) {
          return;
        }

        reconnectAttemptRef.current = 0;
        setStreamStatus("connected");
        scheduleHeartbeatDeadline();
      });

      stream.addEventListener("heartbeat", () => {
        if (isUnmounted || eventSourceRef.current !== stream) {
          return;
        }

        scheduleHeartbeatDeadline();
      });

      stream.addEventListener("lead", (event) => {
        if (isUnmounted || eventSourceRef.current !== stream) {
          return;
        }

        try {
          const incomingLead = JSON.parse((event as MessageEvent<string>).data) as Lead;

          if (!incomingLead?.id) {
            return;
          }

          // React Query still owns the worker fetch/filter lifecycle. The stream only appends
          // brand-new rows between refetches so the lead table updates immediately on inserts.
          setStreamLeads((currentLeads) => mergeRecentLeads(currentLeads, [incomingLead]));
          scheduleHeartbeatDeadline();
        } catch (error) {
          console.error("Failed to parse lead stream event", error);
        }
      });

      stream.addEventListener("stream-error", (event) => {
        console.error("Lead stream reported an application error", event);
      });

      stream.onerror = () => {
        if (isUnmounted || eventSourceRef.current !== stream) {
          return;
        }

        clearHeartbeatTimeout();
        stream.close();
        eventSourceRef.current = null;
        reconnectAttemptRef.current += 1;
        setStreamStatus("reconnecting");
        scheduleReconnect();
      };
    }

    connectToLeadStream();

    return () => {
      isUnmounted = true;
      clearReconnectTimeout();
      clearHeartbeatTimeout();
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, []);

  const campaigns = data?.campaigns ?? [];
  const recentLeads = mergeRecentLeads(
    data?.recentLeads ?? [],
    streamLeads.filter(
      (lead) =>
        leadMatchesPlatformFilter(lead, platformFilter) &&
        isLeadWithinRange(lead.timestamp, dateRange) &&
        leadMatchesSearch(lead, normalizedSearch)
    )
  );
  const platforms = data?.platforms ?? [];
  const overview = data?.overview;
  const workerErrors = data?.errors ?? [];

  const totalImpressions = campaigns.reduce(
    (sum, campaign) => sum + campaign.impressions,
    0
  );
  const totalClicks = campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
  const totalConversions = campaigns.reduce(
    (sum, campaign) => sum + campaign.conversions,
    0
  );
  const clickThroughRate =
    totalImpressions > 0
      ? Number(((totalClicks / totalImpressions) * 100).toFixed(2))
      : 0;

  const totalLeadPages = Math.max(1, Math.ceil(recentLeads.length / LEADS_PER_PAGE));
  const paginatedLeads = recentLeads.slice(
    (leadPage - 1) * LEADS_PER_PAGE,
    leadPage * LEADS_PER_PAGE
  );

  useEffect(() => {
    if (leadPage > totalLeadPages) {
      setLeadPage(totalLeadPages);
    }
  }, [leadPage, totalLeadPages]);

  const hasData = campaigns.length || platforms.length || recentLeads.length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-24" />
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState message="Could not load LeadBot data." onRetry={() => refetch()} />
    );
  }

  if (!hasData) {
    return (
      <EmptyState
        title="No LeadBot data matched these filters"
        description="Try another platform, broaden the date range, or clear the search query."
        action={
          <Button
            onClick={() => {
              setPlatformFilter("all");
              setDateRange("30");
              setSearchInput("");
            }}
          >
            Clear Filters
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Lead Generation Bot</h2>
            <Badge variant={autoPostingEnabled ? "default" : "secondary"}>
              {autoPostingEnabled ? "ACTIVE" : "INACTIVE"}
            </Badge>
            <Badge variant={streamStatus === "connected" ? "default" : "secondary"}>
              {streamStatus === "connected" ? "LIVE" : streamStatus.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Review live social campaigns and incoming leads from the worker-backed platform APIs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Auto-Posting</span>
          <Button
            variant={autoPostingEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoPostingEnabled((currentValue) => !currentValue)}
          >
            {autoPostingEnabled ? "Enabled" : "Disabled"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter state feeds the query key above. Tabs handle the platform slice, the select
          controls the worker-side date window, and the debounced input narrows campaigns/leads. */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Platform</p>
            <Tabs
              value={platformFilter}
              onValueChange={(value) => setPlatformFilter(value as LeadBotPlatformFilter)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                {PLATFORM_OPTIONS.map((option) => (
                  <TabsTrigger key={option.value} value={option.value}>
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="w-full space-y-2 lg:w-52">
            <p className="text-sm font-medium text-muted-foreground">Date Range</p>
            <Select
              value={dateRange}
              onValueChange={(value) => setDateRange(value as LeadBotDateRange)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose range" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-2 lg:w-80">
            <p className="text-sm font-medium text-muted-foreground">Search</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search campaigns, services, names, or sources"
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {workerErrors.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700">
          {workerErrors.join(" ")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Filtered Leads</p>
                <p className="text-2xl font-bold">{recentLeads.length || overview?.totalLeads || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Impressions</p>
                <p className="text-2xl font-bold">{formatNumber(totalImpressions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <MousePointerClick className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">Clicks</p>
                <p className="text-2xl font-bold">{formatNumber(totalClicks)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <Share2 className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">{formatNumber(totalConversions)}</p>
                <p className="text-xs text-muted-foreground">
                  CTR {clickThroughRate}% • {overview?.activeCampaigns ?? 0} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Campaign Metrics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Worker-filtered campaign snapshots from the selected platform range.
              </p>
            </div>
            {isFetching && <Badge variant="outline">Refreshing</Badge>}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="max-w-sm">
                      <div className="space-y-1">
                        <p className="font-medium">{campaign.content}</p>
                        <p className="text-xs text-muted-foreground">
                          Updated {new Date(campaign.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{campaign.platform}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.impressions)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.clicks)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(campaign.conversions)}
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.impressions > 0
                        ? `${((campaign.clicks / campaign.impressions) * 100).toFixed(2)}%`
                        : "0.00%"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={renderCampaignStatus(campaign)}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Connections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{platform.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {platform.posts} campaigns • {platform.leads} leads
                  </p>
                </div>
                <Badge variant={platform.status === "connected" ? "default" : "secondary"}>
                  {platform.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* The worker returns the full filtered lead set for the selected query. The panel slices
          that array client-side for pagination so page switches stay instant without refetching. */}
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span>Recent Leads</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing {paginatedLeads.length} of {recentLeads.length} filtered leads.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Page {leadPage} of {totalLeadPages}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{lead.service}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{lead.source}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(lead.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={renderLeadStatus(lead)}>{lead.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {recentLeads.length > LEADS_PER_PAGE && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (leadPage > 1) {
                        setLeadPage((currentValue) => currentValue - 1);
                      }
                    }}
                    aria-disabled={leadPage === 1}
                    className={leadPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: totalLeadPages }).map((_, index) => {
                  const page = index + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={leadPage === page}
                        onClick={(event) => {
                          event.preventDefault();
                          setLeadPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      if (leadPage < totalLeadPages) {
                        setLeadPage((currentValue) => currentValue + 1);
                      }
                    }}
                    aria-disabled={leadPage === totalLeadPages}
                    className={
                      leadPage === totalLeadPages ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
