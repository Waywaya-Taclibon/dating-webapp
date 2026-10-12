import type { JSX } from "react";
import { Heart } from "lucide-react";

function Wave() {
  return <div className="dw-loader" role="presentation" aria-hidden="true" />;
}

/**
 * Type 1 — fullscreen login loader. Covers the whole viewport (auth gates,
 * route-level suspense, profile checks). One stable element per episode so
 * the wave runs continuously with no remount stutter.
 */
export function FullscreenLoader({
  message = "Loading…",
}: {
  message?: string;
}): JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-pink-50 to-white px-4"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mb-6 shadow-lg">
        <Heart className="w-10 h-10 text-white" fill="white" />
      </div>
      <Wave />
      <p className="text-gray-500 text-lg mt-6">{message}</p>
    </div>
  );
}

/**
 * Type 2 — in-website content loader. Transparent, sized to its container;
 * render it in the page content area below the navbar while the navbar is
 * locked via <Navbar disabled />. Same stable-element rule: don't swap
 * loaders mid-load or the wave restarts.
 */
export function ContentLoader({
  message = "Loading…",
}: {
  message?: string;
}): JSX.Element {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center h-full w-full py-10"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mb-5 shadow-md">
        <Heart className="w-6 h-6 text-white" fill="white" />
      </div>
      <Wave />
      <p className="text-gray-500 mt-6">{message}</p>
    </div>
  );
}

/** Back-compat default: fullscreen login loader. */
export default FullscreenLoader;
