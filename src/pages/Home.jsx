import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaSearch, FaMapMarkerAlt, FaArrowRight } from "react-icons/fa";
import Typed from "typed.js";

import heroBg from "../assets/images/hp-main-img 1.png";
import findPlaceBg from "../assets/images/Rectangle 17.png";
import listPlaceBg from "../assets/images/Rectangle 16.png";
import karachiBg from "../assets/images/karachi 1.png";
import hyderabadBg from "../assets/images/Hyderabad.png";
import sukkurBg from "../assets/images/Sukkur.png";
import lahoreBg from "../assets/images/Lahore.png";
import multanBg from "../assets/images/multan.png";
import rawalpindiBg from "../assets/images/Rawalpindi.png";
import islamabadBg from "../assets/images/Islamabad.png";
import faisalabadBg from "../assets/images/Faisalabad.png";
import jamshoroBg from "../assets/images/Jamshoro.png";

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const el = useRef(null);

  useEffect(() => {
    const typed = new Typed(el.current, {
      strings: [
        "Find home together.",
        "Find your ideal room for rent.",
        "Welcome to Vacant Place.",
      ],
      typeSpeed: 50,
      backSpeed: 30,
      loop: true,
    });

    return () => {
      typed.destroy();
    };
  }, []);

  const handleSearch = (e) => {
    // search logic here later
  };

  const cities = [
    { name: "Karachi", bg: karachiBg },
    { name: "Hyderabad", bg: hyderabadBg },
    { name: "Sukkur", bg: sukkurBg },
    { name: "Lahore", bg: lahoreBg },
    { name: "Multan", bg: multanBg },
    { name: "Rawalpindi", bg: rawalpindiBg },
    { name: "Islamabad", bg: islamabadBg },
    { name: "Faislabad", bg: faisalabadBg },
    { name: "Jamshoro", bg: jamshoroBg },
  ];

  return (
    <div className="w-full">
      <div className="w-[95%] 2xl:max-w-[1600px] mx-auto px-4 md:px-8">
        <section className="flex flex-col-reverse md:flex-row items-center justify-between py-12 md:py-32 gap-8 md:gap-16">
          <div className="w-full md:w-[40%] flex flex-col items-center md:items-start text-center md:text-left space-y-8">
            <h1 className="text-4xl md:text-7xl font-extrabold leading-tight text-secondary">
              Rooms for <span className="text-black">rent</span>
            </h1>

            <div className="h-[40px] flex items-center">
              <span
                ref={el}
                className="text-xl md:text-2xl text-gray-500 font-medium"
              ></span>
            </div>

            <div className="relative w-full group">
              <FaMapMarkerAlt className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl transition-colors" />
              <input
                type="text"
                placeholder="Enter City Name..."
                className="w-full py-4 pl-16 pr-16 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-secondary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                onClick={handleSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
              >
                <FaArrowRight className="text-xl" />
              </button>
            </div>
          </div>

          <div className="w-full md:w-[55%] h-[400px] md:h-[600px] rounded-[40px] overflow-hidden shadow-xl">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${heroBg})` }}
            />
          </div>
        </section>

        <section className="py-24 px-4 md:px-16">
          <h2 className="text-2xl md:text-4xl font-bold text-secondary mb-16 ml-4">
            Looking for a tenant or a roommate
          </h2>

          <div className="flex flex-col md:flex-row gap-8 h-auto md:h-[500px]">
            <div className="flex-1 relative rounded-tl-[100px] rounded-br-[100px] overflow-hidden group">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${findPlaceBg})` }}
              />
              <Link
                to="/dashboard"
                className="absolute inset-0 flex items-center justify-center"
              >
                <button className="bg-[#333] text-white w-[200px] py-4 rounded-md font-semibold text-lg hover:bg-[#444] transition-colors">
                  + Find a Place
                </button>
              </Link>
            </div>

            <div className="flex-1 relative rounded-tl-[100px] rounded-br-[100px] overflow-hidden group">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${listPlaceBg})` }}
              />
              <Link
                to="/signup"
                className="absolute inset-0 flex items-center justify-center"
              >
                <button className="bg-[#333] text-white w-[200px] py-4 rounded-md font-semibold text-lg hover:bg-[#444] transition-colors">
                  + List a Place
                </button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 mb-32 px-4 md:px-24">
          <h2 className="text-2xl md:text-4xl font-bold text-secondary mb-16 text-center md:text-left">
            Popular cities in Pakistan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
            {cities.map((city, index) => (
              <div
                key={index}
                onClick={() => navigate("/dashboard")}
                className="h-[220px] rounded-xl overflow-hidden relative cursor-pointer group shadow-sm hover:shadow-xl transition-all"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${city.bg})` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="bg-[#333] text-white px-12 py-3 rounded-md font-medium">
                    {city.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
