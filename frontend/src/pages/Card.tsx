import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { X, Heart } from "lucide-react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { authFetch, authGet, ServerWakingUpError } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useToast } from "../lib/toast";


interface CardData {
  clerkId: string;
  name?: string;
  age: number;
  gender: string;
  city: string;
  bio: string;
  imageUrl?: string;
}

interface CardProps extends CardData {
  setCards: React.Dispatch<React.SetStateAction<CardData[]>>;
  cards: CardData[];
  swipeDirection?: React.MutableRefObject<"left" | "right" | null>;
  currentUserId: string;
}

const SwipeCards = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const toast = useToast();
  const [cards, setCards] = useState<CardData[]>([]);
  const swipeDirection = useRef<"left" | "right" | null>(null);

  // 🧠 Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      try {
        const data = await authGet<CardData[]>(getToken, `/api/discover/${user.id}`);
        setCards(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching discoverable users:", err);
        if (err instanceof ServerWakingUpError) {
          toast.info("Server is waking up — give it a moment, then refresh.");
        }
      }
    };
    fetchUsers();
  }, [user, getToken, toast]);

  const handleSwipe = (direction: "left" | "right") => {
    swipeDirection.current = direction;
    setCards((prev) => [...prev]); // re-render to trigger swipe animation
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Please log in to view users.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-4">
      {/* Cards Area */}
      <div className="w-full flex-1 flex items-center justify-center min-h-0">
        <div
          className="relative w-full h-full"
          style={{
            maxWidth: "min(400px, 90vw)",
            aspectRatio: "3/4",
            maxHeight: "100%",
          }}
        >
          {cards.map((card) => (
            <Card
              key={card.clerkId}
              {...card}
              cards={cards}
              setCards={setCards}
              swipeDirection={swipeDirection}
              currentUserId={user.id}
            />
          ))}
        </div>
      </div>

      {/* Swipe Buttons */}
      <div className="flex gap-6 pb-2">
        <button
          onClick={() => handleSwipe("left")}
          aria-label="Pass"
          className="bg-white border-2 border-pink-500 text-pink-500 p-3 rounded-full shadow-md hover:bg-pink-100 transition-transform transform hover:scale-110"
        >
          <X className="w-7 h-7" />
        </button>
        <button
          onClick={() => handleSwipe("right")}
          aria-label="Like"
          className="bg-pink-500 text-white p-3 rounded-full shadow-md hover:bg-pink-600 transition-transform transform hover:scale-110"
        >
          <Heart className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};

const Card = ({
  clerkId,
  imageUrl,
  name,
  age,
  gender,
  city,
  bio,
  setCards,
  cards,
  swipeDirection,
  currentUserId,
}: CardProps) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const toast = useToast();
  const x = useMotionValue(0);
  const swipedRef = useRef(false);
  const isFront = clerkId === cards[cards.length - 1]?.clerkId;
  // Stable per-card tilt (no jitter across re-renders)
  const offset = useMemo(() => {
    if (!clerkId) return 0;
    let hash = 0;
    for (let i = 0; i < clerkId.length; i++) hash = (hash * 31 + clerkId.charCodeAt(i)) | 0;
    return hash % 2 === 0 ? 6 : -6;
  }, [clerkId]);
  const rotate = useTransform(x, [-150, 150], [-18 + offset, 18 + offset]);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

  // 🧠 Send swipe event to backend
  const sendSwipe = async (direction: "left" | "right") => {
    const liked = direction === "right";
    try {
      // `from` comes from JWT server-side — only send target + liked
      const res = await authFetch(getToken, "/api/swipe", {
        method: "POST",
        body: JSON.stringify({
          to: clerkId,
          liked,
        }),
      });

      const data = await res.json();

      // ✅ If both liked → It's a match!
      if (data.match) {
        toast.success(`🎉 It's a match with ${name || "someone"}!`);

        // 🔔 Emit "new_match" event to backend for notifications
        getSocket(getToken, currentUserId).emit("new_match", {
          userB: clerkId,
          userAName: user?.fullName || "Someone",
          userBName: name || "Someone",
        });
      }
    } catch (err) {
      console.error("Error sending swipe:", err);
    }
  };

  const triggerSwipe = (direction: "left" | "right") => {
    // Guard: one swipe per card (StrictMode + drag/button double-trigger safe)
    if (swipedRef.current) return;
    swipedRef.current = true;
    const dirValue = direction === "right" ? 600 : -600;
    animate(x, dirValue, {
      type: "tween",
      duration: 0.3,
      ease: "easeOut",
      onComplete: async () => {
        await sendSwipe(direction);
        setCards((prev) => prev.filter((v) => v.clerkId !== clerkId));
        if (swipeDirection) swipeDirection.current = null;
      },
    });
  };

  // Button-driven swipes run as an effect, not during render
  useEffect(() => {
    if (isFront && swipeDirection?.current && !swipedRef.current) {
      triggerSwipe(swipeDirection.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFront, swipeDirection?.current]);

  const handleDragEnd = () => {
    const distance = x.get();
    if (Math.abs(distance) > 100) {
      triggerSwipe(distance > 0 ? "right" : "left");
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  };

  return (
    <motion.div
      className="absolute inset-0 rounded-xl overflow-hidden shadow-xl bg-gray-200"
      style={{
        x,
        opacity,
        rotate,
        boxShadow: isFront
          ? "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)"
          : undefined,
      }}
      animate={{ scale: isFront ? 1 : 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      drag={isFront ? "x" : false}
      dragElastic={0.2}
      dragConstraints={false}
      onDragEnd={handleDragEnd}
    >
      <img
        src={
          imageUrl ||
          "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"
        }
        alt={name || "User"}
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png";
        }}
        className="h-full w-full object-cover absolute inset-0"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      <div className="absolute bottom-0 p-4 text-left text-white">
        <h2 className="text-xl font-bold">
          {name || "Unknown"}, <span className="font-medium">{age}</span>
        </h2>
        <p className="text-sm text-pink-300">
          {gender}, {city}
        </p>
        <p className="text-sm mt-2 text-gray-200 leading-snug line-clamp-2">
          {bio}
        </p>
      </div>
    </motion.div>
  );
};

export default SwipeCards;
