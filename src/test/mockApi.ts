import { vi } from "vitest";

export type MockApiHandler = (request: Request, url: URL) => Response | Promise<Response>;

type MockApiHandlers = Record<string, MockApiHandler>;

const buildAbsoluteUrl = (input: string) =>
  /^https?:\/\//i.test(input)
    ? input
    : `https://dashboard.test${input.startsWith("/") ? input : `/${input}`}`;

const buildRequest = (input: RequestInfo | URL, init?: RequestInit) => {
  if (input instanceof Request) {
    return new Request(buildAbsoluteUrl(input.url), {
      method: input.method,
      headers: input.headers,
      body: input.body,
      redirect: input.redirect,
      signal: input.signal,
      ...(init ?? {}),
    });
  }

  const url = input instanceof URL ? input.toString() : String(input);
  return new Request(buildAbsoluteUrl(url), init);
};

const buildRouteKey = (method: string, pathname: string) =>
  `${method.toUpperCase()} ${pathname}`;

export const jsonResponse = (body: unknown, init: ResponseInit = {}) => {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
};

export const installMockFetch = (handlers: MockApiHandlers) => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = buildRequest(input, init);
    const url = new URL(request.url);
    const handler = handlers[buildRouteKey(request.method, url.pathname)];

    if (!handler) {
      throw new Error(`Unhandled fetch request: ${buildRouteKey(request.method, url.pathname)}`);
    }

    return handler(request, url);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};
