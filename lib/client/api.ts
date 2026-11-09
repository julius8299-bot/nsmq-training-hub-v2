"use client";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** JSON fetch with readable errors. A 401 means the sign-in expired; a 503 from sign-in means "busy, retry". */
export async function api<T>(url: string, init: { method?: string; body?: unknown; retryBusy?: boolean } = {}): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: init.method ?? (init.body === undefined ? "GET" : "POST"),
        headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        cache: "no-store",
      });
    } catch {
      throw new ApiError(0, "No connection. Check your internet and try again.");
    }
    if (response.status === 503 && init.retryBusy && attempt < 4) {
      const wait = Number(response.headers.get("retry-after") || 2) * 1000 + Math.random() * 1500;
      await new Promise((done) => setTimeout(done, wait));
      continue;
    }
    const data = await response.json().catch(() => ({}));
    if (response.ok) return data as T;
    if (response.status === 401) throw new ApiError(401, "Your sign-in has ended. Please sign in again.");
    throw new ApiError(response.status, (data as { error?: string }).error ?? "Something went wrong. Please try again.");
  }
}

export function signInHref() {
  return "/login?next=" + encodeURIComponent(window.location.pathname);
}
