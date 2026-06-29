import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  FaArrowLeft,
  FaWrench,
  FaPlus,
  FaSpinner,
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaFire,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaPaperclip,
  FaComment,
  FaUser,
  FaCalendarAlt,
  FaUpload,
  FaReceipt,
  FaThumbsUp,
  FaThumbsDown,
} from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { API_ROUTES } from "../api/apiRoutes";

const STATUS_CONFIG = {
  open: {
    label: "Open",
    pill: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
  },
  in_review: {
    label: "In Review",
    pill: "bg-purple-50 text-purple-700 border border-purple-200",
    dot: "bg-purple-500",
  },
  scheduled: {
    label: "Scheduled",
    pill: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    dot: "bg-indigo-500",
  },
  in_progress: {
    label: "In Progress",
    pill: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  resolved: {
    label: "Resolved",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  closed: {
    label: "Closed",
    pill: "bg-gray-100 text-gray-500 border border-gray-200",
    dot: "bg-gray-400",
  },
  rejected: {
    label: "Rejected",
    pill: "bg-red-50 text-red-600 border border-red-200",
    dot: "bg-red-500",
  },
  reopened: {
    label: "Reopened",
    pill: "bg-orange-50 text-orange-700 border border-orange-200",
    dot: "bg-orange-500",
  },
  tenant_handling: {
    label: "You're Handling",
    pill: "bg-teal-50 text-teal-700 border border-teal-200",
    dot: "bg-teal-500",
  },
  awaiting_proof_review: {
    label: "Proof Submitted",
    pill: "bg-violet-50 text-violet-700 border border-violet-200",
    dot: "bg-violet-500",
  },
};

const PRIORITY_CONFIG = {
  low: {
    label: "Low",
    color: "text-gray-400",
    bg: "bg-gray-100 text-gray-500",
  },
  medium: {
    label: "Medium",
    color: "text-blue-500",
    bg: "bg-blue-50 text-blue-600",
  },
  high: {
    label: "High",
    color: "text-orange-500",
    bg: "bg-orange-50 text-orange-600",
  },
  emergency: {
    label: "Emergency",
    color: "text-red-500",
    bg: "bg-red-50 text-red-600",
  },
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

const CATEGORIES = [
  "plumbing",
  "electrical",
  "internet",
  "appliance",
  "furniture",
  "cleaning",
  "security",
  "heating",
  "cooling",
  "other",
];
const PRIORITIES = ["low", "medium", "high", "emergency"];

const HISTORY_ACTION_CONFIG = {
  created: {
    label: "Request Created",
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  status_changed: {
    label: "Status Updated",
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  assigned: {
    label: "Technician Assigned",
    color: "text-indigo-600",
    bg: "bg-indigo-100",
  },
  unassigned: {
    label: "Unassigned",
    color: "text-gray-500",
    bg: "bg-gray-100",
  },
  comment_added: {
    label: "Comment",
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
  scheduled: {
    label: "Scheduled",
    color: "text-indigo-600",
    bg: "bg-indigo-100",
  },
  resolved: {
    label: "Resolved",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  closed: { label: "Closed", color: "text-gray-500", bg: "bg-gray-100" },
  reopened: {
    label: "Reopened",
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
  tenant_hired_technician: {
    label: "You Hired Technician",
    color: "text-teal-600",
    bg: "bg-teal-100",
  },
  proof_submitted: {
    label: "Receipt Submitted",
    color: "text-violet-600",
    bg: "bg-violet-100",
  },
  proof_approved: {
    label: "Receipt Approved",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  proof_rejected: {
    label: "Receipt Rejected",
    color: "text-red-600",
    bg: "bg-red-100",
  },
  tenant_hired_other_tenant: {
    label: "Helper Requested",
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  helper_accepted: {
    label: "Helper Accepted",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  helper_declined: {
    label: "Helper Declined",
    color: "text-red-600",
    bg: "bg-red-100",
  },
  helper_completed: {
    label: "Helper Completed",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  // ── NEW ──
  tenant_confirmed_done: {
    label: "You Confirmed Fixed",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  tenant_reopened: {
    label: "You Reported Not Fixed",
    color: "text-orange-600",
    bg: "bg-orange-100",
  },
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

// ─────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────
// PriorityBadge
// ─────────────────────────────────────────────
const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${cfg.bg}`}
    >
      {priority === "emergency" && <FaFire size={9} />}
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────
const EmptyState = ({ onReport }) => (
  <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
    <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mb-5 border border-orange-100">
      <FaWrench className="text-orange-400 text-3xl" />
    </div>
    <h2 className="text-xl font-black text-gray-900 mb-2">
      No maintenance requests
    </h2>
    <p className="text-gray-400 text-sm max-w-xs mb-8 leading-relaxed">
      Spotted an issue? Report it and we'll get it sorted.
    </p>
    <button
      onClick={onReport}
      className="px-8 py-3.5 bg-orange-500 text-white rounded-2xl font-bold text-sm hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-200"
    >
      Report an Issue
    </button>
  </div>
);

// ─────────────────────────────────────────────
// CreateRequestModal
// ─────────────────────────────────────────────
const CreateRequestModal = ({
  onClose,
  onSuccess,
  propertyId,
  bookingId,
  showAlert,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("medium");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || title.length < 5) {
      showAlert("Title must be at least 5 characters.", "warning");
      return;
    }
    if (!description.trim()) {
      showAlert("Description is required.", "warning");
      return;
    }
    if (!propertyId) {
      showAlert("No property linked to this request.", "error");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("propertyId", propertyId);
      if (bookingId) form.append("bookingId", bookingId);
      form.append("title", title);
      form.append("description", description);
      form.append("category", category);
      form.append("priority", priority);
      files.forEach((f) => form.append("files", f));
      await axios.post(API_ROUTES.MAINTENANCE.CREATE, form, {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      showAlert("Maintenance request submitted!", "success");
      onSuccess();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to submit request.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 sticky top-0 bg-white border-b border-gray-50 z-10">
          <div>
            <h3 className="text-base font-black text-gray-900">
              Report an Issue
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              We'll get it sorted for you
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors"
          >
            <FaTimesCircle size={13} />
          </button>
        </div>

        <div className="px-5 pb-6 pt-4 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AC not cooling, water leak..."
              className="mt-1.5 w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400 focus:bg-white transition-colors placeholder:text-gray-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={3}
              className="mt-1.5 w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400 focus:bg-white transition-colors resize-none placeholder:text-gray-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400 capitalize"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1.5 w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400 capitalize"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {priority === "emergency" && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <FaFire className="text-red-400 shrink-0" size={12} />
              <p className="text-xs text-red-600">
                Emergency requests are flagged for immediate attention.
              </p>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Photos (optional)
            </label>
            <label className="mt-1.5 flex items-center gap-2 cursor-pointer">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 font-semibold hover:bg-gray-100 transition-colors">
                <FaUpload size={11} />
                {files.length > 0
                  ? `${files.length} file(s) selected`
                  : "Attach photos"}
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files))}
              />
            </label>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {files.map((f, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 px-2 py-1 rounded-lg font-semibold truncate max-w-[140px]"
                  >
                    {f.name}
                  </span>
                ))}
              </div>
            )}
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
              disabled={loading}
              className="flex-1 py-3 bg-orange-500 text-white rounded-2xl font-bold text-sm hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <FaSpinner className="animate-spin" size={13} />
              ) : (
                <FaWrench size={13} />
              )}
              Submit
            </button>
          </div>
        </div>
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
        const cfg = HISTORY_ACTION_CONFIG[entry.action] || {
          label: entry.action,
          color: "text-gray-500",
          bg: "bg-gray-100",
        };
        const isLast = i === sorted.length - 1;
        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}
              >
                <span className="text-[10px] font-black">
                  {entry.action === "created"
                    ? "✦"
                    : entry.action === "comment_added"
                      ? "💬"
                      : entry.action === "tenant_confirmed_done"
                        ? "✓"
                        : entry.action === "tenant_reopened"
                          ? "↩"
                          : entry.action === "resolved" ||
                              entry.action === "proof_approved" ||
                              entry.action === "helper_completed"
                            ? "✓"
                            : entry.action.includes("rejected") ||
                                entry.action.includes("declined")
                              ? "✕"
                              : "↻"}
                </span>
              </div>
              {!isLast && <div className="w-px flex-1 bg-gray-100 my-1" />}
            </div>
            <div className="pb-4 flex-1 min-w-0">
              <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
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
// TenantWorkConfirmation  ← NEW COMPONENT
//
// Shows when the owner has assigned a technician (scheduled / in_progress /
// resolved) and the tenant hasn't confirmed yet. Tenant picks "Yes, it's fixed"
// or "No, still broken". Once submitted, shows the recorded verdict.
// ─────────────────────────────────────────────
const TenantWorkConfirmation = ({ request, onRefresh, showAlert }) => {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [showNoteFor, setShowNoteFor] = useState(null); // "done" | "not_done" | null

  const confirmableStatuses = [
    "scheduled",
    "in_progress",
    "resolved",
    "in_review",
  ];
  const alreadyConfirmed = !!request.tenantConfirmation?.verdict;
  const canConfirm =
    confirmableStatuses.includes(request.status) && request.assignedTo?.name;

  const handleConfirm = async (verdict) => {
    setLoading(true);
    try {
      await axios.post(
        API_ROUTES.MAINTENANCE.CONFIRM_WORK(request._id),
        { verdict, note },
        {
          headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      showAlert(
        verdict === "done"
          ? "Great! Marked as resolved."
          : "Reported as not fixed. Owner has been notified.",
        "success",
      );
      setShowNoteFor(null);
      setNote("");
      onRefresh();
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to submit.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Already confirmed — show badge only ──
  if (alreadyConfirmed) {
    const isDone = request.tenantConfirmation.verdict === "done";
    return (
      <div
        className={`rounded-2xl border px-4 py-3 flex items-start gap-3 ${isDone ? "bg-emerald-50 border-emerald-100" : "bg-orange-50 border-orange-100"}`}
      >
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isDone ? "bg-emerald-100" : "bg-orange-100"}`}
        >
          {isDone ? (
            <FaThumbsUp className="text-emerald-600" size={13} />
          ) : (
            <FaThumbsDown className="text-orange-500" size={13} />
          )}
        </div>
        <div>
          <p
            className={`text-xs font-black ${isDone ? "text-emerald-700" : "text-orange-700"}`}
          >
            {isDone
              ? "You confirmed this is fixed"
              : "You reported this is not fixed"}
          </p>
          {request.tenantConfirmation.note && (
            <p className="text-[11px] text-gray-500 mt-0.5">
              {request.tenantConfirmation.note}
            </p>
          )}
          <p className="text-[10px] text-gray-400 mt-1">
            {fmtTime(request.tenantConfirmation.confirmedAt)}
          </p>
        </div>
      </div>
    );
  }

  if (!canConfirm) return null;

  // ── Note input step ──
  if (showNoteFor) {
    const isDone = showNoteFor === "done";
    return (
      <div
        className={`rounded-2xl border p-4 space-y-3 ${isDone ? "bg-emerald-50 border-emerald-100" : "bg-orange-50 border-orange-100"}`}
      >
        <div className="flex items-center justify-between">
          <p
            className={`text-sm font-black ${isDone ? "text-emerald-700" : "text-orange-700"}`}
          >
            {isDone ? "Confirm work is done?" : "Report issue not fixed?"}
          </p>
          <button
            onClick={() => {
              setShowNoteFor(null);
              setNote("");
            }}
            className="text-[10px] text-gray-400 font-semibold"
          >
            Cancel
          </button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            isDone
              ? "Any comments about the work done... (optional)"
              : "Describe what's still wrong... (optional)"
          }
          rows={2}
          className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 resize-none outline-none focus:border-gray-400 placeholder:text-gray-300"
        />
        <button
          onClick={() => handleConfirm(showNoteFor)}
          disabled={loading}
          className={`w-full py-3 text-white rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 ${isDone ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-500 hover:bg-orange-600"}`}
        >
          {loading ? (
            <FaSpinner className="animate-spin" size={13} />
          ) : isDone ? (
            <FaThumbsUp size={13} />
          ) : (
            <FaThumbsDown size={13} />
          )}
          {isDone ? "Yes, it's fixed" : "No, still broken"}
        </button>
      </div>
    );
  }

  // ── Default: prompt the tenant ──
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-3">
      <div>
        <p className="text-sm font-black text-indigo-800">
          Was the work completed?
        </p>
        <p className="text-xs text-indigo-500 mt-0.5">
          Let us know if the technician fixed the issue.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowNoteFor("done")}
          className="flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all active:scale-95"
        >
          <FaThumbsUp size={12} /> Yes, fixed!
        </button>
        <button
          onClick={() => setShowNoteFor("not_done")}
          className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-orange-300 text-orange-600 rounded-2xl font-bold text-sm hover:bg-orange-50 transition-all active:scale-95"
        >
          <FaThumbsDown size={12} /> Still broken
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ProofSection
// ─────────────────────────────────────────────
const ProofSection = ({ request, onRefresh, showAlert }) => {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const canSubmit = request.status === "tenant_handling" && !request.proof;

  const handleSubmit = async () => {
    if (!desc || !amount || files.length === 0) {
      showAlert(
        "Please fill all fields and attach at least one receipt.",
        "warning",
      );
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("description", desc);
      form.append("amount", amount);
      files.forEach((f) => form.append("files", f));
      await axios.post(API_ROUTES.MAINTENANCE.SUBMIT_PROOF(request._id), form, {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      showAlert("Receipt submitted successfully!", "success");
      setOpen(false);
      onRefresh();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to submit proof.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  if (request.proof) {
    const { proof } = request;
    const statusColors = {
      pending: "bg-amber-50 border-amber-100 text-amber-700",
      approved: "bg-emerald-50 border-emerald-100 text-emerald-700",
      rejected: "bg-red-50 border-red-100 text-red-600",
    };
    return (
      <div
        className={`rounded-2xl border p-4 space-y-2 ${statusColors[proof.status] || statusColors.pending}`}
      >
        <div className="flex items-center gap-2 mb-1">
          <FaReceipt size={12} />
          <p className="text-xs font-black uppercase tracking-wider">
            Receipt Submitted
          </p>
          <span
            className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-md ${proof.status === "approved" ? "bg-emerald-200" : proof.status === "rejected" ? "bg-red-200" : "bg-amber-200"}`}
          >
            {proof.status.toUpperCase()}
          </span>
        </div>
        <p className="text-xs">{proof.description}</p>
        <p className="text-sm font-black">
          PKR {proof.amount?.toLocaleString()}
        </p>
        {proof.ownerNote && (
          <p className="text-xs opacity-80 italic">
            Owner note: {proof.ownerNote}
          </p>
        )}
        {proof.resolution && (
          <p className="text-xs font-bold capitalize">
            Resolution: {proof.resolution.replace(/_/g, " ")}
          </p>
        )}
      </div>
    );
  }

  if (!canSubmit) return null;

  return (
    <div className="space-y-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between px-4 py-3 bg-violet-50 border border-violet-100 rounded-2xl hover:bg-violet-100 active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
              <FaReceipt className="text-violet-500" size={12} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-violet-700">
                Submit Receipt
              </p>
              <p className="text-[10px] text-violet-400">
                Upload proof of payment
              </p>
            </div>
          </div>
          <FaChevronRight className="text-violet-300" size={11} />
        </button>
      ) : (
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-violet-700">Submit Receipt</p>
            <button
              onClick={() => setOpen(false)}
              className="text-[10px] text-violet-400 font-semibold"
            >
              Cancel
            </button>
          </div>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe the work done and cost..."
            className="w-full text-sm bg-white border border-violet-200 rounded-xl px-3 py-2.5 resize-none outline-none focus:border-violet-400 placeholder:text-gray-300"
            rows={3}
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount paid (PKR)"
            className="w-full text-sm bg-white border border-violet-200 rounded-xl px-3 py-2.5 outline-none focus:border-violet-400 placeholder:text-gray-300"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-violet-200 rounded-xl text-xs text-violet-500 font-semibold hover:bg-violet-50 transition-colors">
              <FaUpload size={11} />
              {files.length > 0
                ? `${files.length} file(s) selected`
                : "Attach receipts"}
            </div>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files))}
            />
          </label>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-violet-500 text-white rounded-xl font-bold text-sm hover:bg-violet-600 transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <FaSpinner className="animate-spin" size={13} />
            ) : (
              <FaReceipt size={13} />
            )}
            Submit Receipt
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// CommentBox
// ─────────────────────────────────────────────
const CommentBox = ({ requestId, onRefresh, showAlert }) => {
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
      showAlert("Comment added.", "success");
      setNote("");
      setOpen(false);
      onRefresh();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to add comment.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaComment size={11} /> Add a comment
        </button>
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write a comment or update..."
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
              {loading && <FaSpinner className="animate-spin" size={10} />}
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// RequestCard
// ─────────────────────────────────────────────
const RequestCard = ({ request, onRefresh, showAlert }) => {
  const [expanded, setExpanded] = useState(false);
  const categoryEmoji = CATEGORY_ICONS[request.category] || "🔩";
  const isEmergency = request.isEmergency || request.priority === "emergency";

  // Show the confirmation prompt banner on the card header if relevant
  const needsConfirmation =
    ["scheduled", "in_progress", "resolved", "in_review"].includes(
      request.status,
    ) &&
    request.assignedTo?.name &&
    !request.tenantConfirmation?.verdict;

  return (
    <div
      className={`bg-white rounded-3xl overflow-hidden border transition-all duration-200 ${isEmergency ? "border-red-200 shadow-md shadow-red-50" : needsConfirmation ? "border-indigo-200 shadow-md shadow-indigo-50" : "border-gray-100 shadow-sm"}`}
    >
      {isEmergency && (
        <div className="bg-red-500 px-5 py-1.5 flex items-center gap-2">
          <FaFire className="text-white/80" size={11} />
          <span className="text-white text-xs font-bold tracking-wide">
            Emergency Request
          </span>
        </div>
      )}

      {/* Banner nudging tenant to confirm — only if not already confirmed */}
      {needsConfirmation && !isEmergency && (
        <div className="bg-indigo-600 px-5 py-2 flex items-center justify-between">
          <p className="text-white text-xs font-bold">
            Did the technician fix the issue?
          </p>
          <button
            onClick={() => setExpanded(true)}
            className="text-[10px] font-bold bg-white/20 text-white px-2 py-1 rounded-lg hover:bg-white/30 transition-colors"
          >
            Confirm
          </button>
        </div>
      )}

      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 text-lg">
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
                <h3 className="text-gray-900 font-black text-sm leading-tight truncate">
                  {request.title}
                </h3>
                <p className="text-gray-400 text-xs mt-0.5 capitalize">
                  {request.category} · {fmt(request.createdAt)}
                </p>
              </div>
              <StatusBadge status={request.status} />
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3 leading-relaxed line-clamp-2">
          {request.description}
        </p>
      </div>

      {request.attachments?.length > 0 && (
        <div className="px-4 pb-3 flex items-center gap-1.5">
          <FaPaperclip className="text-gray-300" size={10} />
          <span className="text-[10px] text-gray-400 font-semibold">
            {request.attachments.length} attachment
            {request.attachments.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div
        className="mx-4 border-t border-gray-50 pt-3 pb-3 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-xs font-bold text-gray-400">
          {expanded ? "Hide details" : "View details & timeline"}
        </span>
        {expanded ? (
          <FaChevronUp className="text-gray-300" size={11} />
        ) : (
          <FaChevronDown className="text-gray-300" size={11} />
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-5 space-y-4">
          {request.assignedTo?.name && (
            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FaUser className="text-indigo-500" size={12} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  Assigned Technician
                </p>
                <p className="text-sm font-bold text-indigo-800">
                  {request.assignedTo.name}
                </p>
                {request.assignedTo.phone && (
                  <p className="text-xs text-indigo-600">
                    📞 {request.assignedTo.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── WORK CONFIRMATION PANEL ── */}
          <TenantWorkConfirmation
            request={request}
            onRefresh={onRefresh}
            showAlert={showAlert}
          />

          {request.scheduledAt && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
              <FaCalendarAlt className="text-gray-400" size={11} />
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                  Scheduled For
                </p>
                <p className="text-xs font-bold text-gray-700">
                  {fmtTime(request.scheduledAt)}
                </p>
              </div>
            </div>
          )}

          {request.resolutionNote && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">
                Resolution Note
              </p>
              <p className="text-xs text-emerald-800">
                {request.resolutionNote}
              </p>
              {request.resolvedAt && (
                <p className="text-[10px] text-emerald-400 mt-1">
                  Resolved {fmt(request.resolvedAt)}
                </p>
              )}
            </div>
          )}

          {request.tenantHiredTechnician?.name && (
            <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 space-y-1">
              <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider">
                Hired Technician
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
              <p className="text-[10px] text-teal-400">
                {fmtTime(request.tenantHiredTechnician.hiredAt)}
              </p>
            </div>
          )}

          {request.tenantHelper && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                  Helper Request
                </p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${request.tenantHelper.status === "accepted" ? "bg-emerald-100 text-emerald-700" : request.tenantHelper.status === "declined" ? "bg-red-100 text-red-600" : request.tenantHelper.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}
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
              {request.tenantHelper.helperNote && (
                <p className="text-xs text-blue-600 italic">
                  {request.tenantHelper.helperNote}
                </p>
              )}
            </div>
          )}

          <ProofSection
            request={request}
            onRefresh={onRefresh}
            showAlert={showAlert}
          />

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

          <CommentBox
            requestId={request._id}
            onRefresh={onRefresh}
            showAlert={showAlert}
          />
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// TabPill
// ─────────────────────────────────────────────
const TabPill = ({ label, count, active, onClick }) => (
  <button
    onClick={onClick}
    className={`shrink-0 px-4 py-1.5 rounded-xl text-sm font-bold transition-all active:scale-95 border ${active ? "bg-orange-500 text-white border-transparent shadow-sm shadow-orange-200" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
  >
    {label}
    {count > 0 && (
      <span
        className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-black ${active ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"}`}
      >
        {count}
      </span>
    )}
  </button>
);

// ─────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────
const StatCard = ({ value, label, color }) => (
  <div className="flex-1 bg-white rounded-2xl px-3 py-3 text-center border border-gray-100 shadow-sm">
    <p className={`text-xl font-black ${color}`}>{value}</p>
    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
      {label}
    </p>
  </div>
);

// ─────────────────────────────────────────────
// MyMaintenanceRequests — main
// ─────────────────────────────────────────────
const MyMaintenanceRequests = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();

  const passedPropertyId = location.state?.propertyId;
  const passedBookingId = location.state?.bookingId;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const showAlertRef = useRef(showAlert);
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  const TABS = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "in_progress", label: "In Progress" },
    { key: "tenant_handling", label: "Self-Handling" },
    { key: "awaiting_proof_review", label: "Proof Sent" },
    { key: "resolved", label: "Resolved" },
    { key: "closed", label: "Closed" },
  ];

  const fetchRequests = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const params = { view: "tenant" };
        if (passedPropertyId) params.propertyId = passedPropertyId;

        const res = await axios.get(API_ROUTES.MAINTENANCE.MY_REQUESTS, {
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
            err.response?.data?.message || "Failed to load requests.",
            "error",
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [passedPropertyId],
  ); // eslint-disable-line

  useEffect(() => {
    fetchRequests(false);
  }, [fetchRequests]);

  const tabCount = (key) => {
    if (key === "all") return requests.length;
    if (key === "in_progress")
      return requests.filter((r) =>
        ["in_progress", "in_review", "scheduled", "reopened"].includes(
          r.status,
        ),
      ).length;
    return requests.filter((r) => r.status === key).length;
  };

  const filtered = (() => {
    if (activeTab === "all") return requests;
    if (activeTab === "in_progress")
      return requests.filter((r) =>
        ["in_progress", "in_review", "scheduled", "reopened"].includes(
          r.status,
        ),
      );
    return requests.filter((r) => r.status === activeTab);
  })();

  const openCount = requests.filter((r) => r.status === "open").length;
  const inProgressCount = requests.filter((r) =>
    ["in_progress", "in_review", "scheduled"].includes(r.status),
  ).length;
  const resolvedCount = requests.filter((r) =>
    ["resolved", "closed"].includes(r.status),
  ).length;
  const emergencyCount = requests.filter((r) => r.isEmergency).length;
  // Count requests where tenant still needs to confirm work
  const awaitingConfirmCount = requests.filter(
    (r) =>
      ["scheduled", "in_progress", "resolved", "in_review"].includes(
        r.status,
      ) &&
      r.assignedTo?.name &&
      !r.tenantConfirmation?.verdict,
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 leading-tight">
                Maintenance
              </h1>
              {awaitingConfirmCount > 0 && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-full">
                  {awaitingConfirmCount} need
                  {awaitingConfirmCount === 1 ? "s" : ""} your input
                </span>
              )}
            </div>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">
                {requests.length} request{requests.length !== 1 ? "s" : ""}
                {emergencyCount > 0 && (
                  <span className="text-red-500 font-semibold">
                    {" "}
                    · {emergencyCount} emergency
                  </span>
                )}
                {openCount > 0 && (
                  <span className="text-blue-500 font-semibold">
                    {" "}
                    · {openCount} open
                  </span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors text-white shrink-0 shadow-sm shadow-orange-200"
          >
            <FaPlus size={14} />
          </button>
          <button
            onClick={() => fetchRequests(true)}
            disabled={refreshing}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-400 disabled:opacity-40"
          >
            <FaSyncAlt size={13} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

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

      {/* ── Stats ── */}
      {!loading && requests.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 mt-4">
          <div className="flex gap-2">
            <StatCard
              value={requests.length}
              label="Total"
              color="text-gray-900"
            />
            <StatCard value={openCount} label="Open" color="text-blue-600" />
            <StatCard
              value={inProgressCount}
              label="Active"
              color="text-amber-500"
            />
            <StatCard
              value={resolvedCount}
              label="Resolved"
              color="text-emerald-600"
            />
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
              <FaSpinner className="animate-spin text-orange-400 text-xl" />
            </div>
            <p className="text-gray-400 text-sm">Loading requests…</p>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-5 border border-red-100">
              <FaTimesCircle className="text-red-400 text-3xl" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">
              Couldn't load requests
            </h2>
            <p className="text-gray-400 text-sm max-w-xs mb-8 leading-relaxed">
              Check your connection or try again.
            </p>
            <button
              onClick={() => {
                setFetchError(false);
                fetchRequests(false);
              }}
              className="px-8 py-3.5 bg-orange-500 text-white rounded-2xl font-bold text-sm hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-200"
            >
              Try Again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <EmptyState onReport={() => setShowCreateForm(true)} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-2">
              <FaWrench className="text-gray-300 text-xl" />
            </div>
            <p className="text-gray-500 font-semibold text-sm">
              No {activeTab.replace(/_/g, " ")} requests
            </p>
            <p className="text-gray-400 text-xs">Try a different filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((req) => (
              <RequestCard
                key={req._id}
                request={req}
                onRefresh={() => fetchRequests(true)}
                showAlert={showAlert}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateForm && (
        <CreateRequestModal
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchRequests(true);
          }}
          propertyId={passedPropertyId}
          bookingId={passedBookingId}
          showAlert={showAlert}
        />
      )}
    </div>
  );
};

export default MyMaintenanceRequests;