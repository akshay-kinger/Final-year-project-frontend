import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft,
  FaWrench,
  FaSpinner,
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaFire,
  FaChevronDown,
  FaChevronUp,
  FaPaperclip,
  FaComment,
  FaUser,
  FaTools,
  FaUserPlus,
  FaReceipt,
  FaCheck,
  FaTimes,
  FaEdit,
  FaEye,
  FaSort,
  FaThumbsUp,
  FaThumbsDown,
} from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { API_ROUTES } from "../api/apiRoutes";

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const STATUS_CONFIG = {
  open: {
    label: "Open",
    pill: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  in_review: {
    label: "In Review",
    pill: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  scheduled: {
    label: "Scheduled",
    pill: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  in_progress: {
    label: "In Progress",
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  resolved: {
    label: "Resolved",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  closed: {
    label: "Closed",
    pill: "bg-gray-100 text-gray-500 border-gray-200",
    dot: "bg-gray-400",
  },
  rejected: {
    label: "Rejected",
    pill: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-500",
  },
  reopened: {
    label: "Reopened",
    pill: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  tenant_handling: {
    label: "Tenant Handling",
    pill: "bg-teal-50 text-teal-700 border-teal-200",
    dot: "bg-teal-500",
  },
  awaiting_proof_review: {
    label: "Proof Pending",
    pill: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", bg: "bg-gray-100 text-gray-500" },
  medium: { label: "Medium", bg: "bg-blue-50 text-blue-600" },
  high: { label: "High", bg: "bg-orange-50 text-orange-600" },
  emergency: { label: "Emergency", bg: "bg-red-50 text-red-600" },
};

const CATEGORY_ICONS = {
  plumbing: "🔧",
  electrical: "⚡",
  internet: "📶",
  appliance: "🏠",
  furniture: "🪑",
  cleaning: "🧹",
  security: "🔒",
  heating: "🔥",
  cooling: "❄️",
  other: "🔩",
};

const VALID_STATUSES = [
  "open",
  "in_review",
  "scheduled",
  "in_progress",
  "resolved",
  "closed",
  "rejected",
  "reopened",
];

const RESOLUTION_OPTIONS = [
  {
    value: "deduct_from_rent",
    label: "Deduct from rent",
    desc: "Subtract from next payment",
  },
  {
    value: "reimburse_tenant",
    label: "Reimburse tenant",
    desc: "Pay tenant directly",
  },
  { value: "split", label: "Split cost", desc: "Share between owner & tenant" },
  {
    value: "no_action",
    label: "Decline cost",
    desc: "Tenant bears the expense",
  },
];

const HISTORY_COLORS = {
  created: "bg-blue-100 text-blue-600",
  status_changed: "bg-purple-100 text-purple-600",
  assigned: "bg-indigo-100 text-indigo-600",
  comment_added: "bg-gray-100 text-gray-600",
  resolved: "bg-emerald-100 text-emerald-600",
  proof_approved: "bg-emerald-100 text-emerald-600",
  proof_submitted: "bg-violet-100 text-violet-600",
  proof_rejected: "bg-red-100 text-red-600",
  tenant_hired_technician: "bg-teal-100 text-teal-600",
  tenant_confirmed_done: "bg-emerald-100 text-emerald-600",
  tenant_reopened: "bg-orange-100 text-orange-600",
};
const HISTORY_ICONS = {
  created: "✦",
  comment_added: "💬",
  resolved: "✓",
  proof_approved: "✓",
  helper_completed: "✓",
  rejected: "✕",
  proof_rejected: "✕",
  helper_declined: "✕",
  tenant_confirmed_done: "✓",
  tenant_reopened: "↩",
};

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
const fmtAgo = (d) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d);
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${cfg.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${cfg.bg}`}
    >
      {priority === "emergency" && <FaFire size={8} />}
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────
// TenantConfirmationBadge  ← NEW
// Shows on the owner dashboard what the tenant said about the work
// ─────────────────────────────────────────────
const TenantConfirmationBadge = ({ confirmation }) => {
  if (!confirmation?.verdict) return null;
  const isDone = confirmation.verdict === "done";
  return (
    <div
      className={`rounded-2xl border px-4 py-3 flex items-start gap-3 ${isDone ? "bg-emerald-50 border-emerald-100" : "bg-orange-50 border-orange-100"}`}
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isDone ? "bg-emerald-100" : "bg-orange-100"}`}
      >
        {isDone ? (
          <FaThumbsUp className="text-emerald-600" size={12} />
        ) : (
          <FaThumbsDown className="text-orange-500" size={12} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-black ${isDone ? "text-emerald-700" : "text-orange-700"}`}
        >
          {isDone
            ? "Tenant confirmed work is done"
            : "Tenant says issue is NOT fixed"}
        </p>
        {confirmation.note && (
          <p className="text-[11px] text-gray-500 mt-0.5">
            {confirmation.note}
          </p>
        )}
        <p className="text-[10px] text-gray-400 mt-1">
          {fmtTime(confirmation.confirmedAt)}
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// StatsBar
// ─────────────────────────────────────────────
const StatsBar = ({ requests }) => {
  const open = requests.filter((r) => r.status === "open").length;
  const active = requests.filter((r) =>
    ["in_progress", "scheduled", "in_review", "reopened"].includes(r.status),
  ).length;
  const proof = requests.filter(
    (r) => r.status === "awaiting_proof_review",
  ).length;
  const emergency = requests.filter(
    (r) => r.isEmergency || r.priority === "emergency",
  ).length;
  const resolved = requests.filter((r) =>
    ["resolved", "closed"].includes(r.status),
  ).length;
  // Tenant flagged as not fixed
  const disputed = requests.filter(
    (r) => r.tenantConfirmation?.verdict === "not_done",
  ).length;

  const items = [
    {
      label: "Open",
      value: open,
      color: "text-blue-600",
      bg: "bg-blue-50",
      show: true,
    },
    {
      label: "Active",
      value: active,
      color: "text-amber-600",
      bg: "bg-amber-50",
      show: true,
    },
    {
      label: "Proof",
      value: proof,
      color: "text-violet-600",
      bg: "bg-violet-50",
      show: proof > 0,
    },
    {
      label: "Disputed",
      value: disputed,
      color: "text-orange-600",
      bg: "bg-orange-50",
      show: disputed > 0,
    },
    {
      label: "Emergency",
      value: emergency,
      color: "text-red-600",
      bg: "bg-red-50",
      show: emergency > 0,
    },
    {
      label: "Resolved",
      value: resolved,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      show: true,
    },
  ].filter((i) => i.show);

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
    >
      {items.map(({ label, value, color, bg }) => (
        <div key={label} className={`${bg} rounded-2xl p-3 text-center`}>
          <p className={`text-lg font-black ${color}`}>{value}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// AssignTechnicianModal
// ─────────────────────────────────────────────
const PAYMENT_OPTIONS = [
  {
    value: "deduct_from_rent",
    label: "Deduct from rent",
    desc: "Subtract from tenant's next payment",
    icon: "🏠",
  },
  {
    value: "direct_payment",
    label: "Pay technician directly",
    desc: "Owner pays out of pocket",
    icon: "💳",
  },
  {
    value: "split",
    label: "Split cost",
    desc: "Shared between owner & tenant",
    icon: "⚖️",
  },
];

const AssignTechnicianModal = ({ request, onClose, onSuccess, showAlert }) => {
  const [name, setName] = useState(request.assignedTo?.name || "");
  const [phone, setPhone] = useState(request.assignedTo?.phone || "");
  const [paymentMethod, setPaymentMethod] = useState(
    request.assignedTo?.payment?.method || "",
  );
  const [paymentAmount, setPaymentAmount] = useState(
    request.assignedTo?.payment?.amount || "",
  );
  const [paymentNote, setPaymentNote] = useState(
    request.assignedTo?.payment?.note || "",
  );
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!name.trim()) {
      showAlert("Technician name is required.", "warning");
      return;
    }
    if (!paymentMethod) {
      showAlert("Please select a payment method.", "warning");
      return;
    }
    setLoading(true);
    try {
      await axios.patch(
        API_ROUTES.MAINTENANCE.ASSIGN(request._id),
        { name, phone, paymentMethod, paymentAmount, paymentNote },
        {
          headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      showAlert("Technician assigned!", "success");
      onSuccess();
      onClose();
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to assign.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50 sticky top-0 bg-white z-10">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Assign Technician
            </p>
            <h3 className="text-base font-black text-gray-900 mt-0.5 truncate max-w-[220px]">
              {request.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200"
          >
            <FaTimesCircle size={13} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Technician Name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmed Electrician"
              className="mt-1.5 w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:bg-white transition-colors placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0312-1234567"
              className="mt-1.5 w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:bg-white transition-colors placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Payment Method <span className="text-red-400">*</span>
            </label>
            <div className="mt-2 space-y-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPaymentMethod(opt.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${paymentMethod === opt.value ? "bg-indigo-600 border-indigo-600 text-white" : "bg-gray-50 border-gray-100 hover:bg-gray-100"}`}
                >
                  <span className="text-lg shrink-0">{opt.icon}</span>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-bold ${paymentMethod === opt.value ? "text-white" : "text-gray-800"}`}
                    >
                      {opt.label}
                    </p>
                    <p
                      className={`text-[10px] mt-0.5 ${paymentMethod === opt.value ? "text-indigo-200" : "text-gray-400"}`}
                    >
                      {opt.desc}
                    </p>
                  </div>
                  {paymentMethod === opt.value && (
                    <FaCheck size={11} className="text-white shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
          {paymentMethod && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Estimated Cost (PKR)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 3500"
                  className="mt-1.5 w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:bg-white transition-colors placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Payment Note (optional)
                </label>
                <textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Any note about the payment arrangement..."
                  rows={2}
                  className="mt-1.5 w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-400 focus:bg-white transition-colors resize-none placeholder:text-gray-300"
                />
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={loading}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <FaSpinner className="animate-spin" size={13} />
              ) : (
                <FaUserPlus size={13} />
              )}
              Assign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// UpdateStatusModal
// ─────────────────────────────────────────────
const UpdateStatusModal = ({ request, onClose, onSuccess, showAlert }) => {
  const [status, setStatus] = useState(request.status);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (status === request.status) {
      showAlert("Status hasn't changed.", "warning");
      return;
    }
    setLoading(true);
    try {
      await axios.patch(
        API_ROUTES.MAINTENANCE.UPDATE_STATUS(request._id),
        { status, note },
        {
          headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      showAlert("Status updated!", "success");
      onSuccess();
      onClose();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to update status.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Update Status
            </p>
            <h3 className="text-base font-black text-gray-900 mt-0.5 truncate max-w-[220px]">
              {request.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200"
          >
            <FaTimesCircle size={13} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {VALID_STATUSES.map((s) => {
              const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.open;
              const isActive = status === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${isActive ? `border ${cfg.pill} shadow-sm` : "bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100"}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${isActive ? cfg.dot : "bg-gray-300"}`}
                  />
                  <span className="text-xs font-bold">{cfg.label}</span>
                  {isActive && (
                    <FaCheck size={9} className="ml-auto text-current" />
                  )}
                </button>
              );
            })}
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for this status change..."
              rows={2}
              className="mt-1.5 w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-400 focus:bg-white transition-colors resize-none placeholder:text-gray-300"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading || status === request.status}
              className="flex-1 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <FaSpinner className="animate-spin" size={13} />
              ) : (
                <FaEdit size={13} />
              )}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ReviewProofModal
// ─────────────────────────────────────────────
const ReviewProofModal = ({ request, onClose, onSuccess, showAlert }) => {
  const [decision, setDecision] = useState("");
  const [resolution, setResolution] = useState("deduct_from_rent");
  const [resolvedAmount, setResolvedAmount] = useState(
    request.proof?.amount || "",
  );
  const [ownerNote, setOwnerNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!decision) {
      showAlert("Choose approve or reject.", "warning");
      return;
    }
    if (decision === "approved" && !resolution) {
      showAlert("Select a resolution.", "warning");
      return;
    }
    setLoading(true);
    try {
      await axios.patch(
        API_ROUTES.MAINTENANCE.REVIEW_PROOF(request._id),
        {
          decision,
          resolution: decision === "approved" ? resolution : undefined,
          resolvedAmount:
            decision === "approved" ? Number(resolvedAmount) : undefined,
          ownerNote,
        },
        {
          headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      showAlert(
        decision === "approved" ? "Proof approved!" : "Proof rejected.",
        "success",
      );
      onSuccess();
      onClose();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to review proof.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const { proof } = request;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50 sticky top-0 bg-white z-10">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Review Receipt
            </p>
            <h3 className="text-base font-black text-gray-900 mt-0.5 truncate max-w-[220px]">
              {request.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200"
          >
            <FaTimesCircle size={13} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FaReceipt className="text-violet-500" size={12} />
              <p className="text-xs font-black text-violet-700 uppercase tracking-wider">
                Tenant's Receipt
              </p>
            </div>
            <p className="text-sm text-violet-800 leading-relaxed">
              {proof?.description}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-violet-400">Claimed amount</p>
              <p className="text-base font-black text-violet-900">
                PKR {proof?.amount?.toLocaleString()}
              </p>
            </div>
            {proof?.attachments?.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-1">
                {proof.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] bg-violet-100 text-violet-600 px-2 py-1 rounded-lg font-semibold hover:bg-violet-200 transition-colors"
                  >
                    Receipt {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              {
                val: "approved",
                label: "Approve",
                icon: FaCheck,
                color: "bg-emerald-50 border-emerald-300 text-emerald-700",
              },
              {
                val: "rejected",
                label: "Reject",
                icon: FaTimes,
                color: "bg-red-50 border-red-300 text-red-700",
              },
            ].map(({ val, label, icon: Icon, color }) => (
              <button
                key={val}
                onClick={() => setDecision(val)}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${decision === val ? color : "bg-gray-50 border-gray-200 text-gray-400"}`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {decision === "approved" && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                How to settle?
              </p>
              {RESOLUTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setResolution(opt.value)}
                  className={`w-full flex items-start justify-between px-4 py-3 rounded-2xl border text-left transition-all ${resolution === opt.value ? "bg-gray-900 border-gray-900 text-white" : "bg-gray-50 border-gray-100 hover:bg-gray-100"}`}
                >
                  <div>
                    <p
                      className={`text-sm font-bold ${resolution === opt.value ? "text-white" : "text-gray-800"}`}
                    >
                      {opt.label}
                    </p>
                    <p
                      className={`text-[10px] mt-0.5 ${resolution === opt.value ? "text-gray-300" : "text-gray-400"}`}
                    >
                      {opt.desc}
                    </p>
                  </div>
                  {resolution === opt.value && (
                    <FaCheck size={11} className="text-white mt-1 shrink-0" />
                  )}
                </button>
              ))}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Settled Amount (PKR)
                </label>
                <input
                  type="number"
                  value={resolvedAmount}
                  onChange={(e) => setResolvedAmount(e.target.value)}
                  className="mt-1.5 w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Note to tenant (optional)
            </label>
            <textarea
              value={ownerNote}
              onChange={(e) => setOwnerNote(e.target.value)}
              placeholder="Explain your decision..."
              rows={2}
              className="mt-1.5 w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-gray-400 resize-none transition-colors placeholder:text-gray-300"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !decision}
              className={`flex-1 py-3 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 ${decision === "rejected" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
            >
              {loading ? (
                <FaSpinner className="animate-spin" size={13} />
              ) : decision === "rejected" ? (
                <FaTimes size={13} />
              ) : (
                <FaCheck size={13} />
              )}
              {decision === "rejected" ? "Reject" : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// OwnerCommentBox
// ─────────────────────────────────────────────
const OwnerCommentBox = ({ requestId, onRefresh, showAlert }) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!note.trim()) return;
    setLoading(true);
    try {
      await axios.post(
        API_ROUTES.MAINTENANCE.ADD_COMMENT(requestId),
        { note },
        {
          headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      showAlert("Note added.", "success");
      setNote("");
      setOpen(false);
      onRefresh();
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaComment size={11} /> Add internal note
      </button>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Internal note visible to staff..."
        className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 resize-none outline-none focus:border-gray-400 placeholder:text-gray-300"
        rows={2}
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-xs text-gray-400 font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !note.trim()}
          className="px-4 py-1.5 bg-gray-800 text-white rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1.5"
        >
          {loading && <FaSpinner className="animate-spin" size={10} />} Post
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// HistoryTimeline
// ─────────────────────────────────────────────
const HistoryTimeline = ({ history }) => {
  if (!history?.length) return null;
  const sorted = [...history].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
  return (
    <div className="space-y-0">
      {sorted.map((entry, i) => {
        const color =
          HISTORY_COLORS[entry.action] || "bg-gray-100 text-gray-500";
        const icon = HISTORY_ICONS[entry.action] || "↻";
        const isLast = i === sorted.length - 1;
        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-black ${color}`}
              >
                {icon}
              </div>
              {!isLast && <div className="w-px flex-1 bg-gray-100 my-1" />}
            </div>
            <div className="pb-4 flex-1 min-w-0">
              <p className={`text-xs font-bold ${color.split(" ")[1]}`}>
                {entry.action
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </p>
              {entry.note && (
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {entry.note}
                </p>
              )}
              {entry.fromStatus && entry.toStatus && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {STATUS_CONFIG[entry.fromStatus]?.label || entry.fromStatus} →{" "}
                  {STATUS_CONFIG[entry.toStatus]?.label || entry.toStatus}
                </p>
              )}
              {entry.performedBy?.name && (
                <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                  <FaUser size={8} /> {entry.performedBy.name}
                </p>
              )}
              <p className="text-[10px] text-gray-300 mt-1">
                {fmtTime(entry.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// OwnerRequestCard
// ─────────────────────────────────────────────
const OwnerRequestCard = ({ request, onRefresh, showAlert }) => {
  const [expanded, setExpanded] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showProof, setShowProof] = useState(false);

  const isEmergency = request.isEmergency || request.priority === "emergency";
  const hasProof = request.status === "awaiting_proof_review" && request.proof;
  const tenantDisputed = request.tenantConfirmation?.verdict === "not_done";
  const categoryEmoji = CATEGORY_ICONS[request.category] || "🔩";

  return (
    <>
      <div
        className={`bg-white rounded-3xl overflow-hidden border transition-all duration-200 ${
          isEmergency
            ? "border-red-200 shadow-md shadow-red-50"
            : tenantDisputed
              ? "border-orange-200 shadow-md shadow-orange-50"
              : hasProof
                ? "border-violet-200 shadow-md shadow-violet-50"
                : "border-gray-100 shadow-sm"
        }`}
      >
        {isEmergency && (
          <div className="bg-red-500 px-4 py-2 flex items-center gap-2">
            <FaFire className="text-white/80" size={11} />
            <span className="text-white text-xs font-bold tracking-wide">
              Emergency — Needs immediate attention
            </span>
          </div>
        )}

        {/* Tenant dispute banner */}
        {tenantDisputed && !isEmergency && (
          <div className="bg-orange-500 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaThumbsDown className="text-white/80" size={11} />
              <span className="text-white text-xs font-bold">
                Tenant says issue is not fixed
              </span>
            </div>
            <button
              onClick={() => setExpanded(true)}
              className="text-[10px] font-bold bg-white/20 text-white px-2 py-1 rounded-lg hover:bg-white/30 transition-colors"
            >
              View
            </button>
          </div>
        )}

        {hasProof && !isEmergency && !tenantDisputed && (
          <div className="bg-violet-600 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaReceipt className="text-white/80" size={11} />
              <span className="text-white text-xs font-bold">
                Tenant submitted a receipt — review needed
              </span>
            </div>
            <button
              onClick={() => setShowProof(true)}
              className="text-[10px] font-bold bg-white/20 text-white px-2 py-1 rounded-lg hover:bg-white/30 transition-colors"
            >
              Review
            </button>
          </div>
        )}

        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 text-lg">
              {categoryEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      #{request.requestNumber || "—"}
                    </span>
                    <PriorityBadge priority={request.priority} />
                  </div>
                  <h3 className="text-gray-900 font-black text-sm leading-tight">
                    {request.title}
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5 capitalize">
                    {request.category} · {fmtAgo(request.createdAt)}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </div>
            </div>
          </div>

          {request.reportedBy && (
            <div className="mt-3 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                <FaUser className="text-gray-400" size={9} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold">
                  Reported by
                </p>
                <p className="text-xs font-bold text-gray-700 truncate">
                  {request.reportedBy?.name ||
                    request.reportedBy?.email ||
                    "Tenant"}
                </p>
              </div>
              <p className="text-[10px] text-gray-400">
                {fmt(request.createdAt)}
              </p>
            </div>
          )}

          <p className="text-sm text-gray-500 mt-3 leading-relaxed line-clamp-2">
            {request.description}
          </p>
        </div>

        {/* Quick-action buttons */}
        <div className="px-4 pb-4 grid grid-cols-3 gap-2">
          <button
            onClick={() => setShowAssign(true)}
            className="flex flex-col items-center gap-1.5 py-3 px-2 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-100 active:scale-[0.97] transition-all group"
          >
            <div className="w-8 h-8 bg-indigo-100 group-hover:bg-indigo-200 rounded-xl flex items-center justify-center transition-colors">
              <FaUserPlus className="text-indigo-500" size={13} />
            </div>
            <p className="text-[10px] font-bold text-indigo-700 text-center leading-tight">
              {request.assignedTo ? "Re-assign" : "Assign"}
            </p>
          </button>

          <button
            onClick={() => setShowStatus(true)}
            className="flex flex-col items-center gap-1.5 py-3 px-2 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 active:scale-[0.97] transition-all group"
          >
            <div className="w-8 h-8 bg-gray-100 group-hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
              <FaEdit className="text-gray-500" size={13} />
            </div>
            <p className="text-[10px] font-bold text-gray-500 text-center leading-tight">
              Status
            </p>
          </button>

          {hasProof ? (
            <button
              onClick={() => setShowProof(true)}
              className="flex flex-col items-center gap-1.5 py-3 px-2 bg-violet-50 border border-violet-200 rounded-2xl hover:bg-violet-100 active:scale-[0.97] transition-all group relative"
            >
              <div className="w-8 h-8 bg-violet-100 group-hover:bg-violet-200 rounded-xl flex items-center justify-center transition-colors relative">
                <FaReceipt className="text-violet-500" size={13} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              </div>
              <p className="text-[10px] font-bold text-violet-700 text-center leading-tight">
                Receipt
              </p>
            </button>
          ) : (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex flex-col items-center gap-1.5 py-3 px-2 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 active:scale-[0.97] transition-all group"
            >
              <div className="w-8 h-8 bg-gray-100 group-hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                <FaEye className="text-gray-500" size={13} />
              </div>
              <p className="text-[10px] font-bold text-gray-500 text-center leading-tight">
                Details
              </p>
            </button>
          )}
        </div>

        {request.assignedTo?.name && (
          <div className="mx-4 mb-4 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <FaTools className="text-indigo-500" size={12} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                    Assigned Technician
                  </p>
                  <p className="text-xs font-bold text-indigo-800">
                    {request.assignedTo.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssign(true)}
                className="text-[10px] text-indigo-500 font-bold hover:underline"
              >
                Change
              </button>
            </div>
            {request.assignedTo.phone && (
              <p className="text-xs text-indigo-600 pl-10">
                📞 {request.assignedTo.phone}
              </p>
            )}
            {request.assignedTo.payment?.method && (
              <div className="pl-10 space-y-0.5">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  Payment
                </p>
                <p className="text-xs text-indigo-700 font-semibold capitalize">
                  {request.assignedTo.payment.method.replace(/_/g, " ")}
                  {request.assignedTo.payment.amount
                    ? ` — PKR ${request.assignedTo.payment.amount.toLocaleString()}`
                    : ""}
                </p>
                {request.assignedTo.payment.note && (
                  <p className="text-[10px] text-indigo-400 italic">
                    {request.assignedTo.payment.note}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div
          className="mx-4 border-t border-gray-50 pt-3 pb-3 flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-xs font-bold text-gray-400">
            {expanded ? "Hide timeline" : "View full timeline"}
          </span>
          {expanded ? (
            <FaChevronUp className="text-gray-300" size={11} />
          ) : (
            <FaChevronDown className="text-gray-300" size={11} />
          )}
        </div>

        {expanded && (
          <div className="px-4 pb-5 space-y-4">
            {/* ── TENANT CONFIRMATION BADGE ── */}
            <TenantConfirmationBadge
              confirmation={request.tenantConfirmation}
            />

            {request.tenantHiredTechnician?.name && (
              <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 space-y-1">
                <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">
                  Tenant Hired Technician
                </p>
                <p className="text-sm font-bold text-teal-800">
                  {request.tenantHiredTechnician.name}
                </p>
                {request.tenantHiredTechnician.contact && (
                  <p className="text-xs text-teal-600">
                    {request.tenantHiredTechnician.contact}
                  </p>
                )}
                <p className="text-xs text-teal-700">
                  {request.tenantHiredTechnician.description}
                </p>
              </div>
            )}

            {request.proof && (
              <div
                className={`rounded-2xl border px-4 py-3 space-y-2 ${request.proof.status === "approved" ? "bg-emerald-50 border-emerald-100" : request.proof.status === "rejected" ? "bg-red-50 border-red-100" : "bg-violet-50 border-violet-100"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaReceipt
                      size={11}
                      className={
                        request.proof.status === "approved"
                          ? "text-emerald-500"
                          : request.proof.status === "rejected"
                            ? "text-red-400"
                            : "text-violet-500"
                      }
                    />
                    <p className="text-xs font-black uppercase tracking-wider text-gray-600">
                      Receipt
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${request.proof.status === "approved" ? "bg-emerald-200 text-emerald-800" : request.proof.status === "rejected" ? "bg-red-200 text-red-700" : "bg-violet-200 text-violet-800"}`}
                  >
                    {request.proof.status}
                  </span>
                </div>
                <p className="text-xs text-gray-700">
                  {request.proof.description}
                </p>
                <p className="text-sm font-black text-gray-900">
                  PKR {request.proof.amount?.toLocaleString()}
                </p>
                {request.proof.resolution && (
                  <p className="text-xs text-gray-500 font-semibold">
                    Resolution: {request.proof.resolution.replace(/_/g, " ")}
                  </p>
                )}
                {request.proof.status === "pending" && (
                  <button
                    onClick={() => setShowProof(true)}
                    className="mt-1 w-full py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 transition-all flex items-center justify-center gap-1.5"
                  >
                    <FaEye size={10} /> Review this receipt
                  </button>
                )}
              </div>
            )}

            {request.tenantHelper && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                    Tenant Helper
                  </p>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${request.tenantHelper.status === "completed" ? "bg-blue-100 text-blue-700" : request.tenantHelper.status === "accepted" ? "bg-emerald-100 text-emerald-700" : request.tenantHelper.status === "declined" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}
                  >
                    {request.tenantHelper.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-blue-800">
                  {request.tenantHelper.description}
                </p>
                {request.tenantHelper.agreedAmount && (
                  <p className="text-xs font-bold text-blue-700">
                    Agreed: PKR{" "}
                    {request.tenantHelper.agreedAmount.toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {request.attachments?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Attachments
                </p>
                <div className="flex gap-2 flex-wrap">
                  {request.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500 font-semibold hover:bg-gray-100 transition-colors"
                    >
                      <FaPaperclip size={10} /> File {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {request.history?.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Activity Timeline
                </p>
                <HistoryTimeline history={request.history} />
              </div>
            )}

            <OwnerCommentBox
              requestId={request._id}
              onRefresh={onRefresh}
              showAlert={showAlert}
            />
          </div>
        )}
      </div>

      {showAssign && (
        <AssignTechnicianModal
          request={request}
          onClose={() => setShowAssign(false)}
          onSuccess={onRefresh}
          showAlert={showAlert}
        />
      )}
      {showStatus && (
        <UpdateStatusModal
          request={request}
          onClose={() => setShowStatus(false)}
          onSuccess={onRefresh}
          showAlert={showAlert}
        />
      )}
      {showProof && (
        <ReviewProofModal
          request={request}
          onClose={() => setShowProof(false)}
          onSuccess={onRefresh}
          showAlert={showAlert}
        />
      )}
    </>
  );
};

// ─────────────────────────────────────────────
// MAIN — OwnerMaintenanceDashboard
// ─────────────────────────────────────────────
const OwnerMaintenanceDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
  const propertyId = location.state?.propertyId;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("action");
  const [sortBy, setSortBy] = useState("newest");
  const [fetchError, setFetchError] = useState(false);

  const showAlertRef = useRef(showAlert);
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  const fetchRequests = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const params = { view: "owner" };
        if (propertyId) params.propertyId = propertyId;

        const res = await axios.get(API_ROUTES.MAINTENANCE.OWNER_REQUESTS, {
          params,
          headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.data.success) {
          setRequests(res.data.data || []);
          setFetchError(false);
        }
      } catch (err) {
        if (!silent && !fetchError) {
          setFetchError(true);
          showAlertRef.current(
            err.response?.data?.message || "Failed to load.",
            "error",
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [propertyId],
  ); // eslint-disable-line

  useEffect(() => {
    fetchRequests(false);
  }, [fetchRequests]);
  useEffect(() => {
    const id = setInterval(() => fetchRequests(true), 30000);
    return () => clearInterval(id);
  }, [fetchRequests]);

  const actionItems = requests.filter(
    (r) =>
      ["open", "in_review", "awaiting_proof_review", "reopened"].includes(
        r.status,
      ) ||
      (r.isEmergency && !["resolved", "closed"].includes(r.status)) ||
      r.tenantConfirmation?.verdict === "not_done", // ← disputed requests need attention too
  );
  const inProgressItems = requests.filter((r) =>
    ["scheduled", "in_progress", "tenant_handling"].includes(r.status),
  );
  const resolvedItems = requests.filter((r) =>
    ["resolved", "closed", "rejected"].includes(r.status),
  );

  const sortFn = (a, b) => {
    if (sortBy === "priority") {
      const o = { emergency: 0, high: 1, medium: 2, low: 3 };
      return (o[a.priority] ?? 4) - (o[b.priority] ?? 4);
    }
    if (sortBy === "status") return a.status.localeCompare(b.status);
    return new Date(b.createdAt) - new Date(a.createdAt);
  };

  const getTabItems = () => {
    if (activeTab === "action") return [...actionItems].sort(sortFn);
    if (activeTab === "active") return [...inProgressItems].sort(sortFn);
    if (activeTab === "resolved") return [...resolvedItems].sort(sortFn);
    return [...requests].sort(sortFn);
  };

  const filtered = getTabItems();
  const proofCount = requests.filter(
    (r) => r.status === "awaiting_proof_review",
  ).length;
  const emergencyCount = requests.filter(
    (r) => r.isEmergency || r.priority === "emergency",
  ).length;
  const disputedCount = requests.filter(
    (r) => r.tenantConfirmation?.verdict === "not_done",
  ).length;

  const TABS = [
    {
      key: "action",
      label: "Needs Action",
      count: actionItems.length,
      urgent: true,
    },
    {
      key: "active",
      label: "In Progress",
      count: inProgressItems.length,
      urgent: false,
    },
    {
      key: "resolved",
      label: "Resolved",
      count: resolvedItems.length,
      urgent: false,
    },
    { key: "all", label: "All", count: requests.length, urgent: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
          >
            <FaArrowLeft className="text-gray-600" size={13} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-gray-900">Maintenance</h1>
              {proofCount > 0 && (
                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-black rounded-full">
                  {proofCount} receipt{proofCount > 1 ? "s" : ""} pending
                </span>
              )}
              {disputedCount > 0 && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-black rounded-full">
                  {disputedCount} disputed
                </span>
              )}
            </div>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">
                {requests.length} total
                {emergencyCount > 0 && (
                  <span className="text-red-500 font-semibold">
                    {" "}
                    · {emergencyCount} emergency
                  </span>
                )}
                {actionItems.length > 0 && (
                  <span className="text-amber-500 font-semibold">
                    {" "}
                    · {actionItems.length} need action
                  </span>
                )}
              </p>
            )}
          </div>

          <button
            onClick={() =>
              setSortBy((s) =>
                s === "newest"
                  ? "priority"
                  : s === "priority"
                    ? "status"
                    : "newest",
              )
            }
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            title={`Sort: ${sortBy}`}
          >
            <FaSort className="text-gray-400" size={13} />
          </button>
          <button
            onClick={() => fetchRequests(true)}
            disabled={refreshing}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-400 disabled:opacity-40"
          >
            <FaSyncAlt size={13} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {sortBy !== "newest" && (
          <div className="max-w-2xl mx-auto px-4 pb-1">
            <span className="text-[10px] text-gray-400 font-semibold">
              Sorted by: {sortBy}
            </span>
          </div>
        )}

        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {TABS.map(({ key, label, count, urgent }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 border ${activeTab === key ? (urgent ? "bg-red-500 text-white border-transparent" : "bg-gray-900 text-white border-transparent") : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
              >
                {label}
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm">
              <FaSpinner className="animate-spin text-gray-400 text-lg" />
            </div>
            <p className="text-gray-400 text-sm">Loading requests…</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mb-4 border border-red-100">
              <FaTimesCircle className="text-red-400 text-2xl" />
            </div>
            <p className="text-gray-900 font-bold text-base mb-1">
              Couldn't load requests
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Check your connection and try again.
            </p>
            <button
              onClick={() => {
                setFetchError(false);
                fetchRequests(false);
              }}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-700 transition-all active:scale-95"
            >
              Try Again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
              <FaWrench className="text-gray-300 text-2xl" />
            </div>
            <p className="text-gray-900 font-bold text-base mb-1">
              No maintenance requests
            </p>
            <p className="text-gray-400 text-sm max-w-[220px] leading-relaxed">
              Tenants haven't reported any issues yet.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <StatsBar requests={requests} />
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-2">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-2">
                  <FaCheckCircle className="text-gray-300 text-xl" />
                </div>
                <p className="text-gray-600 font-bold text-sm">
                  {activeTab === "action"
                    ? "Nothing needs attention right now"
                    : `No ${activeTab} requests`}
                </p>
                <p className="text-gray-400 text-xs">
                  Switch tabs to see other requests
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((req) => (
                  <OwnerRequestCard
                    key={req._id}
                    request={req}
                    onRefresh={() => fetchRequests(true)}
                    showAlert={showAlert}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerMaintenanceDashboard;