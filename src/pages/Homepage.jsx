import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { API_ROUTES, IMAGE_BASE_URL } from "../api/apiRoutes";

const Homepage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [occupancy, setOccupancy] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [showMap, setShowMap] = useState(false);

  // Map bounds — when set, only properties inside the visible map area are shown
  const [mapBounds, setMapBounds] = useState(null);
  // mapFilterActive: true means cards list is being driven by the visible map area
  const [mapFilterActive, setMapFilterActive] = useState(false);

  // Selected marker — shows an InfoWindow popup on the map
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Refs to card elements so we can scroll to them when a marker is clicked
  const cardRefs = useRef({});

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await axios.get(API_ROUTES.ACCOMMODATIONS.ALL, {
          headers: {
            authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setProperties(res.data.data);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // Called every time the user pans or zooms the map
  const handleBoundsChanged = useCallback((event) => {
    const bounds = event.detail?.bounds;
    if (!bounds) return;
    // bounds = { north, south, east, west }
    setMapBounds(bounds);
    // Only activate map filtering once the user has actually moved the map
    setMapFilterActive(true);
  }, []);

  const isFilterActive =
    search ||
    propertyType ||
    occupancy ||
    minPrice ||
    maxPrice ||
    mapFilterActive;

  const filteredProperties = properties.filter((property) => {
    const text = search.toLowerCase();

    // Text / dropdown filters
    const passesText =
      !search ||
      property.title?.toLowerCase().includes(text) ||
      property.city?.toLowerCase().includes(text) ||
      property.area?.toLowerCase().includes(text);

    const passesType = !propertyType || property.propertyType === propertyType;
    const passesOccupancy =
      !occupancy || property.roomSharingType === occupancy;
    const passesMin = !minPrice || (property.rent ?? 0) >= Number(minPrice);
    const passesMax = !maxPrice || (property.rent ?? 0) <= Number(maxPrice);

    // Map bounds filter — only applied when the user has panned/zoomed the map
    // and the property actually has coordinates stored
    let passesMapBounds = true;
    if (
      mapFilterActive &&
      mapBounds &&
      property.latitude &&
      property.longitude
    ) {
      passesMapBounds =
        property.latitude >= mapBounds.south &&
        property.latitude <= mapBounds.north &&
        property.longitude >= mapBounds.west &&
        property.longitude <= mapBounds.east;
    }

    return (
      passesText &&
      passesType &&
      passesOccupancy &&
      passesMin &&
      passesMax &&
      passesMapBounds
    );
  });

  // When a marker is clicked: show InfoWindow + scroll the card into view + highlight it
  const handleMarkerClick = (property) => {
    setSelectedProperty(property);
    const card = cardRefs.current[property._id];
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("ring-2", "ring-primary");
      setTimeout(() => card.classList.remove("ring-2", "ring-primary"), 2000);
    }
  };

  const clearAllFilters = () => {
    setSearch("");
    setPropertyType("");
    setOccupancy("");
    setMinPrice("");
    setMaxPrice("");
    setMapBounds(null);
    setMapFilterActive(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-semibold text-gray-500">
          Loading properties...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-primary text-center mb-4">
        Available Properties
      </h1>

      {/* ── Filter bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <input
          type="text"
          placeholder="Search by city, area or title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-[420px] px-6 py-3 text-base border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
        />

        <div className="flex flex-wrap items-center gap-3 justify-end">
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Type</option>
            <option value="room">Room</option>
            <option value="flat">Flat</option>
            <option value="house">House</option>
          </select>

          <select
            value={occupancy}
            onChange={(e) => setOccupancy(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">Occupancy</option>
            <option value="single">Single room</option>
            <option value="sharing">Sharing</option>
          </select>

          <input
            type="number"
            placeholder="Min ₨"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="border rounded-lg px-3 py-2 w-24"
          />

          <input
            type="number"
            placeholder="Max ₨"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="border rounded-lg px-3 py-2 w-24"
          />

          <button
            onClick={() => setShowMap((v) => !v)}
            className="border rounded-lg px-3 py-2 bg-primary text-white hover:bg-primary-dark transition"
          >
            {showMap ? "Hide Map" : "Show Map"}
          </button>

          {isFilterActive && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-500 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Map bounds badge */}
      {mapFilterActive && (
        <div className="mb-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 w-fit">
          <span>📍 Showing properties in the visible map area</span>
          <button
            onClick={() => {
              setMapBounds(null);
              setMapFilterActive(false);
            }}
            className="ml-2 text-blue-500 hover:underline"
          >
            Remove
          </button>
        </div>
      )}

      {/* ── Map ── */}
      {showMap && (
        <div
          className="mb-8 rounded-2xl overflow-hidden shadow-md"
          style={{ height: "420px" }}
        >
          <APIProvider apiKey="AIzaSyC4Q15J0gP0wpLVzuqvG7GvMe4xBBQGptE">
            <Map
              defaultCenter={{ lat: 24.8607, lng: 67.0011 }} // Karachi
              defaultZoom={12}
              style={{ width: "100%", height: "100%" }}
              // onBoundsChanged fires after every pan/zoom — drives the filter
              onBoundsChanged={handleBoundsChanged}
            >
              {properties.map((property) =>
                property.latitude && property.longitude ? (
                  <Marker
                    key={property._id}
                    position={{
                      lat: property.latitude,
                      lng: property.longitude,
                    }}
                    title={property.title}
                    onClick={() => handleMarkerClick(property)}
                  />
                ) : null,
              )}

              {/* InfoWindow — price popup when a marker is clicked */}
              {selectedProperty &&
                selectedProperty.latitude &&
                selectedProperty.longitude && (
                  <InfoWindow
                    position={{
                      lat: selectedProperty.latitude,
                      lng: selectedProperty.longitude,
                    }}
                    onCloseClick={() => setSelectedProperty(null)}
                  >
                    <div className="text-sm">
                      <p className="font-semibold text-gray-800">
                        {selectedProperty.title}
                      </p>
                      <p className="text-gray-500">
                        {selectedProperty.area}, {selectedProperty.city}
                      </p>
                      <p className="text-primary font-bold mt-1">
                        ₨ {selectedProperty.rent?.toLocaleString()}
                      </p>
                      <button
                        onClick={() =>
                          navigate(`/property/${selectedProperty._id}`)
                        }
                        className="mt-2 text-xs text-blue-600 hover:underline"
                      >
                        View details →
                      </button>
                    </div>
                  </InfoWindow>
                )}
            </Map>
          </APIProvider>
        </div>
      )}

      {/* ── Property cards ── */}
      {filteredProperties.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          No properties found.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProperties.map((property) => (
            <div
              key={property._id}
              ref={(el) => {
                cardRefs.current[property._id] = el;
              }}
              className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col transition-all duration-300"
            >
              {property.images?.length > 0 && (
                <img
                  src={`${IMAGE_BASE_URL}/${property.images[0].split(/[\\/]/).pop()}`}
                  alt={property.title}
                  className="h-44 w-full object-cover"
                />
              )}

              <div className="p-4 flex flex-col flex-1">
                <h2 className="text-lg font-semibold text-gray-800">
                  {property.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {property.city}, {property.area}
                </p>
                <p className="text-sm capitalize text-gray-600 mt-1">
                  {property.propertyType} · {property.roomSharingType}
                </p>
                <p className="text-primary font-bold text-lg mt-2">
                  ₨ {property.rent?.toLocaleString()}
                </p>
                <button
                  onClick={() => navigate(`/property/${property._id}`)}
                  className="mt-auto bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dark transition"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Homepage;
