import defaultAvatar from "../../public/assets/default.jpg";
import { FaXmark } from "react-icons/fa6";
import { RiChatAiLine } from "react-icons/ri";

const AvatarPreviewModal = ({ user, onClose, onStartChat }) => {
  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
          title="Close"
        >
          <FaXmark size={18} />
        </button>

        {/* Large Avatar Image */}
        <div className="relative mt-2">
          <img
            src={user.image || defaultAvatar}
            alt={user.fullName || "User"}
            className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-cover shadow-md border-4 border-[#01AA85]"
          />
        </div>

        {/* User Info */}
        <div className="mt-4 text-center w-full">
          <h3 className="text-xl font-bold text-[#2A3D39]">
            {user.fullName || "Chat User"}
          </h3>
          <p className="text-sm text-gray-500 font-medium">
            @{user.username || "username"}
          </p>

          {/* Bio - only shown if user actually wrote a bio */}
          {user.bio && user.bio.trim() ? (
            <div className="mt-4 p-3 bg-[#e5f6f3] rounded-xl text-center border border-[#01aa8533] max-h-32 overflow-auto custom-scrollbar">
              <p className="text-[11px] uppercase tracking-wider text-teal-700 font-bold mb-1">
                About
              </p>
              <p className="text-sm text-[#2A3D39] whitespace-pre-wrap break-words">
                {user.bio}
              </p>
            </div>
          ) : null}
        </div>

        {/* Action Button: Start Chat (if callback provided) */}
        {onStartChat && (
          <button
            onClick={() => {
              onStartChat(user);
              onClose();
            }}
            className="mt-5 w-full bg-[#01AA85] hover:bg-[#019b79] text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <RiChatAiLine size={18} />
            <span>Open Chat</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AvatarPreviewModal;

