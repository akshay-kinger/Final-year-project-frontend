import React from "react";
import {
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";

const CustomAlert = ({
  isOpen,
  onClose,
  message,
  type = "info",
  onConfirm,
}) => {
  if (!isOpen) return null;

  const types = {
    info: {
      icon: <FaInfoCircle className="text-blue-500 text-3xl" />,
      bgColor: "bg-blue-50",
      textColor: "text-blue-800",
      btnColor: "bg-blue-500",
    },
    success: {
      icon: <FaCheckCircle className="text-primary text-3xl" />,
      bgColor: "bg-green-50",
      textColor: "text-green-800",
      btnColor: "bg-primary",
    },
    warning: {
      icon: <FaExclamationTriangle className="text-yellow-500 text-3xl" />,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-800",
      btnColor: "bg-yellow-500",
    },
    error: {
      icon: <FaTimes className="text-red-500 text-3xl" />,
      bgColor: "bg-red-50",
      textColor: "text-red-800",
      btnColor: "bg-red-500",
    },
  };

  const currentType = types[type] || types.info;

  const handleConfirmAction = () => {
    if (onConfirm) onConfirm(); // Run the delete logic
    onClose(); // Close modal
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
        <div
          className={`p-6 flex flex-col items-center text-center ${currentType.bgColor}`}
        >
          <div className="mb-4">{currentType.icon}</div>
          <p className="text-gray-700 font-medium mb-6">{message}</p>

          <div className="flex gap-3 w-full">
            {/* If it's a confirmation modal, show two buttons */}
            {onConfirm ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`flex-1 px-4 py-2 rounded-xl text-white font-bold ${currentType.btnColor} hover:brightness-90`}
                >
                  Confirm
                </button>
              </>
            ) : (
              /* Regular alert button */
              <button
                onClick={onClose}
                className={`w-full text-white px-6 py-2 rounded-xl font-bold ${currentType.btnColor} hover:brightness-90`}
              >
                Okay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
