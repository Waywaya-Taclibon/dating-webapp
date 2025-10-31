import { useEffect, useState } from "react";
import { Menu, X, Bell } from "lucide-react";
import { SignedIn, UserButton, useUser } from "@clerk/clerk-react";
import { io } from "socket.io-client";
import NotificationModal from "./NotificationModal";

const socket = io("http://localhost:3001"); // 👈 backend URL

export default function Navbar() {
  const { user } = useUser();
  const userId = user?.id;

  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ✅ Fetch notifications and listen for new ones
  useEffect(() => {
    if (!userId) return;

    // Join user’s room
    socket.emit("join_room", userId);

    // Fetch all notifications
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/notifications/${userId}`);
        const data = await res.json();
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();

    // Listen for live notifications
    socket.on("new_notification", (notif) => {
      setNotifications((prev) => [notif, ...prev]); // prepend new one
    });

    return () => {
      socket.off("new_notification");
    };
  }, [userId]);

  // ✅ Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    await fetch(`http://localhost:3001/api/notifications/markAll/${userId}`, {
      method: "PATCH",
    });
  };

  // ✅ Handle bell click — opens modal and marks all as read
  const handleBellClick = async () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (!showNotifications && unreadCount > 0) {
      await handleMarkAllAsRead();
    }
  };

  const navItems = [
    { name: "Discover", href: "/discover" },
    { name: "Matches", href: "/matches" },
    { name: "Messages", href: "/messages" },
    { name: "Profile", href: "/profile" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 shadow-md z-50 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex-shrink-0">
              <a href="/dashboard" className="text-2xl font-bold text-gray-800">
                Dopa
                <span className="text-pink-500">Wink</span>
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8 items-center">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-pink-500 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  {item.name}
                </a>
              ))}

              {/* Notification Bell */}
              <button
                onClick={handleBellClick}
                className="relative p-2 text-gray-700 hover:text-pink-500 transition-colors duration-200"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              {/* Mobile Notification Bell */}
              <button
                onClick={handleBellClick}
                className="relative p-2 text-gray-700 hover:text-pink-500 transition-colors duration-200"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-pink-500 hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500"
                aria-expanded={isOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gradient-to-b from-pink-50 to-white">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-pink-500 hover:bg-pink-50 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAsRead={() => {}} // not needed anymore
        onMarkAllAsRead={() => {}} // disabled
      />
    </>
  );
}
