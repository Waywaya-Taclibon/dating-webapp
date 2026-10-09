// Central API config — set VITE_API_URL in Vercel + .env.local, falls back to prod.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://dopawink.onrender.com";

type GetToken = () => Promise<string | null>;

/** Thrown when the backend is unreachable (cold start / spin-down / offline). */
export class ServerWakingUpError extends Error {
  constructor(message = "Server is waking up, retrying…") {
    super(message);
    this.name = "ServerWakingUpError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Authenticated fetch — always sends the Clerk session JWT.
 * Retries network-level failures (cold Render spin-up, blips) with backoff,
 * then throws ServerWakingUpError so UI can show "waking up" instead of hanging.
 */
export async function authFetch(
  getToken: GetToken,
  path: string,
  options: RequestInit = {},
  retries = 2
): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    } catch (err) {
      lastError = err;
      // Render free tier can take ~30-60s to wake; back off and retry.
      if (attempt < retries) await sleep(2000 * (attempt + 1));
    }
  }
  console.error(`Network failure for ${path} after ${retries + 1} attempts:`, lastError);
  throw new ServerWakingUpError();
}

/** GET + JSON with auth and basic error checking. */
export async function authGet<T>(
  getToken: GetToken,
  path: string
): Promise<T> {
  const res = await authFetch(getToken, path);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${path} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}
