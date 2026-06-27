import React from "react";
import { FaSpinner } from "react-icons/fa";

const Loader = () => {
  return (
    // Changed from stark white (bg-white/80) to subtle dark overlay (bg-black/30)
    // Added 'animate-fade-in' for smoother entry
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[2px] transition-all duration-300 animate-fade-in">
      <div className="bg-white p-5 rounded-2xl shadow-2xl flex flex-col items-center">
        <FaSpinner className="h-10 w-10 text-primary animate-spin" />
        <p className="mt-3 text-sm font-semibold text-secondary">Loading...</p>
      </div>
    </div>
  );
};

// Add this small CSS snippet to index.css if 'animate-fade-in' doesn't work automatically:
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// .animate-fade-in { animation: fadeIn 0.2s ease-out; }

export default Loader;
