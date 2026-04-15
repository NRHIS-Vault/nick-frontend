import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NcsStatusResponse } from "@/lib/types";

const testMocks = vi.hoisted(() => ({
  toast: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getNcsStatus: vi.fn(),
  pauseNcsWorker: vi.fn(),
  resumeNcsWorker: vi.fn(),
}));

import { getNcsStatus, pauseNcsWorker, resumeNcsWorker } from "@/lib/api";
import WorkerControl from "./WorkerControl";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    session: {
      access_token: "test-access-token",
    },
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: testMocks.toast,
  }),
}));

const mockedGetNcsStatus = vi.mocked(getNcsStatus);
const mockedPauseNcsWorker = vi.mocked(pauseNcsWorker);
const mockedResumeNcsWorker = vi.mocked(resumeNcsWorker);

const baseResponse: NcsStatusResponse = {
  generatedAt: "2026-04-13T10:05:00.000Z",
  source: "supabase",
  summary: {
    totalWorkers: 2,
    idleWorkers: 0,
    busyWorkers: 1,
    errorWorkers: 1,
    pausedWorkers: 1,
  },
  workers: [
    {
      id: "worker-1",
      workerKey: "leadbot-runner",
      name: "LeadBot Runner",
      status: "busy",
      rawStatus: "running",
      statusMessage: "Polling provider queues.",
      isPaused: false,
      source: "supabase",
      job: {
        id: "job-1",
        name: "Lead intake sync",
        type: "sync",
        queue: "leadbot",
        progressPct: 65,
        details: {
          summary: "Syncing Meta and TikTok leads.",
        },
        error: null,
      },
      timestamps: {
        createdAt: "2026-04-13T09:00:00.000Z",
        updatedAt: "2026-04-13T10:05:00.000Z",
        pausedAt: null,
        lastHeartbeatAt: "2026-04-13T10:05:00.000Z",
        lastStartedAt: "2026-04-13T09:58:00.000Z",
        lastFinishedAt: null,
      },
    },
    {
      id: "worker-2",
      workerKey: "billing-runner",
      name: "Billing Runner",
      status: "error",
      rawStatus: "failed",
      statusMessage: "Worker is paused.",
      isPaused: true,
      source: "supabase",
      job: {
        id: "job-2",
        name: "Invoice export",
        type: "export",
        queue: "billing",
        progressPct: 10,
        details: {
          summary: "Waiting for operator resume.",
        },
        error: "Exchange timeout",
      },
      timestamps: {
        createdAt: "2026-04-13T09:00:00.000Z",
        updatedAt: "2026-04-13T10:00:00.000Z",
        pausedAt: "2026-04-13T10:00:00.000Z",
        lastHeartbeatAt: "2026-04-13T09:59:00.000Z",
        lastStartedAt: "2026-04-13T09:55:00.000Z",
        lastFinishedAt: "2026-04-13T09:58:00.000Z",
      },
    },
  ],
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("WorkerControl", () => {
  beforeEach(() => {
    testMocks.toast.mockReset();
    mockedGetNcsStatus.mockReset();
    mockedPauseNcsWorker.mockReset();
    mockedResumeNcsWorker.mockReset();

    mockedGetNcsStatus.mockResolvedValue(baseResponse);
    mockedPauseNcsWorker.mockResolvedValue({
      ok: true,
      action: "pause",
      workerId: "worker-1",
      requestId: "request-1",
      queued: true,
      stub: false,
      message: "Pause request queued for worker-1. The NCS control consumer will update worker state shortly.",
    });
    mockedResumeNcsWorker.mockResolvedValue({
      ok: true,
      action: "resume",
      workerId: "worker-2",
      requestId: "request-2",
      queued: true,
      stub: false,
      message: "Resume request queued for worker-2. The NCS control consumer will update worker state shortly.",
    });
  });

  it("renders NCS worker rows from the status query", async () => {
    render(<WorkerControl />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText("LeadBot Runner")).toBeTruthy();
      expect(screen.getByText("Billing Runner")).toBeTruthy();
    });

    expect(mockedGetNcsStatus).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Lead intake sync")).toBeTruthy();
    expect(screen.getByText("Invoice export")).toBeTruthy();
    expect(screen.getByText("Syncing Meta and TikTok leads.")).toBeTruthy();
    expect(screen.getByText("Exchange timeout")).toBeTruthy();
  });

  it("queues a pause request for active rows", async () => {
    render(<WorkerControl />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Pause LeadBot Runner")).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText("Pause LeadBot Runner"));

    await waitFor(() => {
      expect(mockedPauseNcsWorker).toHaveBeenCalledWith({
        workerId: "worker-1",
        accessToken: "test-access-token",
      });
    });

    expect(testMocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Pause request queued",
      })
    );
  });

  it("queues a resume request for paused rows", async () => {
    render(<WorkerControl />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Resume Billing Runner")).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText("Resume Billing Runner"));

    await waitFor(() => {
      expect(mockedResumeNcsWorker).toHaveBeenCalledWith({
        workerId: "worker-2",
        accessToken: "test-access-token",
      });
    });

    expect(testMocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Resume request queued",
      })
    );
  });
});
