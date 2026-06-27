import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  FaTimes,
  FaSpinner,
  FaPenNib,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { API_ROUTES } from "../api/apiRoutes";

/**
 * AgreementModal
 *
 * Presented as a formal executed instrument (affidavit-style) rather than
 * an app dialog — letterhead, a recital of parties, the instrument body,
 * and a wax-seal stamp that is affixed on execution.
 *
 * Props:
 *   agreement   — agreement object from API
 *   mode        — "tenant" | "owner"
 *   onClose     — () => void
 *   onSigned    — (updatedAgreement) => void   called after successful sign
 */

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=EB+Garamond:ital,wght@0,400;0,600;1,500&family=Courier+Prime:wght@400;700&display=swap');";

// A pressed wax/ink seal — used as the single signature moment of the page.
const Seal = ({ label = "EXECUTED" }) => (
  <div className="seal-stamp shrink-0">
    <svg viewBox="0 0 120 120" className="w-20 h-20 sm:w-24 sm:h-24">
      <circle
        cx="60"
        cy="60"
        r="56"
        fill="none"
        stroke="#7A2331"
        strokeWidth="2.5"
      />
      <circle
        cx="60"
        cy="60"
        r="47"
        fill="none"
        stroke="#7A2331"
        strokeWidth="1"
        strokeDasharray="2.2 3"
      />
      <path
        id="sealCurve"
        d="M 22 78 A 47 47 0 0 1 98 78"
        fill="none"
        stroke="none"
      />
      <text fontSize="10.5" fill="#7A2331" letterSpacing="2.5">
        <textPath href="#sealCurve" startOffset="50%" textAnchor="middle">
          {label}
        </textPath>
      </text>
      <path
        d="M40 64 L52 76 L82 44"
        fill="none"
        stroke="#7A2331"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const AgreementModal = ({ agreement, mode, onClose, onSigned }) => {
  const { showAlert } = useAlert();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const textRef = useRef(null);

  const handleScroll = () => {
    const el = textRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
    if (atBottom) setScrolledToBottom(true);
  };

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const isTenant = mode === "tenant";

  const handleSign = async () => {
    if (!checked) {
      showAlert("Please check the confirmation box before signing.", "error");
      return;
    }
    setLoading(true);
    try {
      const route = isTenant
        ? API_ROUTES.AGREEMENT.TENANT_SIGN(agreement._id)
        : API_ROUTES.AGREEMENT.OWNER_SIGN(agreement._id);

      const res = await axios.post(
        route,
        {},
        {
          headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );

      if (res.data.success) {
        showAlert(
          isTenant
            ? "Agreement signed! Awaiting owner countersignature."
            : "Agreement countersigned! Tenant can now proceed to payment.",
          "success",
        );
        onSigned(res.data.data);
      }
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to sign agreement.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const signedAt = isTenant
    ? agreement.tenantSignedAt
    : agreement.ownerSignedAt;
  const alreadySigned = isTenant
    ? agreement.tenantSigned
    : agreement.ownerSigned;
  const fullyExecuted = agreement.status === "completed";

  const refNumber = agreement._id
    ? `№ ${String(agreement._id).slice(-8).toUpperCase()}`
    : "№ —";
  const issuedOn = agreement.createdAt
    ? new Date(agreement.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const PartyStatus = ({ title, signed, at }) => (
    <div className="flex-1 px-5 py-4 text-center">
      <p className="text-[11px] tracking-[0.2em] text-[#9C8459] font-['EB_Garamond'] font-semibold">
        {title}
      </p>
      {signed ? (
        <p className="mt-1.5 font-['EB_Garamond'] italic text-sm text-[#1C2541]">
          Signed{" "}
          <span className="not-italic font-semibold">
            {new Date(at).toLocaleDateString()}
          </span>
        </p>
      ) : (
        <p className="mt-1.5 font-['EB_Garamond'] italic text-sm text-[#8A8478]">
          Awaiting signature
        </p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#13151c]/80 backdrop-blur-sm">
      <style>{`
        ${FONT_IMPORT}
        .instrument-paper {
          background-color: #F8F4E9;
          background-image:
            radial-gradient(circle at 18% 22%, rgba(122,35,49,0.04), transparent 40%),
            radial-gradient(circle at 82% 78%, rgba(176,141,87,0.07), transparent 45%);
        }
        .doc-body {
          background-color: #FBF8F0;
          background-image: repeating-linear-gradient(
            0deg,
            rgba(28,37,65,0.025) 0px,
            rgba(28,37,65,0.025) 1px,
            transparent 1px,
            transparent 26px
          );
        }
        .seal-stamp svg {
          filter: drop-shadow(0 1px 0 rgba(0,0,0,0.08));
          mix-blend-mode: multiply;
          animation: stampIn 0.55s cubic-bezier(0.2, 1.4, 0.4, 1) both;
        }
        @keyframes stampIn {
          0%   { opacity: 0; transform: scale(2.4) rotate(0deg); }
          60%  { opacity: 1; transform: scale(0.92) rotate(-10deg); }
          100% { opacity: 1; transform: scale(1) rotate(-7deg); }
        }
      `}</style>

      <div className="w-full max-w-2xl max-h-[92vh] p-[3px] rounded-sm bg-gradient-to-br from-[#B08D57] via-[#D9C39A] to-[#B08D57] shadow-2xl">
        <div className="instrument-paper relative flex flex-col max-h-[calc(92vh-6px)] rounded-[2px] border border-[#1C2541]/15 overflow-hidden">
          {/* close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1.5 text-[#1C2541]/40 hover:text-[#1C2541] hover:bg-[#1C2541]/5 rounded-full transition-colors"
          >
            <FaTimes size={15} />
          </button>

          {/* ── Letterhead ──────────────────────────────────────────── */}
          <div className="px-8 sm:px-10 pt-8 pb-5 text-center shrink-0">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full border-[1.5px] border-[#B08D57] flex items-center justify-center">
              <span className="font-['Cormorant_Garamond'] text-lg font-semibold text-[#7A2331]">
                RA
              </span>
            </div>
            <h2 className="font-['Cormorant_Garamond'] font-semibold text-[26px] sm:text-[30px] tracking-wide text-[#1C2541]">
              Rental Agreement
            </h2>
            <p className="mt-1 font-['EB_Garamond'] italic text-[13px] text-[#6B6354]">
              {isTenant
                ? "Instrument of Tenancy — presented for your signature"
                : "Instrument of Tenancy — presented for countersignature"}
            </p>

            <div className="my-4 flex items-center justify-center gap-3">
              <span className="h-px w-16 bg-[#B08D57]/60" />
              <span className="w-1.5 h-1.5 rotate-45 bg-[#B08D57]" />
              <span className="h-px w-16 bg-[#B08D57]/60" />
            </div>

            <div className="flex items-center justify-center gap-6 font-['EB_Garamond'] text-[12px] text-[#6B6354]">
              <span>
                Agreement{" "}
                <span className="text-[#1C2541] font-semibold">
                  {refNumber}
                </span>
              </span>
              <span className="w-px h-3 bg-[#1C2541]/15" />
              <span>
                Dated{" "}
                <span className="text-[#1C2541] font-semibold">{issuedOn}</span>
              </span>
            </div>
          </div>

          {/* ── Recital of parties ──────────────────────────────────── */}
          <div className="mx-8 sm:mx-10 flex items-stretch divide-x divide-[#1C2541]/10 border border-[#1C2541]/10 rounded-sm bg-[#1C2541]/[0.02] shrink-0">
            <PartyStatus
              title="THE TENANT"
              signed={agreement.tenantSigned}
              at={agreement.tenantSignedAt}
            />
            <PartyStatus
              title="THE OWNER"
              signed={agreement.ownerSigned}
              at={agreement.ownerSignedAt}
            />
          </div>

          {fullyExecuted && (
            <div className="mt-4 mx-8 sm:mx-10 flex items-center justify-center gap-2 shrink-0">
              <span className="text-[11px] tracking-[0.25em] font-['EB_Garamond'] font-semibold text-[#7A2331]">
                ◆ FULLY EXECUTED BY BOTH PARTIES ◆
              </span>
            </div>
          )}

          {/* ── Instrument body ─────────────────────────────────────── */}
          <div
            ref={textRef}
            onScroll={handleScroll}
            className="doc-body flex-1 overflow-y-auto mx-8 sm:mx-10 my-5 px-5 sm:px-7 py-6 rounded-sm border border-[#1C2541]/12"
          >
            <pre className="whitespace-pre-wrap font-['Courier_Prime'] text-[12.5px] leading-[1.85] text-[#2B2A26]">
              {agreement.agreementText}
            </pre>
          </div>

          {/* ── Footer — execution ───────────────────────────────────── */}
          <div className="px-8 sm:px-10 pb-8 pt-1 shrink-0">
            {alreadySigned ? (
              <div className="flex items-center gap-5 border-t border-[#1C2541]/10 pt-6">
                <Seal />
                <div className="font-['EB_Garamond'] text-[#1C2541]">
                  <p className="text-sm">
                    Recorded as duly signed by{" "}
                    <span className="font-semibold">
                      {isTenant ? "the Tenant" : "the Owner"}
                    </span>
                  </p>
                  <p className="italic text-[13px] text-[#6B6354] mt-0.5">
                    on {new Date(signedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-t border-[#1C2541]/10 pt-6 space-y-4">
                {!scrolledToBottom && (
                  <div className="flex items-center gap-2 text-[12px] font-['EB_Garamond'] text-[#8A5A1E] bg-[#B08D57]/10 border border-[#B08D57]/30 px-4 py-2.5 rounded-sm">
                    <FaExclamationTriangle size={12} />
                    Please read the instrument in full before attestation.
                  </div>
                )}

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                    disabled={!scrolledToBottom}
                    className="mt-1 w-4 h-4 accent-[#7A2331] cursor-pointer disabled:opacity-40"
                  />
                  <span
                    className={`font-['EB_Garamond'] text-[14px] leading-relaxed transition-colors ${
                      scrolledToBottom ? "text-[#2B2A26]" : "text-[#B7AF9C]"
                    }`}
                  >
                    <span className="italic">I attest</span> that I have read
                    this instrument in full and accept its terms as legally
                    binding, and that affixing my signature below constitutes my
                    consent.
                  </span>
                </label>

                <button
                  onClick={handleSign}
                  disabled={!checked || loading}
                  className="w-full py-3.5 bg-[#1C2541] text-[#F8F4E9] rounded-sm font-['Cormorant_Garamond'] font-semibold text-[16px] tracking-wide
                    border border-[#B08D57]/50 shadow-lg shadow-[#1C2541]/20 hover:bg-[#28335c] transition-all
                    active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed
                    flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Affixing signature…
                    </>
                  ) : (
                    <>
                      <FaPenNib />
                      {isTenant ? "Affix Signature" : "Affix Countersignature"}
                    </>
                  )}
                </button>

                <p className="text-center font-['EB_Garamond'] italic text-[11.5px] text-[#9C9182]">
                  Your signature is timestamped and stored as part of the
                  permanent record.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementModal;
