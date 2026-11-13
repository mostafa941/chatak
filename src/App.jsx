import { useState, useEffect, useRef, useCallback } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Navlinks from "./components/Navlinks";
import Chatbox from "./components/Chatbox";
import Chatlist from "./components/Chatlist";
import ProfilePage from "./components/ProfilePage";
import NotificationsPage from "./components/NotificationsPage";
import SearchModal from "./components/SearchModal";
import ToastContainer from "./components/ToastNotification";
import {
  auth,
  listenForNotifications,
  markNotificationsAsRead,
  markMessagesAsRead,
} from "./firebase/firebase";

const App = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("chats");
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Track which chat is currently open
  const selectedUserRef = useRef(null);
  const prevNotificationsRef = useRef([]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
    }

    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });

    return () => unsubscribe();
  }, []);

  // Listen for unread notifications for current user
  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }

    const unsubscribe = listenForNotifications(user.uid, (newNotifications) => {
      // Detect newly arrived notifications to show slide-down toast
      const prevIds = new Set(prevNotificationsRef.current.map((n) => n.id));
      const brandNew = newNotifications.filter((n) => !prevIds.has(n.id));

      brandNew.forEach((notif) => {
        const currentSelectedUser = selectedUserRef.current;
        const isInSameChat =
          currentSelectedUser && notif.senderUid === currentSelectedUser.uid;

        // If not in the same chat, show top slide-down Toast
        if (!isInSameChat) {
          setToasts((prev) => {
            if (prev.some((t) => t.id === notif.id)) return prev;
            return [...prev, notif];
          });
        }
      });

      prevNotificationsRef.current = newNotifications;
      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleToastClick = useCallback((notification) => {
    setSelectedUser({
      uid: notification.senderUid,
      fullName: notification.senderName,
      image: notification.senderImage,
      username: notification.senderUsername,
      email: "",
    });
    setActiveTab("chats");

    // Mark as read
    markNotificationsAsRead([notification]);
    if (notification.chatId) {
      markMessagesAsRead(
        notification.chatId,
        auth?.currentUser?.email,
        auth?.currentUser?.uid
      );
    }
  }, []);

  const handleSelectFromNotification = (chatUser) => {
    setSelectedUser(chatUser);
    setActiveTab("chats");
  };

  const handleSetSelectedUser = (u) => {
    setSelectedUser(u);
    setActiveTab("chats");
  };

  const handleBackFromChat = () => {
    setSelectedUser(null);
  };

  const isMobileChatOpen = activeTab === "chats" && !!selectedUser;

  return (
    <div className="h-[100dvh] lg:h-screen w-full overflow-hidden">
      {user ? (
        <>
          {/* Toast notifications that slide down from the top */}
          <ToastContainer
            toasts={toasts}
            removeToast={removeToast}
            onClickNotification={handleToastClick}
          />

          {/* Search Modal for mobile dropdown trigger */}
          <SearchModal
            startChat={handleSetSelectedUser}
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
          />

          <div className="flex lg:flex-row flex-col items-start w-full h-full overflow-hidden">
            <Navlinks
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              notificationCount={notifications.length}
              unreadMessagesCount={unreadMessagesCount}
              onOpenSearch={() => setIsSearchOpen(true)}
              hideMobileBars={isMobileChatOpen}
            />

            {/* Main Content Area */}
            <div
              className={`flex w-full overflow-hidden ${
                isMobileChatOpen
                  ? "mt-0 mb-0 lg:mt-0 lg:mb-0 h-[100dvh] lg:h-screen"
                  : "mt-[56px] mb-[60px] lg:mt-0 lg:mb-0 h-[calc(100dvh-116px)] lg:h-screen"
              }`}
            >
              {activeTab === "chats" && (
                <>
                  {/* Desktop: show both chatlist and chatbox side-by-side */}
                  <div className="hidden lg:flex w-full h-full">
                    <Chatlist
                      setSelectedUser={handleSetSelectedUser}
                      onTotalUnreadChange={setUnreadMessagesCount}
                    />
                    <Chatbox selectedUser={selectedUser} />
                  </div>

                  {/* Mobile: show either chatlist or chatbox */}
                  <div className="lg:hidden flex w-full h-full">
                    {selectedUser ? (
                      <Chatbox
                        selectedUser={selectedUser}
                        onBack={handleBackFromChat}
                      />
                    ) : (
                      <Chatlist
                        setSelectedUser={handleSetSelectedUser}
                        onTotalUnreadChange={setUnreadMessagesCount}
                      />
                    )}
                  </div>
                </>
              )}

              {activeTab === "profile" && (
                <ProfilePage onBack={() => setActiveTab("chats")} />
              )}

              {activeTab === "notifications" && (
                <NotificationsPage
                  onSelectChat={handleSelectFromNotification}
                  notifications={notifications}
                  setNotifications={setNotifications}
                />
              )}
            </div>
          </div>
        </>
      ) : (
        <div>
          {isLogin ? (
            <Login isLogin={isLogin} setIsLogin={setIsLogin} />
          ) : (
            <Register isLogin={isLogin} setIsLogin={setIsLogin} />
          )}
        </div>
      )}
    </div>
  );
};

export default App;
