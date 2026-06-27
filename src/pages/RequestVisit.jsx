import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaArrowLeft,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { API_ROUTES } from "../api/apiRoutes";
import { useAlert } from "../context/AlertContext";
import { useLoader } from "../context/LoaderContext";

const RequestVisit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { showLoader, hideLoader } = useLoader();

  const [property, setProperty] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // ================= FETCH PROPERTY =================
  useEffect(() => {
    const fetchProperty = async () => {
      showLoader(); // Use global loader
      try {
        const res = await axios.get(API_ROUTES.ACCOMMODATIONS.GET_BY_ID(id), {
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setProperty(res.data.data);
      } catch (err) {
        showAlert("Failed to load visit slots", "error");
        navigate(-1);
      } finally {
        hideLoader();
      }
    };

    fetchProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ================= SUBMIT REQUEST =================
  const handleSubmit = async () => {
    if (!selectedSlot) {
      showAlert("Please select a time slot to proceed", "warning");
      return;
    }

    showLoader();
    try {
      await axios.post(
        API_ROUTES.VISITS.REQUEST,
        {
          productId: id,
          date: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        },
        {
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      showAlert("Visit requested! You can track it in 'My Visits'.", "success");
      // Redirecting to Homepage or Dashboard is often clearer than a specific sub-page
      navigate("/Homepage");
    } catch (err) {
      showAlert(err.response?.data?.message || "Request failed", "error");
    } finally {
      hideLoader();
    }
  };

  if (!property) return null;

  const groupedSlots = property.visitSlots || [];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
        {/* HEADER SECTION - Matching AddProperty style */}
        <div className="bg-secondary p-8 text-center relative">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Schedule a Visit
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Select your preferred arrival time
          </p>
        </div>

        <div className="p-8 md:p-12">
          {/* PROPERTY INFO CARD */}
          <div className="flex items-start gap-4 p-5 bg-primary/5 rounded-3xl border border-primary/10 mb-8">
            <div className="p-3 bg-primary text-secondary rounded-2xl shadow-sm">
              <FaMapMarkerAlt size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-secondary">
                {property.title}
              </h2>
              <p className="text-sm text-gray-500">
                {property.area}, {property.city}
              </p>
            </div>
          </div>

          {/* SLOTS SECTION */}
          <div className="space-y-8">
            {groupedSlots.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 font-medium">
                  No visit slots have been posted for this property yet.
                </p>
              </div>
            ) : (
              groupedSlots.map((day, index) => (
                <div
                  key={index}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <FaCalendarAlt className="text-primary" />
                    <h3 className="font-bold text-secondary">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {day.slots.map((slot, i) => {
                      const isSelected =
                        selectedSlot &&
                        selectedSlot.date === day.date &&
                        selectedSlot.startTime === slot.startTime;

                      return (
                        <button
                          key={i}
                          disabled={slot.isBooked}
                          onClick={() =>
                            setSelectedSlot({
                              date: day.date,
                              startTime: slot.startTime,
                              endTime: slot.endTime,
                            })
                          }
                          className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all group
                            ${
                              slot.isBooked
                                ? "bg-gray-100 border-transparent opacity-50 cursor-not-allowed"
                                : isSelected
                                  ? "bg-primary border-primary text-secondary shadow-lg shadow-primary/20 scale-[1.02]"
                                  : "bg-white border-gray-100 hover:border-primary/30 text-gray-600"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <FaClock
                              className={
                                isSelected ? "text-secondary" : "text-gray-400"
                              }
                            />
                            <span className="font-bold">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          {isSelected && (
                            <FaCheckCircle className="text-secondary animate-in zoom-in duration-300" />
                          )}
                          {slot.isBooked && (
                            <span className="text-[10px] font-black uppercase text-gray-400">
                              Booked
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* SUBMIT BUTTON AREA */}
          <div className="mt-12">
            <button
              onClick={handleSubmit}
              disabled={!selectedSlot}
              className="w-full py-4 bg-secondary text-white rounded-2xl font-black text-lg uppercase tracking-wider hover:bg-black transition-all shadow-xl shadow-secondary/20 transform active:scale-95 disabled:bg-gray-200 disabled:shadow-none disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Confirm Visit Request
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">
              The owner will be notified of your request immediately
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestVisit;
