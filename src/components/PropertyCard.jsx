import React from "react";
import { Link } from "react-router-dom";
import { FaMapMarkerAlt, FaBed, FaBuilding } from "react-icons/fa";

const PropertyCard = ({ property }) => {
  // Formatting price to Pakistani Rupee standard
  const formattedRent = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(property.pricing.rent);

  // Base URL for your backend images
  const imageUrl = `http://localhost:4000/assets/${property.file[0]}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-primary">
          {property.availability}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-secondary line-clamp-1">
            {property.title}
          </h3>
          <p className="text-primary font-extrabold text-lg">{formattedRent}</p>
        </div>

        <div className="flex items-center text-gray-500 text-sm mb-4">
          <FaMapMarkerAlt className="mr-2" />
          <p className="line-clamp-1">
            {property.area}, {property.location}
          </p>
        </div>

        {/* Quick Info Tags */}
        <div className="flex gap-2 mb-6">
          <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            <FaBuilding className="mr-2" />
            {property.propertyType.flat || property.propertyType.room}
          </span>
        </div>

        <Link to={`/property/${property._id}`} className="block">
          <button className="w-full py-3 bg-secondary text-white rounded-xl font-semibold hover:bg-primary hover:text-white transition-colors">
            See Details
          </button>
        </Link>
      </div>
    </div>
  );
};

export default PropertyCard;
