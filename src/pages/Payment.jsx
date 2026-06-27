import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  FaLock,
  FaCheckCircle,
  FaArrowLeft,
  FaSpinner,
  FaClock,
  FaExclamationTriangle,
  FaCreditCard,
  FaHome,
  FaFileContract,
  FaTimesCircle,
  FaInfoCircle,
} from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { API_ROUTES } from "../api/apiRoutes";
import AgreementModal from "./AgreementModal";

// Stripe loaded via CDN in index.html:
// <script src="https://js.stripe.com/v3/"></script>

const STRIPE_PUBLIC_KEY =
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_YOUR_STRIPE_KEY";

const HOLD_MINUTES = 30;

const Payment = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const { propertyTitle, rent, checkInDate, checkOutDate, totalAmount, days } =
    location.state || {};

  // ── Agreement state ────────────────────────────────────────────────────────
  const [agreementLoading, setAgreementLoading] = useState(true);
  const [agreement, setAgreement] = useState(null);
  const [agreementError, setAgreementError] = useState(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  // ── Payment state ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [cardElement, setCardElement] = useState(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [error, setError] = useState(null);

  // ── 30-min timer — only starts after payment intent is created ─────────────
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = sessionStorage.getItem(`pay_hold_${bookingId}`);
    if (saved) {
      const elapsed = Math.floor((Date.now() - Number(saved)) / 1000);
      const remaining = Math.max(0, HOLD_MINUTES * 60 - elapsed);
      if (remaining > 0) return remaining;
    }
    return HOLD_MINUTES * 60;
  });
  const [expired, setExpired] = useState(false);

  // Resume timer if we already have a clientSecret (page refresh)
  useEffect(() => {
    const saved = sessionStorage.getItem(`pay_hold_${bookingId}`);
    if (saved) {
      const elapsed = Math.floor((Date.now() - Number(saved)) / 1000);
      if (elapsed < HOLD_MINUTES * 60) setTimerActive(true);
    }
  }, [bookingId]);

  // Countdown
  useEffect(() => {
    if (!timerActive || paymentDone || expired) return;
    if (timeLeft <= 0) {
      setExpired(true);
      return;
    }
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timerActive, timeLeft, paymentDone, expired]);

  // ── Load Stripe.js ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (window.Stripe) {
      setStripe(window.Stripe(STRIPE_PUBLIC_KEY));
    }
  }, []);

  // ── Fetch agreement for this booking ──────────────────────────────────────
  useEffect(() => {
    if (!bookingId) return;
    const fetchAgreement = async () => {
      setAgreementLoading(true);
      try {
        const res = await axios.get(
          API_ROUTES.AGREEMENT.GET_BY_BOOKING(bookingId),
          {
            headers: {
              authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        setAgreement(res.data.data || null);
      } catch (err) {
        if (err.response?.status === 404) {
          setAgreementError(
            "No agreement found for this booking. Please contact the owner.",
          );
        } else {
          setAgreementError("Failed to load agreement.");
        }
      } finally {
        setAgreementLoading(false);
      }
    };
    fetchAgreement();
  }, [bookingId]);

  // ── Agreement fully signed check ──────────────────────────────────────────
  const agreementFullySigned =
    agreement?.tenantSigned && agreement?.ownerSigned;

  // ── Create payment intent ─────────────────────────────────────────────────
  const handleCreateIntent = async () => {
    if (!agreementFullySigned) {
      showAlert(
        "Please complete signing the agreement before proceeding to payment.",
        "error",
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        API_ROUTES.PAYMENT.CREATE_INTENT,
        { bookingId },
        {
          headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      if (res.data.success) {
        setClientSecret(res.data.clientSecret);
        sessionStorage.setItem(`pay_hold_${bookingId}`, Date.now().toString());
        setTimerActive(true);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to initialize payment.";
      setError(msg);
      showAlert(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Mount Stripe card element once clientSecret is ready ──────────────────
  useEffect(() => {
    if (!clientSecret || !stripe || cardElement) return;
    const elementsInstance = stripe.elements();
    const card = elementsInstance.create("card", {
      style: {
        base: {
          color: "#1f2937",
          fontFamily: '"Inter", sans-serif',
          fontSize: "16px",
          "::placeholder": { color: "#9ca3af" },
        },
        invalid: { color: "#ef4444" },
      },
    });
    card.mount("#card-element");
    setCardElement(card);
  }, [clientSecret, stripe, cardElement]);

  // ── Confirm payment ───────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!stripe || !cardElement || !clientSecret) return;
    setLoading(true);
    setError(null);

    const { paymentIntent, error: stripeError } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    if (paymentIntent.status === "succeeded") {
      sessionStorage.removeItem(`pay_hold_${bookingId}`);
      setPaymentDone(true);
      showAlert("Payment successful! Booking confirmed.", "success");
    }
    setLoading(false);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const timerColor =
    timeLeft > 600
      ? "text-emerald-500"
      : timeLeft > 180
        ? "text-amber-500"
        : "text-rose-500";
  const timerBg =
    timeLeft > 600
      ? "bg-emerald-50 border-emerald-200"
      : timeLeft > 180
        ? "bg-amber-50 border-amber-200"
        : "bg-rose-50 border-rose-200";

  /* ── SUCCESS ─────────────────────────────────────────────────────────────── */
  if (paymentDone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <FaCheckCircle className="text-emerald-500 text-4xl" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              Booking Confirmed!
            </h2>
            <p className="text-gray-500">
              Payment successful for{" "}
              <span className="font-bold text-gray-700">{propertyTitle}</span>.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-bold">
                ₨ {totalAmount?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Check-in</span>
              <span className="font-bold">
                {checkInDate ? new Date(checkInDate).toLocaleDateString() : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Check-out</span>
              <span className="font-bold">
                {checkOutDate
                  ? new Date(checkOutDate).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/homepage")}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg hover:bg-primary-dark transition-all active:scale-95"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  /* ── EXPIRED ─────────────────────────────────────────────────────────────── */
  if (expired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-lg border border-rose-100 p-10 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto">
            <FaExclamationTriangle className="text-rose-500 text-4xl" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              Payment Window Expired
            </h2>
            <p className="text-gray-500">
              Your 30-minute payment window has expired. Please go to My
              Bookings to restart the payment process.
            </p>
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

  /* ── LOADING AGREEMENT ───────────────────────────────────────────────────── */
  if (agreementLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FaSpinner className="animate-spin text-primary text-4xl" />
      </div>
    );
  }

  /* ── MAIN PAYMENT PAGE ───────────────────────────────────────────────────── */
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
        <h1 className="text-xl font-bold text-gray-800">Complete Payment</h1>
        <div className="ml-auto flex items-center gap-2 text-gray-400 text-sm">
          <FaLock size={12} />
          <span>Secured by Stripe</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
        {/* Agreement gate — shown when agreement exists but not fully signed */}
        {agreement && !agreementFullySigned && (
          <div className="bg-white rounded-3xl shadow-sm border-2 border-amber-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2.5 rounded-xl">
                <FaFileContract className="text-amber-600 text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">
                  Agreement Signature Required
                </h3>
                <p className="text-xs text-gray-500">
                  Both parties must sign before payment is unlocked
                </p>
              </div>
            </div>

            {/* Signature status pills */}
            <div className="flex gap-3">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
                  agreement.tenantSigned
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
                }`}
              >
                {agreement.tenantSigned ? (
                  <FaCheckCircle size={11} />
                ) : (
                  <FaClock size={11} />
                )}
                Tenant: {agreement.tenantSigned ? "Signed" : "Pending"}
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
                  agreement.ownerSigned
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
                }`}
              >
                {agreement.ownerSigned ? (
                  <FaCheckCircle size={11} />
                ) : (
                  <FaClock size={11} />
                )}
                Owner: {agreement.ownerSigned ? "Signed" : "Pending"}
              </div>
            </div>

            {/* Tenant hasn't signed yet */}
            {!agreement.tenantSigned && (
              <button
                onClick={() => setShowAgreementModal(true)}
                className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold text-base hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <FaFileContract size={16} />
                Review & Sign Agreement
              </button>
            )}

            {/* Tenant signed, waiting on owner */}
            {agreement.tenantSigned && !agreement.ownerSigned && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700 flex gap-2">
                <FaInfoCircle className="shrink-0 mt-0.5" />
                <span>
                  You've signed! Waiting for the owner to countersign. Payment
                  will unlock automatically once they do.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Agreement error */}
        {agreementError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 text-rose-700 text-sm">
            <FaTimesCircle className="shrink-0 mt-0.5" />
            {agreementError}
          </div>
        )}

        {/* Agreement fully signed badge */}
        {agreementFullySigned && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 text-green-700 text-sm font-semibold">
            <FaCheckCircle size={18} />
            <span>
              Rental agreement fully signed by both parties — you can now
              proceed to payment.
            </span>
          </div>
        )}

        {/* Timer — only visible once payment intent is created */}
        {timerActive && (
          <div
            className={`rounded-3xl border-2 p-5 flex items-center gap-4 ${timerBg} transition-all duration-500`}
          >
            <div
              className={`text-4xl font-black font-mono tabular-nums ${timerColor}`}
            >
              {formatTime(timeLeft)}
            </div>
            <div>
              <p className="font-bold text-gray-800">
                Complete payment before time runs out
              </p>
              <p className="text-sm text-gray-500">
                Your payment window will close automatically.
              </p>
            </div>
            <FaClock className={`ml-auto text-2xl ${timerColor} shrink-0`} />
          </div>
        )}

        {/* Booking Summary */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl">
                <FaHome className="text-white text-xl" />
              </div>
              <div>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                  Booking Summary
                </p>
                <h2 className="text-white font-bold text-lg leading-tight">
                  {propertyTitle}
                </h2>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Check-in</span>
              <span className="font-semibold">
                {checkInDate ? new Date(checkInDate).toLocaleDateString() : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Check-out</span>
              <span className="font-semibold">
                {checkOutDate
                  ? new Date(checkOutDate).toLocaleDateString()
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                ₨ {Math.round(rent / 30).toLocaleString()} × {days} days
              </span>
              <span className="font-semibold">
                ₨ {totalAmount?.toLocaleString()}
              </span>
            </div>
            <hr className="border-dashed border-gray-200" />
            <div className="flex justify-between font-black text-gray-900 text-lg">
              <span>Total Due</span>
              <span>₨ {totalAmount?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment section — locked until agreement fully signed */}
        <div
          className={`bg-white rounded-3xl shadow-sm border p-6 space-y-5 transition-all ${
            agreementFullySigned
              ? "border-gray-100"
              : "border-gray-100 opacity-50 pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <FaCreditCard className="text-primary text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Card Details</h3>
              <p className="text-xs text-gray-400">
                Powered by Stripe — 100% secure
                {!agreementFullySigned && (
                  <span className="ml-2 text-amber-500 font-semibold">
                    (Locked until agreement signed)
                  </span>
                )}
              </p>
            </div>
          </div>

          {!clientSecret ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Click below to securely initialize your payment session.
              </p>
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-600 text-sm">
                  {error}
                </div>
              )}
              <button
                onClick={handleCreateIntent}
                disabled={loading || !agreementFullySigned}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" /> Initializing...
                  </>
                ) : (
                  <>
                    <FaCreditCard /> Enter Payment Details
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                id="card-element"
                className="border-2 border-gray-200 rounded-2xl px-4 py-4 bg-gray-50 focus-within:border-primary transition-all"
              />

              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-600 text-sm flex items-center gap-2">
                  <FaExclamationTriangle className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={loading || !cardElement}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <FaLock /> Pay ₨ {totalAmount?.toLocaleString()}
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                <FaLock size={10} /> Your payment info is encrypted and never
                stored by us.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Agreement Modal */}
      {showAgreementModal && agreement && (
        <AgreementModal
          agreement={agreement}
          mode="tenant"
          onClose={() => setShowAgreementModal(false)}
          onSigned={(updated) => {
            setAgreement(updated);
            setShowAgreementModal(false);
            showAlert(
              "Agreement signed! Waiting for the owner to countersign.",
              "success",
            );
          }}
        />
      )}
    </div>
  );
};

export default Payment;
