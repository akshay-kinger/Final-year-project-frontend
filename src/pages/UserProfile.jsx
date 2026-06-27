import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaShieldAlt,
  FaCalendarAlt,
  FaFileAlt,
} from "react-icons/fa";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";

const UserProfile = () => {
  const { showLoader, hideLoader } = useLoader();
  const { showAlert } = useAlert();
  const { logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      showLoader();
      try {
        const response = await axios.get(
          "http://localhost:4000/api/auth/get-profile",
          {
            headers: {
              authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        setProfile(response.data.data);
      } catch (error) {
        console.error("Profile fetch error:", error);
        showAlert(
          error.response?.data?.message || "Failed to load profile data.",
          "error",
        );
      } finally {
        hideLoader();
      }
    };

    fetchProfile();
  }, [showLoader, hideLoader, showAlert]);

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      showAlert("New passwords do not match.", "warning");
      return;
    }

    showLoader();
    try {
      const response = await axios.put(
        "http://localhost:4000/api/auth/change-password",
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
          confirmNewPassword: passwords.confirmNewPassword,
        },
        {
          headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      showAlert(
        response.data.message || "Password updated successfully.",
        "success",
      );
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Failed to update password.",
        "error",
      );
    } finally {
      hideLoader();
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-secondary mb-8">My Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Personal Info */}
          <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-sm h-fit">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <FaUser className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-secondary">
                {profile.name}
              </h2>
              <p className="text-sm text-gray-500 capitalize">
                {profile.userType || "User"}
              </p>
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-6">
              <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                <FaEnvelope className="text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm font-medium text-secondary truncate">
                    {profile.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                <FaPhone className="text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-secondary">
                    {profile.number}
                  </p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                <FaShieldAlt className="text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-400">Account Status</p>
                  <p
                    className={`text-sm font-medium ${
                      profile.blocked ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {profile.blocked ? "Blocked" : "Active"} /{" "}
                    {profile.approvedByAdmin ? "Approved" : "Pending"}
                  </p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                <FaCalendarAlt className="text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-400">Joined</p>
                  <p className="text-sm font-medium text-secondary">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400 mr-2">Gender:</p>
                <p className="text-sm font-medium text-secondary">
                  {profile.gender}
                </p>
              </div>
            </div>

            {/* CNIC Photos */}
            {/* CNIC Photos */}
            {profile.cnicPhotos && profile.cnicPhotos.length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                <h3 className="text-sm font-semibold text-gray-500 mb-2">
                  CNIC Photos
                </h3>
                <div className="flex gap-4 overflow-x-auto">
                  {profile.cnicPhotos.map((photo, index) => {
                    // Extract filename from your original path
                    const fileName = photo.split("/").pop();
                    return (
                      <img
                        key={index}
                        src={`http://localhost:4000/uploads/${fileName.split(/[\\/]/).pop()}`}
                        alt={`CNIC ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Security & Posts */}
          <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm space-y-8">
            <div className="flex items-center mb-6">
              <FaLock className="text-primary w-6 h-6 mr-3" />
              <h2 className="text-xl font-bold text-secondary">
                Security Settings
              </h2>
            </div>

            <form onSubmit={handleSubmitPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwords.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="newPassword"
                      value={passwords.newPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder="New password"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <FaLock className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="confirmNewPassword"
                      value={passwords.confirmNewPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-secondary text-white rounded-full font-bold hover:bg-black transition"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
