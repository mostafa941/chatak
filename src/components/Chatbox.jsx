import { useEffect, useMemo, useRef, useState } from "react";
import defaultAvatar from "../../public/assets/default.jpg";
import { RiSendPlaneFill, RiArrowLeftLine } from "react-icons/ri";
import {
  auth,
  db,
  listenForMessages,
  sendMessage,
  markMessagesAsRead,
} from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import logo from "../../public/assets/logo.png";
import formatTimestamp from "../utlis/formatTimestamp";
import AvatarPreviewModal from "./AvatarPreviewModal";

const Chatbox = ({ selectedUser, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [liveUserData, setLiveUserData] = useState(null);
  const [previewUser, setPreviewUser] = useState(null);
  const scrollRef = useRef(null);

  const currentUserUid = auth?.currentUser?.uid;
  const currentEmail = auth?.currentUser?.email;

  const chatId = useMemo(() => {
    if (!currentUserUid || !selectedUser?.uid) return null;
    return currentUserUid < selectedUser.uid
      ? `${currentUserUid}-${selectedUser.uid}`
      : `${selectedUser.uid}-${currentUserUid}`;
  }, [currentUserUid, selectedUser?.uid]);

  // Listen for live updates to the selected user's profile (photo, bio, name)
  useEffect(() => {
    if (!selectedUser?.uid) {
      setLiveUserData(null);
      return;
    }
    const userDocRef = doc(db, "users", selectedUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setLiveUserData(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, [selectedUser?.uid]);

  const activeUser = liveUserData || selectedUser;

  // Listen for messages in this chat
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }
    const unsubscribe = listenForMessages(chatId, setMessages);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId]);

  // Mark messages as read when viewing the chat (seen)
  useEffect(() => {
    if (chatId && currentEmail && currentUserUid) {
      markMessagesAsRead(chatId, currentEmail, currentUserUid);
    }
  }, [messages, chatId, currentEmail, currentUserUid]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTimestamp =
        (a?.timestamp?.seconds || 0) + (a?.timestamp?.nanoseconds || 0) / 1e9;
      const bTimestamp =
        (b?.timestamp?.seconds || 0) + (b?.timestamp?.nanoseconds || 0) / 1e9;

      return aTimestamp - bTimestamp;
    });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !chatId || !selectedUser) return;

    const text = messageText;
    setMessageText("");

    const newMessage = {
      sender: currentEmail,
      text: text,
      timestamp: {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      },
      read: false,
    };

    sendMessage(text, chatId, currentUserUid, selectedUser.uid);
    setMessages((prev) => [...prev, newMessage]);
  };

  return (
    <>
      {/* Avatar Preview Modal */}
      {previewUser && (
        <AvatarPreviewModal
          user={previewUser}
          onClose={() => setPreviewUser(null)}
        />
      )}

      {selectedUser ? (
        <section className="flex flex-col h-[100dvh] lg:h-screen w-full bg-[#f4f7f6] background-image overflow-hidden">
          {/* Header (flex-shrink-0, fixed at top) */}
          <header className="flex-shrink-0 w-full h-[60px] sm:h-[68px] px-3 sm:px-4 bg-white flex items-center justify-between border-b border-[#9090902c] shadow-xs z-10">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Back button for mobile */}
              {onBack && (
                <button
                  onClick={onBack}
                  className="lg:hidden text-[#01AA85] hover:bg-[#D9F2ED] p-2 -ml-1 rounded-full transition-colors flex-shrink-0"
                  title="Back to chats"
                >
                  <RiArrowLeftLine size={22} />
                </button>
              )}

              {/* Avatar */}
              <img
                src={activeUser?.image || defaultAvatar}
                className="w-10 h-10 sm:w-11 sm:h-11 object-cover rounded-full cursor-pointer hover:ring-2 hover:ring-[#01AA85] transition-all shadow-xs flex-shrink-0"
                alt={activeUser?.fullName}
                onClick={() => setPreviewUser(activeUser)}
                title="Click to view full picture and bio"
              />

              {/* User Name & Handle */}
              <div
                className="cursor-pointer min-w-0 flex-1"
                onClick={() => setPreviewUser(activeUser)}
              >
                <h3 className="font-semibold text-[#2A3D39] text-[15px] sm:text-base leading-tight truncate">
                  {activeUser?.fullName || "Chat User"}
                </h3>
                <p className="font-light text-[#2A3D39] text-[12px] truncate">
                  @{activeUser?.username || "username"}
                </p>
              </div>
            </div>
          </header>

          {/* Messages Area (flex-1, min-h-0, scrollable container) */}
          <main
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-3 custom-scrollbar"
          >
            <div className="flex flex-col justify-end min-h-full space-y-3 pb-2">
              {sortedMessages?.map((msg, index) => {
                const isMe = msg?.sender === currentEmail;

                return (
                  <div
                    key={msg.id || index}
                    className={`flex w-full ${
                      isMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isMe && (
                      <img
                        src={activeUser?.image || defaultAvatar}
                        className="h-8 w-8 sm:h-9 sm:w-9 object-cover rounded-full mr-2 self-end mb-1 flex-shrink-0 cursor-pointer"
                        alt=""
                        onClick={() => setPreviewUser(activeUser)}
                      />
                    )}

                    <div
                      className={`max-w-[82%] sm:max-w-[65%] rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-xs ${
                        isMe
                          ? "bg-[#01AA85] text-white rounded-br-xs"
                          : "bg-white text-[#2A3D39] rounded-bl-xs border border-gray-100"
                      }`}
                    >
                      <p className="text-[14px] sm:text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                        {msg.text}
                      </p>
                      <div
                        className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                          isMe ? "text-white/80" : "text-gray-400"
                        }`}
                      >
                        <span>{formatTimestamp(msg?.timestamp)}</span>
                        {isMe && (
                          <span className="text-xs font-semibold">
                            {msg.read ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* Input Bar (flex-shrink-0, always anchored at bottom) */}
          <footer
            className="flex-shrink-0 w-full bg-white border-t border-gray-200/80 p-2 sm:p-3 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
            style={{ paddingBottom: "max(0.6rem, env(safe-area-inset-bottom))" }}
          >
            <form
              onSubmit={handleSendMessage}
              className="flex items-center bg-[#f0f2f5] hover:bg-[#ebedef] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#01AA85]/30 focus-within:border-[#01AA85] border border-gray-200 rounded-full h-[46px] sm:h-[48px] px-2 sm:px-3 transition-all"
            >
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 h-full bg-transparent text-[#2A3D39] outline-none text-[16px] px-2 sm:px-3 placeholder:text-gray-400"
                type="text"
                placeholder="Type a message..."
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#01AA85] text-white hover:bg-[#019b79] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 shadow-xs"
                title="Send message"
              >
                <RiSendPlaneFill size={18} />
              </button>
            </form>
          </footer>
        </section>
      ) : (
        <section className="h-screen w-[100%] bg-[#e5f6f3] flex flex-col justify-center items-center p-6 text-center">
          <img src={logo} alt="Chat Logo" className="w-20 mb-4 drop-shadow-sm" />
          <h1 className="text-[26px] font-bold text-teal-800">
            Welcome to Chatfrik
          </h1>
          <p className="text-gray-500 max-w-sm mt-2 text-sm">
            Select a conversation or start a new chat with friends
          </p>
        </section>
      )}
    </>
  );
};

export default Chatbox;
