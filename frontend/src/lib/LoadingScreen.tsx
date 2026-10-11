import type { JSX } from "react";
import { Heart } from "lucide-react";

/**
 * Branded full-screen loader — DopaWink heart mark + pink spinner.
 * Use for route transitions, auth gates, and data-loading states so every
 * wait looks intentional instead of a blank page or a flashing form.
 */
export default function LoadingScreen({
  message = "Loading…",
  fullScreen = true,
}: {
  message?: string;
  /** false renders an inline block (for embedding in page layouts like Discover) */
  fullScreen?: boolean;
}): JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center px-4 ${
        fullScreen
          ? "min-h-screen bg-gradient-to-b from-pink-50 to-white"
          : "h-full w-full"
      }`}
    >
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mb-6 shadow-lg">
        <Heart className="w-10 h-10 text-white" fill="white" />
      </div>
      <div
        aria-hidden="true"
        className="w-10 h-10 mb-4 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin"
      />
      <p className="text-gray-500 text-lg">{message}</p>
    </div>
  );
}
