import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaCloudUploadAlt,
  FaTimes,
  FaHome,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaCalendarAlt,
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
} from "react-icons/fa";
import { useLoader } from "../context/LoaderContext";
import { useAlert } from "../context/AlertContext";
import { API_ROUTES } from "../api/apiRoutes";

// ─── Constants ───────────────────────────────────────────────────────────────
const LOCATIONS = [
  "Karachi",
  "Hyderabad",
  "Sukkur",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Gujranwala",
  "Sialkot",
  "Peshawar",
  "Abbottabad",
  "Mardan",
  "Quetta",
  "Gwadar",
  "Muzaffarabad",
];

const AREAS = {
  Karachi: [
    "Clifton Block 8",
    "Clifton Block 9",
    "DHA Phase 1",
    "DHA Phase 5",
    "Cant Station",
    "Gulshan-e-Iqbal",
    "North Nazimabad",
    "Korangi",
    "Malir",
    "Saddar",
    "Lyari",
    "Orangi Town",
    "Baldia",
    "SITE Area",
    "Landhi",
  ],
  Hyderabad: [
    "Qasimabad",
    "Latifabad",
    "Tando Jam",
    "Hirabad",
    "Hussainabad",
    "Phuleli",
    "Naseem Nagar",
    "City Court Area",
    "Gul Centre",
    "Old City Area",
  ],
  Sukkur: [
    "New Sukkur",
    "Sukkur City",
    "Rohri",
    "Minara Road",
    "Ghanta Ghar",
    "Clock Tower",
    "Labour Colony",
  ],
  Lahore: [
    "DHA Lahore",
    "Gulberg",
    "Model Town",
    "Johar Town",
    "Bahria Town",
    "Cantt",
    "Iqbal Town",
    "Garden Town",
    "Wapda Town",
    "Township",
    "Faisal Town",
    "Shadman",
    "Samanabad",
    "Data Nagar",
    "Allama Iqbal Town",
  ],
  Islamabad: [
    "F-6",
    "F-7",
    "F-8",
    "F-10",
    "G-9",
    "G-10",
    "G-11",
    "I-8",
    "E-7",
    "Blue Area",
    "DHA Islamabad",
    "Bahria Town",
    "PWD Colony",
    "Bani Gala",
    "Saidpur Village",
  ],
  Rawalpindi: [
    "Saddar",
    "Westridge",
    "Chaklala",
    "Gulraiz",
    "Bahria Town",
    "DHA",
    "Khayaban-e-Sir Syed",
    "Satellite Town",
    "Waris Khan",
    "Dhoke Syedan",
    "Commercial Market",
  ],
  Faisalabad: [
    "D-Ground",
    "Gulberg",
    "Peoples Colony",
    "Susan Road",
    "Ghulam Muhammad Abad",
    "Batala Colony",
    "Madina Town",
    "Jinnah Colony",
    "Liaquat Colony",
    "Canal Road",
  ],
  Multan: [
    "Cantt",
    "Gulgasht Colony",
    "Shah Rukn-e-Alam",
    "New Multan",
    "Bosan Road",
    "Vehari Road",
    "Chungi No. 9",
    "Hussain Agahi",
    "Old City",
    "Bahauddin Zakariya University Area",
  ],
  Gujranwala: [
    "Civil Lines",
    "Model Town",
    "Satellite Town",
    "Peoples Colony",
    "G.T. Road",
    "Wapda Town",
    "Gulshan Iqbal",
    "Gondlanwala Road",
  ],
  Sialkot: [
    "Cantt",
    "Sambrial",
    "Daska",
    "Badiana",
    "Ugoki",
    "Paris Road",
    "Kashmir Road",
    "Iqbal Road",
  ],
  Peshawar: [
    "Hayatabad",
    "University Town",
    "Saddar",
    "Cantonment",
    "Dalazak Road",
    "Ring Road",
    "Board Bazar",
    "Namak Mandi",
    "Kohati Gate",
    "Warsak Road",
  ],
  Abbottabad: [
    "Cantt",
    "Nawan Shehr",
    "Kakul",
    "Supply",
    "Mandian",
    "Havelian",
    "Lower Cantt",
    "Upper Cantt",
    "Mirpur Road",
  ],
  Mardan: [
    "Gulbahar",
    "Rustam",
    "Katlang",
    "Takht Bhai",
    "Industrial Area",
    "Model Town",
    "University Road",
  ],
  Quetta: [
    "Satellite Town",
    "Jinnah Town",
    "Airport Road",
    "Cantt",
    "Sariab Road",
    "Alamdar Road",
    "Western Bypass",
    "Marriabad",
    "Brewery Road",
    "City Centre",
  ],
  Gwadar: [
    "New Town",
    "Old Town",
    "Fisheries Area",
    "CPEC Zone",
    "Sangar",
    "Pasni Road",
    "Airport Road",
  ],
  Muzaffarabad: [
    "City Centre",
    "Chattar",
    "Abbaspur",
    "Neelum Valley",
    "Sudhan Gali",
    "Upper Chattar",
    "Chehla Bandi",
  ],
};

const PROPERTY_TYPES = ["flat", "room", "house"];

// Step labels now include the new Roommate step (step 4 for rooms)
const STEP_LABELS = ["Basic Info", "Location", "Pricing", "Roommate & Media"];

// ─── Helper ───────────────────────────────────────────────────────────────────
const getLocalDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

// ─── Component ────────────────────────────────────────────────────────────────
const AddProperty = () => {
  const navigate = useNavigate();
  const { showLoader, hideLoader } = useLoader();
  const { showAlert } = useAlert();

  const today = getLocalDate();
  const totalSteps = 4;

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [customAmenity, setCustomAmenity] = useState("");
  const [allowMultipleVisits, setAllowMultipleVisits] = useState(false);
  const [visitSlots, setVisitSlots] = useState([]);
  const [slotDate, setSlotDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [amenities, setAmenities] = useState({
    wifi: false,
    parking: false,
    ac: false,
    kitchen: false,
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    postType: "owner", // "owner" | "resident"
    propertyType: "flat", // "flat" | "room" | "house"
    roomSharingType: "single", // "single" | "sharing"  — only relevant for propertyType === "room"
    country: "Pakistan",
    province: "",
    city: "",
    area: "",
    fullAddress: "",
    rent: "",
    deposit: "",
    availableFrom: "",
    availableTo: "",
    // ── Roommate matching ────────────────────────────────────────────────
    roommateEnabled: false, // true = owner/resident is open to roommate matching
    genderPreference: "any", // "any" | "women_only" | "men_only"
    maxOccupants: 2, // how many people total (including lister)
    preferenceNotes: "", // free-text: lifestyle, habits, rules
    ownerGender: "", // owner's own gender (used for matching)
    ageRange: { min: 18, max: 40 },
  });

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) return "Property Title is required.";
        if (formData.title.length < 5)
          return "Title must be at least 5 characters.";
        if (!formData.description.trim())
          return "Property description is required.";
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
          return "The end date cannot be earlier than the start date.";
        return null;
      case 4:
        if (files.length === 0)
          return "You must upload at least one property photo.";
        if (formData.roommateEnabled && !formData.ownerGender)
          return "Please select your gender so potential roommates can see a match.";
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
    if (name === "title" && value !== "" && !/^[A-Za-z0-9\s]*$/.test(value))
      return;
    if (
      (name === "rent" || name === "deposit") &&
      value !== "" &&
      (parseFloat(value) < 0 || isNaN(value))
    )
      return;
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
    setPreviews((prev) => [
      ...prev,
      ...newFiles.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeImage = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Visit slots ────────────────────────────────────────────────────────────
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
  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateStep();
    if (error) {
      showAlert(error, "warning");
      return;
    }

    showLoader();
    try {
      const data = new FormData();
      // Base fields
      Object.keys(formData).forEach((key) => {
        if (key === "ageRange") {
          data.append("ageRange", JSON.stringify(formData.ageRange));
        } else {
          data.append(key, formData[key]);
        }
      });
      // Amenities
      Object.keys(amenities)
        .filter((k) => amenities[k])
        .forEach((a) => data.append("amenities[]", a));
      // Images
      files.forEach((file) => data.append("images", file));
      // Visit slots
      data.append("visitSlots", JSON.stringify(visitSlots));
      data.append("allowMultipleVisits", allowMultipleVisits);

      await axios.post(API_ROUTES.ACCOMMODATIONS.CREATE, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      showAlert("Property listed successfully!", "success");
      navigate("/Homepage");
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Failed to list property",
        "error",
      );
    } finally {
      hideLoader();
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const isRoom = formData.propertyType === "room";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
        {/* ── HEADER / STEPPER ────────────────────────────────────────────── */}
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
            Step {step}: {STEP_LABELS[step - 1]}
          </h1>
        </div>

        {/* ── FORM ────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-8 md:p-12">
          {/* ════════════════ STEP 1: BASIC INFO ════════════════ */}
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
                    <span className="font-bold">{label}</span>
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
                  placeholder="e.g. 2 Bed DD, Sunny Studio"
                  className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-lg"
                  onChange={handleInputChange}
                  value={formData.title}
                />
              </div>

              {/* Property Type */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 uppercase">
                  Property Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PROPERTY_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          propertyType: type,
                          // reset sharing type if not a room
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

              {/* ── Sharing type — only if Room selected ────────────────── */}
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
                        icon: <FaDoorOpen size={28} />,
                      },
                      {
                        value: "sharing",
                        label: "Shared Room",
                        sub: "Room split between multiple tenants",
                        icon: <FaUsers size={28} />,
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

                  {/* Max occupants (only relevant for sharing) */}
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
              <div className="space-y-4">
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

          {/* ════════════════ STEP 2: LOCATION ════════════════ */}
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
                  placeholder="Enter full address..."
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

          {/* ════════════════ STEP 3: PRICING & TIMELINE ════════════════ */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Rent */}
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

              {/* Deposit */}
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

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-400 uppercase text-xs">
                    Available From
                  </label>
                  <input
                    type="date"
                    name="availableFrom"
                    min={today}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none cursor-pointer"
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
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none cursor-pointer"
                    onChange={handleInputChange}
                    value={formData.availableTo}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ STEP 4: ROOMMATE + MEDIA + AMENITIES ════════════════ */}
          {step === 4 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* ── Roommate Matching Card ─────────────────────────────── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase">
                    <FaUsers className="text-primary" /> Roommate Matching
                  </label>
                  {/* Toggle */}
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

                    {/* Owner's own gender */}
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
                            max={formData.ageRange.max ?? 80}
                            value={formData.ageRange.min ?? ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ageRange: {
                                  ...formData.ageRange,
                                  min:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
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
                            min={formData.ageRange.min ?? 18}
                            max={80}
                            value={formData.ageRange.max ?? ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ageRange: {
                                  ...formData.ageRange,
                                  max:
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value),
                                },
                              })
                            }
                            className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Lifestyle notes */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 uppercase">
                        Lifestyle & House Rules (Optional)
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

              {/* ── Amenities ──────────────────────────────────────────── */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <FaList className="text-primary" /> Select Amenities
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
                      {key}
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

              {/* ── Visit Slots ────────────────────────────────────────── */}
              <div className="space-y-4">
                <label className="text-sm font-bold uppercase text-gray-700">
                  Visit Settings
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
                    className="font-medium cursor-pointer"
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
                    className="p-2 border rounded-xl"
                  />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="p-2 border rounded-xl"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="p-2 border rounded-xl"
                  />
                </div>
                <button
                  type="button"
                  onClick={addVisitSlot}
                  className="bg-black text-white px-4 py-2 rounded-xl font-bold"
                >
                  Add Visit Slot
                </button>
                <div className="mt-2 space-y-2">
                  {visitSlots.map((day, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 p-4 rounded-2xl border border-gray-200"
                    >
                      <h4 className="font-bold text-secondary mb-2">
                        {new Date(day.date).toDateString()}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {day.slots.map((slot, j) => (
                          <div
                            key={j}
                            className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-2 text-sm"
                          >
                            <span className="font-medium">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSlot(day.date, j)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Photo Upload ───────────────────────────────────────── */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                  <FaCloudUploadAlt className="text-primary" /> Upload Photos
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="h-28 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-300 hover:border-primary hover:text-primary transition-all cursor-pointer">
                    <FaCloudUploadAlt size={30} />
                    <span className="text-[10px] font-bold mt-1 uppercase">
                      Add More
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
                        src={img}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        alt={`Preview ${i}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ──────────────────────────────────────── */}
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
                className="flex-[2] py-4 bg-primary text-secondary rounded-2xl font-black text-lg uppercase tracking-wider hover:bg-primary-dark transition-all shadow-xl shadow-primary/20"
              >
                Finish & List Property
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProperty;
