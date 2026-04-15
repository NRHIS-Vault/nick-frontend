import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Clock3,
  Pause,
  Play,
  RefreshCw,
  ServerCog,
} from "lucide-react";
import { getNcsStatus, pauseNcsWorker, resumeNcsWorker } from "@/lib/api";
import type { NcsStatusResponse, NcsWorkerStatusRecord } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type NcsWorker = NcsStatusResponse["workers"][number];
type WorkerAction = "pause" | "resume";

const STATUS_LABELS: Record<NcsWorker["status"], string> = {
  idle: "Idle",
  busy: "Busy",
  error: "Error",
};

const formatTimestamp = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "—";

const getStatusVariant = (status: NcsWorker["status"]) => {
  switch (status) {
    case "busy":
      return "info";
    case "error":
      return "destructive";
    default:
      return "secondary";
  }
};

const getStatusIcon = (status: NcsWorker["status"]) => {
  switch (status) {
    case "busy":
      return <Activity size={12} className="animate-pulse" />;
    case "error":
      return <AlertTriangle size={12} />;
    default:
      return <Clock3 size={12} />;
  }
};

const getJobSummary = (worker: NcsWorker) => {
  if (worker.job.name) {
    return worker.job.name;
  }

  if (worker.job.type) {
    return worker.job.type;
  }

  return worker.status === "busy" ? "Runner active" : "No active job";
};

const getJobDetails = (worker: NcsWorkerStatusRecord) => {
  const details: string[] = [];

  if (worker.job.id) {
    details.push(`ID ${worker.job.id}`);
  }

  if (worker.job.queue) {
    details.push(`Queue ${worker.job.queue}`);
  }

  if (worker.job.type) {
    details.push(`Type ${worker.job.type}`);
  }

  if (worker.job.progressPct !== null) {
    details.push(`${worker.job.progressPct}% complete`);
  }

  return details.join(" • ");
};

const getDetailSummary = (worker: NcsWorker) => {
  const summary = worker.job.details?.summary;
  return typeof summary === "string" && summary.trim() ? summary.trim() : null;
};

const WorkerControl: React.FC = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Keep the status panel fresh because this screen is operational telemetry, not
  // static reference data. A short poll interval is enough until live push arrives.
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["ncs", "status"],
    queryFn: getNcsStatus,
    refetchInterval: 30_000,
    retry: false,
  });

  const controlMutation = useMutation({
    mutationFn: async ({
      action,
      workerId,
    }: {
      action: WorkerAction;
      workerId: string;
    }) =>
      action === "pause"
        ? pauseNcsWorker({
            workerId,
            accessToken: session?.access_token,
          })
        : resumeNcsWorker({
            workerId,
            accessToken: session?.access_token,
          }),
    onSuccess: async (response, variables) => {
      toast({
        title:
          variables.action === "pause" ? "Pause request queued" : "Resume request queued",
        description: response.message,
      });

      await queryClient.invalidateQueries({
        queryKey: ["ncs", "status"],
      });
    },
    onError: (error, variables) => {
      toast({
        variant: "destructive",
        title:
          variables.action === "pause" ? "Pause request failed" : "Resume request failed",
        description:
          error instanceof Error ? error.message : "The control worker request did not complete.",
      });
    },
  });

  const handleWorkerAction = (action: WorkerAction, workerId: string) => {
    // Pause/resume is asynchronous by design: the UI publishes a control request and the
    // queue consumer applies the state change after the HTTP request has already returned.
    controlMutation.mutate({
      action,
      workerId,
    });
  };

  const isActionPending = (workerId: string, action: WorkerAction) =>
    controlMutation.isPending &&
    controlMutation.variables?.workerId === workerId &&
    controlMutation.variables?.action === action;

  const workers = data?.workers ?? [];
  const summary = data?.summary ?? {
    totalWorkers: 0,
    idleWorkers: 0,
    busyWorkers: 0,
    errorWorkers: 0,
    pausedWorkers: 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card">
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState message="Could not load NCS worker status." onRetry={() => refetch()} />;
  }

  if (!workers.length) {
    return (
      <EmptyState
        title="No NCS workers reported"
        description="Populate public.ncs_workers or configure an external NCS status provider to see job runner health."
        action={
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ServerCog className="text-primary" size={18} />
            <h2 className="text-2xl font-bold text-foreground">Nick Control System (NCS)</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Source: {data?.source ?? "unknown"} • Last refresh {formatTimestamp(data?.generatedAt ?? null)}
          </p>
        </div>

        <Button
          onClick={() => refetch()}
          variant="outline"
          className="w-full md:w-auto"
          disabled={isFetching}
        >
          <RefreshCw className={isFetching ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Workers</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{summary.totalWorkers}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Busy</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{summary.busyWorkers}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Errors</p>
          <p className="mt-2 text-3xl font-semibold text-destructive">{summary.errorWorkers}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Paused</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">{summary.pausedWorkers}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Job Details</TableHead>
              <TableHead>Timestamps</TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers.map((worker) => {
              const pausePending = isActionPending(worker.id, "pause");
              const resumePending = isActionPending(worker.id, "resume");
              const detailSummary = getDetailSummary(worker);
              const jobDetails = getJobDetails(worker);

              return (
                <TableRow key={worker.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{worker.name}</p>
                      <p className="text-xs text-muted-foreground">{worker.workerKey}</p>
                      <p className="text-xs text-muted-foreground">Provider: {worker.source}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Badge
                        variant={getStatusVariant(worker.status)}
                        className="inline-flex items-center gap-1"
                      >
                        {getStatusIcon(worker.status)}
                        {STATUS_LABELS[worker.status]}
                      </Badge>
                      {worker.isPaused ? <Badge variant="outline">Paused</Badge> : null}
                      <p className="text-xs text-muted-foreground">
                        Raw status: {worker.rawStatus ?? "unknown"}
                      </p>
                      {worker.statusMessage ? (
                        <p
                          className={
                            worker.status === "error"
                              ? "text-xs text-destructive"
                              : "text-xs text-muted-foreground"
                          }
                        >
                          {worker.statusMessage}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{getJobSummary(worker)}</p>
                      <p className="text-xs text-muted-foreground">{jobDetails || "No queued job metadata."}</p>
                      {detailSummary ? (
                        <p className="text-xs text-muted-foreground">{detailSummary}</p>
                      ) : null}
                      {worker.job.error ? (
                        <p className="text-xs text-destructive">{worker.job.error}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>Heartbeat: {formatTimestamp(worker.timestamps.lastHeartbeatAt)}</p>
                      <p>Started: {formatTimestamp(worker.timestamps.lastStartedAt)}</p>
                      <p>Finished: {formatTimestamp(worker.timestamps.lastFinishedAt)}</p>
                      <p>Updated: {formatTimestamp(worker.timestamps.updatedAt)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleWorkerAction("pause", worker.id)}
                        disabled={worker.isPaused || pausePending || controlMutation.isPending}
                        aria-label={`Pause ${worker.name}`}
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        {pausePending ? "Pausing..." : "Pause"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleWorkerAction("resume", worker.id)}
                        disabled={!worker.isPaused || resumePending || controlMutation.isPending}
                        aria-label={`Resume ${worker.name}`}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {resumePending ? "Resuming..." : "Resume"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Idle workers: {summary.idleWorkers}. Pause and resume enqueue control messages, and the NCS
        consumer applies the worker-state update after it processes the queue batch.
      </p>
    </div>
  );
};

export default WorkerControl;
