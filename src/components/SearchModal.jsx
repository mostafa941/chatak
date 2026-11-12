import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { RiSearchLine } from "react-icons/ri";
import defaultAvatar from "../../public/assets/default.jpg";
import { searchUsers } from "../firebase/firebase";
import AvatarPreviewModal from "./AvatarPreviewModal";

const SearchModal = ({ startChat, isOpen, onClose, onOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewUser, setPreviewUser] = useState(null);

  const openModal = () => {
    if (onOpen) {
      onOpen();
    }
  };

  const closeModal = () => {
    if (onClose) {
      onClose();
    }
    setSearchTerm("");
    setUsers([]);
    setErrorMsg("");
  };

  const handleSearch = async () => {
    setErrorMsg("");

    if (!searchTerm.trim()) {
      setErrorMsg("Please enter a name or username to search");
      return;
    }

    setIsSearching(true);

    try {
      const foundUsers = await searchUsers(searchTerm);
      setUsers(foundUsers);

      if (foundUsers.length === 0) {
        setErrorMsg(`No users found matching "${searchTerm}"`);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("An error occurred while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const modalOpen = isOpen !== undefined ? isOpen : false;

  return (
    <div>
      {/* Avatar Preview Modal */}
      {previewUser && (
        <AvatarPreviewModal
          user={previewUser}
          onClose={() => setPreviewUser(null)}
          onStartChat={(u) => {
            startChat(u);
            closeModal();
          }}
        />
      )}

      {/* Only show the trigger button if onOpen is provided (desktop mode) */}
      {onOpen && !isOpen && (
        <button
          onClick={openModal}
          className="bg-[#D9F2ED] w-[35px] h-[35px] p-2 flex items-center justify-center rounded-lg hover:bg-[#c8eae3] transition-colors"
          title="Search users"
        >
          <RiSearchLine color="#01AA85" className="w-[18px] h-[18px]" />
        </button>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex justify-center items-center bg-[#00170cb7] backdrop-blur-xs p-4"
          onClick={closeModal}
        >
          <div
            className="relative p-0 w-full max-w-md max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-[#01AA85] w-full rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/20">
                <h3 className="text-lg font-bold text-white">Search Users</h3>
                <button
                  onClick={closeModal}
                  className="text-white hover:bg-white/20 rounded-full p-1.5 inline-flex justify-center items-center transition-colors"
                >
                  <FaXmark size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setErrorMsg("");
                      }}
                      onKeyDown={handleKeyDown}
                      type="text"
                      className="bg-white border-none text-gray-900 text-sm rounded-xl outline-none w-full p-3 shadow-inner"
                      placeholder="Search by name or @username..."
                      autoFocus
                    />
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="bg-[#004939] hover:bg-[#00382c] text-white px-4 py-2 rounded-xl disabled:opacity-60 transition-colors flex items-center justify-center flex-shrink-0"
                    >
                      {isSearching ? (
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : (
                        <FaSearch size={14} />
                      )}
                    </button>
                  </div>

                  {/* Inline Error Message */}
                  {errorMsg && (
                    <div className="flex items-center gap-2 bg-red-100 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>

                {/* Results List */}
                <div className="mt-4 max-h-[300px] overflow-auto custom-scrollbar space-y-2">
                  {users?.map((u) => (
                    <div
                      key={u.uid}
                      onClick={() => {
                        startChat(u);
                        closeModal();
                      }}
                      className="flex items-center gap-3 bg-white/10 hover:bg-white/20 p-2.5 rounded-xl cursor-pointer border border-white/10 transition-colors"
                    >
                      <img
                        src={u?.image || defaultAvatar}
                        className="h-10 w-10 rounded-full object-cover flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-white"
                        alt=""
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewUser(u);
                        }}
                        title="Click to view full picture and bio"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="p-0 font-semibold text-white text-[15px] truncate">
                          {u?.fullName || "User"}
                        </h4>
                        <p className="text-[12px] text-white/80 truncate">
                          @{u?.username || "username"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchModal;
