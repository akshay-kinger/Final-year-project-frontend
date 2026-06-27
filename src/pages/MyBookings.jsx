import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaCalendarAlt,
  FaMoneyBillWave,
  FaHome,
  FaSpinner,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaBed,
  FaUsers,
  FaSyncAlt,
  FaWrench,
  FaStar,
  FaChevronRight,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaTools,
  FaFileContract,
  FaCreditCard,
  FaBan,
} from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { API_ROUTES } from "../api/apiRoutes";
import ReviewForm from "../pages/reviews/ReviewForm";
import { getPropertyReviews } from "../service/reviews";
import AgreementModal from "../pages/AgreementModal";

const STORAGE_KEY = "myBookings_state";
const POLL_INTERVAL = 30000;

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    icon: FaClock,
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  approved: {
    label: "Approved",
    icon: FaCheckCircle,
    dot: "bg-emerald-400",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  confirmed: {
    label: "Confirmed",
    icon: FaCheckCircle,
    dot: "bg-blue-400",
    pill: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  rejected: {
    label: "Rejected",
    icon: FaTimesCircle,
    dot: "bg-red-400",
    pill: "bg-red-50 text-red-600 border border-red-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: FaTimesCircle,
    dot: "bg-gray-400",
    pill: "bg-gray-100 text-gray-500 border border-gray-200",
  },
  expired: {
    label: "Expired",
    icon: FaExclamationTriangle,
    dot: "bg-orange-400",
    pill: "bg-orange-50 text-orange-700 border border-orange-200",
  },
  held: {
    label: "Payment Pending",
    icon: FaClock,
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-700 border border-amber-200",
  },
};

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const isOngoing = (b) => {
  if (b.status !== "confirmed") return false;
  const now = new Date();
  return now >= new Date(b.checkInDate) && now <= new Date(b.checkOutDate);
};

const stayProgress = (b) => {
  const now = new Date();
  const start = new Date(b.checkInDate);
  const end = new Date(b.checkOutDate);
  const total = Math.ceil((end - start) / 86400000);
  const done = Math.ceil((now - start) / 86400000);
  return { done: Math.max(0, Math.min(done, total)), total };
};

const saveUIState = (tab, scrollY) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ tab, scrollY }));
  } catch {}
};
const loadUIState = () => {
  try {
    const s = sessionStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : { tab: "all", scrollY: 0 };
  } catch {
    return { tab: "all", scrollY: 0 };
  }
};

// ── EmptyState ────────────────────────────────────────────────────────────────
const EmptyState = ({ navigate }) => (
  <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-5">
      <FaHome className="text-primary text-3xl" />
    </div>
    <h2 className="text-xl font-black text-gray-900 mb-2">No bookings yet</h2>
    <p className="text-gray-400 text-sm max-w-xs mb-8 leading-relaxed">
      Find a place to stay and submit your first booking request.
    </p>
    <button
      onClick={() => navigate("/homepage")}
      className="px-8 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/25"
    >
      Browse Properties
    </button>
  </div>
);

// ── StatusBadge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ── StayProgressBar ───────────────────────────────────────────────────────────
const StayProgressBar = ({ booking }) => {
  const { done, total } = stayProgress(booking);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="space-y-2 px-4 pb-1">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-gray-400">Stay progress</span>
        <span className="text-blue-600">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400">
        Day {done} of {total} · {100 - pct}% remaining
      </p>
    </div>
  );
};

// ── MaintenanceButton ─────────────────────────────────────────────────────────
const MaintenanceButton = ({ booking, navigate }) => {
  if (!["confirmed"].includes(booking.status)) return null;
  return (
    <button
      onClick={() =>
        navigate("/maintenance/my-requests", {
          state: {
            propertyId: booking.property?._id || booking.property,
            bookingId: booking._id,
            propertyTitle: booking.property?.title,
          },
        })
      }
      className="flex-1 flex flex-col items-center justify-center gap-2 px-3 py-4 bg-orange-50 border border-orange-100 rounded-2xl hover:bg-orange-100 active:scale-[0.97] transition-all group"
    >
      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
        <FaWrench className="text-orange-500" size={14} />
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-orange-600">Report Issue</p>
        <p className="text-[10px] text-orange-400 mt-0.5">AC · Water · Wi-Fi</p>
      </div>
    </button>
  );
};

// ── ViewMaintenanceButton ─────────────────────────────────────────────────────
const ViewMaintenanceButton = ({ booking, navigate }) => {
  if (!["confirmed", "approved"].includes(booking.status)) return null;
  return (
    <button
      onClick={() =>
        navigate("/maintenance/my-requests", {
          state: {
            propertyId: booking.property?._id || booking.property,
            bookingId: booking._id,
          },
        })
      }
      className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
    >
      <FaTools size={10} />
      View my maintenance requests
      <FaChevronRight size={9} />
    </button>
  );
};

// ── ReviewSection ─────────────────────────────────────────────────────────────
const ReviewSection = ({ booking, reviewSubmitted, onReviewSubmitted }) => {
  const [expanded, setExpanded] = useState(false);
  const ongoing = isOngoing(booking);

  if (reviewSubmitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-3 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <FaCheckCircle className="text-emerald-500" size={14} />
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-emerald-700">Reviewed</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">Thank you!</p>
        </div>
      </div>
    );
  }

  if (ongoing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-3 py-4 bg-gray-50 border border-gray-100 rounded-2xl opacity-60">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <FaStar className="text-gray-300" size={14} />
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-gray-400">Review</p>
          <p className="text-[10px] text-gray-400 mt-0.5">After stay ends</p>
        </div>
      </div>
    );
  }

  if (expanded) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-amber-700">Your Review</p>
          <button
            onClick={() => setExpanded(false)}
            className="text-[10px] text-amber-400 hover:text-amber-600 font-semibold"
          >
            Collapse
          </button>
        </div>
        <ReviewForm
          bookingId={booking._id}
          onSuccess={() => {
            onReviewSubmitted(booking._id);
            setExpanded(false);
          }}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setExpanded(true)}
      className="flex-1 flex flex-col items-center justify-center gap-2 px-3 py-4 bg-amber-50 border border-amber-100 rounded-2xl hover:bg-amber-100 active:scale-[0.97] transition-all group"
    >
      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
        <FaStar className="text-amber-500" size={14} />
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-amber-700">Write Review</p>
        <p className="text-[10px] text-amber-400 mt-0.5">Rate your stay</p>
      </div>
    </button>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────
const StatCard = ({ value, label, color }) => (
  <div className="flex-1 bg-white rounded-2xl px-4 py-3 text-center border border-gray-100 shadow-sm">
    <p className={`text-2xl font-black ${color}`}>{value}</p>
    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
      {label}
    </p>
  </div>
);

// ── BookingCard ───────────────────────────────────────────────────────────────
// FIX: Added agreement prop and onSignAgreement handler.
// The approved flow now strictly follows: Sign Agreement → Owner Countersigns → Pay.
// Payment is only unlocked once BOTH parties have signed (agreement.status === "completed").
const BookingCard = ({
  booking,
  agreement,
  onCancel,
  onUpdate,
  onPay,
  onSignAgreement,
  isNew,
  reviewSubmitted,
  onReviewSubmitted,
  navigate,
}) => {
  const property = booking.property || {};
  const status = booking.status || "pending";
  const ongoing = isOngoing(booking);
  const isRoommate = booking.roommateApplication?.isRoommateRequest;
  const isApproved = status === "approved";
  const isConfirmed = status === "confirmed";
  const isHeld = status === "held";

  // ── Agreement signature state ─────────────────────────────────────────────
  // agreement can be:
  //   undefined  → not yet fetched
  //   null       → fetch failed
  //   object     → loaded
  const tenantSigned = agreement?.tenantSigned ?? false;
  const ownerSigned = agreement?.ownerSigned ?? false;
  const fullySigned = tenantSigned && ownerSigned;

  return (
    <div
      className={`bg-white rounded-3xl overflow-hidden border transition-all duration-300 ${
        ongoing
          ? "border-blue-300 shadow-lg shadow-blue-100"
          : isNew
            ? "border-primary/30 shadow-md"
            : "border-gray-100 shadow-sm"
      }`}
    >
      {/* ── Ongoing ribbon ── */}
      {ongoing && (
        <div className="bg-blue-500 px-5 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
          <span className="text-white text-xs font-bold">
            Live stay · Day {stayProgress(booking).done} of{" "}
            {stayProgress(booking).total}
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100">
            {isRoommate ? (
              <FaUsers className="text-gray-400" size={14} />
            ) : (
              <FaBed className="text-gray-400" size={14} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
              {isRoommate ? "Roommate" : "Booking"}
            </p>
            <h3 className="text-gray-900 font-black text-base leading-tight truncate">
              {property.title || "Property"}
            </h3>
            {property.city && (
              <div className="flex items-center gap-1 mt-0.5">
                <FaMapMarkerAlt className="text-gray-300" size={9} />
                <p className="text-gray-400 text-xs">{property.city}</p>
              </div>
            )}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* ── Dates + Amount row ── */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Check-in", val: fmt(booking.checkInDate) },
            { label: "Check-out", val: fmt(booking.checkOutDate) },
          ].map(({ label, val }) => (
            <div
              key={label}
              className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100"
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                {label}
              </p>
              <p className="text-gray-800 font-bold text-xs">{val}</p>
            </div>
          ))}
          <div className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              Total
            </p>
            <p className="text-gray-800 font-bold text-xs">
              Rs{Math.round((booking.totalAmount || 0) / 1000)}k
            </p>
          </div>
        </div>
      </div>

      {/* ── Progress bar (ongoing) ── */}
      {ongoing && <StayProgressBar booking={booking} />}

      {/* ── Roommate message ── */}
      {isRoommate && booking.roommateApplication?.message && (
        <div className="mx-4 mb-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
          <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-1">
            Your message
          </p>
          <p className="text-sm text-blue-800 leading-relaxed">
            {booking.roommateApplication.message}
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STATUS-SPECIFIC ACTIONS
          
          APPROVED flow (strict gate):
            Step 1 → Tenant signs agreement
            Step 2 → Waiting for owner countersign
            Step 3 → Both signed → Pay button unlocked
          ══════════════════════════════════════════════════════════════════════ */}

      {/* ── APPROVED: agreement-gated payment ─────────────────────────────── */}
      {isApproved && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
            <FaCheckCircle
              className="text-emerald-500 mt-0.5 shrink-0"
              size={13}
            />
            <p className="text-xs text-emerald-700 leading-relaxed">
              <span className="font-bold">Approved!</span>{" "}
              {fullySigned
                ? "Both parties have signed. You can now proceed to payment."
                : "Sign the rental agreement to proceed to payment."}
            </p>
          </div>

          {/* Agreement not yet fetched */}
          {agreement === undefined && (
            <div className="w-full py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-400 font-semibold text-center flex items-center justify-center gap-2">
              <FaSpinner className="animate-spin" size={11} />
              Loading agreement…
            </div>
          )}

          {/* Agreement fetch failed */}
          {agreement === null && (
            <div className="w-full py-3 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-500 font-semibold text-center">
              Agreement not ready yet — please refresh in a moment.
            </div>
          )}

          {/* Agreement loaded */}
          {agreement && (
            <>
              {/* Step 1: Tenant hasn't signed yet */}
              {!tenantSigned && (
                <button
                  onClick={() => onSignAgreement(booking._id, agreement)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-dark transition-all active:scale-95 shadow-md shadow-primary/20"
                >
                  <FaFileContract size={14} />
                  Review & Sign Agreement
                </button>
              )}

              {/* Step 2: Tenant signed, waiting on owner */}
              {tenantSigned && !ownerSigned && (
                <div className="w-full py-3 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-700 font-semibold text-center flex items-center justify-center gap-2">
                  <FaClock size={13} />
                  Waiting for owner to countersign
                </div>
              )}

              {/* Step 3: Both signed — payment unlocked */}
              {fullySigned && (
                <button
                  onClick={() => onPay(booking)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-100"
                >
                  <FaCreditCard size={14} />
                  Pay Now — ₨ {(booking.totalAmount || 0).toLocaleString()}
                </button>
              )}

              {/* Signature status mini-pills */}
              <div className="flex gap-2 pt-1">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    tenantSigned
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-400 border-gray-200"
                  }`}
                >
                  {tenantSigned ? "✓" : "○"} You signed
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    ownerSigned
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-400 border-gray-200"
                  }`}
                >
                  {ownerSigned ? "✓" : "○"} Owner signed
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── HELD: payment intent created, window open ──────────────────────── */}
      {isHeld && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
            <FaClock className="text-amber-500 mt-0.5 shrink-0" size={12} />
            <p className="text-xs text-amber-700 leading-relaxed">
              <span className="font-bold">Payment window is open.</span>{" "}
              Complete payment within 30 minutes or your slot will be released.
            </p>
          </div>
          <button
            onClick={() => onPay(booking)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 text-white rounded-2xl font-bold text-sm hover:bg-amber-600 transition-all active:scale-95"
          >
            <FaCreditCard size={14} />
            Complete Payment
          </button>
        </div>
      )}

      {/* ── CONFIRMED — two-column action grid ────────────────────────────── */}
      {isConfirmed && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex gap-3">
            <MaintenanceButton booking={booking} navigate={navigate} />
            <ReviewSection
              booking={booking}
              reviewSubmitted={reviewSubmitted}
              onReviewSubmitted={onReviewSubmitted}
            />
          </div>
        </div>
      )}

      {/* ── PENDING ───────────────────────────────────────────────────────── */}
      {status === "pending" && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
            <FaClock className="text-amber-500 mt-0.5 shrink-0" size={12} />
            <p className="text-xs text-amber-700 leading-relaxed">
              Waiting for the owner to respond. You can edit dates or cancel
              while pending.
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => onUpdate(booking)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all active:scale-95"
            >
              <FaEdit size={12} /> Edit
            </button>
            <button
              onClick={() => onCancel(booking._id)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 border border-red-100 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all active:scale-95"
            >
              <FaTimesCircle size={12} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── REJECTED ──────────────────────────────────────────────────────── */}
      {status === "rejected" && (
        <div className="px-4 pb-4">
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
            <FaTimesCircle className="text-red-400 mt-0.5 shrink-0" size={13} />
            <p className="text-xs text-red-600 leading-relaxed">
              Your request was declined by the owner. Try browsing other
              properties.
            </p>
          </div>
        </div>
      )}

      {/* ── CANCELLED ─────────────────────────────────────────────────────── */}
      {status === "cancelled" && (
        <div className="px-4 pb-4">
          <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3">
            <FaTimesCircle
              className="text-gray-400 mt-0.5 shrink-0"
              size={13}
            />
            <p className="text-xs text-gray-500">This booking was cancelled.</p>
          </div>
        </div>
      )}

      {/* ── EXPIRED ───────────────────────────────────────────────────────── */}
      {status === "expired" && (
        <div className="px-4 pb-4">
          <div className="flex items-start gap-2.5 bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3">
            <FaBan className="text-gray-400 mt-0.5 shrink-0" size={13} />
            <p className="text-xs text-gray-500">
              Payment window expired. Please contact the owner to rebook.
            </p>
          </div>
        </div>
      )}

      {/* ── Footer — maintenance link ── */}
      {(isConfirmed || isApproved) && (
        <div className="px-4 pb-4 flex items-center justify-start border-t border-gray-50 pt-3">
          <ViewMaintenanceButton booking={booking} navigate={navigate} />
        </div>
      )}
    </div>
  );
};

// ── CancelModal ───────────────────────────────────────────────────────────────
const CancelModal = ({ onConfirm, onClose, loading }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5">
      <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
        <FaExclamationTriangle className="text-red-500 text-xl" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-black text-gray-900 mb-1">
          Cancel this booking?
        </h3>
        <p className="text-sm text-gray-400">This action cannot be undone.</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
        >
          Keep It
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-3.5 bg-red-500 text-white rounded-2xl font-bold text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <FaSpinner className="animate-spin" size={13} />
          ) : (
            <FaTrash size={13} />
          )}
          Yes, Cancel
        </button>
      </div>
    </div>
  </div>
);

// ── StatusChangeToast ─────────────────────────────────────────────────────────
const StatusChangeToast = ({ changes, onDismiss }) => {
  if (!changes.length) return null;
  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 max-w-sm mx-auto space-y-2 pointer-events-none">
      {changes.map((c, i) => (
        <div
          key={i}
          className="pointer-events-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-emerald-500/15 rounded-xl flex items-center justify-center shrink-0">
            <FaCheckCircle className="text-emerald-400" size={13} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">
              {c.propertyTitle}
            </p>
            <p className="text-xs text-gray-400">
              Status →{" "}
              <span className="font-bold text-gray-600 capitalize">
                {c.newStatus}
              </span>
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-300 hover:text-gray-500 transition-colors"
          >
            <FaTimesCircle size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

// ── SectionLabel ──────────────────────────────────────────────────────────────
const SectionLabel = ({ color, children }) => (
  <div className="flex items-center gap-2 mb-1">
    <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
      {children}
    </span>
  </div>
);

// ── Tab pill ──────────────────────────────────────────────────────────────────
const TabPill = ({ label, count, active, onClick }) => (
  <button
    onClick={onClick}
    className={`shrink-0 px-4 py-1.5 rounded-xl text-sm font-bold transition-all active:scale-95 border ${
      active
        ? "bg-primary text-white border-transparent shadow-sm shadow-primary/20"
        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
    }`}
  >
    {label}
    {count > 0 && (
      <span
        className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-black ${
          active ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

// ── MyBookings (main) ─────────────────────────────────────────────────────────
const MyBookings = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const savedState = loadUIState();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(savedState.tab);
  const [statusChanges, setStatusChanges] = useState([]);
  const [newBookingIds, setNewBookingIds] = useState(new Set());
  const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set());

  // FIX: Agreement map — keyed by bookingId.
  // undefined = not fetched yet | null = fetch failed | object = loaded
  const [agreements, setAgreements] = useState({});

  // FIX: Active agreement open in the sign modal
  const [signingAgreement, setSigningAgreement] = useState(null);

  const prevBookingsRef = useRef([]);
  const pollRef = useRef(null);

  // ── Fetch agreement for a single booking, with one retry on 404 ───────────
  const fetchAgreementForBooking = useCallback((bookingId, attempt = 0) => {
    axios
      .get(API_ROUTES.AGREEMENT.GET_BY_BOOKING(bookingId), {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((r) => {
        setAgreements((prev) => ({ ...prev, [bookingId]: r.data.data }));
      })
      .catch((err) => {
        if (attempt === 0 && err.response?.status === 404) {
          // Backend may be slightly delayed generating it — retry after 2s
          setTimeout(() => fetchAgreementForBooking(bookingId, 1), 2000);
        } else {
          // Mark as null so the card shows an informational message
          setAgreements((prev) => ({ ...prev, [bookingId]: null }));
        }
      });
  }, []);

  const fetchBookings = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await axios.get(API_ROUTES.BOOKING.MY_BOOKINGS, {
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (res.data.success) {
          const fresh = res.data.data || [];
          const prev = prevBookingsRef.current;

          // Detect status changes for toast notifications
          if (prev.length > 0) {
            const changes = [];
            fresh.forEach((b) => {
              const old = prev.find((p) => p._id === b._id);
              if (old && old.status !== b.status) {
                changes.push({
                  propertyTitle: b.property?.title || "Your booking",
                  oldStatus: old.status,
                  newStatus: b.status,
                });
              }
            });
            if (changes.length > 0) {
              setStatusChanges(changes);
              setNewBookingIds(
                new Set(
                  fresh
                    .filter((b) => {
                      const o = prev.find((p) => p._id === b._id);
                      return o && o.status !== b.status;
                    })
                    .map((b) => b._id),
                ),
              );
              setTimeout(() => setNewBookingIds(new Set()), 4000);
            }
          }

          prevBookingsRef.current = fresh;
          setBookings(fresh);

          // FIX: For every approved or held booking, fetch its agreement
          // only if we don't already have it (avoids redundant network calls).
          const needsAgreement = fresh.filter(
            (b) =>
              (b.status === "approved" || b.status === "held") &&
              !(b._id in agreements),
          );
          needsAgreement.forEach((b) => fetchAgreementForBooking(b._id));
        }
      } catch (err) {
        if (!silent)
          showAlert(
            err.response?.data?.message || "Failed to load bookings.",
            "error",
          );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showAlert, fetchAgreementForBooking],
  );

  useEffect(() => {
    fetchBookings(false);
  }, []);
  useEffect(() => {
    if (!loading && savedState.scrollY)
      setTimeout(() => window.scrollTo(0, savedState.scrollY), 100);
  }, [loading]);
  useEffect(() => {
    pollRef.current = setInterval(() => fetchBookings(true), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchBookings]);
  useEffect(() => {
    const fn = () => fetchBookings(true);
    window.addEventListener("focus", fn);
    return () => window.removeEventListener("focus", fn);
  }, [fetchBookings]);
  useEffect(() => {
    const fn = () => {
      if (document.visibilityState === "visible") fetchBookings(true);
    };
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
  }, [fetchBookings]);
  useEffect(() => {
    saveUIState(activeTab, window.scrollY);
  }, [activeTab]);
  useEffect(() => {
    const fn = () => saveUIState(activeTab, window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [activeTab]);

  useEffect(() => {
    const check = async () => {
      const confirmed = bookings.filter((b) => b.status === "confirmed");
      if (!confirmed.length) return;
      const ids = new Set();
      await Promise.all(
        confirmed.map(async (b) => {
          const propertyId = b.property?._id || b.property;
          if (!propertyId) return;
          try {
            const reviews = await getPropertyReviews(propertyId);
            if (
              reviews.some(
                (r) => r.booking === b._id || r.booking?._id === b._id,
              )
            )
              ids.add(b._id);
          } catch {}
        }),
      );
      setReviewedBookingIds(ids);
    };
    check();
  }, [bookings]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await axios.delete(API_ROUTES.BOOKING.DELETE(cancelTarget), {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      showAlert("Booking cancelled.", "success");
      setBookings((prev) => prev.filter((b) => b._id !== cancelTarget));
      prevBookingsRef.current = prevBookingsRef.current.filter(
        (b) => b._id !== cancelTarget,
      );
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to cancel.", "error");
    } finally {
      setCancelLoading(false);
      setCancelTarget(null);
    }
  };

  const NON_EDITABLE_STATUSES = [
    "confirmed",
    "held",
    "booked",
    "cancelled",
    "rejected",
    "approved",
    "expired",
  ];

  const handleUpdate = (booking) => {
    if (NON_EDITABLE_STATUSES.includes(booking.status)) {
      showAlert(
        `Bookings with status "${booking.status}" cannot be edited.`,
        "warning",
      );
      return;
    }
    saveUIState(activeTab, window.scrollY);
    navigate(`/update-booking/${booking._id}`, {
      state: { booking, property: booking.property },
    });
  };

  const handlePay = (booking) => {
    const p = booking.property || {};
    saveUIState(activeTab, window.scrollY);
    navigate(`/payment/${booking._id}`, {
      state: {
        propertyTitle: p.title,
        rent: p.rent,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        totalAmount: booking.totalAmount,
        days: booking.days,
      },
    });
  };

  // FIX: Open the AgreementModal for the tenant to sign
  const handleSignAgreement = (bookingId, agreement) => {
    setSigningAgreement({ bookingId, agreement });
  };

  // FIX: Called by AgreementModal after tenant successfully signs
  const handleAgreementSigned = (updatedAgreement) => {
    setAgreements((prev) => ({
      ...prev,
      [signingAgreement.bookingId]: updatedAgreement,
    }));
    setSigningAgreement(null);
  };

  const handleReviewSubmitted = (id) =>
    setReviewedBookingIds((prev) => {
      const n = new Set(prev);
      n.add(id);
      return n;
    });

  const TABS = [
    { key: "all", label: "All" },
    { key: "ongoing", label: "Ongoing" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "confirmed", label: "Confirmed" },
    { key: "rejected", label: "Rejected" },
  ];

  const tabCount = (key) => {
    if (key === "all") return bookings.length;
    if (key === "ongoing") return bookings.filter(isOngoing).length;
    return bookings.filter((b) => b.status === key).length;
  };

  const filtered = (() => {
    if (activeTab === "all") return bookings;
    if (activeTab === "ongoing") return bookings.filter(isOngoing);
    return bookings.filter((b) => b.status === activeTab);
  })();

  const ongoingList = activeTab === "all" ? filtered.filter(isOngoing) : [];
  const otherList =
    activeTab === "all" ? filtered.filter((b) => !isOngoing(b)) : filtered;

  const renderCard = (booking) => (
    <BookingCard
      key={booking._id}
      booking={booking}
      agreement={agreements[booking._id]}
      onCancel={(id) => setCancelTarget(id)}
      onUpdate={handleUpdate}
      onPay={handlePay}
      onSignAgreement={handleSignAgreement}
      isNew={newBookingIds.has(booking._id)}
      reviewSubmitted={reviewedBookingIds.has(booking._id)}
      onReviewSubmitted={handleReviewSubmitted}
      navigate={navigate}
    />
  );

  const ongoingCount = bookings.filter(isOngoing).length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter(
    (b) => b.status === "confirmed",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-600 shrink-0"
          >
            <FaArrowLeft size={13} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-900 leading-tight">
              My Bookings
            </h1>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">
                {bookings.length} total
                {ongoingCount > 0 && (
                  <span className="text-blue-500 font-semibold">
                    {" "}
                    · {ongoingCount} ongoing
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="text-amber-500 font-semibold">
                    {" "}
                    · {pendingCount} pending
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => fetchBookings(true)}
            disabled={refreshing}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-400 disabled:opacity-40"
          >
            <FaSyncAlt size={13} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <TabPill
                key={tab.key}
                label={tab.label}
                count={tabCount(tab.key)}
                active={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Summary stats ── */}
      {!loading && bookings.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mt-4">
          <div className="flex gap-3">
            <StatCard
              value={bookings.length}
              label="Total"
              color="text-gray-900"
            />
            <StatCard
              value={ongoingCount}
              label="Ongoing"
              color="text-blue-600"
            />
            <StatCard
              value={pendingCount}
              label="Pending"
              color="text-amber-500"
            />
            <StatCard
              value={confirmedCount}
              label="Confirmed"
              color="text-emerald-600"
            />
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <FaSpinner className="animate-spin text-primary text-xl" />
            </div>
            <p className="text-gray-400 text-sm">Loading your bookings…</p>
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState navigate={navigate} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-2">
              <FaBed className="text-gray-300 text-xl" />
            </div>
            <p className="text-gray-500 font-semibold text-sm">
              No {activeTab} bookings
            </p>
            <p className="text-gray-400 text-xs">Try a different filter</p>
          </div>
        ) : activeTab === "all" ? (
          <div className="space-y-4">
            {ongoingList.length > 0 && (
              <div className="space-y-3">
                <SectionLabel color="bg-blue-400">Ongoing Stay</SectionLabel>
                {ongoingList.map(renderCard)}
              </div>
            )}
            {otherList.length > 0 && (
              <div className="space-y-3">
                {ongoingList.length > 0 && (
                  <SectionLabel color="bg-zinc-600">
                    Other Bookings
                  </SectionLabel>
                )}
                {otherList.map(renderCard)}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">{filtered.map(renderCard)}</div>
        )}
      </div>

      {cancelTarget && (
        <CancelModal
          onConfirm={handleCancel}
          onClose={() => setCancelTarget(null)}
          loading={cancelLoading}
        />
      )}
      <StatusChangeToast
        changes={statusChanges}
        onDismiss={() => setStatusChanges([])}
      />

      {/* FIX: AgreementModal for tenant to sign — only shown when a sign action is triggered */}
      {signingAgreement && (
        <AgreementModal
          agreement={signingAgreement.agreement}
          mode="tenant"
          onClose={() => setSigningAgreement(null)}
          onSigned={handleAgreementSigned}
        />
      )}
    </div>
  );
};

export default MyBookings;
