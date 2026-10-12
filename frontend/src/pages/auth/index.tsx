import { SignedIn, SignedOut, SignInButton, SignUpButton, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../../lib/LoadingScreen";
import LandingNavbar from "./LandingNavbar";
import { LandingFooter } from "./LandingSections";

const Auth = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      const infoCompleted = user.publicMetadata?.infoCompleted;

      if (infoCompleted) {
        navigate("/dashboard");
      } else {
        navigate("/info");
      }
    }
  }, [user, isLoaded, navigate]);

  return (
    <div className="relative h-screen overflow-hidden flex flex-col bg-[#fe77ef]">
      {/* Doodle backdrop fused into the brand pink:
          multiply turns the white paper pink while the line-art stays dark,
          then a pink wash keeps the hero text readable. */}
      <div aria-hidden="true" className="absolute inset-0">
        <img
          src={`${import.meta.env.BASE_URL}loginpage/doodle.jpg`}
          alt=""
          className="h-full w-full object-cover mix-blend-multiply opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#fe77ef]/70 via-[#fe77ef]/50 to-[#fe77ef]/70" />
      </div>
      <SignedOut>
        <LandingNavbar />
        {/* Hero — fills remaining viewport; gif + headline untouched */}
        <section className="relative flex flex-col items-center justify-top flex-1 min-h-0 px-4 pt-15 gap-4">
          <img
            src={`${import.meta.env.BASE_URL}loginpage/winkers.gif`}
            alt="DopaWink winking"
            className="w-150 h-80 max-w-[70vw] max-h-[50vh] object-contain"
          />
          <h1 className="mt-6 text-center text-5xl sm:text-6xl md:text-7xl font-extrabold text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)] px-4">
            All it takes is a wink.
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-20">
            <SignUpButton mode="modal">
              <button className="px-8 py-3 bg-white text-pink-600 text-base font-bold rounded-full shadow-xl hover:bg-pink-50 hover:scale-105 transition-all">
                Create Account
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="px-8 py-3 bg-transparent border-2 border-white text-white text-base font-bold rounded-full hover:bg-white/10 hover:scale-105 transition-all">
                Sign In
              </button>
            </SignInButton>
          </div>
        </section>
        <LandingFooter />
      </SignedOut>

      <SignedIn>
        <LoadingScreen message="Redirecting…" />
      </SignedIn>
    </div>
  );
};

export default Auth;