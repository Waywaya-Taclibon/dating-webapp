"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserInfo_1 = __importDefault(require("../models/UserInfo"));
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const Message_1 = __importDefault(require("../models/Message"));
const router = express_1.default.Router();
router.post("/info", async (req, res) => {
    try {
        const { clerkId, age, gender, city, bio } = req.body;
        if (!clerkId)
            return res.status(400).json({ message: "Missing Clerk ID" });
        const existingUser = await UserInfo_1.default.findOne({ clerkId });
        if (existingUser)
            return res
                .status(400)
                .json({ message: "Profile already exists. Use update instead." });
        const newUser = new UserInfo_1.default({ clerkId, age, gender, city, bio });
        await newUser.save();
        res.status(201).json({
            message: "Profile created successfully",
            user: newUser,
        });
    }
    catch (error) {
        console.error("Error creating profile:", error);
        res.status(500).json({ message: "Server error" });
    }
});
router.get("/info/:clerkId", async (req, res) => {
    try {
        const user = await UserInfo_1.default.findOne({ clerkId: req.params.clerkId });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        res.json(user);
    }
    catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Server error" });
    }
});
router.put("/info/:clerkId", async (req, res) => {
    try {
        const { clerkId } = req.params;
        const { bio, age, city, gender } = req.body;
        const updatedUser = await UserInfo_1.default.findOneAndUpdate({ clerkId }, { bio, age, city, gender }, { new: true });
        if (!updatedUser)
            return res.status(404).json({ message: "User not found" });
        res.status(200).json(updatedUser);
    }
    catch (error) {
        console.error("Error updating user info:", error);
        res.status(500).json({ message: "Server error" });
    }
});
router.get("/discover/:clerkId", async (req, res) => {
    try {
        const currentUser = await UserInfo_1.default.findOne({ clerkId: req.params.clerkId });
        if (!currentUser)
            return res.status(404).json({ message: "Current user not found" });
        const excludedIds = [
            currentUser.clerkId,
            ...(currentUser.likedUsers || []),
            ...(currentUser.passedUsers || []),
        ];
        const discoverable = await UserInfo_1.default.find({
            clerkId: { $nin: excludedIds },
        });
        const enrichedUsers = await Promise.all(discoverable.map(async (user) => {
            try {
                const clerkUser = await clerk_sdk_node_1.clerkClient.users.getUser(user.clerkId);
                return {
                    clerkId: user.clerkId,
                    name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
                    imageUrl: clerkUser.imageUrl,
                    age: user.age,
                    gender: user.gender,
                    city: user.city,
                    bio: user.bio,
                };
            }
            catch (err) {
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
        }));
        res.status(200).json(enrichedUsers);
    }
    catch (error) {
        console.error("Error fetching discover users:", error);
        res.status(500).json({ message: "Server error" });
    }
});
router.post("/swipe", async (req, res) => {
    try {
        const { from, to, liked } = req.body;
        if (!from || !to)
            return res.status(400).json({ message: "Missing from/to Clerk IDs" });
        const fromUser = await UserInfo_1.default.findOne({ clerkId: from });
        const toUser = await UserInfo_1.default.findOne({ clerkId: to });
        if (!fromUser || !toUser)
            return res.status(404).json({ message: "User not found" });
        if (liked) {
            if (!fromUser.likedUsers.includes(to)) {
                fromUser.likedUsers.push(to);
            }
            if (toUser.likedUsers.includes(from)) {
                if (!fromUser.matches.includes(to)) {
                    fromUser.matches.push(to);
                    toUser.matches.push(from);
                }
                await toUser.save();
            }
        }
        else {
            if (!fromUser.passedUsers.includes(to)) {
                fromUser.passedUsers.push(to);
            }
        }
        await fromUser.save();
        res.status(200).json({
            message: liked ? "Liked!" : "Passed!",
            match: liked && toUser.likedUsers.includes(from) ? "It's a match! ❤️" : null,
        });
    }
    catch (error) {
        console.error("Error handling swipe:", error);
        res.status(500).json({ message: "Server error" });
    }
});
router.get("/matches/:clerkId", async (req, res) => {
    try {
        const user = await UserInfo_1.default.findOne({ clerkId: req.params.clerkId });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const matchedUsers = await UserInfo_1.default.find({
            clerkId: { $in: user.matches },
        });
        const enrichedMatches = await Promise.all(matchedUsers.map(async (match) => {
            try {
                const clerkUser = await clerk_sdk_node_1.clerkClient.users.getUser(match.clerkId);
                return {
                    clerkId: match.clerkId,
                    name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
                    imageUrl: clerkUser.imageUrl,
                    age: match.age,
                    gender: match.gender,
                    city: match.city,
                    bio: match.bio,
                };
            }
            catch (err) {
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
        }));
        res.status(200).json(enrichedMatches);
    }
    catch (error) {
        console.error("Error fetching matches:", error);
        res.status(500).json({ message: "Server error" });
    }
});
router.get("/matches/with-last/:clerkId", async (req, res) => {
    try {
        const user = await UserInfo_1.default.findOne({ clerkId: req.params.clerkId });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const matchedUsers = await UserInfo_1.default.find({
            clerkId: { $in: user.matches },
        });
        const enrichedMatches = await Promise.all(matchedUsers.map(async (match) => {
            try {
                const chatId = [req.params.clerkId, match.clerkId].sort().join("_");
                const lastMessage = await Message_1.default.findOne({ chatId })
                    .sort({ timestamp: -1 })
                    .limit(1);
                const clerkUser = await clerk_sdk_node_1.clerkClient.users.getUser(match.clerkId);
                return {
                    clerkId: match.clerkId,
                    name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
                    imageUrl: clerkUser.imageUrl,
                    city: match.city,
                    lastMessage: (lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.message) || "Tap to chat",
                    lastSenderId: (lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.senderId) || null,
                    timestamp: (lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.timestamp) || null,
                };
            }
            catch (err) {
                return {
                    clerkId: match.clerkId,
                    name: "Unknown",
                    imageUrl: null,
                    lastMessage: "Tap to chat",
                    lastSenderId: null,
                    timestamp: null,
                };
            }
        }));
        res.status(200).json(enrichedMatches);
    }
    catch (error) {
        console.error("Error fetching matches with last message:", error);
        res.status(500).json({ message: "Server error" });
    }
});
router.get("/match-list/:clerkId", async (req, res) => {
    try {
        const user = await UserInfo_1.default.findOne({ clerkId: req.params.clerkId });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const matchedUsers = await UserInfo_1.default.find({
            clerkId: { $in: user.matches },
        });
        const enrichedMatches = await Promise.all(matchedUsers.map(async (match) => {
            try {
                const clerkUser = await clerk_sdk_node_1.clerkClient.users.getUser(match.clerkId);
                return {
                    clerkId: match.clerkId,
                    name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
                    imageUrl: clerkUser.imageUrl,
                    age: match.age,
                    gender: match.gender,
                    city: match.city,
                    bio: match.bio,
                };
            }
            catch {
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
        }));
        res.status(200).json(enrichedMatches);
    }
    catch (error) {
        console.error("Error fetching match list:", error);
        res.status(500).json({ message: "Server error" });
    }
});
router.delete("/unmatch", async (req, res) => {
    try {
        const { userId, targetId } = req.body;
        if (!userId || !targetId)
            return res.status(400).json({ message: "Missing user IDs" });
        await UserInfo_1.default.updateOne({ clerkId: userId }, { $pull: { matches: targetId } });
        await UserInfo_1.default.updateOne({ clerkId: targetId }, { $pull: { matches: userId } });
        res.status(200).json({ message: "Successfully unmatched" });
    }
    catch (error) {
        console.error("Error unmatching users:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
