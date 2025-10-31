import express from "express";
import UserInfo from "../models/UserInfo";
import { clerkClient } from "@clerk/clerk-sdk-node";
import Message from "../models/Message";

const router = express.Router();

// ✅ Create user profile
router.post("/info", async (req, res) => {
  try {
    const { clerkId, age, gender, city, bio } = req.body;
    if (!clerkId) return res.status(400).json({ message: "Missing Clerk ID" });

    const existingUser = await UserInfo.findOne({ clerkId });
    if (existingUser)
      return res
        .status(400)
        .json({ message: "Profile already exists. Use update instead." });

    const newUser = new UserInfo({ clerkId, age, gender, city, bio });
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

// ✅ Get single user info
router.get("/info/:clerkId", async (req, res) => {
  try {
    const user = await UserInfo.findOne({ clerkId: req.params.clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update user info
router.put("/info/:clerkId", async (req, res) => {
  try {
    const { clerkId } = req.params;
    const { bio, age, city, gender } = req.body;

    const updatedUser = await UserInfo.findOneAndUpdate(
      { clerkId },
      { bio, age, city, gender },
      { new: true }
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

// 🆕 HANDLE SWIPE (like or pass)
router.post("/swipe", async (req, res) => {
  try {
    const { from, to, liked } = req.body;
    if (!from || !to)
      return res.status(400).json({ message: "Missing from/to Clerk IDs" });

    const fromUser = await UserInfo.findOne({ clerkId: from });
    const toUser = await UserInfo.findOne({ clerkId: to });

    if (!fromUser || !toUser)
      return res.status(404).json({ message: "User not found" });

    if (liked) {
      if (!fromUser.likedUsers.includes(to)) {
        fromUser.likedUsers.push(to);
      }

      // Check for mutual like
      if (toUser.likedUsers.includes(from)) {
        if (!fromUser.matches.includes(to)) {
          fromUser.matches.push(to);
          toUser.matches.push(from);
        }
        await toUser.save();
      }
    } else {
      if (!fromUser.passedUsers.includes(to)) {
        fromUser.passedUsers.push(to);
      }
    }

    await fromUser.save();
    res.status(200).json({
      message: liked ? "Liked!" : "Passed!",
      match:
        liked && toUser.likedUsers.includes(from) ? "It's a match! ❤️" : null,
    });
  } catch (error) {
    console.error("Error handling swipe:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 🆕 FETCH MATCHES (with Clerk name + image)
router.get("/matches/:clerkId", async (req, res) => {
  try {
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


// 🆕 UNMATCH ROUTE
router.delete("/unmatch", async (req, res) => {
  try {
    const { userId, targetId } = req.body;

    if (!userId || !targetId)
      return res.status(400).json({ message: "Missing user IDs" });

    // Remove each other from matches array
    await UserInfo.updateOne({ clerkId: userId }, { $pull: { matches: targetId } });
    await UserInfo.updateOne({ clerkId: targetId }, { $pull: { matches: userId } });

    res.status(200).json({ message: "Successfully unmatched" });
  } catch (error) {
    console.error("Error unmatching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
