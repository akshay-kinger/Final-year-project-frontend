import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAlert } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";
import { API_ROUTES, IMAGE_BASE_URL } from "../api/apiRoutes";
import {
  FaHome,
  FaEye,
  FaEdit,
  FaTrash,
  FaCalendarCheck,
  FaBook,
  FaWrench,
  FaSpinner,
  FaPlus,
  FaMapMarkerAlt,
  FaChevronRight,
  FaBed,
  FaUsers,
} from "react-icons/fa";

// ─────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────
const STATUS_CFG = {
  active: {
    label: "Active",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  occupied: {
    label: "Occupied",
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  inactive: {
    label: "Inactive",
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-400",
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
};

// ─────────────────────────────────────────────
// Delete Confirmation Modal
// ─────────────────────────────────────────────
const DeleteModal = ({ property, onConfirm, onClose, loading }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5">
      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
        <FaTrash className="text-red-500" size={16} />
      </div>
      <div className="text-center">
        <p className="text-base font-black text-gray-900 mb-1">
          Delete property?
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          <span className="font-semibold text-gray-600">{property?.title}</span>{" "}
          will be permanently removed.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
        >
          Keep it
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold text-sm hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <FaSpinner className="animate-spin" size={13} />
          ) : (
            <FaTrash size={13} />
          )}
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Property Card
// ─────────────────────────────────────────────
const PropertyCard = ({ property, onDelete, navigate }) => {
  const statusKey = property.status || "inactive";
  const cfg = STATUS_CFG[statusKey] || STATUS_CFG.inactive;
  const imgSrc = property.images?.length
    ? `${IMAGE_BASE_URL}/${property.images[0].split(/[\\/]/).pop()}`
    : null;

  const actions = [
    {
      label: "View",
      icon: FaEye,
      color: "bg-gray-100 text-gray-700 hover:bg-gray-200",
      onClick: () => navigate(`/property/${property._id}`),
    },
    {
      label: "Edit",
      icon: FaEdit,
      color:
        "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100",
      onClick: () => navigate(`/update-property/${property._id}`),
    },
    {
      label: "Delete",
      icon: FaTrash,
      color: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
      onClick: () => onDelete(property),
    },
  ];

  const management = [
    {
      label: "Bookings",
      icon: FaBook,
      color:
        "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100",
      badge: null,
      onClick: () => navigate(`/property/${property._id}/bookings`),
    },
    {
      label: "Visit Requests",
      icon: FaCalendarCheck,
      color:
        "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100",
      badge: null,
      onClick: () => navigate(`/property/${property._id}/requests`),
    },
    {
      label: "Maintenance",
      icon: FaWrench,
      color:
        "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100",
      badge: property._maintenanceCount || null,
      onClick: () =>
        navigate("/owner/maintenance", {
          state: { propertyId: property._id, propertyTitle: property.title },
        }),
    },
  ];

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
      {/* ── Image ── */}
      <div className="relative h-44 bg-gray-100 shrink-0">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaHome className="text-gray-200 text-4xl" />
          </div>
        )}

        {/* Status pill — top right */}
        <div
          className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold ${cfg.bg} ${cfg.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </div>

        {/* Type badge — top left */}
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-black/50 text-white backdrop-blur-sm">
          {property.propertyType === "room" &&
          property.roomSharingType === "sharing" ? (
            <>
              <FaUsers size={9} /> Sharing
            </>
          ) : (
            <>
              <FaBed size={9} /> {property.propertyType || "Property"}
            </>
          )}
        </div>
      </div>

      {/* ── Info ── */}
      <div className="px-4 pt-4 pb-3 flex-1 flex flex-col">
        <h2 className="text-gray-900 font-black text-[15px] leading-snug truncate">
          {property.title}
        </h2>

        <div className="flex items-center gap-1 mt-1 mb-3">
          <FaMapMarkerAlt className="text-gray-300" size={9} />
          <p className="text-gray-400 text-xs truncate">
            {property.city}
            {property.area ? `, ${property.area}` : ""}
          </p>
        </div>

        <p className="text-gray-900 font-black text-lg mb-4">
          ₨ {property.rent?.toLocaleString()}
          <span className="text-gray-400 text-xs font-normal"> /mo</span>
        </p>

        {/* ── Divider ── */}
        <div className="h-px bg-gray-50 mb-3" />

        {/* ── Quick actions row ── */}
        <div className="flex gap-2 mb-3">
          {actions.map(({ label, icon: Icon, color, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${color}`}
            >
              <Icon size={11} /> {label}
            </button>
          ))}
        </div>

        {/* ── Management row (full-width buttons) ── */}
        <div className="space-y-2">
          {management.map(({ label, icon: Icon, color, badge, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] ${color}`}
            >
              <div
                className="w-7 h-7 rounded-xl bg-current/10 flex items-center justify-center shrink-0"
                style={{ background: "rgba(0,0,0,0.06)" }}
              >
                <Icon size={12} />
              </div>
              <span className="flex-1 text-left">{label}</span>
              {badge > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
              <FaChevronRight size={10} className="opacity-40" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────
const EmptyState = ({ navigate }) => (
  <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-5">
      <FaHome className="text-gray-300 text-3xl" />
    </div>
    <p className="text-gray-900 font-black text-xl mb-2">No properties yet</p>
    <p className="text-gray-400 text-sm max-w-[240px] leading-relaxed mb-8">
      Post your first property to start receiving bookings and visit requests.
    </p>
    <button
      onClick={() => navigate("/post-property")}
      className="flex items-center gap-2 px-7 py-3.5 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-gray-700 transition-all active:scale-95 shadow-lg shadow-gray-900/20"
    >
      <FaPlus size={12} /> Post a Property
    </button>
  </div>
);

// ─────────────────────────────────────────────
// Stats bar
// ─────────────────────────────────────────────
const StatsBar = ({ properties }) => {
  const active = properties.filter((p) => p.status === "active").length;
  const occupied = properties.filter((p) => p.status === "occupied").length;
  const total = properties.length;

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: "Total", value: total, color: "text-gray-900" },
        { label: "Active", value: active, color: "text-emerald-600" },
        { label: "Occupied", value: occupied, color: "text-blue-600" },
      ].map(({ label, value, color }) => (
        <div
          key={label}
          className="bg-white border border-gray-100 rounded-2xl p-3 text-center shadow-sm"
        >
          <p className={`text-xl font-black ${color}`}>{value}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
const MyProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null); // property object
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "active" | "occupied" | "inactive"

  const navigate = useNavigate();
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchMyProperties();
  }, []);

  const fetchMyProperties = async () => {
    try {
      const res = await axios.get(API_ROUTES.ACCOMMODATIONS.MY_PROPERTIES, {
        headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setProperties(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch properties:", err);
      showAlert("Failed to load properties.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await axios.delete(API_ROUTES.ACCOMMODATIONS.DELETE(deleteTarget._id), {
        headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setProperties((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      showAlert("Property deleted.", "success");
    } catch {
      showAlert("Failed to delete. Try again.", "error");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "occupied", label: "Occupied" },
    { key: "inactive", label: "Inactive" },
  ];

  const filtered =
    filter === "all"
      ? properties
      : properties.filter((p) => (p.status || "inactive") === filter);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-900">My Properties</h1>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">
                {properties.length} listing{properties.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate("/post-property")}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-700 transition-all active:scale-95"
          >
            <FaPlus size={11} /> Add
          </button>
        </div>

        {/* Filter tabs */}
        {!loading && properties.length > 0 && (
          <div className="max-w-5xl mx-auto px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {FILTERS.map(({ key, label }) => {
                const count =
                  key === "all"
                    ? properties.length
                    : properties.filter((p) => (p.status || "inactive") === key)
                        .length;
                return (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 ${
                      filter === key
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                    {count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                          filter === key
                            ? "bg-white/20 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 mt-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm">
              <FaSpinner className="animate-spin text-gray-400 text-lg" />
            </div>
            <p className="text-gray-400 text-sm">Loading your properties…</p>
          </div>
        ) : properties.length === 0 ? (
          <EmptyState navigate={navigate} />
        ) : (
          <>
            <StatsBar properties={properties} />

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-2">
                <p className="text-gray-600 font-bold text-sm">
                  No {filter} properties
                </p>
                <p className="text-gray-400 text-xs">Switch the filter above</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((property) => (
                  <PropertyCard
                    key={property._id}
                    property={property}
                    onDelete={(p) => setDeleteTarget(p)}
                    navigate={navigate}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <DeleteModal
          property={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

export default MyProperties;
