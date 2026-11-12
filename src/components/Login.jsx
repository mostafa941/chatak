import { useState } from "react";
import { FaSignInAlt } from "react-icons/fa";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";

const getFirebaseErrorMessage = (errorCode) => {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Invalid email address format.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please check and try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    default:
      return "An error occurred. Please try again.";
  }
};

const Login = ({ isLogin, setIsLogin }) => {
  const [userData, setUserData] = useState({ email: "", password: "" });
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

    if (!userData.email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    if (!userData.password.trim()) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, userData?.email, userData?.password);
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
          <h1 className="text-center text-[28px] font-bold">Sign In</h1>
          <p className="text-center text-sm text-gray-400">
            Welcome back, login to continue
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
            {isLoading ? <>Processing...</> : <>Login <FaSignInAlt /></>}
          </button>
        </div>
        <div className="mt-5 text-center text-gray-400 text-sm">
          <button onClick={() => setIsLogin(!isLogin)}>
            Don't have an account yet? Sign Up
          </button>
        </div>
      </div>
    </section>
  );
};

export default Login;
