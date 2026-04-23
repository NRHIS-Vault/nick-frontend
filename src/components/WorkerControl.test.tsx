import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NcsStatusResponse } from "@/lib/types";
import { renderWithProviders } from "@/test/render";
import { installMockFetch } from "@/test/mockApi";
import { createNcsControlApi } from "@/test/ncsQueue";

const testMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: testMocks.useAuth,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: testMocks.toast,
  }),
}));

vi.mock("@/lib/config", () => ({
  config: {
    apiBase: "",
    supabaseUrl: "",
    supabaseAnonKey: "",
    stripePublishableKey: "",
    devAuthEmail: "",
    devAuthPassword: "",
    e2eMockMode: false,
  },
}));

import { useAuth } from "@/hooks/use-auth";
import WorkerControl from "./WorkerControl";

const mockedUseAuth = vi.mocked(useAuth);

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

const findWorkerRow = (name: string) => {
  const row = screen.getByText(name).closest("tr");
  if (!row) {
    throw new Error(`Unable to find a table row for ${name}.`);
  }

  return row;
};

describe("WorkerControl", () => {
  beforeEach(() => {
    testMocks.toast.mockReset();
    mockedUseAuth.mockReset();
    mockedUseAuth.mockReturnValue({
      session: {
        access_token: "test-access-token",
      },
    } as unknown as ReturnType<typeof useAuth>);
  });

  it("renders NCS worker rows from the mocked status endpoint", async () => {
    installMockFetch(
      createNcsControlApi({
        initialStatus: baseResponse,
        expectedAccessToken: "test-access-token",
      }).handlers
    );

    renderWithProviders(<WorkerControl />);

    await waitFor(() => {
      expect(screen.getByText("LeadBot Runner")).toBeTruthy();
      expect(screen.getByText("Billing Runner")).toBeTruthy();
    });

    expect(screen.getByText("Lead intake sync")).toBeTruthy();
    expect(screen.getByText("Invoice export")).toBeTruthy();
    expect(screen.getByText("Syncing Meta and TikTok leads.")).toBeTruthy();
    expect(screen.getByText("Exchange timeout")).toBeTruthy();
  });

  it("updates the UI after queued pause and resume messages are consumed", async () => {
    const ncsApi = createNcsControlApi({
      initialStatus: baseResponse,
      expectedAccessToken: "test-access-token",
    });
    installMockFetch(ncsApi.handlers);

    renderWithProviders(<WorkerControl />);

    await waitFor(() => {
      expect(screen.getByLabelText("Pause LeadBot Runner")).toBeTruthy();
    });

    // Control requests only enqueue work. The row should not change until the test drains
    // the in-memory queue and the component performs another status fetch.
    fireEvent.click(screen.getByLabelText("Pause LeadBot Runner"));

    await waitFor(() => {
      expect(ncsApi.getQueuedMessages()).toHaveLength(1);
    });
    expect(ncsApi.getQueuedMessages()[0]).toMatchObject({
      action: "pause",
      workerId: "worker-1",
      source: "ncs/pause",
    });

    expect(testMocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Pause request queued",
      })
    );

    await ncsApi.consumeAllMessages();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      const leadBotRow = findWorkerRow("LeadBot Runner");

      expect(within(leadBotRow).getByText("Idle")).toBeTruthy();
      expect(within(leadBotRow).getByText("Paused")).toBeTruthy();
      expect(
        within(leadBotRow).getByText("Pause requested via NCS control queue.")
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText("Resume LeadBot Runner"));

    await waitFor(() => {
      expect(ncsApi.getQueuedMessages()).toHaveLength(1);
    });
    expect(ncsApi.getQueuedMessages()[0]).toMatchObject({
      action: "resume",
      workerId: "worker-1",
      source: "ncs/resume",
    });

    expect(testMocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Resume request queued",
      })
    );

    await ncsApi.consumeAllMessages();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => {
      const leadBotRow = findWorkerRow("LeadBot Runner");

      expect(within(leadBotRow).getByText("Idle")).toBeTruthy();
      expect(
        within(leadBotRow).getByText("Resume requested via NCS control queue.")
      ).toBeTruthy();
      expect(within(leadBotRow).queryByText("Paused")).toBeNull();
    });
  });
});
