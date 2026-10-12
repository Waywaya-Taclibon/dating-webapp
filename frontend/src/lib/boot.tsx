import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import { useUser } from "@clerk/clerk-react";
import { FullscreenLoader } from "./LoadingScreen";

interface BootApi {
  /** Hold the boot overlay until async startup work finishes. Idempotent release. */
  hold: (key: string) => () => void;
}

const BootContext = createContext<BootApi>({ hold: () => () => {} });
export const useBoot = () => useContext(BootContext);

// Bridges route-to-route handoffs (e.g. /info unmount → /dashboard mount)
// so the overlay element never unmounts mid-sequence and the wave never restarts.
const SETTLE_GRACE_MS = 350;
// Fade duration before the overlay unmounts for good.
const FADE_MS = 300;

/**
 * Single persistent login overlay. It mounts once on first paint and plays
 * ONE continuous wave while the sequential login phases complete behind it
 * (Clerk load → /info profile check → dashboard mount), then fades out.
 * After settling it never shows again — in-website loads use ContentLoader.
 */
export function BootProvider({ children }: { children: ReactNode }): JSX.Element {
  const { isLoaded: clerkLoaded } = useUser();
  const [holds, setHolds] = useState<readonly string[]>([]);
  const [settled, setSettled] = useState(false);
  const [gone, setGone] = useState(false);
  const timer = useRef<number | null>(null);

  const hold = useCallback((key: string) => {
    let released = false;
    setHolds((prev) => (prev.includes(key) ? prev : [...prev, key]));
    return () => {
      if (released) return;
      released = true;
      setHolds((prev) => prev.filter((k) => k !== key));
    };
  }, []);

  // Settle once Clerk is loaded and every hold is released.
  useEffect(() => {
    if (settled) return;
    if (!clerkLoaded || holds.length > 0) {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      return;
    }
    timer.current = window.setTimeout(() => setSettled(true), SETTLE_GRACE_MS);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [clerkLoaded, holds, settled]);

  // Fade out, then unmount permanently.
  useEffect(() => {
    if (!settled) return;
    const t = window.setTimeout(() => setGone(true), FADE_MS + 50);
    return () => window.clearTimeout(t);
  }, [settled]);

  return (
    <BootContext.Provider value={{ hold }}>
      {children}
      {!gone && (
        <div
          aria-hidden={settled || undefined}
          className={`fixed inset-0 z-[200] transition-opacity duration-300 ${
            settled ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <FullscreenLoader message="" />
        </div>
      )}
    </BootContext.Provider>
  );
}
