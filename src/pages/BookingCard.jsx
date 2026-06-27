/**
 * BookingCard.jsx  — drop this into your MyBookings list
 *
 * Renders the correct CTA for each booking status:
 *
 *   pending   → "Awaiting Owner Approval" (disabled)
 *   approved  → "Sign Agreement" → then "Proceed to Payment" (once both signed)
 *   held      → "Complete Payment" (30-min window open)
 *   confirmed → "Confirmed ✓"
 *   rejected  → "Rejected"
 *   expired   → "Expired"
 *
 * Props:
 *   booking     — booking object from GET /api/bookings/user
 *   agreement   — agreement object (may be null if not yet generated)
 *   onSign      — () => void   open AgreementModal for this booking
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaFileContract,
  FaCreditCard,
  FaUsers,
  FaBan,
} from "react-icons/fa";

const STATUS_PILL = {
  pending: {
    label: "Awaiting Approval",
    cls: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  approved: {
    label: "Approved",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
  },
  held: {
    label: "Payment Pending",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    cls: "bg-green-50 text-green-700 border-green-200",
  },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-600 border-red-200" },
  expired: {
    label: "Expired",
    cls: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

const BookingCard = ({ booking, agreement, onSign }) => {
  const navigate = useNavigate();
  const {
    status,
    property,
    totalAmount,
    days,
    checkInDate,
    checkOutDate,
    _id,
  } = booking;

  const isRoommateBooking = booking.roommateApplication?.isRoommateRequest;

  // Agreement signature state
  const tenantSigned = agreement?.tenantSigned ?? false;
  const ownerSigned = agreement?.ownerSigned ?? false;
  const fullySigned = tenantSigned && ownerSigned;

  const pill = STATUS_PILL[status] || STATUS_PILL.pending;

  const handlePayment = () => {
    navigate(`/payment/${_id}`, {
      state: {
        propertyTitle: property?.title,
        rent: property?.rent,
        checkInDate,
        checkOutDate,
        totalAmount,
        days,
      },
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card header */}
      <div className="p-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isRoommateBooking && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                <FaUsers size={9} /> Roommate
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold border px-2 py-0.5 rounded-full ${pill.cls}`}
            >
              {pill.label}
            </span>
          </div>
          <h3 className="font-bold text-gray-800 text-base truncate">
            {property?.title || "Property"}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {property?.area}, {property?.city}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-black text-gray-900">
            ₨ {totalAmount?.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">
            {days} day{days !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Dates */}
      <div className="px-6 pb-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
        <div>
          <span className="text-xs font-bold uppercase text-gray-400 block mb-0.5">
            Check-in
          </span>
          {checkInDate
            ? new Date(checkInDate).toLocaleDateString("en-PK", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </div>
        <div>
          <span className="text-xs font-bold uppercase text-gray-400 block mb-0.5">
            Check-out
          </span>
          {checkOutDate
            ? new Date(checkOutDate).toLocaleDateString("en-PK", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </div>
      </div>

      {/* CTA section */}
      <div className="px-6 pb-6 space-y-2">
        {/* ── PENDING: no action yet ─────────────────────────────────── */}
        {status === "pending" && (
          <div className="w-full py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-400 font-semibold text-center flex items-center justify-center gap-2">
            <FaClock size={13} /> Waiting for owner to respond
          </div>
        )}

        {/* ── APPROVED: sign agreement first, then pay ───────────────── */}
        {status === "approved" && (
          <>
            {/* Step 1: Sign (if not yet signed by tenant) */}
            {!tenantSigned && (
              <button
                onClick={onSign}
                className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <FaFileContract size={14} />
                Review & Sign Agreement
              </button>
            )}

            {/* Step 1 done, waiting on owner countersign */}
            {tenantSigned && !ownerSigned && (
              <div className="w-full py-3 bg-blue-50 border border-blue-100 rounded-2xl text-sm text-blue-700 font-semibold text-center flex items-center justify-center gap-2">
                <FaClock size={13} /> Waiting for owner countersignature
              </div>
            )}

            {/* Step 2: Both signed → unlock payment */}
            {fullySigned && (
              <button
                onClick={handlePayment}
                className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <FaCreditCard size={14} />
                Proceed to Payment
              </button>
            )}

            {/* Agreement signed status mini-pills */}
            <div className="flex gap-2 pt-1">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${tenantSigned ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-400 border-gray-200"}`}
              >
                {tenantSigned ? "✓" : "○"} You signed
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${ownerSigned ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-400 border-gray-200"}`}
              >
                {ownerSigned ? "✓" : "○"} Owner signed
              </span>
            </div>
          </>
        )}

        {/* ── HELD: payment intent exists, within 30-min window ─────── */}
        {status === "held" && (
          <button
            onClick={handlePayment}
            className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-bold text-sm hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <FaCreditCard size={14} />
            Complete Payment (window open)
          </button>
        )}

        {/* ── CONFIRMED ─────────────────────────────────────────────── */}
        {status === "confirmed" && (
          <div className="w-full py-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700 font-semibold text-center flex items-center justify-center gap-2">
            <FaCheckCircle size={13} /> Booking Confirmed
          </div>
        )}

        {/* ── REJECTED ──────────────────────────────────────────────── */}
        {status === "rejected" && (
          <div className="w-full py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-semibold text-center flex items-center justify-center gap-2">
            <FaTimesCircle size={13} /> Request Declined
          </div>
        )}

        {/* ── EXPIRED ───────────────────────────────────────────────── */}
        {status === "expired" && (
          <div className="w-full py-3 bg-gray-100 border border-gray-200 rounded-2xl text-sm text-gray-400 font-semibold text-center flex items-center justify-center gap-2">
            <FaBan size={13} /> Payment Window Expired
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCard;
