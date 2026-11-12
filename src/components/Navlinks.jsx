import { useState, useEffect, useRef } from "react";
import logo from "../../public/assets/logo.png";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import {
  RiArrowDownSFill,
  RiChatAiLine,
  RiFolderUserLine,
  RiNotificationLine,
  RiShutDownLine,
  RiSearchLine,
  RiLogoutBoxRLine,
  RiDownload2Line,
} from "react-icons/ri";

const Navlinks = ({
  activeTab,
  setActiveTab,
  notificationCount,
  unreadMessagesCount,
  onOpenSearch,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const dropdownRef = useRef(null);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setInstallPrompt(null);
      }
    } else {
      // In case browser handles it natively or on iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert("To install on iPhone/iPad: Tap the Share button in Safari, then select 'Add to Home Screen' 📲");
      } else {
        alert("To install Chatfrik: Click the Install icon in your browser address bar (top right) or browser menu 📲");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log(error);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* ===== Desktop Sidebar (lg and up) ===== */}
      <section className="hidden lg:flex sticky top-0 flex-col items-center justify-between h-[100vh] w-[150px] py-4 bg-[#01AA85]">
        <main className="flex flex-col items-center gap-10 w-full">
          <div className="flex items-center justify-center border-b border-b-1 border-[#ffffffb9] w-full p-4">
            <span className="flex items-center justify-center">
              <img
                src={logo}
                className="w-[56px] h-[52px] object-contain bg-white rounded-lg p-2 shadow-sm"
                alt="Chatfrik Logo"
              />
            </span>
          </div>

          <ul className="flex flex-col items-center gap-7">
            <li>
              <button
                onClick={() => setActiveTab("chats")}
                className={`text-[28px] cursor-pointer relative p-2 rounded-lg transition-colors ${
                  activeTab === "chats" ? "bg-[#ffffff30]" : "hover:bg-[#ffffff20]"
                }`}
                title="Chats"
              >
                <RiChatAiLine color="#fff" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("profile")}
                className={`text-[28px] cursor-pointer p-2 rounded-lg transition-colors ${
                  activeTab === "profile" ? "bg-[#ffffff30]" : "hover:bg-[#ffffff20]"
                }`}
                title="Profile"
              >
                <RiFolderUserLine color="#fff" />
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`text-[28px] cursor-pointer relative p-2 rounded-lg transition-colors ${
                  activeTab === "notifications" ? "bg-[#ffffff30]" : "hover:bg-[#ffffff20]"
                }`}
                title="Notifications"
              >
                <RiNotificationLine color="#fff" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                onClick={handleInstallClick}
                className="text-[28px] cursor-pointer p-2 rounded-lg hover:bg-[#ffffff30] transition-colors"
                title="Install Chatfrik App (PWA)"
              >
                <RiDownload2Line color="#fff" />
              </button>
            </li>
          </ul>
        </main>

        {/* Logout at bottom of sidebar */}
        <div className="w-full flex justify-center pb-2">
          <button
            onClick={handleLogout}
            className="text-[28px] cursor-pointer p-2 rounded-lg hover:bg-[#ffffff30] transition-colors"
            title="Sign Out"
          >
            <RiShutDownLine color="#fff" />
          </button>
        </div>
      </section>

      {/* ===== Mobile Top Nav (below lg) ===== */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[90] bg-[#01AA85] h-[56px] flex items-center justify-between px-4 shadow-sm">
        <img
          src={logo}
          className="w-[38px] h-[36px] object-contain bg-white rounded-lg p-1 shadow-xs"
          alt="Chatfrik Logo"
        />
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-[28px] cursor-pointer"
          >
            <RiArrowDownSFill color="#fff" />
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 w-52 overflow-hidden z-[100]">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  onOpenSearch();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-[#2A3D39] hover:bg-[#e5f6f3] transition-colors text-sm font-medium"
              >
                <RiSearchLine className="text-lg text-[#01AA85]" />
                Search Users
              </button>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  handleInstallClick();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-[#2A3D39] hover:bg-[#e5f6f3] transition-colors text-sm font-medium border-t border-gray-100"
              >
                <RiDownload2Line className="text-lg text-[#01AA85]" />
                Install App (PWA)
              </button>

              <div className="border-t border-gray-100" />
              <button
                onClick={() => {
                  setShowDropdown(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
              >
                <RiLogoutBoxRLine className="text-lg" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== Mobile Bottom Navigation Bar (below lg) ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] bg-white border-t border-gray-200 h-[60px] flex items-center justify-around px-2 shadow-lg">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors relative ${
            activeTab === "chats" ? "text-[#01AA85]" : "text-gray-400"
          }`}
        >
          <RiChatAiLine className="text-[22px]" />
          <span className="text-[10px] font-medium">Chats</span>
          {unreadMessagesCount > 0 && (
            <span className="absolute top-0 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors relative ${
            activeTab === "notifications" ? "text-[#01AA85]" : "text-gray-400"
          }`}
        >
          <RiNotificationLine className="text-[22px]" />
          <span className="text-[10px] font-medium">Alerts</span>
          {notificationCount > 0 && (
            <span className="absolute top-0 right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
            activeTab === "profile" ? "text-[#01AA85]" : "text-gray-400"
          }`}
        >
          <RiFolderUserLine className="text-[22px]" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </>
  );
};

export default Navlinks;
