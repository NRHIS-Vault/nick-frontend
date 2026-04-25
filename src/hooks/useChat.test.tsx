import { act, renderHook, waitFor } from "@testing-library/react";
import type { Session, User } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/config", () => ({
  config: {
    apiBase: "",
    supabaseUrl: "",
    supabaseAnonKey: "",
    devAuthEmail: "",
    devAuthPassword: "",
    e2eMockMode: false,
  },
}));

import { useAuth } from "@/hooks/use-auth";
import type { AuthContextValue } from "@/contexts/auth-context";
import { useChat } from "./useChat";

const encoder = new TextEncoder();

const createJsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });

const createSseResponse = (chunks: string[], init: ResponseInit = {}) =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
      },
      ...init,
    }
  );

const mockedUseAuth = vi.mocked(useAuth);

describe("useChat", () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: "user-1",
      } as unknown as User,
      session: {
        access_token: "test-access-token",
      } as unknown as Session,
      profile: null,
      role: null,
      subscriptionStatus: null,
      isLoading: false,
      isConfigured: true,
      isLocalDevAuthEnabled: false,
      isE2EMockAuthEnabled: false,
      localDevCredentials: null,
      signOut: vi.fn(),
      signInWithLocalDevAccount: vi.fn(),
      signInWithE2EMockAccount: vi.fn(),
      signUpWithE2EMockAccount: vi.fn(),
    } as AuthContextValue);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("hydrates the latest stored conversation on mount", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toBe("/chat-history");
      expect(init?.headers).toMatchObject({
        Accept: "application/json",
        Authorization: "Bearer test-access-token",
      });

      return createJsonResponse({
        conversations: [
          {
            id: "conversation-1",
            title: "Stored chat",
            created_at: "2026-03-26T12:00:00.000Z",
            updated_at: "2026-03-26T12:05:00.000Z",
            messages: [
              {
                id: "message-1",
                role: "assistant",
                content: "Persisted reply",
                created_at: "2026-03-26T12:01:00.000Z",
              },
            ],
          },
        ],
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChat());

    await waitFor(() => {
      expect(result.current.isHydratingHistory).toBe(false);
      expect(result.current.conversationId).toBe("conversation-1");
      expect(result.current.messages).toHaveLength(1);
    });

    expect(result.current.messages[0]).toMatchObject({
      role: "assistant",
      content: "Persisted reply",
      status: "complete",
    });
    expect(result.current.conversations).toHaveLength(1);
  });

  it("sends the existing conversation id and appends streamed assistant tokens into one message", async () => {
    const chatPostBodies: Array<Record<string, unknown>> = [];

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === "/chat-history") {
        return createJsonResponse({
          conversations: [
            {
              id: "conversation-1",
              title: "Stored chat",
              created_at: "2026-03-26T12:00:00.000Z",
              updated_at: "2026-03-26T12:05:00.000Z",
              messages: [
                {
                  id: "message-1",
                  role: "assistant",
                  content: "Persisted reply",
                  created_at: "2026-03-26T12:01:00.000Z",
                },
              ],
            },
          ],
        });
      }

      if (url === "/chat") {
        chatPostBodies.push(JSON.parse(String(init?.body)));
        expect(init?.headers).toMatchObject({
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          Authorization: "Bearer test-access-token",
        });

        // The response is split into separate SSE events so the hook has to stitch
        // token fragments back into the in-progress assistant message.
        return createSseResponse([
          'event: meta\ndata: {"conversationId":"conversation-1"}\n\n',
          'event: token\ndata: {"delta":"Live"}\n\n',
          'event: token\ndata: {"delta":" reply"}\n\n',
          'event: done\ndata: {"ok":true,"conversationId":"conversation-1"}\n\n',
        ]);
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useChat());

    await waitFor(() => {
      expect(result.current.isHydratingHistory).toBe(false);
      expect(result.current.conversationId).toBe("conversation-1");
    });

    await act(async () => {
      await result.current.sendMessage("Need help");
    });

    expect(chatPostBodies[0]).toMatchObject({
      conversationId: "conversation-1",
      tools: ["searchLeads", "fetchTrades"],
    });
    const postedMessages = Array.isArray(chatPostBodies[0].messages)
      ? chatPostBodies[0].messages
      : [];
    expect(postedMessages[postedMessages.length - 1]).toEqual({
      role: "user",
      content: "Need help",
    });

    expect(result.current.messages.at(-2)).toMatchObject({
      role: "user",
      content: "Need help",
    });
    expect(result.current.messages.at(-1)).toMatchObject({
      role: "assistant",
      content: "Live reply",
      status: "complete",
    });
    expect(result.current.streamStatus).toBeNull();
    expect(result.current.isStreaming).toBe(false);
  });
});
