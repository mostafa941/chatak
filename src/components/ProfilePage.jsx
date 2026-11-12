import { useState, useEffect } from "react";
import { auth, db, updateUserProfile } from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import defaultAvatar from "../../public/assets/default.jpg";
import { RiArrowLeftLine, RiCameraLine, RiSaveLine, RiEyeLine } from "react-icons/ri";
import { uploadProfileImage } from "../utlis/uploadImage";
import AvatarPreviewModal from "./AvatarPreviewModal";

const ProfilePage = ({ onBack }) => {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [previewUser, setPreviewUser] = useState(null);

  useEffect(() => {
    if (!auth?.currentUser?.uid) return;
    const userDocRef = doc(db, "users", auth?.currentUser?.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser(data);
        setFullName(data?.fullName || "");
        setBio(data?.bio || "");
      }
    });
    return unsubscribe;
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrorMsg("Please select a valid image file.");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const updateData = {
        fullName: fullName.trim(),
        bio: bio.trim(),
      };

      if (imageFile) {
        const imageUrl = await uploadProfileImage(imageFile, auth.currentUser.uid);
        if (imageUrl) {
          updateData.image = imageUrl;
        }
      }

      await updateUserProfile(auth.currentUser.uid, updateData);
      setSuccessMsg("Profile updated successfully!");
      setImageFile(null);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to update profile. Please try again.");
      setTimeout(() => setErrorMsg(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex flex-col items-center h-screen w-full bg-[#e5f6f3]">
      {/* Avatar Preview Modal */}
      {previewUser && (
        <AvatarPreviewModal
          user={previewUser}
          onClose={() => setPreviewUser(null)}
        />
      )}

      {/* Header */}
      <header className="w-full bg-white p-4 flex items-center gap-3 shadow-sm">
        <button
          onClick={onBack}
          className="text-[#01AA85] text-2xl hover:bg-[#D9F2ED] p-2 rounded-lg transition-colors"
        >
          <RiArrowLeftLine />
        </button>
        <h2 className="text-xl font-bold text-[#2A3D39]">Edit Profile</h2>
      </header>

      {/* Profile Content */}
      <div className="flex flex-col items-center w-full max-w-md px-6 py-8 overflow-auto custom-scrollbar">
        {/* Avatar */}
        <div className="relative mb-6">
          <img
            src={imagePreview || user?.image || defaultAvatar}
            className="w-28 h-28 rounded-full object-cover border-4 border-[#01AA85] shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
            alt="Profile"
            onClick={() =>
              setPreviewUser({
                ...user,
                image: imagePreview || user?.image,
                fullName,
                bio,
              })
            }
            title="Click to view full picture"
          />
          <label className="absolute bottom-0 right-0 bg-[#01AA85] p-2.5 rounded-full cursor-pointer hover:bg-[#019b79] transition-colors shadow-md">
            <RiCameraLine color="#fff" size={18} />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Username (read-only) */}
        <p className="text-gray-400 text-sm mb-6">
          @{user?.username || "username"}
        </p>

        {/* Form */}
        <div className="w-full space-y-4">
          <div>
            <label className="text-sm font-medium text-[#2A3D39] mb-1 block">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border border-green-200 w-full p-3 rounded-lg bg-white text-[#2A3D39] font-medium outline-none focus:border-[#01AA85] transition-colors"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#2A3D39] mb-1 block">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="border border-green-200 w-full p-3 rounded-lg bg-white text-[#2A3D39] font-medium outline-none focus:border-[#01AA85] transition-colors resize-none"
              placeholder="Tell us about yourself (bio)..."
            />
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              <svg
                className="w-5 h-5 flex-shrink-0"
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

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-[#01AA85] text-white font-bold w-full p-3 rounded-lg flex items-center gap-2 justify-center hover:bg-[#019b79] transition-colors disabled:opacity-60"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                Uploading & Saving...
              </span>
            ) : (
              <>
                Save Changes <RiSaveLine />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
