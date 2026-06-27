import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEnvelope, FaLock, FaKey, FaArrowLeft } from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { useLoader } from "../context/LoaderContext";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { showLoader, hideLoader } = useLoader();
  const [step, setStep] = useState(1);
  const [email, setemail] = useState("");
  const [otp, setOtp] = useState("");
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // --- STEP 1: SEND email ---
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const response = await axios.post(
        "http://localhost:4000/api/password/request-reset",
        { email }
      );

      if (response.data.success) {
        showAlert("OTP sent to your email.", "success");
        setStep(2);
      } else {
        showAlert(response.data.message || "Email not found.", "error");
      }
    } catch (error) {
      console.error(error);
      showAlert("Error sending email.", "error");
    } finally {
      hideLoader();
    }
  };

  // --- STEP 2: VERIFY OTP ---
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const response = await axios.post(
        "http://localhost:4000/api/password/verify-otp",
        {
          email: email, // match backend field
          otp: otp, // match backend field
        }
      );

      // Display backend message directly
      if (response.data && response.data.message) {
        showAlert(
          response.data.message,
          response.data.success ? "success" : "error"
        );
      }

      // Move to next step only if success
      if (response.data.success) {
        setStep(3);
      }
    } catch (error) {
      console.error(error);
      showAlert(
        error.response?.data?.message || "Error verifying OTP.",
        "error"
      );
    } finally {
      hideLoader();
    }
  };

  // --- STEP 3: RESET PASSWORD ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Check passwords match
    if (passwords.newPassword !== passwords.confirmPassword) {
      showAlert("Passwords do not match.", "warning");
      return;
    }

    showLoader();
    try {
      const response = await axios.post(
        "http://localhost:4000/api/password/reset-password",
        {
          email: email, // match backend field
          newPassword: passwords.newPassword, // only send new password
        }
      );

      // Show backend message dynamically
      showAlert(
        response.data.message || "Password reset failed.",
        response.data.success ? "success" : "error"
      );

      // Redirect only if success
      if (response.data.success) {
        navigate("/login");
      }
    } catch (error) {
      console.error(error);
      showAlert(
        error.response?.data?.message || "Error resetting password.",
        "error"
      );
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl relative">
        {/* Back Button (only for step 1) */}
        {step === 1 && (
          <button
            onClick={() => navigate("/login")}
            className="absolute top-6 left-6 text-gray-400 hover:text-secondary transition"
          >
            <FaArrowLeft />
          </button>
        )}

        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-secondary">
            {step === 1 && "Forgot Password"}
            {step === 2 && "Enter Verification Code"}
            {step === 3 && "Reset Password"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 && "Enter your email to receive a reset code."}
            {step === 2 && `Code sent to ${email}`}
            {step === 3 && "Create a strong new password."}
          </p>
        </div>

        {/* --- FORM STEP 1: email --- */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="relative">
              <FaEnvelope className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                placeholder="email address"
                value={email}
                onChange={(e) => setemail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary text-white rounded-full font-bold hover:bg-primary-dark transition"
            >
              Send Code
            </button>
          </form>
        )}

        {/* --- FORM STEP 2: OTP --- */}
        {step === 2 && (
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
              Verify Code
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-sm text-gray-500 hover:text-secondary mt-4"
            >
              Change email
            </button>
          </form>
        )}

        {/* --- FORM STEP 3: NEW PASSWORD --- */}
        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="relative">
              <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                placeholder="New Password"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, newPassword: e.target.value })
                }
              />
            </div>
            <div className="relative">
              <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                placeholder="Confirm Password"
                value={passwords.confirmPassword}
                onChange={(e) =>
                  setPasswords({
                    ...passwords,
                    confirmPassword: e.target.value,
                  })
                }
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-secondary text-white rounded-full font-bold hover:bg-black transition"
            >
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
