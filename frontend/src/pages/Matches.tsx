import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { Heart, MessageCircle, X } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

interface Match {
  clerkId: string;
  name: string;
  imageUrl: string | null;
  age?: number;
  city?: string;
}

const MatchesPage: React.FC = () => {
  const { user } = useUser();
  const currentUserId = user?.id;
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch matches from backend
  useEffect(() => {
    const fetchMatches = async () => {
      if (!currentUserId) return;
      try {
        const res = await fetch(`https://dopawink.onrender.com/api/match-list/${currentUserId}`);
        const data = await res.json();
        setMatches(data);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [currentUserId]);

  // ✅ Unmatch a user
  const handleUnmatch = async (targetId: string) => {
    const confirmed = window.confirm("Are you sure you want to unmatch?");
    if (!confirmed || !currentUserId) return;

    try {
      await fetch(`https://dopawink.onrender.com/api/unmatch`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, targetId }),
      });

      setMatches((prev) => prev.filter((m) => m.clerkId !== targetId));
    } catch (error) {
      console.error("Error unmatching:", error);
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
                    className="w-full h-72 object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => handleUnmatch(match.clerkId)}
                      className="bg-white/90 backdrop-blur-md p-2 rounded-full hover:bg-pink-100 transition-colors duration-200 shadow-md"
                      aria-label="Unmatch"
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
    </div>
  );
};

export default MatchesPage;
