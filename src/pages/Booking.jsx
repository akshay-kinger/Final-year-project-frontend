import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaArrowLeft,
  FaSpinner,
  FaHome,
  FaInfoCircle,
  FaUsers,
  FaFileContract,
  FaExclamationTriangle,
  FaArrowRight,
} from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { API_ROUTES } from "../api/apiRoutes";

// ── Status-specific messaging for duplicate bookings ──────────────────────────
const DUPLICATE_MESSAGES = {
  pending: {
    title: "Request Already Sent",
    body: "You already have a pending request for this property. Wait for the owner to respond before submitting another.",
    action: "View My Bookings",
    color: "amber",
  },
  approved: {
    title: "Booking Approved",
    body: "Your booking has already been approved. Sign the rental agreement and complete payment to confirm your stay.",
    action: "Go to My Bookings",
    color: "blue",
  },
  held: {
    title: "Payment Window Open",
    body: "You have an open payment window for this property. Complete your payment before the window expires.",
    action: "Complete Payment",
    color: "amber",
  },
  confirmed: {
    title: "Already Booked",
    body: "You already have a confirmed booking for this property.",
    action: "View My Bookings",
    color: "green",
  },
};

const colorMap = {
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-500",
    text: "text-amber-800",
    btn: "bg-amber-500 hover:bg-amber-600",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-500",
    text: "text-blue-800",
    btn: "bg-blue-600 hover:bg-blue-700",
  },
  green: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "text-emerald-500",
    text: "text-emerald-800",
    btn: "bg-emerald-600 hover:bg-emerald-700",
  },
};

// ── DuplicateBookingBanner ────────────────────────────────────────────────────
const DuplicateBookingBanner = ({ existingStatus, onNavigate }) => {
  const info = DUPLICATE_MESSAGES[existingStatus] || DUPLICATE_MESSAGES.pending;
  const colors = colorMap[info.color] || colorMap.amber;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center space-y-6">
        <div
          className={`w-20 h-20 ${colors.bg} rounded-full flex items-center justify-center mx-auto border-2 ${colors.border}`}
        >
          <FaExclamationTriangle className={`${colors.icon} text-3xl`} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">
            {info.title}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">{info.body}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onNavigate}
            className={`w-full py-4 ${colors.btn} text-white rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2`}
          >
            {info.action}
            <FaArrowRight size={14} />
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Booking.jsx
// ─────────────────────────────────────────────────────────────────────────────
const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const {
    propertyId,
    propertyTitle,
    rent,
    checkInDate,
    checkOutDate,
    postedById,
    isRoommateRequest = false,
  } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [message, setMessage] = useState("");

  // FIX: Track duplicate booking state so we can render an informative screen
  // instead of just an error toast.
  const [duplicateState, setDuplicateState] = useState(null); // { status, bookingId }

  // ── Guard: no property in state ───────────────────────────────────────────
  useEffect(() => {
    if (!propertyId) {
      showAlert("Invalid booking session.", "error");
      navigate("/homepage");
    }
  }, [propertyId, navigate, showAlert]);

  // ── Guard: owner cannot book their own property ───────────────────────────
  useEffect(() => {
    const currentUserId = localStorage.getItem("userId");
    if (postedById && currentUserId && postedById === currentUserId) {
      showAlert("You cannot book your own property.", "error");
      navigate(-1);
    }
  }, [postedById, navigate, showAlert]);

  /* ── COST CALCULATION ──────────────────────────────────────────────────── */
  const calcDays = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const diff = new Date(checkOutDate) - new Date(checkInDate);
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1;
  };

  const days = calcDays();
  const dailyRate = rent / 30;
  const totalAmount = Math.round(dailyRate * days);

  /* ── SUBMIT ────────────────────────────────────────────────────────────── */
  const handleRequestBooking = async () => {
    setLoading(true);
    try {
      const payload = {
        propertyId,
        checkInDate,
        checkOutDate,
        totalAmount,
        days,
        isRoommateRequest,
        ...(isRoommateRequest && { message: message.trim() }),
      };

      const res = await axios.post(API_ROUTES.BOOKING.CREATE, payload, {
        headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (res.data.success) {
        setRequested(true);
        showAlert(
          isRoommateRequest
            ? "Roommate application sent! You'll be notified once the owner responds."
            : "Booking request sent! You'll be notified once the owner responds.",
          "success",
        );
      }
    } catch (err) {
      // FIX: 409 = duplicate active booking — render an informative screen
      // instead of a generic error toast.
      if (err.response?.status === 409) {
        setDuplicateState({
          status: err.response.data.existingStatus || "pending",
          bookingId: err.response.data.existingBookingId,
        });
      } else {
        const msg = err.response?.data?.message || "Failed to send request.";
        showAlert(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── DUPLICATE BOOKING SCREEN ─────────────────────────────────────────── */
  if (duplicateState) {
    return (
      <DuplicateBookingBanner
        existingStatus={duplicateState.status}
        onNavigate={() => navigate("/my-bookings")}
      />
    );
  }

  /* ── SUCCESS STATE ────────────────────────────────────────────────────── */
  if (requested) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <FaCheckCircle className="text-emerald-500 text-4xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              {isRoommateRequest ? "Application Sent!" : "Request Sent!"}
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Your{" "}
              {isRoommateRequest ? "roommate application" : "booking request"}{" "}
              for{" "}
              <span className="font-bold text-gray-700">{propertyTitle}</span>{" "}
              has been submitted. The owner will review it. Once approved,
              you'll need to{" "}
              <span className="font-semibold text-gray-700">
                sign the rental agreement
              </span>{" "}
              before proceeding to payment.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-left">
            <FaFileContract className="text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-700 space-y-1">
              <p>
                <strong>What happens next:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-blue-600">
                <li>Owner approves your request</li>
                <li>You sign the e-agreement</li>
                <li>Owner countersigns</li>
                <li>You complete payment</li>
              </ol>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate("/my-bookings")}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg hover:bg-primary-dark transition-all active:scale-95"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate("/homepage")}
              className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN PAGE ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans">
      {/* Sticky header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition text-gray-600"
        >
          <FaArrowLeft />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          {isRoommateRequest ? "Roommate Application" : "Request Booking"}
        </h1>
        {isRoommateRequest && (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full">
            <FaUsers size={10} /> Roommate
          </span>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
        {/* Property card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl">
                {isRoommateRequest ? (
                  <FaUsers className="text-white text-xl" />
                ) : (
                  <FaHome className="text-white text-xl" />
                )}
              </div>
              <div>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                  {isRoommateRequest ? "Roommate Application" : "Property"}
                </p>
                <h2 className="text-white font-bold text-lg leading-tight">
                  {propertyTitle}
                </h2>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <FaCalendarAlt size={13} className="text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Check-in
                  </span>
                </div>
                <p className="text-gray-800 font-bold text-sm">
                  {checkInDate
                    ? new Date(checkInDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <FaCalendarAlt size={13} className="text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Check-out
                  </span>
                </div>
                <p className="text-gray-800 font-bold text-sm">
                  {checkOutDate
                    ? new Date(checkOutDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Price breakdown */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">
                Price Breakdown
              </h3>
              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  Monthly Rent{isRoommateRequest ? " (per person)" : ""}
                </span>
                <span>₨ {rent?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 italic">
                <span>Daily Rate (Rent ÷ 30)</span>
                <span>₨ {Math.round(dailyRate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-900 font-medium">
                <span>
                  Subtotal (₨ {Math.round(dailyRate).toLocaleString()} × {days}{" "}
                  days)
                </span>
                <span>₨ {totalAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Service fee</span>
                <span className="font-semibold text-emerald-500">Free</span>
              </div>
              <hr className="border-dashed border-gray-200" />
              <div className="flex justify-between font-black text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span>Total Amount</span>
                <span className="text-xl">
                  ₨ {totalAmount?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Roommate message field */}
        {isRoommateRequest && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FaUsers className="text-primary" size={16} />
              Introduce Yourself (optional)
            </h3>
            <p className="text-sm text-gray-500">
              Share a bit about your lifestyle, work schedule, or any
              preferences. This helps the owner match you with the right
              roommates.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. I'm a grad student, early riser, non-smoker, work from home 3 days a week..."
              rows={4}
              maxLength={500}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-primary transition"
            />
            <p className="text-xs text-gray-400 text-right">
              {message.length}/500
            </p>
          </div>
        )}

        {/* Flow explanation notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <FaInfoCircle className="text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-bold mb-0.5">How it works</p>
            <p>
              After the owner approves your request, you'll sign a rental
              agreement. Payment is only available once both parties have
              signed.
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleRequestBooking}
          disabled={loading}
          className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" /> Sending...
            </>
          ) : (
            <>
              <FaCheckCircle />
              {isRoommateRequest ? "Send Application" : "Send Booking Request"}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Booking;
