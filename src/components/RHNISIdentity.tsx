import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Database,
  Eye,
  Fingerprint,
  Radio,
  RefreshCw,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { getIdentityData } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

type IdentityTabKey = "identity" | "beacon" | "legacy";

const iconMap: Record<string, LucideIcon> = {
  fingerprint: Fingerprint,
  eye: Eye,
  radio: Radio,
  shield: Shield,
};

const operationalStatusPattern =
  /(active|armed|available|broadcasting|propagating|ready|spreading|synced|tracking)/i;

const formatSize = (mb: number) =>
  mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toLocaleString()} MB`;

const formatTimestamp = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Unavailable";

const getStatusClassName = (status: string) =>
  operationalStatusPattern.test(status)
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100"
    : "bg-surface-muted text-muted-foreground";

const SummaryCard = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) => (
  <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
  </div>
);

const RHNISIdentity: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IdentityTabKey>("identity");
  const { session, user, isLoading: isAuthLoading } = useAuth();
  const accessToken = session?.access_token ?? null;
  const isLocalDevSession = user?.id === "local-dev-user";
  const canFetchIdentity = Boolean(accessToken) && !isLocalDevSession;

  // The endpoint is user-scoped and requires the current Supabase access token, so the
  // query stays disabled until auth hydration finishes with a real session.
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["identity", user?.id],
    queryFn: () => getIdentityData({ accessToken: accessToken! }),
    enabled: canFetchIdentity,
  });

  if (isAuthLoading || (canFetchIdentity && isLoading)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-10" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isLocalDevSession) {
    return (
      <Alert variant="info">
        <Shield className="h-4 w-4" />
        <AlertTitle>Real Supabase session required</AlertTitle>
        <AlertDescription>
          The `/identity` worker validates a real bearer token before it loads RHNIS data. The
          local dev fallback account cannot query user-scoped identity records.
        </AlertDescription>
      </Alert>
    );
  }

  if (!accessToken) {
    return (
      <ErrorState
        title="Authentication required"
        message="Sign in again before loading identity data."
      />
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load identity data"
        message={
          error instanceof Error ? error.message : "The identity service request failed."
        }
        onRetry={() => refetch()}
      />
    );
  }

  if (!data?.hasProfile) {
    return (
      <EmptyState
        title="No identity profile found"
        description="No RHNIS profile rows were found for this account in Supabase."
        action={
          <Button onClick={() => refetch()} variant="outline">
            Refresh
          </Button>
        }
      />
    );
  }

  const identityData = data.identity;
  const beaconData = data.beacon;
  const legacyData = data.legacy;
  const profileHealth = identityData.summary.activeFeatures
    ? `${identityData.summary.activeFeatures} active features`
    : "No active features";

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              RHNIS Identity Service
            </p>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Authenticated identity profile</h2>
              <p className="text-sm text-muted-foreground">
                User-scoped RHNIS data loaded from `/identity` with the current Authorization
                bearer token.
              </p>
            </div>
          </div>

          <Button
            onClick={() => refetch()}
            variant="outline"
            className="gap-2 self-start"
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing" : "Refresh"}
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard label="Profile Status" value="Connected" helper={profileHealth} />
          <SummaryCard
            label="Beacon Signature"
            value={beaconData.summary.signature ?? "Unavailable"}
            helper={`User ${data.userId}`}
          />
          <SummaryCard
            label="Last Sync"
            value={formatTimestamp(data.computedAt)}
            helper={`Profile updated ${formatTimestamp(legacyData.lastUpdatedAt)}`}
          />
        </div>
      </div>

      <div className="flex space-x-1 rounded-lg border border-border bg-surface-muted p-1">
        <button
          onClick={() => setActiveTab("identity")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "identity"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Identity
        </button>
        <button
          onClick={() => setActiveTab("beacon")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "beacon"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Beacon
        </button>
        <button
          onClick={() => setActiveTab("legacy")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "legacy"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Legacy
        </button>
      </div>

      {activeTab === "identity" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryCard
              label="Identity Features"
              value={identityData.summary.totalFeatures}
              helper="Rows from public.rhnis_identity_features"
            />
            <SummaryCard
              label="Operational Features"
              value={identityData.summary.activeFeatures}
              helper="Statuses marked active/armed/broadcasting/etc."
            />
            <SummaryCard
              label="Profile Updated"
              value={formatTimestamp(identityData.summary.lastUpdatedAt)}
            />
          </div>

          {identityData.features.length ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {identityData.features.map((feature) => {
                const Icon = iconMap[feature.icon] ?? Shield;

                return (
                  <div
                    key={`${feature.title}-${feature.createdAt ?? feature.status}`}
                    className="rounded-lg border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/20 p-2 text-primary">
                          <Icon size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{feature.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(feature.createdAt)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-1 text-xs ${getStatusClassName(feature.status)}`}
                      >
                        {feature.status}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No identity features"
              description="This profile exists, but no identity feature rows were returned."
            />
          )}
        </div>
      )}

      {activeTab === "beacon" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <SummaryCard
              label="Signature"
              value={beaconData.summary.signature ?? "Unavailable"}
              helper="public.rhnis_profiles.beacon_signature"
            />
            <SummaryCard
              label="Total Signals"
              value={beaconData.summary.totalSignals.toLocaleString()}
              helper="Sum of beacon counts"
            />
            <SummaryCard
              label="Active Streams"
              value={beaconData.summary.activeStreams}
              helper="Beacon rows in an operational state"
            />
            <SummaryCard
              label="Record Types"
              value={beaconData.summary.recordTypes}
              helper={formatTimestamp(beaconData.summary.lastUpdatedAt)}
            />
          </div>

          {beaconData.data.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {beaconData.data.map((item) => (
                <div
                  key={`${item.type}-${item.createdAt ?? item.status}`}
                  className="rounded-lg border border-border bg-card p-5 text-center shadow-sm"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Radio className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-3xl font-bold text-primary">
                    {item.count.toLocaleString()}
                  </p>
                  <p className="mt-1 font-medium text-foreground">{item.type}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatTimestamp(item.createdAt)}
                  </p>
                  <span
                    className={`mt-3 inline-block rounded-full px-2 py-1 text-xs ${getStatusClassName(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No beacon data"
              description="This profile exists, but no beacon propagation rows were returned."
            />
          )}
        </div>
      )}

      {activeTab === "legacy" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <SummaryCard
              label="Total Storage"
              value={formatSize(legacyData.stats.totalStorageMb)}
              helper="Derived from legacy_stats JSON"
            />
            <SummaryCard
              label="Voice Archive"
              value={formatSize(legacyData.stats.voiceRecordingsMb)}
            />
            <SummaryCard
              label="Interaction Logs"
              value={formatSize(legacyData.stats.interactionLogsMb)}
            />
            <SummaryCard
              label="Digital Signatures"
              value={formatSize(legacyData.stats.digitalSignaturesMb)}
              helper={`Created ${formatTimestamp(legacyData.profileCreatedAt)}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {legacyData.details.map((detail) => (
              <div
                key={detail.id}
                className="rounded-lg border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/15 p-2 text-primary">
                      <Database className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{detail.label}</h3>
                      <p className="text-xs text-muted-foreground">{detail.description}</p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-1 text-xs ${getStatusClassName(detail.status)}`}
                  >
                    {detail.status}
                  </span>
                </div>

                <p className="mt-6 text-2xl font-semibold text-primary">
                  {formatSize(detail.sizeMb)}
                </p>
              </div>
            ))}
          </div>

          {legacyData.notes.length ? (
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h3 className="font-semibold text-foreground">Legacy Notes</h3>
              <div className="mt-4 space-y-2">
                {legacyData.notes.map((note) => (
                  <div
                    key={note}
                    className="rounded-lg border border-border/60 bg-surface-muted p-3 text-sm text-muted-foreground"
                  >
                    {note}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default RHNISIdentity;
