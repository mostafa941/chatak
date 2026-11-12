import { useState } from "react";
import { FaUserPlus } from "react-icons/fa";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";

const getFirebaseErrorMessage = (errorCode) => {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in.";
    case "auth/invalid-email":
      return "Invalid email address format.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/operation-not-allowed":
      return "Account creation is currently disabled.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    default:
      return "An error occurred. Please try again.";
  }
};

const Register = ({ isLogin, setIsLogin }) => {
  const [userData, setUserData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChangeUserData = (e) => {
    const { name, value } = e.target;
    setErrorMsg("");
    setUserData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleAuth = async () => {
    setErrorMsg("");

    if (!userData.fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!userData.email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    if (!userData.password.trim()) {
      setErrorMsg("Please enter a password.");
      return;
    }
    if (userData.password.length < 6) {
      setErrorMsg("Password should be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData?.email,
        userData?.password
      );
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);

      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        username: user.email?.split("@")[0],
        fullName: userData.fullName,
        image: "",
        bio: "",
      });
    } catch (error) {
      console.log(error);
      setErrorMsg(getFirebaseErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAuth();
    }
  };

  return (
    <section className="flex flex-col justify-center items-center h-[100vh] background-image">
      <div className="bg-white shadow-lg p-5 rounded-xl w-[20rem] flex flex-col justify-center items-center">
        <div className="mb-7">
          <h1 className="text-center text-[28px] font-bold">Sign Up</h1>
          <p className="text-center text-sm text-gray-400">
            Welcome, create an account to continue
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-3 py-2.5 rounded-lg text-sm w-full mb-4">
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

        <div className="w-full">
          <input
            type="text"
            name="fullName"
            onChange={handleChangeUserData}
            onKeyDown={handleKeyDown}
            className="border border-green-200 w-full p-2 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none placeholder:text-[#00493958]"
            placeholder="Full Name"
          />
          <input
            type="email"
            name="email"
            onChange={handleChangeUserData}
            onKeyDown={handleKeyDown}
            className="border border-green-200 w-full p-2 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none placeholder:text-[#00493958]"
            placeholder="Email"
          />
          <input
            type="password"
            name="password"
            onChange={handleChangeUserData}
            onKeyDown={handleKeyDown}
            className="border border-green-200 w-full p-2 rounded-md bg-[#01aa851d] text-[#004939f3] mb-3 font-medium outline-none placeholder:text-[#00493958]"
            placeholder="Password"
          />
        </div>
        <div className="w-full">
          <button
            disabled={isLoading}
            onClick={handleAuth}
            className="bg-[#01aa85] text-white font-bold w-full p-2 rounded-md flex items-center gap-2 justify-center"
          >
            {isLoading ? (
              <>Processing...</>
            ) : (
              <>
                Register <FaUserPlus />
              </>
            )}
          </button>
        </div>
        <div className="mt-5 text-center text-gray-400 text-sm">
          <button onClick={() => setIsLogin(!isLogin)}>
            Already have an account? Sign In
          </button>
        </div>
      </div>
    </section>
  );
};

export default Register;
