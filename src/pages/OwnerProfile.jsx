import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserCircle, FaArrowLeft, FaSpinner, FaStar } from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { API_ROUTES } from "../api/apiRoutes";
import ReviewList from "../pages/reviews/ReviewList";

const OwnerProfile = () => {
  const { ownerId } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const authHeader = { authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchOwner = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          API_ROUTES.AUTH.GET_PUBLIC_PROFILE(ownerId),
          { headers: authHeader },
        );
        setOwner(res.data.data);
      } catch (err) {
        console.error("Error fetching owner profile:", err);
        showAlert("Failed to load owner profile.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchOwner();
  }, [ownerId]);

  if (loading || !owner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <FaSpinner className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">
          Loading owner profile...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans">
      <div className="w-[95%] 2xl:max-w-[900px] mx-auto px-4 md:px-8 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-secondary transition"
        >
          <FaArrowLeft /> Back
        </button>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-5">
            <div className="bg-gray-100 p-3 rounded-full">
              <FaUserCircle className="w-16 h-16 text-gray-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary">
                {owner.name}
              </h1>
              <p className="text-sm text-gray-500 uppercase font-bold tracking-tight mt-1">
                {owner.userType === "owner" ? "Property Owner" : "Resident"}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <FaStar className="text-yellow-500" size={14} />
                <span className="font-semibold text-secondary">
                  {owner.ownerAvgRating?.toFixed(1) || "New"}
                </span>
                <span className="text-gray-400 text-sm">
                  ({owner.ownerReviewCount || 0} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <ReviewList type="owner" id={ownerId} />
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;
