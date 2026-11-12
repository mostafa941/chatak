import { useState, useEffect, useMemo } from "react";
import defaultAvatar from "../../public/assets/default.jpg";
import { RiMore2Fill } from "react-icons/ri";
import SearchModal from "./SearchModal";
import AvatarPreviewModal from "./AvatarPreviewModal";

import {
  auth,
  db,
  listenForChats,
  getUnreadCountForChat,
  markMessagesAsRead,
} from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import formatTimestamp from "../utlis/formatTimestamp";

const Chatlist = ({ setSelectedUser, onTotalUnreadChange }) => {
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [previewUser, setPreviewUser] = useState(null);

  // Listen to current user profile changes (name, bio, image)
  useEffect(() => {
    if (!auth?.currentUser?.uid) return;
    const userDocRef = doc(db, "users", auth?.currentUser?.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUser(docSnap.data());
      }
    });
    return unsubscribe;
  }, []);

  // Listen for active chats
  useEffect(() => {
    const unsubscribe = listenForChats(setChats);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Listen for unread counts for each chat
  useEffect(() => {
    const unsubscribes = [];
    const currentEmail = auth?.currentUser?.email;
    if (!currentEmail) return;

    chats.forEach((chat) => {
      const unsub = getUnreadCountForChat(chat.id, currentEmail, (count) => {
        setUnreadCounts((prev) => ({
          ...prev,
          [chat.id]: count,
        }));
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub && unsub());
    };
  }, [chats]);

  // Calculate total unread messages count across all chats
  const totalUnread = useMemo(() => {
    return Object.values(unreadCounts).reduce((sum, c) => sum + (c || 0), 0);
  }, [unreadCounts]);

  // Report total unread count up to parent (for Navlinks badge)
  useEffect(() => {
    if (onTotalUnreadChange) {
      onTotalUnreadChange(totalUnread);
    }
  }, [totalUnread, onTotalUnreadChange]);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const aTimestamp =
        (a?.lastMessageTimestamp?.seconds || 0) +
        (a?.lastMessageTimestamp?.nanoseconds || 0) / 1e9;
      const bTimestamp =
        (b?.lastMessageTimestamp?.seconds || 0) +
        (b?.lastMessageTimestamp?.nanoseconds || 0) / 1e9;

      return bTimestamp - aTimestamp;
    });
  }, [chats]);

  const startChat = (otherUser, chatId) => {
    setSelectedUser(otherUser);
    if (chatId) {
      // Mark as read immediately on open
      markMessagesAsRead(
        chatId,
        auth?.currentUser?.email,
        auth?.currentUser?.uid
      );
      setUnreadCounts((prev) => ({
        ...prev,
        [chatId]: 0,
      }));
    }
  };

  return (
    <section className="relative flex flex-col item-start justify-start bg-white h-[100vh] w-[100%] md:w-[600px] border-r border-[#9090902c]">
      {/* Avatar Preview Modal */}
      {previewUser && (
        <AvatarPreviewModal
          user={previewUser}
          onClose={() => setPreviewUser(null)}
          onStartChat={(u) => {
            const currentUid = auth?.currentUser?.uid;
            const cid =
              currentUid < u.uid
                ? `${currentUid}-${u.uid}`
                : `${u.uid}-${currentUid}`;
            startChat(u, cid);
          }}
        />
      )}

      {/* Top Header */}
      <header className="flex items-center justify-between w-[100%] lg:border-b border-b-1 border-[#898989b9] p-4 sticky md:static top-0 z-[50] bg-white">
        <main className="flex items-center gap-3">
          <img
            src={user?.image || defaultAvatar}
            className="w-[44px] h-[44px] object-cover rounded-full cursor-pointer hover:ring-2 hover:ring-[#01AA85] transition-all"
            alt=""
            onClick={() => setPreviewUser(user)}
            title="Click to view full picture and bio"
          />
          <div>
            <h3 className="p-0 font-semibold text-[#2A3D39] md:text-[17px] leading-tight">
              {user?.fullName || "Chat User"}
            </h3>
            <p className="p-0 font-light text-[#2A3D39] text-[13px]">
              @{user?.username || "username"}
            </p>
          </div>
        </main>
        <button className="bg-[#D9F2ED] w-[35px] h-[35px] p-2 flex items-center justify-center rounded-lg">
          <RiMore2Fill color="#01AA85" className="w-[28px] h-[28px]" />
        </button>
      </header>

      {/* Messages Header with Unread Count */}
      <div className="w-[100%] mt-[10px] px-5">
        <header className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#2A3D39] flex items-center gap-1.5">
            <span>Messages</span>
            <span className="text-[#01AA85] font-bold">({totalUnread})</span>
          </h3>
          <SearchModal
            startChat={(u) => {
              const currentUid = auth?.currentUser?.uid;
              const cid =
                currentUid < u.uid
                  ? `${currentUid}-${u.uid}`
                  : `${u.uid}-${currentUid}`;
              startChat(u, cid);
            }}
            isOpen={isSearchOpen}
            onOpen={() => setIsSearchOpen(true)}
            onClose={() => setIsSearchOpen(false)}
          />
        </header>
      </div>

      {/* Chats List */}
      <main className="flex flex-col items-start mt-[1rem] pb-20 lg:pb-3 custom-scrollbar w-[100%] h-[100%] overflow-y-auto">
        {sortedChats?.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full h-48 text-gray-400 text-center px-4">
            <p className="text-sm">No chats yet</p>
            <p className="text-xs mt-1">Use the search icon to find friends and start chatting!</p>
          </div>
        ) : (
          sortedChats?.map((chat) => {
            const otherUser = chat?.users?.find(
              (u) => u?.email !== auth?.currentUser?.email
            );
            if (!otherUser) return null;

            const chatUnread = unreadCounts[chat.id] || 0;

            return (
              <div
                key={chat?.id}
                onClick={() => startChat(otherUser, chat.id)}
                className={`flex items-center justify-between w-[100%] border-b border-[#90909015] px-5 py-3 cursor-pointer transition-colors ${
                  chatUnread > 0 ? "bg-[#01aa850d] hover:bg-[#01aa8518]" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Avatar - click specifically to preview */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={otherUser?.image || defaultAvatar}
                      className="h-[44px] w-[44px] rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-[#01AA85] transition-all"
                      alt={otherUser?.fullName}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewUser(otherUser);
                      }}
                      title="Click to view full picture and bio"
                    />
                    {chatUnread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#01AA85] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                        {chatUnread > 99 ? "99+" : chatUnread}
                      </span>
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="min-w-0 flex-1">
                    <h2 className="p-0 font-semibold text-[#2A3d39] text-[15px] truncate text-left">
                      {otherUser?.fullName || "Chat User"}
                    </h2>
                    <p
                      className={`p-0 text-left text-[13px] truncate ${
                        chatUnread > 0
                          ? "font-semibold text-[#01AA85]"
                          : "font-normal text-gray-400"
                      }`}
                    >
                      {chat?.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex flex-col items-end flex-shrink-0 ml-2">
                  <span className="text-gray-400 text-[11px]">
                    {formatTimestamp(chat?.lastMessageTimestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </main>
    </section>
  );
};

export default Chatlist;
