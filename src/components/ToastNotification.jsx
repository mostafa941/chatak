import { useEffect, useState } from "react";
import defaultAvatar from "../../public/assets/default.jpg";

const ToastNotification = ({ notification, onClose, onClickNotification }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  const handleClick = () => {
    onClickNotification(notification);
    handleClose();
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 bg-white rounded-xl shadow-2xl p-4 mb-3 cursor-pointer border border-gray-100 w-[340px] max-w-[90vw] transition-all duration-300 ease-out ${
        isVisible && !isLeaving
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0"
      }`}
      style={{ pointerEvents: "auto" }}
    >
      <img
        src={notification.senderImage || defaultAvatar}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        alt=""
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-[#2A3D39] text-sm truncate">
          {notification.senderName}
        </h4>
        <p className="text-gray-500 text-xs truncate">{notification.message}</p>
      </div>
      <span className="text-[10px] text-gray-400 flex-shrink-0">now</span>
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast, onClickNotification }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center pointer-events-none">
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          notification={toast}
          onClose={removeToast}
          onClickNotification={onClickNotification}
        />
      ))}
    </div>
  );
};

export default ToastContainer;

