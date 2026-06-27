import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-secondary text-gray-300 pt-16 pb-8">
      {/* UPDATED CONTAINER WIDTH to match Home page */}
      <div className="w-[95%] 2xl:max-w-[1600px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 space-y-6">
          <Link
            to="/"
            className="text-3xl font-extrabold text-white tracking-tight"
          >
            VACANT<span className="text-primary">PLACE</span>
          </Link>
          <p className="text-base text-gray-400 leading-relaxed">
            We are building a community for both owners and tenants to make
            rental experiences easier, faster, and more human.
          </p>
        </div>

        <div>
          <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">
            Company
          </h3>
          <ul className="space-y-4">
            <li>
              <Link
                to="/about"
                className="hover:text-primary transition-colors"
              >
                About Us
              </Link>
            </li>
            <li>
              <span className="text-gray-600 cursor-not-allowed">Careers</span>
            </li>
            <li>
              <span className="text-gray-600 cursor-not-allowed">
                Contact Us
              </span>
            </li>
            <li>
              <span className="text-gray-600 cursor-not-allowed">Blog</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">
            Legal
          </h3>
          <ul className="space-y-4">
            <li>
              <span className="text-gray-600 cursor-not-allowed">
                Terms of Service
              </span>
            </li>
            <li>
              <span className="text-gray-600 cursor-not-allowed">
                Privacy Policy
              </span>
            </li>
            <li>
              <span className="text-gray-600 cursor-not-allowed">
                Cookie Policy
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">
            Newsletter
          </h3>
          <p className="text-sm mb-4 text-gray-400">
            Subscribe for the latest listings and rental tips.
          </p>
          <div className="flex">
            <input
              type="email"
              placeholder="Your email"
              className="px-4 py-3 w-full rounded-l-lg focus:outline-none text-secondary bg-gray-100"
              disabled
            />
            <button className="bg-primary px-6 py-3 rounded-r-lg text-white font-bold hover:bg-primary-dark transition cursor-not-allowed opacity-80">
              Join
            </button>
          </div>
        </div>
      </div>

      {/* UPDATED CONTAINER WIDTH for bottom bar */}
      <div className="w-[95%] 2xl:max-w-[1600px] mx-auto px-4 md:px-8 pt-8 border-t border-[#3d3d3d] flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} Vacant Place. All rights reserved.
        </p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          {/* Social placeholders could go here */}
          <span className="hover:text-gray-300 cursor-pointer transition">
            Twitter
          </span>
          <span className="hover:text-gray-300 cursor-pointer transition">
            Instagram
          </span>
          <span className="hover:text-gray-300 cursor-pointer transition">
            Facebook
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
