"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const notificationSchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    time: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    type: { type: String, enum: ["match", "message", "system"], default: "system" },
});
exports.default = mongoose_1.default.model("Notification", notificationSchema);
