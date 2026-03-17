import { config } from "./config";

// Build a URL that honors VITE_API_BASE while allowing absolute URLs for tests.
const baseUrl = (config.apiBase || "").replace(/\/$/, "");
const buildUrl = (url: string) =>
  /^https?:\/\//i.test(url) ? url : `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;

/**
 * Typed fetch wrapper.
 * - Parses JSON into generic type T.
 * - Throws a descriptive Error when the response is not ok, preserving status and body text.
 * - Accepts standard fetch RequestInit options (method, headers, body, etc.).
 */
export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const finalUrl = buildUrl(url);
  const mergedOptions: RequestInit = {
    headers: {
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  };

  const res = await fetch(finalUrl, mergedOptions);

  if (!res.ok) {
    let details = "";
    try {
      const text = await res.text();
      details = text ? `: ${text}` : "";
    } catch (_err) {
      details = "";
    }
    throw new Error(`Request to ${finalUrl} failed (${res.status} ${res.statusText})${details}`);
  }

  try {
    return (await res.json()) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${finalUrl}: ${(error as Error).message}`);
  }
}
