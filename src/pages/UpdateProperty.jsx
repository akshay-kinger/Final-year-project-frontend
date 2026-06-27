import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaCloudUploadAlt,
  FaTimes,
  FaHome,
  FaMoneyBillWave,
  FaList,
  FaPlus,
  FaArrowRight,
  FaArrowLeft,
  FaCheckCircle,
  FaUser,
  FaUsers,
  FaVenusMars,
  FaVenus,
  FaBed,
  FaDoorOpen,
  FaUserFriends,
  FaStickyNote,
  FaCalendarAlt,
} from "react-icons/fa";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { API_ROUTES, IMAGE_BASE_URL } from "../api/apiRoutes";

// ─── Constants ────────────────────────────────────────────────────────────────
const LOCATIONS = ["Karachi", "Hyderabad", "Sukkur"];
const AREAS = {
  Karachi: [
    "Clifton Block 8",
    "Clifton Block 9",
    "DHA Phase 1",
    "DHA Phase 5",
    "Cant Station",
  ],
  Hyderabad: ["Qasimabad", "Latifabad", "Tando Jam"],
  Sukkur: ["New Sukkur", "Sukkur City", "Rohri"],
};
const STEP_LABELS = ["Basic Info", "Location", "Pricing", "Roommate & Media"];

const getLocalDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

// ─────────────────────────────────────────────────────────────────────────────
const UpdateProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const { showAlert } = useAlert();

  const today = getLocalDate();
  const totalSteps = 4;

  // ── UI state ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // ── Image state ────────────────────────────────────────────────────────────
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [previousImages, setPreviousImages] = useState([]);

  // ── Amenity state ──────────────────────────────────────────────────────────
  const [amenities, setAmenities] = useState({});
  const [customAmenity, setCustomAmenity] = useState("");

  // ── Visit slot state ───────────────────────────────────────────────────────
  const [visitSlots, setVisitSlots] = useState([]);
  const [allowMultipleVisits, setAllowMultipleVisits] = useState(false);
  const [slotDate, setSlotDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // ── Form data ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    postType: "owner",
    propertyType: "flat",
    roomSharingType: "single",
    country: "Pakistan",
    province: "",
    city: "",
    area: "",
    fullAddress: "",
    rent: "",
    deposit: "",
    availableFrom: "",
    availableTo: "",
    // Roommate matching
    roommateEnabled: false,
    genderPreference: "any",
    ownerGender: "",
    maxOccupants: 2,
    preferenceNotes: "",
    ageRange: { min: 18, max: 40 },
  });

  // ── Fetch property & hydrate ───────────────────────────────────────────────
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await axios.get(API_ROUTES.ACCOMMODATIONS.GET_BY_ID(id), {
          headers: { authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const prop = res.data.data;
        const rp = prop.roommatePreference || {};

        setFormData({
          title: prop.title || "",
          description: prop.description || "",
          postType: prop.postType || "owner",
          propertyType: prop.propertyType || "flat",
          roomSharingType:
            rp.roomSharingType || prop.roomSharingType || "single",
          country: prop.country || "Pakistan",
          province: prop.province || "",
          city: prop.city || "",
          area: prop.area || "",
          fullAddress: prop.fullAddress || "",
          rent: prop.rent || "",
          deposit: prop.deposit || "",
          availableFrom: prop.availableFrom?.split("T")[0] || "",
          availableTo: prop.availableTo?.split("T")[0] || "",
          // Roommate
          roommateEnabled: rp.enabled || false,
          genderPreference: rp.genderPreference || "any",
          ownerGender: rp.ownerGender || "",
          maxOccupants: rp.maxOccupants || 2,
          preferenceNotes: rp.preferenceNotes || "",
          ageRange: rp.ageRange || { min: 18, max: 40 },
        });

        const amns = {};
        prop.amenities?.forEach((a) => (amns[a] = true));
        setAmenities(amns);

        setVisitSlots(prop.visitSlots || []);
        setAllowMultipleVisits(prop.allowMultipleVisits || false);
        setPreviousImages(prop.images || []);
        setPreviews(prop.images || []);
      } catch (err) {
        console.error(err);
        showAlert("Failed to fetch property", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) return "Property Title is required.";
        if (!formData.description.trim()) return "Description is required.";
        return null;
      case 2:
        if (!formData.city) return "Please select a city.";
        if (!formData.area) return "Please select an area.";
        if (!formData.fullAddress.trim()) return "Full address is required.";
        if (!formData.province.trim()) return "Province is required.";
        return null;
      case 3:
        if (!formData.rent || Number(formData.rent) <= 0)
          return "Monthly rent must be greater than 0.";
        if (!formData.availableFrom)
          return "Please select an 'Available From' date.";
        if (!formData.availableTo)
          return "Please select an 'Available Until' date.";
        if (formData.availableTo < formData.availableFrom)
          return "End date cannot be earlier than start date.";
        return null;
      case 4:
        if (previews.length === 0)
          return "At least one property photo is required.";
        if (formData.roommateEnabled && !formData.ownerGender)
          return "Please select your gender for roommate matching.";
        return null;
      default:
        return null;
    }
  };

  const nextStep = (e) => {
    e.preventDefault();
    const error = validateStep();
    if (error) {
      showAlert(error, "warning");
      return;
    }
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // ── Input handlers ─────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleRoommate = () => {
    setFormData((prev) => ({
      ...prev,
      roommateEnabled: !prev.roommateEnabled,
    }));
  };

  const handleAmenityChange = (name) => {
    setAmenities((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleAddAmenity = () => {
    if (!customAmenity.trim()) return;
    const key = customAmenity.toLowerCase().replace(/\s+/g, "_");
    setAmenities((prev) => ({ ...prev, [key]: true }));
    setCustomAmenity("");
  };

  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...newFiles]);
    const newBlobs = newFiles.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newBlobs]);
  };

  const removeImage = (index) => {
    if (index < previousImages.length) {
      const updatedPrev = previousImages.filter((_, i) => i !== index);
      setPreviousImages(updatedPrev);
      setPreviews([
        ...updatedPrev,
        ...files.map((f) => URL.createObjectURL(f)),
      ]);
    } else {
      const fileIndex = index - previousImages.length;
      const updatedFiles = files.filter((_, i) => i !== fileIndex);
      setFiles(updatedFiles);
      setPreviews([
        ...previousImages,
        ...updatedFiles.map((f) => URL.createObjectURL(f)),
      ]);
    }
  };

  // ── Visit slot handlers ────────────────────────────────────────────────────
  const addVisitSlot = () => {
    if (!slotDate || !startTime || !endTime) {
      showAlert("Please fill in all slot details.", "warning");
      return;
    }
    setVisitSlots((prev) => {
      const existingDay = prev.find((d) => d.date === slotDate);
      if (existingDay) {
        return prev.map((d) =>
          d.date === slotDate
            ? {
                ...d,
                slots: [...d.slots, { startTime, endTime, isBooked: false }],
              }
            : d,
        );
      }
      return [
        ...prev,
        { date: slotDate, slots: [{ startTime, endTime, isBooked: false }] },
      ];
    });
    setStartTime("");
    setEndTime("");
  };

  const removeSlot = (date, index) => {
    setVisitSlots((prev) =>
      prev
        .map((d) =>
          d.date === date
            ? { ...d, slots: d.slots.filter((_, i) => i !== index) }
            : d,
        )
        .filter((d) => d.slots.length > 0),
    );
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (step < totalSteps) return;
    const error = validateStep();
    if (error) {
      showAlert(error, "warning");
      return;
    }

    setUpdating(true);
    showLoader();

    try {
      const data = new FormData();

      Object.keys(formData).forEach((key) => {
        const value = formData[key];
        if (key === "ageRange") {
          data.append("ageRange", JSON.stringify(value));
        } else if (value === null || value === undefined) {
          data.append(key, "");
        } else {
          data.append(key, value);
        }
      });

      Object.keys(amenities)
        .filter((k) => amenities[k])
        .forEach((a) => data.append("amenities[]", a));

      files.forEach((file) => data.append("images", file));
      data.append("previousImages", JSON.stringify(previousImages));
      data.append("visitSlots", JSON.stringify(visitSlots));
      data.append("allowMultipleVisits", allowMultipleVisits);

      await axios.put(API_ROUTES.ACCOMMODATIONS.UPDATE(id), data, {
        headers: {
          "Content-Type": "multipart/form-data",
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      showAlert("Property updated successfully!", "success");
      navigate("/my-properties");
    } catch (err) {
      console.error(err);
      showAlert(
        err.response?.data?.message || "Failed to update property",
        "error",
      );
    } finally {
      setUpdating(false);
      hideLoader();
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const isRoom = formData.propertyType === "room";

  const getImageUrl = (img) =>
    img.startsWith("blob:")
      ? img
      : `${IMAGE_BASE_URL}/${img.split(/[\\/]/).pop()}`;

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium animate-pulse">
            Loading property...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
        {/* ── HEADER / STEPPER ── */}
        <div className="bg-secondary p-8 text-center relative">
          <div className="flex justify-between items-center max-w-xs mx-auto mb-4">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className="flex flex-col items-center relative z-10"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    step >= num
                      ? "bg-primary text-secondary scale-110"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {step > num ? <FaCheckCircle size={20} /> : num}
                </div>
              </div>
            ))}
            <div className="absolute top-[3.25rem] left-1/2 -translate-x-1/2 w-[60%] h-1 bg-gray-700 -z-0">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Step {step}: Update {STEP_LABELS[step - 1]}
          </h1>
        </div>

        <form onSubmit={handleUpdate} className="p-8 md:p-12">
          {/* ════ STEP 1: BASIC INFO ════ */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Post type */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    value: "owner",
                    label: "I'm the Owner",
                    icon: <FaUser size={32} />,
                  },
                  {
                    value: "resident",
                    label: "I'm a Resident",
                    icon: <FaHome size={32} />,
                  },
                ].map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, postType: value })
                    }
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                      formData.postType === value
                        ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                        : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <span
                      className={
                        formData.postType === value
                          ? "text-primary"
                          : "text-gray-400"
                      }
                    >
                      {icon}
                    </span>
                    <span className="font-bold text-secondary">{label}</span>
                  </button>
                ))}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 uppercase">
                  Property Title
                </label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Sunny Studio Apartment"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-lg"
                  onChange={handleInputChange}
                  value={formData.title}
                />
              </div>

              {/* Property type */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 uppercase">
                  Property Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["flat", "room", "house"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          propertyType: type,
                          roomSharingType:
                            type === "room"
                              ? formData.roomSharingType
                              : "single",
                        })
                      }
                      className={`py-3 px-4 rounded-xl border-2 capitalize font-bold transition-all ${
                        formData.propertyType === type
                          ? "border-primary text-primary bg-primary/5"
                          : "border-gray-100 text-gray-400"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Room arrangement — only for room type */}
              {isRoom && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <label className="block text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                    <FaBed className="text-primary" /> Room Arrangement
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        value: "single",
                        label: "Single Occupancy",
                        sub: "Entire room for one person",
                        icon: <FaDoorOpen size={26} />,
                      },
                      {
                        value: "sharing",
                        label: "Shared Room",
                        sub: "Room split between multiple tenants",
                        icon: <FaUsers size={26} />,
                      },
                    ].map(({ value, label, sub, icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, roomSharingType: value })
                        }
                        className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-start gap-2 text-left ${
                          formData.roomSharingType === value
                            ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                            : "border-gray-100 bg-gray-50"
                        }`}
                      >
                        <span
                          className={
                            formData.roomSharingType === value
                              ? "text-primary"
                              : "text-gray-400"
                          }
                        >
                          {icon}
                        </span>
                        <span className="font-bold text-sm">{label}</span>
                        <span className="text-xs text-gray-400">{sub}</span>
                      </button>
                    ))}
                  </div>

                  {formData.roomSharingType === "sharing" && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <label className="block text-sm font-bold text-gray-400 uppercase">
                        Max Occupants (including yourself)
                      </label>
                      <select
                        name="maxOccupants"
                        className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none"
                        value={formData.maxOccupants}
                        onChange={handleInputChange}
                      >
                        {[2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} people
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 uppercase">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="4"
                  required
                  placeholder="Describe the vibe of your place..."
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none"
                  onChange={handleInputChange}
                  value={formData.description}
                />
              </div>
            </div>
          )}

          {/* ════ STEP 2: LOCATION ════ */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase">
                    City
                  </label>
                  <select
                    name="city"
                    required
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none"
                    onChange={handleInputChange}
                    value={formData.city}
                  >
                    <option value="">Select City</option>
                    {LOCATIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase">
                    Area
                  </label>
                  <select
                    name="area"
                    required
                    disabled={!formData.city}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none"
                    onChange={handleInputChange}
                    value={formData.area}
                  >
                    <option value="">Select Area</option>
                    {AREAS[formData.city]?.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase">
                  Full Address
                </label>
                <input
                  name="fullAddress"
                  required
                  placeholder="e.g. 123 Clifton Block 2, Karachi"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none"
                  onChange={handleInputChange}
                  value={formData.fullAddress}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <input
                  name="province"
                  required
                  placeholder="Province"
                  className="p-4 bg-gray-50 border-none rounded-2xl outline-none"
                  onChange={handleInputChange}
                  value={formData.province}
                />
                <input
                  name="country"
                  disabled
                  className="p-4 bg-gray-200 border-none rounded-2xl outline-none cursor-not-allowed"
                  value={formData.country}
                />
              </div>
            </div>
          )}

          {/* ════ STEP 3: PRICING ════ */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-6 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                <div className="p-4 bg-primary text-secondary rounded-2xl shadow-lg shadow-primary/20">
                  <FaMoneyBillWave size={28} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-500 uppercase mb-1">
                    Monthly Rent (PKR)
                    {isRoom && formData.roomSharingType === "sharing"
                      ? " — per person"
                      : ""}
                  </label>
                  <input
                    type="number"
                    name="rent"
                    required
                    min="1"
                    placeholder="0.00"
                    className="w-full bg-transparent border-none text-3xl font-black focus:ring-0 outline-none p-0"
                    onChange={handleInputChange}
                    value={formData.rent}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase">
                  Security Deposit (Optional)
                </label>
                <input
                  type="number"
                  name="deposit"
                  min="0"
                  placeholder="0.00"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none"
                  onChange={handleInputChange}
                  value={formData.deposit}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase text-xs">
                    Available From
                  </label>
                  <input
                    type="date"
                    name="availableFrom"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                    onChange={handleInputChange}
                    value={formData.availableFrom}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase text-xs">
                    Available Until
                  </label>
                  <input
                    type="date"
                    name="availableTo"
                    min={formData.availableFrom || today}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                    onChange={handleInputChange}
                    value={formData.availableTo}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ════ STEP 4: ROOMMATE + AMENITIES + VISIT SLOTS + MEDIA ════ */}
          {step === 4 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* ── Roommate Matching ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase">
                    <FaUsers className="text-primary" /> Roommate Matching
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleRoommate}
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                      formData.roommateEnabled ? "bg-primary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
                        formData.roommateEnabled
                          ? "translate-x-7"
                          : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {formData.roommateEnabled && (
                  <div className="bg-gray-50 rounded-3xl p-6 space-y-6 border border-gray-100 animate-in fade-in duration-300">
                    {/* Gender preference */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                        <FaVenusMars /> Preferred Roommate Gender
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: "any", label: "Any Gender" },
                          { value: "women_only", label: "Women Only" },
                          { value: "men_only", label: "Men Only" },
                        ].map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                genderPreference: value,
                              })
                            }
                            className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${
                              formData.genderPreference === value
                                ? value === "women_only"
                                  ? "border-pink-400 text-pink-600 bg-pink-50"
                                  : "border-primary text-primary bg-primary/5"
                                : "border-gray-100 text-gray-400"
                            }`}
                          >
                            {value === "women_only" && (
                              <FaVenus className="inline mr-1 text-pink-400" />
                            )}
                            {label}
                          </button>
                        ))}
                      </div>
                      {formData.genderPreference === "women_only" && (
                        <p className="text-xs text-pink-500 bg-pink-50 border border-pink-100 rounded-xl px-4 py-2 animate-in fade-in duration-200">
                          🔒 This listing will only be visible to women in the
                          roommate search.
                        </p>
                      )}
                    </div>

                    {/* Owner gender */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 uppercase">
                        Your Gender
                      </label>
                      <select
                        name="ownerGender"
                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none"
                        value={formData.ownerGender}
                        onChange={handleInputChange}
                      >
                        <option value="">Select your gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other / Prefer not to say</option>
                      </select>
                    </div>

                    {/* Age range */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-400 uppercase">
                        Preferred Age Range of Roommate
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">
                            Min Age
                          </label>
                          <input
                            type="number"
                            min={18}
                            max={formData.ageRange.max}
                            value={formData.ageRange.min}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ageRange: {
                                  ...formData.ageRange,
                                  min: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">
                            Max Age
                          </label>
                          <input
                            type="number"
                            min={formData.ageRange.min}
                            max={80}
                            value={formData.ageRange.max}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ageRange: {
                                  ...formData.ageRange,
                                  max: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preference notes */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                        <FaStickyNote size={12} /> Lifestyle & House Rules
                        (Optional)
                      </label>
                      <textarea
                        name="preferenceNotes"
                        rows="3"
                        placeholder="e.g. Non-smoker preferred, early riser, no pets, students OK..."
                        className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none text-sm"
                        onChange={handleInputChange}
                        value={formData.preferenceNotes}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Amenities ── */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <FaList className="text-primary" /> Update Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.keys(amenities).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleAmenityChange(key)}
                      className={`p-4 rounded-2xl border-2 transition-all font-bold capitalize ${
                        amenities[key]
                          ? "bg-primary border-primary text-secondary shadow-lg shadow-primary/20"
                          : "bg-white border-gray-100 text-gray-400"
                      }`}
                    >
                      {key.replaceAll("_", " ")}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom amenity..."
                    className="flex-1 p-3 bg-gray-50 rounded-xl outline-none"
                    value={customAmenity}
                    onChange={(e) => setCustomAmenity(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddAmenity}
                    className="p-3 bg-secondary text-white rounded-xl"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>

              {/* ── Visit Slots ── */}
              <div className="space-y-4">
                <label className="text-sm font-bold uppercase text-gray-700 flex items-center gap-2">
                  <FaCalendarAlt className="text-primary" /> Visit Slots
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="multipleVisits"
                    checked={allowMultipleVisits}
                    onChange={() =>
                      setAllowMultipleVisits(!allowMultipleVisits)
                    }
                  />
                  <label
                    htmlFor="multipleVisits"
                    className="font-medium cursor-pointer text-sm"
                  >
                    Allow multiple visits per slot
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="date"
                    min={today}
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    className="p-2 border rounded-xl text-sm"
                  />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="p-2 border rounded-xl text-sm"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="p-2 border rounded-xl text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={addVisitSlot}
                  className="bg-black text-white px-4 py-2 rounded-xl font-bold text-sm"
                >
                  Add Visit Slot
                </button>

                {visitSlots.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {visitSlots.map((day, i) => (
                      <div
                        key={i}
                        className="bg-gray-50 p-4 rounded-2xl border border-gray-200"
                      >
                        <h4 className="font-bold text-secondary mb-2 text-sm flex items-center gap-2">
                          <FaCalendarAlt className="text-primary" size={11} />
                          {new Date(day.date).toDateString()}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {day.slots.map((slot, j) => (
                            <div
                              key={j}
                              className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-medium ${
                                slot.isBooked
                                  ? "bg-red-50 border-red-100 text-red-400"
                                  : "bg-white border-gray-200 text-gray-700"
                              }`}
                            >
                              <span>
                                {slot.startTime} – {slot.endTime}
                              </span>
                              {slot.isBooked && (
                                <span className="text-red-400">(Booked)</span>
                              )}
                              {!slot.isBooked && (
                                <button
                                  type="button"
                                  onClick={() => removeSlot(day.date, j)}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <FaTimes size={10} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Photo Management ── */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <FaCloudUploadAlt className="text-primary" /> Manage Photos
                </label>
                {previews.length === 0 && (
                  <p className="text-xs text-red-400 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                    At least one photo is required.
                  </p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="h-28 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-300 hover:border-primary hover:text-primary transition-all cursor-pointer">
                    <FaCloudUploadAlt size={30} />
                    <span className="text-[10px] font-bold mt-1 uppercase">
                      Add New
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                  {previews.map((img, i) => (
                    <div
                      key={i}
                      className="relative h-28 rounded-3xl overflow-hidden group shadow-md border border-gray-100"
                    >
                      <img
                        src={getImageUrl(img)}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        alt={`Preview ${i + 1}`}
                      />
                      {/* Badge: existing vs new */}
                      <span
                        className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          img.startsWith("blob:")
                            ? "bg-green-500 text-white"
                            : "bg-black/50 text-white"
                        }`}
                      >
                        {img.startsWith("blob:") ? "New" : "Saved"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ── */}
          <div className="mt-12 flex justify-between gap-4">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-4 border-2 border-secondary text-secondary rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
              >
                <FaArrowLeft /> Back
              </button>
            )}
            {step < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-[2] py-4 bg-secondary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl shadow-secondary/20"
              >
                Continue <FaArrowRight />
              </button>
            ) : (
              <button
                type="submit"
                disabled={updating}
                className="flex-[2] py-4 bg-primary text-secondary rounded-2xl font-black text-lg uppercase tracking-wider hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {updating ? "Saving Changes..." : "Update Property Listing"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProperty;
