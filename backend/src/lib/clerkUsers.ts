import { clerkClient } from "@clerk/clerk-sdk-node";

export interface ClerkProfile {
  name: string;
  imageUrl: string | null;
}

const FALLBACK: ClerkProfile = { name: "Unknown", imageUrl: null };
const TTL_MS = 5 * 60 * 1000; // 5-minute cache — names/avatars change rarely
const cache = new Map<string, { at: number; profile: ClerkProfile }>();

function fromClerkUser(u: any): ClerkProfile {
  const name =
    `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || u?.username || "Someone";
  return { name, imageUrl: u?.imageUrl || null };
}

/**
 * Batched + cached Clerk lookup — replaces N× getUser with 1× getUserList.
 * Never throws: unknown users map to { name: "Unknown", imageUrl: null }.
 */
export async function getClerkProfiles(
  clerkIds: string[]
): Promise<Map<string, ClerkProfile>> {
  const unique = [...new Set(clerkIds.filter(Boolean))];
  const result = new Map<string, ClerkProfile>();
  const now = Date.now();
  const missing: string[] = [];

  for (const id of unique) {
    const hit = cache.get(id);
    if (hit && now - hit.at < TTL_MS) {
      result.set(id, hit.profile);
    } else {
      if (hit) cache.delete(id); // stale
      missing.push(id);
    }
  }

  if (missing.length > 0) {
    try {
      // getUserList pages at 10 by default — raise limit for our batch (max 500)
      const users: any[] = [];
      for (let i = 0; i < missing.length; i += 100) {
        const page = missing.slice(i, i + 100);
        const list: any = await clerkClient.users.getUserList({
          userId: page,
          limit: page.length,
        });
        if (Array.isArray(list)) users.push(...list);
        else if (Array.isArray(list?.data)) users.push(...list.data);
      }
      for (const u of users) {
        const id = u?.id;
        if (!id) continue;
        const profile = fromClerkUser(u);
        cache.set(id, { at: now, profile });
        result.set(id, profile);
      }
    } catch (err) {
      console.error("⚠️ Clerk batch lookup failed, falling back per-id:", err);
      // Fallback: individual lookups so one bad id doesn't sink the batch
      await Promise.all(
        missing.map(async (id) => {
          if (result.has(id)) return;
          try {
            const u = await clerkClient.users.getUser(id);
            const profile = fromClerkUser(u);
            cache.set(id, { at: now, profile });
            result.set(id, profile);
          } catch {
            result.set(id, FALLBACK);
          }
        })
      );
    }
  }

  for (const id of unique) {
    if (!result.has(id)) result.set(id, FALLBACK);
  }
  return result;
}

/** Single-profile convenience wrapper (uses the same batch cache). */
export async function getClerkProfile(clerkId: string): Promise<ClerkProfile> {
  const map = await getClerkProfiles([clerkId]);
  return map.get(clerkId) || FALLBACK;
}
