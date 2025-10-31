import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Sparkles, Users } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-pink-50 to-white px-4">
      <SignedOut>
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mb-4 shadow-lg">
            <Heart className="w-10 h-10 text-white" fill="white" />
          </div>
          <h1 className="text-6xl font-bold mb-2">
            <span className="text-gray-800">Dopa</span>
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Wink</span>
          </h1>
          <p className="text-gray-500 text-lg">
            Sign in to continue your journey
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
          {/* Feature Highlights */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-pink-100 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-pink-500" />
              </div>
              <span className="text-gray-700">Personalized experience</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-pink-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-pink-500" />
              </div>
              <span className="text-gray-700">Connect with others</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-pink-100 p-2 rounded-lg">
                <Heart className="w-5 h-5 text-pink-500" />
              </div>
              <span className="text-gray-700">Safe and secure</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <SignUpButton mode="modal">
              <button className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-lg transition-all transform hover:scale-[1.02]">
                Create Account
              </button>
            </SignUpButton>

            <SignInButton mode="modal">
              <button className="w-full py-4 bg-white border-2 border-pink-500 text-pink-500 hover:bg-pink-50 font-semibold rounded-lg transition-all">
                Sign In
              </button>
            </SignInButton>
          </div>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        {/* Bottom Decoration */}
        <div className="mt-8 flex space-x-2">
          <div className="w-2 h-2 rounded-full bg-pink-300 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse delay-75"></div>
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-150"></div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="bg-white shadow-lg rounded-xl p-8">
          <div className="flex flex-col items-center space-y-4">
            <UserButton afterSignOutUrl="/" />
            <p className="text-gray-700">Redirecting...</p>
          </div>
        </div>
      </SignedIn>
    </div>
  );
};

export default Auth;