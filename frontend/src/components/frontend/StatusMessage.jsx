import React, { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";

const styles = {
  success: {
    bg: "bg-green-50",
    border: "border-green-300",
    text: "text-green-800",
    icon: <FaCheckCircle className="text-green-600 text-xl" />,
    title: "Thank you!",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-800",
    icon: <FaTimesCircle className="text-red-600 text-xl" />,
    title: "Something went wrong",
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-800",
    icon: <FaExclamationTriangle className="text-yellow-600 text-xl" />,
    title: "Important",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-800",
    icon: <FaInfoCircle className="text-blue-600 text-xl" />,
    title: "Information",
  },
};

function StatusMessage({
  type = "success",
  title,
  message,
  details,
  onClose,
  duration = 2000,
}) {
  const config = styles[type] || styles.success;
  const [animate, setAnimate] = useState("enter");

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setAnimate("exit");
    }, duration);

    const removeTimer = setTimeout(() => {
      onClose?.();
    }, duration + 300);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onClose]);

  return (
    <div
      className={`
        fixed top-20 right-4 z-[100]
        rounded-xl border ${config.border} ${config.bg}
        p-5 shadow-lg
        transform transition-all duration-300 ease-in-out
        ${
          animate === "enter"
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-full opacity-0 scale-95"
        }
      `}
    >
      <div className="flex gap-4 items-start">
        {/* Icon */}
        <div className="mt-0.5">{config.icon}</div>

        {/* Content */}
        <div className="flex-1">
          <h4 className={`font-semibold ${config.text}`}>
            {title || config.title}
          </h4>

          {message && (
            <p className="mt-1 text-sm text-gray-700">{message}</p>
          )}

          {details && (
            <div className="mt-3 rounded-md bg-white/70 p-3 text-sm text-gray-700">
              {details}
            </div>
          )}
        </div>

        {/* Manual Close */}
        <button
          onClick={() => setAnimate("exit")}
          className="text-gray-400 hover:text-gray-600 text-lg"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default StatusMessage;
