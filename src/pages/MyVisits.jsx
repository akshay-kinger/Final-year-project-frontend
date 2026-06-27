import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_ROUTES, IMAGE_BASE_URL } from "../api/apiRoutes";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../context/AlertContext";
import { useLoader } from "../context/LoaderContext"; // 1. Added useLoader import
import { FaSpinner } from "react-icons/fa";

const MyVisits = () => {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert(); // 2. Destructured showConfirm
  const { showLoader, hideLoader } = useLoader(); // 3. Destructured loader functions

  useEffect(() => {
    fetchVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVisits = async () => {
    try {
      showLoader(); // 4. Added global loader to fetch
      const res = await axios.get(API_ROUTES.VISITS.MY_VISITS, {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setVisits(res.data.data || []);
    } catch (err) {
      showAlert("Failed to load visits", "error");
    } finally {
      setLoading(false);
      hideLoader(); // 5. Hide global loader after fetch
    }
  };

  // ✅ CANCEL VISIT
  const cancelVisit = async (visitId) => {
    // 6. Added showConfirm before processing cancellation
    showConfirm(
      "Are you sure you want to cancel this visit request?",
      async () => {
        showLoader(); // 7. Added global loader for the async operation
        try {
          await axios.patch(
            API_ROUTES.VISITS.CANCEL(visitId),
            {},
            {
              headers: {
                authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );
          showAlert("Visit cancelled successfully", "success");

          // update UI instantly
          setVisits((prev) =>
            prev.map((v) =>
              v._id === visitId ? { ...v, status: "cancelled" } : v,
            ),
          );
        } catch (err) {
          showAlert("Failed to cancel visit", "error");
        } finally {
          hideLoader(); // 8. Hide global loader
        }
      },
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "cancelled":
        return "bg-gray-200 text-gray-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-3xl text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* HEADER */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-secondary">
          My Visit Requests
        </h1>
        <p className="text-gray-500 mt-2">
          Track and manage your property visit requests
        </p>
      </div>

      {visits.length === 0 ? (
        <p className="text-center text-gray-500">No visits found</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visits.map((v) => {
            const property = v.productId;

            return (
              <div
                key={v._id}
                className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
              >
                {/* IMAGE */}
                {property?.images?.length > 0 && (
                  <img
                    src={`${IMAGE_BASE_URL}/${property.images[0]
                      .split(/[\\/]/)
                      .pop()}`}
                    className="h-40 w-full object-cover"
                    alt="property"
                  />
                )}

                <div className="p-4">
                  <h2 className="font-bold text-lg text-secondary">
                    {property?.title || "Property"}
                  </h2>

                  <p className="text-gray-500 text-sm">
                    {property?.city} - {property?.area}
                  </p>

                  <p className="mt-3 text-sm text-gray-600">
                    📅 {new Date(v.date).toLocaleDateString()}
                  </p>

                  <p className="text-sm text-gray-600">
                    🕒 {v.startTime} - {v.endTime}
                  </p>

                  {/* STATUS */}
                  <span
                    className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(
                      v.status,
                    )}`}
                  >
                    {v.status}
                  </span>

                  {/* ACTIONS */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => navigate(`/property/${property?._id}`)}
                      className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold"
                    >
                      View
                    </button>

                    {/* ❌ CANCEL ONLY IF PENDING */}
                    {v.status === "pending" && (
                      <button
                        onClick={() => cancelVisit(v._id)}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyVisits;
