import React from "react";
// Importing generic images from your assets that were used in the old About page
import renterImg from "../assets/images/images.jpg";
import ownerImg from "../assets/images/Rectangle 164.png";

const About = () => {
  return (
    <div className="w-full bg-white">
      {/* Header Section */}
      <div className="bg-secondary py-24">
        <div className="w-[95%] 2xl:max-w-[1600px] mx-auto px-4 md:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
            About <span className="text-primary">Us</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We are on a mission to change the way you rent, forever. Making it
            simpler, faster, and more human for everyone.
          </p>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="w-[95%] 2xl:max-w-[1600px] mx-auto px-4 md:px-8 py-24">
        {/* Section 1: Renters */}
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24 mb-32">
          <div className="w-full md:w-1/2 space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary">
              For <span className="text-primary">Renters</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Searching for a new home used to be exhausting. We've made it as
              easy as booking a hotel. From browsing and touring to applying,
              the entire process is faster, easier, and more trustworthy on
              Vacant Place.
            </p>
            <div className="h-1 w-20 bg-primary rounded-full"></div>
          </div>
          <div className="w-full md:w-1/2 h-[300px] md:h-[400px]">
            <img
              src={renterImg}
              alt="Happy renters"
              className="w-full h-full object-cover rounded-[40px] shadow-2xl rotate-2 hover:rotate-0 transition-all duration-500"
            />
          </div>
        </div>

        {/* Section 2: Owners */}
        <div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-24 mb-32">
          <div className="w-full md:w-1/2 h-[300px] md:h-[400px]">
            <img
              src={ownerImg}
              alt="Property owners"
              className="w-full h-full object-cover rounded-[40px] shadow-2xl -rotate-2 hover:rotate-0 transition-all duration-500"
            />
          </div>
          <div className="w-full md:w-1/2 space-y-6 md:text-right flex flex-col items-end">
            <h2 className="text-3xl md:text-5xl font-bold text-secondary">
              For <span className="text-primary">Owners</span>
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              We connect property owners directly with verified renters, helping
              you fill vacancies quickly and manage your properties with less
              hassle. Say goodbye to intermediaries and hello to efficiency.
            </p>
            <div className="h-1 w-20 bg-primary rounded-full"></div>
          </div>
        </div>

        {/* Our Purpose - Centered */}
        <div className="text-center max-w-4xl mx-auto bg-gray-50 rounded-[50px] p-12 md:p-16 shadow-sm">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-8">
            Our Purpose
          </h2>
          <p className="text-gray-600 text-xl leading-relaxed">
            We believe finding your new apartment is more than just a move. It's
            a fresh start. We are building a community for both owners and
            tenants to make rental experiences easier, faster, and more
            trustworthy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
