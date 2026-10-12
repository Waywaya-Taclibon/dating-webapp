import type { JSX } from "react";
import { Heart } from "lucide-react";

const MARQUEE_WORDS = ["SWIPE", "MATCH", "CHAT", "WINK"];

/** Infinite scrolling ribbon between hero and content. */
export function Marquee(): JSX.Element {
  const row = (hidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {MARQUEE_WORDS.map((word, i) => (
        <span key={`${word}-${i}`} className="flex items-center">
          <span className="mx-6 text-xl font-extrabold tracking-widest text-white">
            {word}
          </span>
          <Heart className="w-5 h-5 text-pink-300" fill="currentColor" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden bg-purple-700 py-3" aria-label="DopaWink highlights">
      <div className="dw-marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/** Slim single-row footer: logo leftmost, copyright rightmost. */
export function LandingFooter(): JSX.Element {
  return (
    <footer className="relative bg-purple-900 text-white px-4 py-2 shrink-0">
      <div className="w-full flex items-center justify-between gap-2 text-xs">
        <span className="font-bold">
          <span className="text-white">Dopa</span>
          <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Wink
          </span>
        </span>
        <p className="text-purple-300">© 2026 DopaWink</p>
      </div>
    </footer>
  );
}
