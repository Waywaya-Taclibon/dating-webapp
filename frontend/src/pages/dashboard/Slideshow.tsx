import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [1, 2, 3, 4, 5].map(
  (n) => `${import.meta.env.BASE_URL}homepage/${n}.jpg`
);
const AUTOPLAY_MS = 5000;

/**
 * Full-bleed hero slideshow for /dashboard. Crossfading slides with a
 * lighter-pink gel overlay so the welcome text stays readable.
 * Autoplay pauses on hover/focus and when the user prefers reduced motion.
 */
export default function Slideshow(): JSX.Element {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  const go = useCallback(
    (dir: 1 | -1) =>
      setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length),
    []
  );

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = window.setTimeout(() => go(1), AUTOPLAY_MS);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [index, paused, go]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-roledescription="carousel"
      aria-label="DopaWink highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      {SLIDES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden={i === index ? undefined : true}
          loading={i === 0 ? "eager" : "lazy"}
          onError={(e) => {
            // Hide broken slides so the gel + text still look intentional
            (e.target as HTMLImageElement).style.display = "none";
          }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Lighter-pink color gel — keeps the welcome text legible */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-pink-300/30 bg-gradient-to-t from-pink-100/50 via-pink-200/10 to-transparent"
      />

      {/* Controls */}
      <button
        onClick={() => go(-1)}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 hover:bg-white text-pink-600 shadow-md transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/70 hover:bg-white text-pink-600 shadow-md transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((src, i) => (
          <button
            key={src}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2.5 rounded-full transition-all ${
              i === index ? "w-7 bg-pink-600" : "w-2.5 bg-white/80 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
