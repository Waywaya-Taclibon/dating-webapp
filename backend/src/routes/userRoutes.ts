import express from "express";
import UserInfo from "../models/UserInfo";
import { clerkClient } from "@clerk/clerk-sdk-node";
import Message from "../models/Message";
import Notification from "../models/Notification";
import { enforceSelf, getAuthId } from "../middleware/requireAuth";

const router = express.Router();

function validateProfileInput(input: {
  age?: unknown;
  gender?: unknown;
  city?: unknown;
  bio?: unknown;
}): string | null {
  if (input.age !== undefined) {
    const age = Number(input.age);
    if (!Number.isInteger(age) || age < 18 || age > 120)
      return "Age must be an integer between 18 and 120";
  }
  if (input.gender !== undefined && typeof input.gender === "string" && input.gender.length > 30)
    return "Gender too long";
  if (input.city !== undefined && typeof input.city === "string" && input.city.length > 100)
    return "City too long";
  if (input.bio !== undefined && typeof input.bio === "string" && input.bio.length > 1000)
    return "Bio must be under 1000 characters";
  return null;
}

// ✅ Create user profile — identity comes from the verified JWT, not the body
router.post("/info", async (req, res) => {
  try {
    const authId = getAuthId(req);
    if (!authId) return res.status(401).json({ message: "Unauthorized" });
    const { age, gender, city, bio } = req.body;
    const clerkId = authId;

    const validationError = validateProfileInput({ age, gender, city, bio });
    if (validationError) return res.status(400).json({ message: validationError });
    if (age === undefined || !gender || !city || !bio)
      return res.status(400).json({ message: "Missing required profile fields" });

    const existingUser = await UserInfo.findOne({ clerkId });
    if (existingUser)
      return res
        .status(400)
        .json({ message: "Profile already exists. Use update instead." });

    const newUser = new UserInfo({
      clerkId,
      age: Number(age),
      gender: String(gender).slice(0, 30),
      city: String(city).slice(0, 100),
      bio: String(bio).slice(0, 1000),
    });
    await newUser.save();

    res.status(201).json({
      message: "Profile created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get single user info — users can only read their own profile
router.get("/info/:clerkId", async (req, res) => {
  try {
    if (!enforceSelf(req, res, req.params.clerkId)) return;
    const user = await UserInfo.findOne({ clerkId: req.params.clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update user info — only own profile, only provided fields, with validation
router.put("/info/:clerkId", async (req, res) => {
  try {
    const clerkId = enforceSelf(req, res, req.params.clerkId);
    if (!clerkId) return;
    const { bio, age, city, gender } = req.body;

    const validationError = validateProfileInput({ age, gender, city, bio });
    if (validationError) return res.status(400).json({ message: validationError });

    const update: Record<string, unknown> = {};
    if (bio !== undefined) update.bio = String(bio).slice(0, 1000);
    if (age !== undefined) update.age = Number(age);
    if (city !== undefined) update.city = String(city).slice(0, 100);
    if (gender !== undefined) update.gender = String(gender).slice(0, 30);
    if (Object.keys(update).length === 0)
      return res.status(400).json({ message: "No valid fields to update" });

    const updatedUser = await UserInfo.findOneAndUpdate(
      { clerkId },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user info:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🆕 FETCH DISCOVER USERS (enriched with Clerk name + image)
router.get("/discover/:clerkId", async (req, res) => {
  try {
    if (!enforceSelf(req, res, req.params.clerkId)) return;
    const currentUser = await UserInfo.findOne({ clerkId: req.params.clerkId });
    if (!currentUser)
      return res.status(404).json({ message: "Current user not found" });

    const excludedIds = [
      currentUser.clerkId,
      ...(currentUser.likedUsers || []),
      ...(currentUser.passedUsers || []),
    ];

    const discoverable = await UserInfo.find({
      clerkId: { $nin: excludedIds },
    });

    // 🔥 Enrich each MongoDB user with Clerk info (name + image)
    const enrichedUsers = await Promise.all(
      discoverable.map(async (user) => {
        try {
          const clerkUser = await clerkClient.users.getUser(user.clerkId);
          return {
            clerkId: user.clerkId,
            name: `${clerkUser.firstName || ""} ${
              clerkUser.lastName || ""
            }`.trim(),
            imageUrl: clerkUser.imageUrl,
            age: user.age,
            gender: user.gender,
            city: user.city,
            bio: user.bio,
          };
        } catch (err) {
          return {
            clerkId: user.clerkId,
            name: "Unknown",
            imageUrl: null,
            age: user.age,
            gender: user.gender,
            city: user.city,
            bio: user.bio,
          };
        }
      })
    );

    res.status(200).json(enrichedUsers);
  } catch (error) {
    console.error("Error fetching discover users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🆕 HANDLE SWIPE (like or pass) — `from` must be the authed user
// Atomic + idempotent via $addToSet: safe under concurrent mutual likes,
// duplicate taps, and StrictMode double-invocation.
router.post("/swipe", async (req, res) => {
  try {
    const { to, liked } = req.body;
    const from = getAuthId(req);
    if (!from) return res.status(401).json({ message: "Unauthorized" });
    if (!to || typeof to !== "string" || to.length > 64)
      return res.status(400).json({ message: "Missing target user" });
    if (typeof liked !== "boolean")
      return res.status(400).json({ message: "Missing liked flag" });
    if (to === from)
      return res.status(400).json({ message: "Cannot swipe on yourself" });

    const [fromUser, toUser] = await Promise.all([
      UserInfo.findOne({ clerkId: from }).select("clerkId").lean(),
      UserInfo.findOne({ clerkId: to }).select("clerkId likedUsers").lean(),
    ]);

    if (!fromUser || !toUser)
      return res.status(404).json({ message: "User not found" });

    if (liked) {
      await UserInfo.updateOne(
        { clerkId: from },
        { $addToSet: { likedUsers: to } }
      );

      // Mutual like → match both sides (idempotent, no duplicates)
      const isMatch = (toUser.likedUsers || []).includes(from);
      if (isMatch) {
        await Promise.all([
          UserInfo.updateOne(
            { clerkId: from },
            { $addToSet: { matches: to } }
          ),
          UserInfo.updateOne(
            { clerkId: to },
            { $addToSet: { matches: from } }
          ),
        ]);
      }
      return res.status(200).json({
        message: "Liked!",
        match: isMatch ? "It's a match! ❤️" : null,
      });
    }

    await UserInfo.updateOne(
      { clerkId: from },
      { $addToSet: { passedUsers: to } }
    );
    return res.status(200).json({ message: "Passed!", match: null });
  } catch (error) {
    console.error("Error handling swipe:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🆕 FETCH MATCHES (with Clerk name + image)
router.get("/matches/:clerkId", async (req, res) => {
  try {
    if (!enforceSelf(req, res, req.params.clerkId)) return;
    const user = await UserInfo.findOne({ clerkId: req.params.clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const matchedUsers = await UserInfo.find({
      clerkId: { $in: user.matches },
    });

    // Enrich matches with Clerk info
    const enrichedMatches = await Promise.all(
      matchedUsers.map(async (match) => {
        try {
          const clerkUser = await clerkClient.users.getUser(match.clerkId);
          return {
            clerkId: match.clerkId,
            name: `${clerkUser.firstName || ""} ${
              clerkUser.lastName || ""
            }`.trim(),
            imageUrl: clerkUser.imageUrl,
            age: match.age,
            gender: match.gender,
            city: match.city,
            bio: match.bio,
          };
        } catch (err) {
          return {
            clerkId: match.clerkId,
            name: "Unknown",
            imageUrl: null,
            age: match.age,
            gender: match.gender,
            city: match.city,
            bio: match.bio,
          };
        }
      })
    );

    res.status(200).json(enrichedMatches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/matches/with-last/:clerkId", async (req, res) => {
  try {
    if (!enforceSelf(req, res, req.params.clerkId)) return;
    const user = await UserInfo.findOne({ clerkId: req.params.clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Find all matched users
    const matchedUsers = await UserInfo.find({
      clerkId: { $in: user.matches },
    });

    // ✅ For each matched user, get the latest message
    const enrichedMatches = await Promise.all(
      matchedUsers.map(async (match) => {
        try {
          const chatId = [req.params.clerkId, match.clerkId].sort().join("_");

          // Find the most recent message between both users
          const lastMessage = await Message.findOne({ chatId })
            .sort({ timestamp: -1 })
            .limit(1);

          const clerkUser = await clerkClient.users.getUser(match.clerkId);

          return {
            clerkId: match.clerkId,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
            imageUrl: clerkUser.imageUrl,
            city: match.city,
            lastMessage: lastMessage?.message || "Tap to chat",
            lastSenderId: lastMessage?.senderId || null,
            timestamp: lastMessage?.timestamp || null,
          };
        } catch (err) {
          return {
            clerkId: match.clerkId,
            name: "Unknown",
            imageUrl: null,
            lastMessage: "Tap to chat",
            lastSenderId: null,
            timestamp: null,
          };
        }
      })
    );

    res.status(200).json(enrichedMatches);
  } catch (error) {
    console.error("Error fetching matches with last message:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// 🆕 FETCH MATCH LIST (with Clerk details)
router.get("/match-list/:clerkId", async (req, res) => {
  try {
    if (!enforceSelf(req, res, req.params.clerkId)) return;
    const user = await UserInfo.findOne({ clerkId: req.params.clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const matchedUsers = await UserInfo.find({
      clerkId: { $in: user.matches },
    });

    const enrichedMatches = await Promise.all(
      matchedUsers.map(async (match) => {
        try {
          const clerkUser = await clerkClient.users.getUser(match.clerkId);
          return {
            clerkId: match.clerkId,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
            imageUrl: clerkUser.imageUrl,
            age: match.age,
            gender: match.gender,
            city: match.city,
            bio: match.bio,
          };
        } catch {
          return {
            clerkId: match.clerkId,
            name: "Unknown",
            imageUrl: null,
            age: match.age,
            gender: match.gender,
            city: match.city,
            bio: match.bio,
          };
        }
      })
    );

    res.status(200).json(enrichedMatches);
  } catch (error) {
    console.error("Error fetching match list:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// 🆕 UNMATCH ROUTE — userId must be the authed user
router.delete("/unmatch", async (req, res) => {
  try {
    const userId = getAuthId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { targetId } = req.body;

    if (!targetId || typeof targetId !== "string")
      return res.status(400).json({ message: "Missing target user" });

    // Remove each other from matches array
    await UserInfo.updateOne({ clerkId: userId }, { $pull: { matches: targetId } });
    await UserInfo.updateOne({ clerkId: targetId }, { $pull: { matches: userId } });

    res.status(200).json({ message: "Successfully unmatched" });
  } catch (error) {
    console.error("Error unmatching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🛠️ SELF-SERVICE RESET — clears your likes, passes, matches (both sides)
// and deletes every message you sent or received, plus your notifications.
// Only ever touches the caller's own data (authId from JWT).
// Used by the hidden dev button in the frontend.
router.post("/reset/state", async (req, res) => {
  try {
    const authId = getAuthId(req);
    if (!authId) return res.status(401).json({ message: "Unauthorized" });

    const { confirm } = req.body || {};
    if (confirm !== "RESET") {
      return res.status(400).json({
        message: 'Send { "confirm": "RESET" } to confirm full reset',
      });
    }

    // 1. Clear own swipe state
    await UserInfo.updateOne(
      { clerkId: authId },
      { $set: { likedUsers: [], passedUsers: [], matches: [] } }
    );

    // 2. Remove me from everyone else's swipe state (so I reappear in Discover)
    const others = await UserInfo.updateMany(
      {
        $or: [
          { likedUsers: authId },
          { passedUsers: authId },
          { matches: authId },
        ],
      },
      { $pull: { likedUsers: authId, passedUsers: authId, matches: authId } }
    );

    // 3. Delete all my messages (both directions)
    const messages = await Message.deleteMany({
      $or: [{ senderId: authId }, { receiverId: authId }],
    });

    // 4. Delete my notifications
    const notifications = await Notification.deleteMany({ userId: authId });

    res.status(200).json({
      message: "Reset complete — fresh Discover, no matches, no messages",
      cleared: {
        othersTouched: others.modifiedCount ?? 0,
        messagesDeleted: messages.deletedCount ?? 0,
        notificationsDeleted: notifications.deletedCount ?? 0,
      },
    });
  } catch (error) {
    console.error("Error resetting state:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
