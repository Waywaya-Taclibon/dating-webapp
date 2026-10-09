// Central API config — set VITE_API_URL in Vercel + .env.local, falls back to prod.
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://dopawink.onrender.com";

type GetToken = () => Promise<string | null>;

/** Authenticated fetch — always sends the Clerk session JWT. */
export async function authFetch(
  getToken: GetToken,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
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
