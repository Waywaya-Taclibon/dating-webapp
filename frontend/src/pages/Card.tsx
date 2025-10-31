import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { X, Heart } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { io } from "socket.io-client";

const socket = io("https://dopawink.onrender.com", {
  transports: ["websocket", "polling"], // ✅ enable fallback
  withCredentials: true,                 // ✅ match backend CORS
});


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
  const [cards, setCards] = useState<CardData[]>([]);
  const swipeDirection = useRef<"left" | "right" | null>(null);

  // 🧠 Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      try {
        const res = await fetch(`https://dopawink.onrender.com/api/discover/${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch discover users");
        const data = await res.json();
        setCards(data);
      } catch (err) {
        console.error("Error fetching discoverable users:", err);
      }
    };
    fetchUsers();
  }, [user]);

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
          className="bg-white border-2 border-pink-500 text-pink-500 p-3 rounded-full shadow-md hover:bg-pink-100 transition-transform transform hover:scale-110"
        >
          <X className="w-7 h-7" />
        </button>
        <button
          onClick={() => handleSwipe("right")}
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
  const x = useMotionValue(0);
  const isFront = clerkId === cards[cards.length - 1]?.clerkId;
  const offset = isFront ? 0 : Math.random() > 0.5 ? 6 : -6;
  const rotate = useTransform(x, [-150, 150], [-18 + offset, 18 + offset]);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

  // 🧠 Send swipe event to backend
  const sendSwipe = async (direction: "left" | "right") => {
    const liked = direction === "right";
    try {
      const res = await fetch("https://dopawink.onrender.com/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: currentUserId,
          to: clerkId,
          liked,
        }),
      });

      const data = await res.json();

      // ✅ If both liked → It's a match!
      if (data.match) {
        alert("🎉 It's a match!");

        // 🔔 Emit "new_match" event to backend for notifications
        socket.emit("new_match", {
          userA: currentUserId,
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
    const dirValue = direction === "right" ? 600 : -600;
    animate(x, dirValue, {
      type: "tween",
      duration: 0.3,
      ease: "easeOut",
      onComplete: async () => {
        await sendSwipe(direction);
        setCards((prev) => prev.filter((v) => v.clerkId !== clerkId));
        swipeDirection!.current = null;
      },
    });
  };

  if (isFront && swipeDirection?.current) {
    triggerSwipe(swipeDirection.current);
  }

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
