import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaMapMarkerAlt,
  FaCheckCircle,
  FaUserCircle,
  FaArrowLeft,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaBookmark,
  FaRegBookmark,
  FaUsers,
  FaVenus,
  FaMars,
  FaVenusMars,
  FaBed,
  FaHome,
  FaDoorOpen,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaShieldAlt,
  FaUserFriends,
  FaStickyNote,
} from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import Chat from "./chat";
import { API_ROUTES, IMAGE_BASE_URL } from "../api/apiRoutes";

// ─── Helper: gender preference badge ─────────────────────────────────────────
const GenderBadge = ({ preference }) => {
  if (!preference || preference === "any") return null;
  const isWomen = preference === "women_only";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${
        isWomen
          ? "bg-pink-50 text-pink-600 border border-pink-200"
          : "bg-blue-50 text-blue-600 border border-blue-200"
      }`}
    >
      {isWomen ? <FaVenus size={11} /> : <FaMars size={11} />}
      {isWomen ? "Women Only" : "Men Only"}
    </span>
  );
};

// ─── Helper: info tile ────────────────────────────────────────────────────────
const InfoTile = ({ label, value, icon: Icon, accent }) => (
  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-1">
    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase">
      {Icon && <Icon size={12} />}
      {label}
    </div>
    <p
      className={`font-bold text-base capitalize ${accent || "text-gray-800"}`}
    >
      {value || "—"}
    </p>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);

  const currentUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const authHeader = { authorization: `Bearer ${token}` };

  // ── Fetch property ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      try {
        const res = await axios.get(API_ROUTES.ACCOMMODATIONS.GET_BY_ID(id), {
          headers: authHeader,
        });
        if (res.data.data) {
          setProperty(res.data.data);
        } else {
          showAlert("Property not found.", "error");
          navigate("/homepage");
        }
      } catch (err) {
        console.error("Error fetching property details:", err);
        showAlert("Failed to load property details.", "error");
      } finally {
        setTimeout(() => setLoading(false), 200);
      }
    };
    fetchProperty();
  }, [id, navigate, showAlert]);

  // ── Check shortlist ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !id) return;
    const checkShortlist = async () => {
      try {
        const res = await axios.get(API_ROUTES.SHORTLIST.GET, {
          headers: authHeader,
        });
        const list = res.data.data || [];
        setIsShortlisted(
          list.some(
            (item) => item.property?._id === id || item.property === id,
          ),
        );
      } catch (err) {
        console.error("Shortlist check failed:", err);
      }
    };
    checkShortlist();
  }, [id, token]);

  // ── Toggle shortlist ───────────────────────────────────────────────────────
  const handleShortlistToggle = useCallback(async () => {
    if (!token) {
      showAlert("Please log in to shortlist properties.", "error");
      return;
    }
    setShortlistLoading(true);
    try {
      if (isShortlisted) {
        await axios.delete(API_ROUTES.SHORTLIST.REMOVE(id), {
          headers: authHeader,
        });
        setIsShortlisted(false);
        showAlert("Removed from shortlist.", "info");
      } else {
        await axios.post(
          API_ROUTES.SHORTLIST.ADD,
          { propertyId: id },
          { headers: authHeader },
        );
        setIsShortlisted(true);
        showAlert("Added to shortlist!", "success");
      }
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to update shortlist.",
        "error",
      );
    } finally {
      setShortlistLoading(false);
    }
  }, [id, isShortlisted, token, showAlert]);

  // ── Image navigation ───────────────────────────────────────────────────────
  const goToPrevSlide = (e) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1,
    );
  };
  const goToNextSlide = (e) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1,
    );
  };

  if (loading || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <FaSpinner className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">
          Loading property details...
        </p>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const isOwner =
    property.postedBy?._id === currentUserId ||
    property.postedBy === currentUserId;

  const isRoom = property.propertyType === "room";
  const roommateEnabled = property.roommateEnabled;
  const isSharing = property.roomSharingType === "sharing";
  const rp = {
    genderPreference: property.genderPreference,
    maxOccupants: property.maxOccupants,
    ageRange: property.ageRange,
    preferenceNotes: property.preferenceNotes,
  };
  const spotsLeft = isSharing
    ? Math.max(
        0,
        (property.maxOccupants ?? 2) - (property.currentOccupants ?? 1),
      )
    : null;

  const getImageUrl = (img) => `${IMAGE_BASE_URL}/${img.split(/[\\/]/).pop()}`;

  // ── Shared booking state passed to /booking route ─────────────────────────
  const baseBookingState = {
    propertyId: property._id,
    propertyTitle: property.title,
    rent: property.rent,
    deposit: property.deposit,      // ← added
    checkInDate: property.availableFrom,
    checkOutDate: property.availableTo,
    postedById: property.postedBy?._id || property.postedBy,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans">
      {/* ── IMAGE GALLERY ──────────────────────────────────────────────────── */}
      <div className="relative h-[50vh] md:h-[60vh] bg-gray-900 flex items-center justify-center overflow-hidden">
        {/* Back */}
        <button
          onClick={() => navigate("/homepage")}
          className="absolute top-6 left-6 z-20 bg-white/90 p-3 rounded-full text-secondary hover:bg-white shadow-lg transition"
        >
          <FaArrowLeft />
        </button>

        {/* Shortlist (top-right) */}
        {!isOwner && (
          <button
            onClick={handleShortlistToggle}
            disabled={shortlistLoading}
            className={`absolute top-6 right-6 z-20 p-3 rounded-full shadow-lg transition-all transform active:scale-90 ${
              isShortlisted
                ? "bg-primary text-white hover:bg-primary-dark"
                : "bg-white/90 text-gray-500 hover:bg-white hover:text-primary"
            }`}
          >
            {shortlistLoading ? (
              <FaSpinner className="animate-spin" size={18} />
            ) : isShortlisted ? (
              <FaBookmark size={18} />
            ) : (
              <FaRegBookmark size={18} />
            )}
          </button>
        )}

        {/* Women-only badge overlay on image */}
        {roommateEnabled && rp?.genderPreference === "women_only" && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
            <span className="inline-flex items-center gap-2 bg-pink-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
              <FaVenus size={12} /> Women Only Listing
            </span>
          </div>
        )}

        <div className="relative w-full h-full">
          {property?.images?.length > 0 ? (
            <>
              <img
                src={getImageUrl(property.images[activeImageIndex])}
                alt={property.title || "Property Image"}
                className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => setIsPreviewOpen(true)}
              />

              {property.images.length > 1 && (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {property.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(i);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === activeImageIndex
                          ? "bg-white scale-125"
                          : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}

              {property.images.length > 1 && (
                <>
                  <button
                    onClick={goToPrevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white text-gray-600 rounded-full shadow-md hover:bg-gray-100 transition z-10"
                  >
                    <FaChevronLeft size={18} />
                  </button>
                  <button
                    onClick={goToNextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white text-gray-600 rounded-full shadow-md hover:bg-gray-100 transition z-10"
                  >
                    <FaChevronRight size={18} />
                  </button>
                  <button
                    onClick={() => setIsPreviewOpen(true)}
                    className="absolute bottom-4 left-6 bg-white text-gray-600 px-4 py-2 rounded-full text-sm font-semibold shadow-md hover:bg-gray-100 transition z-10"
                  >
                    {property.images.length} Photos
                  </button>
                </>
              )}

              <div className="absolute bottom-4 right-6 bg-black/60 text-white px-4 py-1 rounded-full text-sm backdrop-blur-sm">
                {activeImageIndex + 1} / {property.images.length}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No images available
            </div>
          )}
        </div>
      </div>

      {/* ── FULL-SCREEN PREVIEW ────────────────────────────────────────────── */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10"
          onClick={() => setIsPreviewOpen(false)}
        >
          <button
            className="absolute top-6 right-6 text-white text-3xl hover:text-primary transition z-[110]"
            onClick={() => setIsPreviewOpen(false)}
          >
            <FaTimes />
          </button>

          {property.images.length > 1 && (
            <>
              <button
                onClick={goToPrevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition z-[110]"
              >
                <FaChevronLeft size={22} />
              </button>
              <button
                onClick={goToNextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition z-[110]"
              >
                <FaChevronRight size={22} />
              </button>
            </>
          )}

          <img
            src={getImageUrl(property.images[activeImageIndex])}
            alt="Full Preview"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />

          {property.images.length > 1 && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-[110]"
              onClick={(e) => e.stopPropagation()}
            >
              {property.images.map((img, i) => (
                <img
                  key={i}
                  src={getImageUrl(img)}
                  alt={`thumb-${i}`}
                  onClick={() => setActiveImageIndex(i)}
                  className={`w-14 h-10 object-cover rounded-lg cursor-pointer transition-all border-2 ${
                    i === activeImageIndex
                      ? "border-primary opacity-100"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <div className="w-[95%] 2xl:max-w-[1200px] mx-auto px-4 md:px-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ══════════════ LEFT COLUMN ══════════════ */}
          <div className="w-full lg:w-2/3 space-y-6">
            {/* Title + location */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <h1 className="text-3xl font-bold text-secondary">
                  {property.title}
                </h1>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-bold uppercase px-3 py-1.5 bg-secondary text-white rounded-full capitalize">
                    {property.propertyType}
                  </span>
                  {property.postType && (
                    <span className="text-xs font-bold uppercase px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                      {property.postType === "owner"
                        ? "Owner Post"
                        : "Resident Post"}
                    </span>
                  )}
                  {roommateEnabled && (
                    <GenderBadge preference={rp?.genderPreference} />
                  )}
                </div>
              </div>

              <div className="flex items-center text-gray-500 mb-2">
                <FaMapMarkerAlt className="text-primary mr-2 shrink-0" />
                <span className="text-base">
                  {property.fullAddress ? `${property.fullAddress}, ` : ""}
                  {property.area}, {property.city}
                  {property.province ? `, ${property.province}` : ""}
                  {property.country ? `, ${property.country}` : ""}
                </span>
              </div>
            </div>

            {/* ── Property Info grid ── */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-secondary mb-5">
                Property Info
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InfoTile
                  label="Property Type"
                  value={property.propertyType}
                  icon={FaHome}
                />
                {isRoom && (
                  <InfoTile
                    label="Room Arrangement"
                    value={isSharing ? "Shared Room" : "Single Occupancy"}
                    icon={isSharing ? FaUsers : FaDoorOpen}
                  />
                )}
                {isRoom && isSharing && (
                  <InfoTile
                    label="Max Occupants"
                    value={`${rp?.maxOccupants ?? "—"} people`}
                    icon={FaUserFriends}
                  />
                )}
                {isRoom && isSharing && spotsLeft !== null && (
                  <InfoTile
                    label="Spots Left"
                    value={spotsLeft > 0 ? `${spotsLeft} available` : "Full"}
                    icon={FaBed}
                    accent={spotsLeft > 0 ? "text-green-600" : "text-red-500"}
                  />
                )}
                <InfoTile
                  label="Security Deposit"
                  value={
                    property.deposit > 0
                      ? `₨ ${Number(property.deposit).toLocaleString()}`
                      : "None"
                  }
                  icon={FaShieldAlt}
                />
                <InfoTile
                  label="Available From"
                  value={new Date(property.availableFrom).toLocaleDateString(
                    "en-PK",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                  icon={FaCalendarAlt}
                />
                <InfoTile
                  label="Available Until"
                  value={new Date(property.availableTo).toLocaleDateString(
                    "en-PK",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                  icon={FaCalendarAlt}
                />
              </div>
            </div>

            {/* ── Roommate Matching section ── */}
            {roommateEnabled && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <FaUsers className="text-primary" size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-secondary">
                    Roommate Matching
                  </h3>
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    Open
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                  <InfoTile
                    label="Gender Preference"
                    value={
                      rp?.genderPreference === "women_only"
                        ? "Women Only"
                        : rp?.genderPreference === "men_only"
                          ? "Men Only"
                          : "Any Gender"
                    }
                    icon={FaVenusMars}
                    accent={
                      rp?.genderPreference === "women_only"
                        ? "text-pink-600"
                        : rp?.genderPreference === "men_only"
                          ? "text-blue-600"
                          : "text-gray-800"
                    }
                  />
                  {rp?.ageRange && (
                    <InfoTile
                      label="Age Range"
                      value={`${rp.ageRange.min} – ${rp.ageRange.max} yrs`}
                      icon={FaUserFriends}
                    />
                  )}
                  {isSharing && (
                    <InfoTile
                      label="Spots Available"
                      value={
                        spotsLeft > 0
                          ? `${spotsLeft} of ${rp?.maxOccupants}`
                          : "Full"
                      }
                      icon={FaBed}
                      accent={spotsLeft > 0 ? "text-green-600" : "text-red-500"}
                    />
                  )}
                </div>

                {rp?.preferenceNotes && (
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex gap-3">
                    <FaStickyNote
                      className="text-primary shrink-0 mt-0.5"
                      size={16}
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                        Lifestyle & House Rules
                      </p>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {rp.preferenceNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Amenities ── */}
            {property.amenities?.length > 0 && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-secondary mb-5">
                  Amenities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100"
                    >
                      <FaCheckCircle
                        className="text-primary shrink-0"
                        size={14}
                      />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {amenity.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Visit Slots ── */}
            {property.visitSlots?.length > 0 && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-xl font-bold text-secondary mb-5">
                  Available Visit Slots
                </h3>
                <div className="space-y-3">
                  {property.visitSlots.map((day, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
                    >
                      <p className="text-sm font-bold text-secondary mb-2 flex items-center gap-2">
                        <FaCalendarAlt className="text-primary" size={12} />
                        {new Date(day.date).toLocaleDateString("en-PK", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {day.slots.map((slot, j) => (
                          <span
                            key={j}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                              slot.isBooked
                                ? "bg-red-50 text-red-400 border-red-100 line-through"
                                : "bg-green-50 text-green-700 border-green-100"
                            }`}
                          >
                            {slot.startTime} – {slot.endTime}
                            {slot.isBooked ? " (Booked)" : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Description ── */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-secondary mb-3">
                Description
              </h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>
          </div>

          {/* ══════════════ RIGHT COLUMN (sticky card) ══════════════ */}
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-primary/10 lg:sticky lg:top-8">
              {/* Rent */}
              <div className="mb-6">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">
                  Monthly Rent{isRoom && isSharing ? " (per person)" : ""}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-secondary">
                    ₨ {Number(property.rent).toLocaleString()}
                  </span>
                  <span className="text-gray-400 text-sm">/ month</span>
                </div>
                {property.deposit > 0 && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <FaShieldAlt size={10} />₨{" "}
                    {Number(property.deposit).toLocaleString()} security deposit
                  </p>
                )}
              </div>

              {/* Roommate spots pill */}
              {roommateEnabled && isSharing && (
                <div
                  className={`mb-5 flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl border ${
                    spotsLeft > 0
                      ? "bg-green-50 text-green-700 border-green-100"
                      : "bg-red-50 text-red-500 border-red-100"
                  }`}
                >
                  <FaUsers size={14} />
                  {spotsLeft > 0
                    ? `${spotsLeft} spot${spotsLeft > 1 ? "s" : ""} available`
                    : "Room is full"}
                </div>
              )}

              <div className="space-y-3">
                {/* ── CTA buttons ── */}
                {isOwner ? (
                  <div className="w-full py-4 bg-gray-100 text-gray-400 rounded-xl font-bold text-base text-center cursor-not-allowed border border-gray-200">
                    You own this property
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      navigate("/booking/" + property._id, {
                        state: {
                          ...baseBookingState,
                          isRoommateRequest:
                            isRoom && roommateEnabled && isSharing,
                        },
                      })
                    }
                    disabled={isRoom && isSharing && spotsLeft === 0}
                    className={`w-full py-4 rounded-xl font-bold text-base transition-all transform active:scale-95 ${
                      isRoom && isSharing && spotsLeft === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                        : "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark"
                    }`}
                  >
                    {isRoom && isSharing && spotsLeft === 0
                      ? "Room Full"
                      : "Book Now"}
                  </button>
                )}

                <button
                  onClick={() => navigate(`/property/${id}/request-visit`)}
                  className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-base shadow-lg hover:bg-green-700 transition-all transform active:scale-95"
                >
                  Request a Visit
                </button>

                {!isOwner && (
                  <button
                    onClick={handleShortlistToggle}
                    disabled={shortlistLoading}
                    className={`w-full py-4 rounded-xl font-bold text-base transition-all transform active:scale-95 flex items-center justify-center gap-3 border-2 ${
                      isShortlisted
                        ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                        : "bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    {shortlistLoading ? (
                      <FaSpinner className="animate-spin" size={16} />
                    ) : isShortlisted ? (
                      <FaBookmark size={16} />
                    ) : (
                      <FaRegBookmark size={16} />
                    )}
                    {isShortlisted ? "Shortlisted" : "Save to Shortlist"}
                  </button>
                )}

                {!isOwner && (
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="w-full py-4 bg-secondary text-white rounded-xl font-bold text-base hover:bg-black transition-all transform active:scale-95"
                  >
                    Chat with Owner
                  </button>
                )}
              </div>

              {/* Owner info */}
              <div
                onClick={() =>
                  navigate(
                    `/owner/${property.postedBy?._id || property.postedBy}`,
                  )
                }
                className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-4 cursor-pointer group"
              >
                <div className="bg-gray-100 p-2 rounded-full">
                  <FaUserCircle className="w-12 h-12 text-gray-400" />
                </div>
                <div>
                  <h4 className="font-bold text-secondary group-hover:text-primary transition">
                    {property.postedBy?.name ||
                      property.postedBy?.fullName ||
                      "Owner"}
                  </h4>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-tight mt-0.5">
                    {property.postType === "resident"
                      ? "Verified Resident"
                      : "Verified Property Owner"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isChatOpen && (
        <Chat
          onClose={() => setIsChatOpen(false)}
          productId={id}
          postedBy={property.postedBy}
        />
      )}
    </div>
  );
};

export default PropertyDetails;