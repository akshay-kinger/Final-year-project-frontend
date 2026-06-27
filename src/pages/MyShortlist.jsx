import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaBookmark,
  FaMapMarkerAlt,
  FaSpinner,
  FaTrash,
  FaHome,
  FaArrowLeft,
  FaRegBookmark,
} from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { API_ROUTES, IMAGE_BASE_URL } from "../api/apiRoutes";

// ─── Skeleton card shown while loading ──────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-8 bg-gray-100 rounded-lg w-20" />
      </div>
    </div>
  </div>
);

// ─── Individual shortlist card ───────────────────────────────────────────────
const ShortlistCard = ({ item, onRemove, removing }) => {
  const navigate = useNavigate();
  const property = item.property;

  if (!property) return null;

  const imageUrl =
    property.images?.length > 0
      ? `${IMAGE_BASE_URL}/${property.images[0].split(/[\\/]/).pop()}`
      : null;

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Image */}
      <div
        className="relative h-48 bg-gray-100 cursor-pointer overflow-hidden"
        onClick={() => navigate(`/property/${property._id}`)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaHome className="text-gray-300 text-4xl" />
          </div>
        )}

        {/* Property type badge */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          {property.propertyType || "Property"}
        </span>

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(property._id);
          }}
          disabled={removing}
          title="Remove from shortlist"
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm text-red-400 rounded-full shadow-sm
            hover:bg-red-50 hover:text-red-500 transition-all duration-200 disabled:opacity-50"
        >
          {removing ? (
            <FaSpinner className="animate-spin" size={13} />
          ) : (
            <FaTrash size={13} />
          )}
        </button>
      </div>

      {/* Content */}
      <div
        className="p-5 cursor-pointer"
        onClick={() => navigate(`/property/${property._id}`)}
      >
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1.5 line-clamp-1">
          {property.title}
        </h3>

        <div className="flex items-center text-gray-400 text-sm mb-4">
          <FaMapMarkerAlt className="text-primary mr-1.5 shrink-0" size={11} />
          <span className="truncate">
            {property.area}, {property.city}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">
              Monthly Rent
            </p>
            <p className="text-lg font-black text-secondary">
              ₨ {property.rent?.toLocaleString()}
            </p>
          </div>

          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500
            group-hover:border-primary/30 group-hover:text-primary group-hover:bg-primary/5 transition-colors"
          >
            View →
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Empty state ─────────────────────────────────────────────────────────────
const EmptyState = ({ navigate }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
      <FaRegBookmark className="text-gray-300 text-3xl" />
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">
      No shortlisted properties yet
    </h3>
    <p className="text-gray-400 text-sm max-w-xs mb-6">
      Browse properties and tap the bookmark icon to save them here for later.
    </p>
    <button
      onClick={() => navigate("/homepage")}
      className="px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm
        hover:bg-primary-dark transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
    >
      Browse Properties
    </button>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const MyShortlist = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [shortlist, setShortlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null); // tracks which card is being removed

  const token = localStorage.getItem("token");
  const authHeader = { authorization: `Bearer ${token}` };

  // ── Fetch shortlist ──────────────────────────────────────────────────────
  const fetchShortlist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_ROUTES.SHORTLIST.GET, {
        headers: authHeader,
      });
      setShortlist(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch shortlist:", err);
      showAlert("Failed to load your shortlist.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShortlist();
  }, [fetchShortlist]);

  // ── Remove one item ──────────────────────────────────────────────────────
  const handleRemove = useCallback(
    async (propertyId) => {
      setRemovingId(propertyId);
      try {
        await axios.delete(API_ROUTES.SHORTLIST.REMOVE(propertyId), {
          headers: authHeader,
        });
        setShortlist((prev) =>
          prev.filter((item) => item.property?._id !== propertyId),
        );
        showAlert("Removed from shortlist.", "info");
      } catch (err) {
        showAlert(
          err.response?.data?.message || "Failed to remove from shortlist.",
          "error",
        );
      } finally {
        setRemovingId(null);
      }
    },
    [showAlert],
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 sticky top-[68px] z-30">
        <div className="w-[95%] 2xl:max-w-[1200px] mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/homepage")}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FaArrowLeft size={15} />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <FaBookmark className="text-primary" size={16} />
                My Shortlist
              </h1>
              {!loading && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {shortlist.length}{" "}
                  {shortlist.length === 1 ? "property" : "properties"} saved
                </p>
              )}
            </div>
          </div>

          {/* Clear all — only shown when there are items */}
          {!loading && shortlist.length > 0 && (
            <button
              onClick={async () => {
                if (!window.confirm("Remove all shortlisted properties?"))
                  return;
                // Remove one by one — reuse existing endpoint
                for (const item of shortlist) {
                  if (item.property?._id) {
                    await axios
                      .delete(API_ROUTES.SHORTLIST.REMOVE(item.property._id), {
                        headers: authHeader,
                      })
                      .catch(() => {});
                  }
                }
                setShortlist([]);
                showAlert("Shortlist cleared.", "info");
              }}
              className="text-xs font-semibold text-red-400 hover:text-red-500 px-3 py-1.5
                rounded-lg hover:bg-red-50 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="w-[95%] 2xl:max-w-[1200px] mx-auto px-4 md:px-8 mt-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : shortlist.length === 0 ? (
          <EmptyState navigate={navigate} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {shortlist.map((item) => (
              <ShortlistCard
                key={item._id}
                item={item}
                onRemove={handleRemove}
                removing={removingId === item.property?._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyShortlist;
