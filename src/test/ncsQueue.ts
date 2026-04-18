import type {
  NcsControlWorkerActionResponse,
  NcsStatusResponse,
  NcsWorkerStatusRecord,
} from "@/lib/types";
import { jsonResponse, type MockApiHandler } from "./mockApi";

type NcsControlAction = "pause" | "resume";

type QueuedControlMessage = {
  action: NcsControlAction;
  requestId: string;
  requestedAt: string;
  source: `ncs/${NcsControlAction}`;
  workerId: string;
};

type CreateNcsControlApiOptions = {
  expectedAccessToken?: string;
  initialStatus: NcsStatusResponse;
};

const STATUS_PRIORITY: Record<NcsWorkerStatusRecord["status"], number> = {
  error: 0,
  busy: 1,
  idle: 2,
};

const clone = <T,>(value: T): T => structuredClone(value);

const summarizeWorkers = (workers: NcsWorkerStatusRecord[]) => ({
  totalWorkers: workers.length,
  idleWorkers: workers.filter((worker) => worker.status === "idle").length,
  busyWorkers: workers.filter((worker) => worker.status === "busy").length,
  errorWorkers: workers.filter((worker) => worker.status === "error").length,
  pausedWorkers: workers.filter((worker) => worker.isPaused).length,
});

const sortWorkers = (workers: NcsWorkerStatusRecord[]) =>
  [...workers].sort((left, right) => {
    const statusDelta = STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status];
    if (statusDelta !== 0) {
      return statusDelta;
    }

    return left.name.localeCompare(right.name);
  });

const createControlResponse = ({
  action,
  requestId,
  workerId,
}: QueuedControlMessage): NcsControlWorkerActionResponse => ({
  ok: true,
  action,
  workerId,
  requestId,
  queued: true,
  stub: false,
  message: `${
    action === "pause" ? "Pause" : "Resume"
  } request queued for ${workerId}. The NCS control consumer will update worker state shortly.`,
});

const applyQueuedMessage = (
  workers: NcsWorkerStatusRecord[],
  message: QueuedControlMessage,
  processedAt: string
) =>
  sortWorkers(
    workers.map((worker) => {
      if (worker.id !== message.workerId && worker.workerKey !== message.workerId) {
        return worker;
      }

      if (message.action === "pause") {
        return {
          ...worker,
          status: "idle",
          rawStatus: "paused",
          statusMessage: "Pause requested via NCS control queue.",
          isPaused: true,
          timestamps: {
            ...worker.timestamps,
            pausedAt: processedAt,
            updatedAt: processedAt,
          },
        };
      }

      return {
        ...worker,
        status: "idle",
        rawStatus: "idle",
        statusMessage: "Resume requested via NCS control queue.",
        isPaused: false,
        timestamps: {
          ...worker.timestamps,
          pausedAt: null,
          updatedAt: processedAt,
        },
      };
    })
  );

export const createNcsControlApi = ({
  expectedAccessToken,
  initialStatus,
}: CreateNcsControlApiOptions) => {
  let statusState: NcsStatusResponse = {
    ...clone(initialStatus),
    workers: sortWorkers(clone(initialStatus.workers)),
    summary: summarizeWorkers(initialStatus.workers),
  };
  const queuedMessages: QueuedControlMessage[] = [];
  let requestCounter = 0;
  let eventCounter = 0;

  const nextTimestamp = () => {
    const timestamp = new Date(Date.UTC(2026, 3, 17, 12, eventCounter, 0)).toISOString();
    eventCounter += 1;
    return timestamp;
  };

  const buildStatusResponse = () => ({
    ...clone(statusState),
    generatedAt: nextTimestamp(),
    summary: summarizeWorkers(statusState.workers),
    workers: sortWorkers(clone(statusState.workers)),
  });

  const assertAccessToken = (request: Request) => {
    if (!expectedAccessToken) {
      return;
    }

    const actualToken = request.headers.get("Authorization");
    if (actualToken !== `Bearer ${expectedAccessToken}`) {
      throw new Error(`Expected Authorization header Bearer ${expectedAccessToken}.`);
    }
  };

  const createControlHandler =
    (action: NcsControlAction): MockApiHandler =>
    async (request) => {
      assertAccessToken(request);

      const payload = (await request.json().catch(() => null)) as { workerId?: unknown } | null;
      if (!payload || typeof payload.workerId !== "string" || !payload.workerId.trim()) {
        return jsonResponse(
          {
            ok: false,
            error: "Request body must include a workerId.",
          },
          {
            status: 400,
          }
        );
      }

      requestCounter += 1;
      const message: QueuedControlMessage = {
        action,
        workerId: payload.workerId.trim(),
        requestId: `request-${requestCounter}`,
        requestedAt: nextTimestamp(),
        source: `ncs/${action}`,
      };

      queuedMessages.push(message);

      return jsonResponse(createControlResponse(message), {
        status: 202,
      });
    };

  const consumeNextMessage = async () => {
    const nextMessage = queuedMessages.shift();
    if (!nextMessage) {
      return null;
    }

    statusState = {
      ...statusState,
      generatedAt: nextTimestamp(),
      workers: applyQueuedMessage(statusState.workers, nextMessage, nextTimestamp()),
    };

    return clone(nextMessage);
  };

  const consumeAllMessages = async () => {
    const processedMessages: QueuedControlMessage[] = [];

    // The WorkerControl panel invalidates immediately after a 202 response, so tests can
    // deterministically decide when the queue-backed state transition actually lands.
    while (queuedMessages.length > 0) {
      const processedMessage = await consumeNextMessage();
      if (processedMessage) {
        processedMessages.push(processedMessage);
      }
    }

    return processedMessages;
  };

  return {
    handlers: {
      "GET /ncs/status": () => jsonResponse(buildStatusResponse()),
      "POST /ncs/pause": createControlHandler("pause"),
      "POST /ncs/resume": createControlHandler("resume"),
    } satisfies Record<string, MockApiHandler>,
    getQueuedMessages: () => clone(queuedMessages),
    getStatusSnapshot: () => buildStatusResponse(),
    queueSize: () => queuedMessages.length,
    consumeNextMessage,
    consumeAllMessages,
  };
};
