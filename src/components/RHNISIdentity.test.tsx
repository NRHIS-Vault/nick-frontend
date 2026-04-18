import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RHNISIdentityResponse } from "@/lib/types";
import { renderWithProviders } from "@/test/render";
import { installMockFetch, jsonResponse } from "@/test/mockApi";

const testMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: testMocks.useAuth,
}));

vi.mock("@/lib/config", () => ({
  config: {
    apiBase: "",
    supabaseUrl: "",
    supabaseAnonKey: "",
    stripePublishableKey: "",
    devAuthEmail: "",
    devAuthPassword: "",
  },
}));

import { useAuth } from "@/hooks/use-auth";
import RHNISIdentity from "./RHNISIdentity";

const mockedUseAuth = vi.mocked(useAuth);

const identityResponse: RHNISIdentityResponse = {
  source: "supabase",
  computedAt: "2026-04-16T14:30:00.000Z",
  userId: "user-1",
  profileId: "profile-1",
  hasProfile: true,
  identity: {
    summary: {
      totalFeatures: 3,
      activeFeatures: 2,
      lastUpdatedAt: "2026-04-16T14:00:00.000Z",
    },
    features: [
      {
        icon: "fingerprint",
        title: "Voiceprint Vault",
        status: "tracking",
        description: "Stored voice markers for identity replay checks.",
        createdAt: "2026-04-12T11:00:00.000Z",
      },
      {
        icon: "radio",
        title: "Beacon Relay",
        status: "broadcasting",
        description: "Streaming beacon metadata into the RHNIS propagation layer.",
        createdAt: "2026-04-14T18:30:00.000Z",
      },
      {
        icon: "shield",
        title: "Operator Guardrails",
        status: "idle",
        description: "Waiting on the next protected identity handoff.",
        createdAt: "2026-04-15T09:15:00.000Z",
      },
    ],
  },
  beacon: {
    summary: {
      signature: "SIG-ALPHA-9",
      totalSignals: 408,
      activeStreams: 3,
      recordTypes: 4,
      lastUpdatedAt: "2026-04-16T14:10:00.000Z",
    },
    data: [
      {
        type: "Conversation Mirrors",
        count: 128,
        status: "broadcasting",
        createdAt: "2026-04-15T10:00:00.000Z",
      },
      {
        type: "Voice Anchors",
        count: 92,
        status: "active",
        createdAt: "2026-04-14T08:45:00.000Z",
      },
    ],
  },
  legacy: {
    stats: {
      voiceRecordingsMb: 512,
      interactionLogsMb: 768,
      digitalSignaturesMb: 256,
      totalStorageMb: 1536,
    },
    details: [
      {
        id: "voice-archive",
        label: "Voice Archive",
        sizeMb: 512,
        status: "synced",
        description: "Encrypted voice archive retained for identity audits.",
      },
      {
        id: "interaction-logs",
        label: "Interaction Logs",
        sizeMb: 768,
        status: "tracking",
        description: "Conversation history retained for longitudinal review.",
      },
      {
        id: "signatures",
        label: "Digital Signatures",
        sizeMb: 256,
        status: "ready",
        description: "Structured signature snapshots for operator verification.",
      },
    ],
    notes: [
      "Retention synced with primary archive tier.",
      "Latest signature digest passed background verification.",
    ],
    profileCreatedAt: "2026-04-01T12:00:00.000Z",
    lastUpdatedAt: "2026-04-16T14:15:00.000Z",
  },
};

describe("RHNISIdentity", () => {
  beforeEach(() => {
    mockedUseAuth.mockReset();
    mockedUseAuth.mockReturnValue({
      session: {
        access_token: "test-access-token",
      },
      user: {
        id: "user-1",
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);
  });

  it("renders authenticated identity, beacon, and legacy data from the worker response", async () => {
    const fetchMock = installMockFetch({
      "GET /identity": (request) => {
        expect(request.headers.get("Authorization")).toBe("Bearer test-access-token");
        return jsonResponse(identityResponse);
      },
    });

    renderWithProviders(<RHNISIdentity />);

    await waitFor(() => {
      expect(screen.getByText("Authenticated identity profile")).toBeTruthy();
      expect(screen.getByText("Voiceprint Vault")).toBeTruthy();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("SIG-ALPHA-9")).toBeTruthy();
    expect(screen.getByText("Stored voice markers for identity replay checks.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Beacon" }));

    await waitFor(() => {
      expect(screen.getByText("Conversation Mirrors")).toBeTruthy();
      expect(screen.getByText("Voice Anchors")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Legacy" }));

    await waitFor(() => {
      expect(screen.getByText("Legacy Notes")).toBeTruthy();
      expect(screen.getAllByText("Voice Archive").length).toBeGreaterThan(0);
      expect(screen.getByText("Retention synced with primary archive tier.")).toBeTruthy();
    });
  });
});
