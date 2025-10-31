import React, { useState, useEffect, useRef } from "react";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  ConversationList,
  Conversation,
  Avatar,
  TypingIndicator,
  ConversationHeader,
  type MessageModel,
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import Navbar from "./Navbar";
import { useUser } from "@clerk/clerk-react";
import { io } from "socket.io-client";

const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:3001"
    : "https://dopawink.onrender.com";


// ✅ Connect Socket.IO
const socket = io(
  import.meta.env.MODE === "development"
    ? "http://localhost:3001"
    : "https://dopawink.onrender.com",
  {
    transports: ["websocket"], // helps reduce polling issues on Vercel
  }
);

interface ChatUser {
  city: string;
  clerkId: string;
  name: string;
  imageUrl: string | null;
  lastMessage?: string;
  lastSenderId?: string;
  timestamp?: string;
}

interface MessageData {
  _id?: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp?: string;
}

const MessagePage: React.FC = () => {
  const { user } = useUser();
  const currentUserId = user?.id;
  const [matches, setMatches] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<MessageModel[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ Join user's room when logged in
  useEffect(() => {
    if (currentUserId) {
      socket.emit("join_room", currentUserId);
      console.log(`Joined room for user: ${currentUserId}`);
    }

    // ✅ Listen for new messages
    socket.on("receive_message", (data: MessageData) => {
      if (data.senderId === selectedUser?.clerkId) {
        setMessages((prev) => [
          ...prev,
          {
            message: data.message,
            sentTime: new Date().toLocaleTimeString(),
            sender: selectedUser.name,
            direction: "incoming",
            position: "single",
          },
        ]);
      }

      // ✅ Update preview + move chat to top
      setMatches((prev) => {
        const updated = prev.map((match) =>
          match.clerkId === data.senderId || match.clerkId === data.receiverId
            ? {
                ...match,
                lastMessage: data.message,
                lastSenderId: data.senderId,
                timestamp: new Date().toISOString(),
              }
            : match
        );
        // ✅ Sort by newest timestamp
        return updated.sort(
          (a, b) =>
            new Date(b.timestamp || 0).getTime() -
            new Date(a.timestamp || 0).getTime()
        );
      });
    });

    // ✅ Typing indicator
    socket.on("user_typing", ({ senderId }) => {
      if (senderId === selectedUser?.clerkId) setIsTyping(true);
    });

    socket.on("user_stop_typing", ({ senderId }) => {
      if (senderId === selectedUser?.clerkId) setIsTyping(false);
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, [currentUserId, selectedUser]);

  // ✅ Fetch matches + their last messages
  useEffect(() => {
    const fetchMatchesWithLastMessages = async () => {
      if (!currentUserId) return;
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/matches/with-last/${currentUserId}`
        );
        const data = await res.json();

        // ✅ If backend doesn't have that endpoint, fallback to normal matches
        if (Array.isArray(data) && data.length > 0) {
          setMatches(
            data.sort(
              (a: ChatUser, b: ChatUser) =>
                new Date(b.timestamp || 0).getTime() -
                new Date(a.timestamp || 0).getTime()
            )
          );
        } else {
          const fallback = await fetch(
            `${API_BASE_URL}/api/matches/${currentUserId}`
          );
          const fallbackData = await fallback.json();
          setMatches(
            fallbackData.map((u: ChatUser) => ({
              ...u,
              lastMessage: "Tap to chat",
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching matches:", error);
      }
    };

    fetchMatchesWithLastMessages();
  }, [currentUserId]);

  // ✅ Fetch chat messages
  const fetchMessages = async (receiverId: string) => {
    if (!currentUserId) return;
    const chatId = [currentUserId, receiverId].sort().join("_");

    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/${chatId}`);
      const data: MessageData[] = await res.json();

      setMessages(
        data.map((msg) => ({
          message: msg.message,
          sentTime: new Date(msg.timestamp || Date.now()).toLocaleTimeString(),
          sender:
            msg.senderId === currentUserId
              ? "You"
              : selectedUser?.name || "User",
          direction: msg.senderId === currentUserId ? "outgoing" : "incoming",
          position: "single",
        }))
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // ✅ Handle typing
  const handleTyping = () => {
    if (!selectedUser || !currentUserId) return;

    socket.emit("typing", {
      senderId: currentUserId,
      receiverId: selectedUser.clerkId,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        senderId: currentUserId,
        receiverId: selectedUser.clerkId,
      });
    }, 1000);
  };

  // ✅ Send message
  const handleSend = async (message: string) => {
    if (!selectedUser || !currentUserId) return;

    const newMsg: MessageModel = {
      message,
      sentTime: new Date().toLocaleTimeString(),
      sender: "You",
      direction: "outgoing",
      position: "single",
    };
    setMessages((prev) => [...prev, newMsg]);

    socket.emit("send_message", {
      senderId: currentUserId,
      receiverId: selectedUser.clerkId,
      message,
    });

    socket.emit("stop_typing", {
      senderId: currentUserId,
      receiverId: selectedUser.clerkId,
    });

    try {
      await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: selectedUser.clerkId,
          message,
        }),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }

    // ✅ Instantly update preview in sidebar
    setMatches((prev) => {
      const updated = prev.map((match) =>
        match.clerkId === selectedUser.clerkId
          ? {
              ...match,
              lastMessage: message,
              lastSenderId: currentUserId,
              timestamp: new Date().toISOString(),
            }
          : match
      );
      return updated.sort(
        (a, b) =>
          new Date(b.timestamp || 0).getTime() -
          new Date(a.timestamp || 0).getTime()
      );
    });
  };

  return (
    <div className="h-screen bg-neutral-50">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      <div className="h-full pt-16 overflow-hidden">
        <MainContainer responsive style={{ height: "100%" }}>
          {/* LEFT SIDEBAR */}
          <ConversationList>
            {matches.map((match) => (
              <Conversation
                key={match.clerkId}
                name={match.name}
                lastSenderName={
                  match.lastSenderId === currentUserId ? "You:" : ""
                }
                info={match.lastMessage || "Tap to chat"}
                onClick={() => {
                  setSelectedUser(match);
                  fetchMessages(match.clerkId);
                }}
                active={selectedUser?.clerkId === match.clerkId}
              >
                <Avatar src={match.imageUrl || undefined} name={match.name} />
              </Conversation>
            ))}
          </ConversationList>

          {/* RIGHT CHAT PANEL */}
          {selectedUser ? (
            <ChatContainer>
              <ConversationHeader>
                <Avatar
                  src={selectedUser.imageUrl || undefined}
                  name={selectedUser.name}
                />
                <ConversationHeader.Content
                  userName={selectedUser.name}
                  info={selectedUser.city || "Online"}
                />
              </ConversationHeader>

              <MessageList
                typingIndicator={
                  isTyping ? (
                    <TypingIndicator
                      content={`${selectedUser.name} is typing...`}
                    />
                  ) : null
                }
              >
                {messages.map((msg, index) => (
                  <Message key={index} model={msg} />
                ))}
              </MessageList>

              <MessageInput
                placeholder={`Message ${selectedUser.name}...`}
                attachButton={false}
                onSend={handleSend}
                onChange={handleTyping}
              />
            </ChatContainer>
          ) : (
            <div className="flex items-center justify-center w-full text-gray-400">
              Select a match to start chatting 💬
            </div>
          )}
        </MainContainer>
      </div>
    </div>
  );
};

export default MessagePage;
