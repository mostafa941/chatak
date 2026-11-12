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
        <section className="flex flex-col items-start justify-start h-screen w-[100%] background-image">
          {/* Header */}
          <header className="w-[100%] h-[74px] px-4 py-3 bg-white flex items-center justify-between border-b border-[#9090902c] shadow-sm">
            <div className="flex items-center gap-3">
              {/* Back button for mobile */}
              {onBack && (
                <button
                  onClick={onBack}
                  className="lg:hidden text-[#01AA85] text-2xl hover:bg-[#D9F2ED] p-1.5 rounded-lg transition-colors"
                >
                  <RiArrowLeftLine />
                </button>
              )}
              {/* Avatar - click specifically to preview */}
              <img
                src={activeUser?.image || defaultAvatar}
                className="w-11 h-11 object-cover rounded-full cursor-pointer hover:ring-2 hover:ring-[#01AA85] transition-all shadow-sm"
                alt={activeUser?.fullName}
                onClick={() => setPreviewUser(activeUser)}
                title="Click to view full picture and bio"
              />
              <div
                className="cursor-pointer"
                onClick={() => setPreviewUser(activeUser)}
              >
                <h3 className="font-semibold text-[#2A3D39] text-base leading-tight">
                  {activeUser?.fullName || "Chat User"}
                </h3>
                <p className="font-light text-[#2A3D39] text-xs">
                  @{activeUser?.username || "username"}
                </p>
              </div>
            </div>
          </header>

          {/* Messages Body */}
          <main className="custom-scrollbar relative h-[calc(100vh-74px)] w-[100%] flex flex-col justify-between">
            <section className="px-3 pt-5 pb-24 lg:pb-16 flex-1 overflow-y-auto">
              <div ref={scrollRef} className="overflow-y-auto h-full max-h-[75vh]">
                {sortedMessages?.map((msg, index) => {
                  const isMe = msg?.sender === currentEmail;

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex w-full mb-3 ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isMe && (
                        <img
                          src={activeUser?.image || defaultAvatar}
                          className="h-9 w-9 object-cover rounded-full mr-2 self-end mb-1 flex-shrink-0 cursor-pointer"
                          alt=""
                          onClick={() => setPreviewUser(activeUser)}
                        />
                      )}

                      <div
                        className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm ${
                          isMe
                            ? "bg-[#01AA85] text-white rounded-br-none"
                            : "bg-white text-[#2A3D39] rounded-bl-none"
                        }`}
                      >
                        <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                          {msg.text}
                        </p>
                        <div
                          className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                            isMe ? "text-white/80" : "text-gray-400"
                          }`}
                        >
                          <span>{formatTimestamp(msg?.timestamp)}</span>
                          {isMe && (
                            <span className="text-xs">
                              {msg.read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Input Bar */}
            <div className="sticky lg:bottom-0 bottom-[60px] p-3 w-[100%] bg-gradient-to-t from-black/5 to-transparent">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center bg-white h-[48px] w-[100%] px-3 rounded-full relative shadow-md border border-gray-200"
              >
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="h-full text-[#2A3D39] outline-none text-[15px] px-2 rounded-full w-[100%]"
                  type="text"
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="flex items-center justify-center p-2 rounded-full bg-[#01AA85] text-white hover:bg-[#019b79] transition-colors disabled:opacity-40 flex-shrink-0 shadow-sm"
                >
                  <RiSendPlaneFill size={18} />
                </button>
              </form>
            </div>
          </main>
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
