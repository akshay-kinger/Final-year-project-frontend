import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaSpinner,
  FaInfoCircle,
} from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { API_ROUTES } from "../api/apiRoutes";

const UpdateBooking = () => {
  const { bookingId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // State is passed from MyBookings: { booking, property }
  const { booking, property } = state || {};

  const isRoommateRequest = booking?.roommateApplication?.isRoommateRequest;

  const [checkInDate, setCheckInDate] = useState(
    booking?.checkInDate
      ? new Date(booking.checkInDate).toISOString().split("T")[0]
      : "",
  );
  const [checkOutDate, setCheckOutDate] = useState(
    booking?.checkOutDate
      ? new Date(booking.checkOutDate).toISOString().split("T")[0]
      : "",
  );
  const [message, setMessage] = useState(
    booking?.roommateApplication?.message || "",
  );
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Guard
  if (!booking || !property) {
    navigate("/my-bookings");
    return null;
  }

  // Recalculate proportional amount from property rent
  const calcDays = () => {
    if (!checkInDate || !checkOutDate) return booking.days || 1;
    const diff = new Date(checkOutDate) - new Date(checkInDate);
    const d = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return d > 0 ? d : 1;
  };

  const days = calcDays();
  const dailyRate = (property.rent || 0) / 30;
  const totalAmount = Math.round(dailyRate * days);

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    if (!checkInDate || !checkOutDate) {
      showAlert("Please select both check-in and check-out dates.", "warning");
      return;
    }
    if (checkOutDate <= checkInDate) {
      showAlert("Check-out must be after check-in.", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = { checkInDate, checkOutDate, totalAmount, days };
      if (isRoommateRequest) payload.message = message;

      await axios.put(API_ROUTES.BOOKING.UPDATE(bookingId), payload, {
        headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setDone(true);
      showAlert("Booking updated successfully!", "success");
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to update booking.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <FaCheckCircle className="text-emerald-500 text-4xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              Booking Updated!
            </h2>
            <p className="text-gray-500 text-sm">
              Your changes for{" "}
              <span className="font-bold text-gray-700">{property.title}</span>{" "}
              have been saved.
            </p>
          </div>
          <button
            onClick={() => navigate("/my-bookings")}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg hover:bg-primary-dark transition-all active:scale-95"
          >
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition text-gray-600"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Update Booking</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
        {/* Property title */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-6 py-5">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
              Editing Booking For
            </p>
            <h2 className="text-white font-bold text-lg">{property.title}</h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                  <FaCalendarAlt size={11} className="text-primary" /> Check-in
                </label>
                <input
                  type="date"
                  min={today}
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-none focus:ring-2 focus:ring-primary cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                  <FaCalendarAlt size={11} className="text-primary" /> Check-out
                </label>
                <input
                  type="date"
                  min={checkInDate || today}
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-none focus:ring-2 focus:ring-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Price breakdown (auto-recalculated) */}
            <div className="bg-primary/5 rounded-2xl border border-primary/10 p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <FaMoneyBillWave className="text-primary" size={14} />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Updated Price Breakdown
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Daily Rate (Rent ÷ 30)</span>
                <span>₨ {Math.round(dailyRate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  ₨ {Math.round(dailyRate).toLocaleString()} × {days} days
                </span>
                <span className="font-semibold">
                  ₨ {totalAmount.toLocaleString()}
                </span>
              </div>
              <hr className="border-dashed border-primary/20" />
              <div className="flex justify-between font-black text-gray-900">
                <span>Total Amount</span>
                <span className="text-lg text-primary">
                  ₨ {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Roommate message (only for roommate requests) */}
            {isRoommateRequest && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">
                  Message to Owner (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Update your introduction or message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <FaInfoCircle className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-bold">Pending only.</span> Updates are only
            allowed while the owner hasn't yet responded to your request.
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" /> Saving Changes...
            </>
          ) : (
            <>
              <FaCheckCircle /> Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UpdateBooking;
