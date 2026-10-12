import { useState, type JSX } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";

const LANDING_LINKS = [
  { name: "About", href: "/about" },
  { name: "Features", href: "/features" },
  { name: "Contact Us", href: "/contact" },
];

/**
 * Public landing navbar — logo left (same DopaWink styling as the hero),
 * info links center, auth buttons right. Shared by / and the info routes.
 */
export default function LandingNavbar(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Solid white bar block — the torn strip below fuses into this,
          so bar + teeth read as ONE torn navbar container.
          NOTE: no shadow here — a straight shadow line would sever the
          teeth from the bar and flip the read back to "torn pink". */}
      <div className="bg-white/95 backdrop-blur">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center h-16">
          {/* Logo — same design as the hero h1 */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold">
              <span className="text-gray-800">Dopa</span>
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                Wink
              </span>
            </Link>
          </div>

          {/* Desktop links — pinned to the true viewport center */}
          <div className="hidden md:flex space-x-8 items-center absolute left-1/2 -translate-x-1/2">
            {LANDING_LINKS.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-700 hover:text-pink-500 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-sm font-semibold rounded-full shadow-md transition-all">
                  Create Account
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="px-5 py-2 bg-white border-2 border-pink-500 text-pink-500 hover:bg-pink-50 text-sm font-semibold rounded-full transition-all">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-pink-500 hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gradient-to-b from-pink-50 to-white">
          {LANDING_LINKS.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="text-gray-700 hover:text-pink-500 hover:bg-pink-50 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <SignedOut>
            <div className="flex gap-2 px-3 py-2">
              <SignUpButton mode="modal">
                <button className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-semibold rounded-full shadow-md">
                  Create Account
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="flex-1 py-2 bg-white border-2 border-pink-500 text-pink-500 text-sm font-semibold rounded-full">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </SignedOut>
        </div>
      </div>

      {/* Torn-paper strip — dense irregular fiber teeth (no repeating rhythm),
          fused into the bar block so the navbar reads as one ripped sheet.
          Pale fringe underlay suggests paper fiber thickness. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 28"
        preserveAspectRatio="none"
        className="block w-full h-[26px] -mt-px drop-shadow-md"
      >
        <polygon
          fill="#fbcfe8"
          transform="translate(0 3)"
          points="0,0 1200,0 1200,22 1188,22 1180,12 1172,23 1158,21 1150,9 1142,24 1128,22 1120,15 1110,24 1096,20 1088,7 1080,23 1066,24 1058,14 1048,22 1036,10 1026,25 1012,21 1004,16 994,24 980,22 972,8 964,23 950,20 942,15 932,25 918,23 910,11 900,22 888,19 880,6 872,24 858,22 850,13 840,25 826,21 818,17 808,23 796,9 786,24 772,22 764,14 754,21 742,11 732,26 718,22 710,16 700,24 686,20 678,8 670,23 656,24 648,13 638,22 626,10 616,25 602,21 594,15 584,24 570,22 562,7 554,23 540,20 532,14 522,25 508,23 500,12 490,22 478,18 470,5 462,24 448,21 440,15 430,25 416,23 408,10 398,22 386,19 378,7 370,24 356,22 348,14 338,21 326,11 316,26 302,22 294,16 284,24 270,20 262,9 254,23 240,24 232,13 222,22 210,10 200,25 186,21 178,15 168,24 154,22 146,8 138,23 124,20 116,14 106,25 92,23 84,11 74,22 62,18 54,6 46,24 32,21 24,15 14,25 0,22"
        />
        <polygon
          fill="#ffffff"
          fillOpacity={0.95}
          points="0,0 1200,0 1200,22 1188,22 1180,12 1172,23 1158,21 1150,9 1142,24 1128,22 1120,15 1110,24 1096,20 1088,7 1080,23 1066,24 1058,14 1048,22 1036,10 1026,25 1012,21 1004,16 994,24 980,22 972,8 964,23 950,20 942,15 932,25 918,23 910,11 900,22 888,19 880,6 872,24 858,22 850,13 840,25 826,21 818,17 808,23 796,9 786,24 772,22 764,14 754,21 742,11 732,26 718,22 710,16 700,24 686,20 678,8 670,23 656,24 648,13 638,22 626,10 616,25 602,21 594,15 584,24 570,22 562,7 554,23 540,20 532,14 522,25 508,23 500,12 490,22 478,18 470,5 462,24 448,21 440,15 430,25 416,23 408,10 398,22 386,19 378,7 370,24 356,22 348,14 338,21 326,11 316,26 302,22 294,16 284,24 270,20 262,9 254,23 240,24 232,13 222,22 210,10 200,25 186,21 178,15 168,24 154,22 146,8 138,23 124,20 116,14 106,25 92,23 84,11 74,22 62,18 54,6 46,24 32,21 24,15 14,25 0,22"
        />
      </svg>
    </nav>
  );
}
