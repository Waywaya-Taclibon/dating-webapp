import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { Heart, MessageCircle, X } from "lucide-react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { authFetch, authGet } from "../lib/api";
import { useToast } from "../lib/toast";

interface Match {
  clerkId: string;
  name: string;
  imageUrl: string | null;
  age?: number;
  city?: string;
}

const MatchesPage: React.FC = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const currentUserId = user?.id;
  const navigate = useNavigate();
  const toast = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<Match | null>(null);

  // ✅ Fetch matches from backend
  useEffect(() => {
    const fetchMatches = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }
      try {
        const data = await authGet<Match[]>(getToken, `/api/match-list/${currentUserId}`);
        setMatches(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [currentUserId, getToken]);

  // ✅ Unmatch a user (inline confirm dialog, no window.confirm)
  const handleUnmatch = async () => {
    if (!confirmTarget || !currentUserId) return;
    const targetId = confirmTarget.clerkId;
    try {
      // userId comes from JWT server-side — only send targetId
      const res = await authFetch(getToken, `/api/unmatch`, {
        method: "DELETE",
        body: JSON.stringify({ targetId }),
      });
      if (!res.ok) throw new Error(`Unmatch failed (${res.status})`);
      setMatches((prev) => prev.filter((m) => m.clerkId !== targetId));
      toast.success(`Unmatched ${confirmTarget.name}.`);
    } catch (error) {
      console.error("Error unmatching:", error);
      toast.error("Could not unmatch. Try again.");
    } finally {
      setConfirmTarget(null);
    }
  };

  // ✅ Navigate to messages
  const handleStartMessage = (targetId: string) => {
    navigate(`/messages?chat=${targetId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading matches...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 to-white overflow-hidden">
      <Navbar />

      <main className="flex-1 pt-20 pb-8 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-pink-500 fill-pink-400" />
            <h1 className="text-3xl font-bold text-gray-800">
              Your <span className="text-pink-500">Matches</span>
            </h1>
          </div>
          <p className="text-gray-600 ml-11">
            You have{" "}
            <span className="font-semibold text-pink-500">
              {matches.length}
            </span>{" "}
            {matches.length === 1 ? "match" : "matches"}
          </p>
        </div>

        {/* Empty state */}
        {matches.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-pink-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No matches yet 💔
            </h2>
            <p className="text-gray-500">
              Keep swiping to find your perfect{" "}
              <span className="text-pink-400 font-semibold">DopaWink!</span>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <div
                key={match.clerkId}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-pink-100"
              >
                {/* Card Image */}
                <div className="relative">
                  <img
                    src={match.imageUrl || "https://placehold.co/300x300"}
                    alt={match.name}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/300x300";
                    }}
                    className="w-full h-72 object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => setConfirmTarget(match)}
                      className="bg-white/90 backdrop-blur-md p-2 rounded-full hover:bg-pink-100 transition-colors duration-200 shadow-md"
                      aria-label={`Unmatch ${match.name}`}
                    >
                      <X className="w-5 h-5 text-pink-500" />
                    </button>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">
                      {match.name}, {match.age}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {match.city ? match.city : "Location unknown"}
                    </p>
                  </div>

                  <button
                    onClick={() => handleStartMessage(match.clerkId)}
                    className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Go to Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Inline unmatch confirmation (no window.confirm) */}
      {confirmTarget && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setConfirmTarget(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Confirm unmatch"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-80 max-w-[calc(100vw-2rem)] border border-pink-100"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Unmatch {confirmTarget.name}?
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              You'll both be removed from each other's matches. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                className="flex-1 py-2 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Keep
              </button>
              <button
                onClick={handleUnmatch}
                className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all"
              >
                Unmatch
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MatchesPage;
