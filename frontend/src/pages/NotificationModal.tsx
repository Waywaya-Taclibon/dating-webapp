import { X } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void; // still accepted for compatibility
}

export default function NotificationModal({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
}: NotificationModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-opacity-100 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-20 right-4 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col border border-pink-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-pink-100 bg-gradient-to-r from-pink-500 to-purple-500 rounded-t-xl">
          <h2 className="text-xl font-semibold text-white">Notifications</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Notifications list */}
        <div className="overflow-y-auto flex-1 bg-gradient-to-b from-pink-50 to-white">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-pink-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-pink-50 transition-colors cursor-pointer ${
                    !notification.read ? "bg-pink-100/40" : ""
                  }`}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-pink-500 rounded-full ml-2 mt-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
