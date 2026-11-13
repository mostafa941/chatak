import { useState, useMemo } from "react";
import defaultAvatar from "../../public/assets/default.jpg";
import {
  auth,
  markNotificationsAsRead,
  markMessagesAsRead,
} from "../firebase/firebase";
import formatTimestamp from "../utlis/formatTimestamp";
import AvatarPreviewModal from "./AvatarPreviewModal";
import { RiCheckDoubleLine } from "react-icons/ri";

const NotificationsPage = ({ onSelectChat, notifications }) => {
  const [previewUser, setPreviewUser] = useState(null);

  // Group unread notifications by sender user (WhatsApp style)
  const unreadSenders = useMemo(() => {
    const senderMap = new Map();

    (notifications || []).forEach((notif) => {
      const key = notif.senderUid || notif.chatId;
      if (!senderMap.has(key)) {
        senderMap.set(key, {
          senderUid: notif.senderUid,
          chatId: notif.chatId,
          senderName: notif.senderName || "Chat User",
          senderImage: notif.senderImage || "",
          senderUsername: notif.senderUsername || "",
          senderBio: notif.senderBio || "",
          latestMessage: notif.message,
          latestTimestamp: notif.timestamp,
          count: 1,
          notificationsList: [notif],
        });
      } else {
        const item = senderMap.get(key);
        item.count += 1;
        item.notificationsList.push(notif);
        const curSec = notif.timestamp?.seconds || 0;
        const itemSec = item.latestTimestamp?.seconds || 0;
        if (curSec >= itemSec) {
          item.latestMessage = notif.message;
          item.latestTimestamp = notif.timestamp;
        }
      }
    });

    return Array.from(senderMap.values()).sort((a, b) => {
      const aSec = a.latestTimestamp?.seconds || 0;
      const bSec = b.latestTimestamp?.seconds || 0;
      return bSec - aSec;
    });
  }, [notifications]);

  const handleSenderClick = async (senderGroup) => {
    // 1. Mark all notifications from this sender as read
    await markNotificationsAsRead(senderGroup.notificationsList);

    // 2. Mark messages in this chat as read
    if (senderGroup.chatId) {
      await markMessagesAsRead(
        senderGroup.chatId,
        auth?.currentUser?.email,
        auth?.currentUser?.uid
      );
    }

    // 3. Open the chat
    if (onSelectChat) {
      onSelectChat({
        uid: senderGroup.senderUid,
        fullName: senderGroup.senderName,
        image: senderGroup.senderImage,
        username: senderGroup.senderUsername,
        bio: senderGroup.senderBio,
      });
    }
  };

  const handleMarkAllRead = async () => {
    if (notifications && notifications.length > 0) {
      await markNotificationsAsRead(notifications);
    }
  };

  return (
    <section className="flex flex-col items-start justify-start h-full w-full bg-white overflow-hidden">
      {/* Avatar Preview Modal */}
      {previewUser && (
        <AvatarPreviewModal
          user={previewUser}
          onClose={() => setPreviewUser(null)}
          onStartChat={(u) => {
            const group = unreadSenders.find((g) => g.senderUid === u.uid);
            if (group) {
              handleSenderClick(group);
            } else if (onSelectChat) {
              onSelectChat(u);
            }
          }}
        />
      )}

      {/* Header */}
      <header className="w-full p-4 border-b border-[#9090902c] flex items-center justify-between bg-white sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-[#2A3D39]">Notifications</h2>
          <p className="text-xs text-gray-400">
            {unreadSenders.length > 0
              ? `${unreadSenders.length} conversation${
                  unreadSenders.length > 1 ? "s" : ""
                } with unread messages`
              : "All caught up"}
          </p>
        </div>
        {unreadSenders.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-xs text-[#01AA85] font-semibold bg-[#D9F2ED] px-3 py-1.5 rounded-lg hover:bg-[#c8eae3] transition-colors"
          >
            <RiCheckDoubleLine size={16} />
            <span>Mark all read</span>
          </button>
        )}
      </header>

      {/* Body */}
      <main className="flex flex-col w-full overflow-auto h-full custom-scrollbar pb-20 lg:pb-6">
        {unreadSenders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6 text-center my-auto">
            <div className="w-16 h-16 rounded-full bg-[#e5f6f3] flex items-center justify-center mb-4 text-[#01AA85]">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-[#2A3D39]">
              No unread messages
            </p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              When someone sends you a message you haven't opened yet, it will appear here like WhatsApp!
            </p>
          </div>
        ) : (
          unreadSenders.map((sender) => (
            <div
              key={sender.senderUid || sender.chatId}
              onClick={() => handleSenderClick(sender)}
              className="flex items-center justify-between w-full px-5 py-4 border-b border-[#90909015] hover:bg-[#e5f6f3]/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Avatar with click to preview */}
                <div className="relative flex-shrink-0">
                  <img
                    src={sender.senderImage || defaultAvatar}
                    className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-[#01AA85] transition-all"
                    alt={sender.senderName}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewUser({
                        uid: sender.senderUid,
                        fullName: sender.senderName,
                        username: sender.senderUsername,
                        image: sender.senderImage,
                        bio: sender.senderBio,
                      });
                    }}
                    title="Click to view full picture and bio"
                  />
                  {sender.count > 1 && (
                    <span className="absolute -top-1 -right-1 bg-[#01AA85] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                      {sender.count}
                    </span>
                  )}
                </div>

                {/* Sender Info and snippet */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-[#2A3D39] text-[15px] truncate">
                      {sender.senderName}
                    </h4>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {sender.latestTimestamp
                        ? formatTimestamp(sender.latestTimestamp)
                        : "now"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5 font-normal">
                    {sender.latestMessage || "Sent a message"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </section>
  );
};

export default NotificationsPage;
