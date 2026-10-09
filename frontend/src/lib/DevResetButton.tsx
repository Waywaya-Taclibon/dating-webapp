import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { authFetch } from "./api";
import { useToast } from "./toast";

/**
 * Hidden dev reset button.
 *
 * It is intentionally hidden with inline `display: none` so it never shows
 * in normal use. To reveal it:
 *   1. Open DevTools (F12) → Elements panel
 *   2. Find `#dev-reset-state` (Ctrl+F in Elements, search "dev-reset-state")
 *   3. Uncheck `display: none` in the Styles pane (or delete the style attr)
 *   4. Click the button → confirm → your likes, passes, matches and
 *      all messages are wiped for YOUR account only.
 */
export default function DevResetButton() {
  const { getToken } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const handleReset = async () => {
    const ok = window.confirm(
      "Reset ALL your swipes (likes + passes), matches and messages? This cannot be undone."
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await authFetch(getToken, "/api/reset/state", {
        method: "POST",
        body: JSON.stringify({ confirm: "RESET" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(`Reset failed: ${(data as any)?.message || res.status}`);
        return;
      }
      toast.success(
        `Reset done — ${(data as any)?.cleared?.messagesDeleted ?? 0} messages deleted. Reloading…`
      );
      window.setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      console.error("Reset failed:", err);
      toast.error("Reset failed — network/server error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      id="dev-reset-state"
      data-dev-reset="swipe-state"
      type="button"
      title="Hidden dev reset — reveal via Inspect Element"
      onClick={handleReset}
      disabled={busy}
      style={{ display: "none" }}
    >
      {busy ? "Resetting…" : "Reset swipes + messages"}
    </button>
  );
}
