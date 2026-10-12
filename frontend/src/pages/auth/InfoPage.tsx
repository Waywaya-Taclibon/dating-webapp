import type { JSX, ReactNode } from "react";
import LandingNavbar from "./LandingNavbar";
import { LandingFooter } from "./LandingSections";

/**
 * Shared shell for public info pages (/about, /features, /contact).
 * Navbar on top, footer pinned to the bottom, content padded to clear
 * the fixed navbar + torn strip.
 */
export default function InfoPage({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 to-white">
      <LandingNavbar />
      <main className="flex-1 pt-28 pb-16 px-6">{children}</main>
      <LandingFooter />
    </div>
  );
}
