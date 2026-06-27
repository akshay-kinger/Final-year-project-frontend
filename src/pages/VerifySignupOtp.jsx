import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaKey, FaArrowLeft } from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { useLoader } from "../context/LoaderContext";

const VerifySignupOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
  const { showLoader, hideLoader } = useLoader();

  const email = location.state?.email;

  const [otp, setOtp] = useState("");

  if (!email) {
    navigate("/signup");
    return null;
  }

  // --- VERIFY OTP ---
  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      showAlert("OTP must be 6 digits.", "warning");
      return;
    }

    showLoader();
    try {
      const response = await axios.post(
        "http://localhost:4000/api/auth/verify-otp",
        {
          email,
          otp,
        },
      );

      showAlert(
        response.data.message || "Account verified successfully.",
        response.data.success ? "success" : "error",
      );

      if (response.data.success) {
        navigate("/login");
      }
    } catch (error) {
      console.error(error);
      showAlert(error.response?.data?.message || "Invalid OTP.", "error");
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl relative">
        {/* Back Button */}
        <button
          onClick={() => navigate("/signup")}
          className="absolute top-6 left-6 text-gray-400 hover:text-secondary transition"
        >
          <FaArrowLeft />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-secondary">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Code sent to <b>{email}</b>
          </p>
        </div>

        <form onSubmit={handleOtpSubmit} className="space-y-6">
          <div className="relative">
            <FaKey className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              required
              className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary text-white rounded-full font-bold hover:bg-primary-dark transition"
          >
            Verify Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifySignupOtp;
