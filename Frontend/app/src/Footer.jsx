import React from "react";
import { Link } from "react-router-dom";
import hp from "/hp.jpeg";

const Footer = () => {
  return (
    <footer className="bg-white text-gray-600 body-font border-t border-gray-200">
      <div className="container mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between">
        {/* Logo & Company */}
        <Link to="/" className="flex items-center mb-4 sm:mb-0">
          <img
            src={hp}
            alt="logo"
            className="w-10 h-10 object-cover rounded-full border-2 border-indigo-500"
          />
          <span className="ml-3 text-lg font-semibold text-gray-800">
            Nandhini Brass & Metal Crafts
          </span>
        </Link>

        {/* Copyright */}
        <p className="text-sm text-gray-500 mb-4 sm:mb-0">
          © 1950 Since —
          <a
            href="https://twitter.com/knyttneve"
            className="text-gray-600 ml-1 underline hover:text-indigo-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            Entire Global Services
          </a>
        </p>

        {/* Social Icons */}
        <span className="flex justify-center space-x-4">
          <a className="text-gray-400 hover:text-indigo-500" href="#">
            <svg
              fill="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-5 h-5"
              viewBox="0 0 24 24"
            >
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
            </svg>
          </a>
          <a className="text-gray-400 hover:text-indigo-500" href="#">
            <svg
              fill="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-5 h-5"
              viewBox="0 0 24 24"
            >
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 7.5v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
            </svg>
          </a>
          <a className="text-gray-400 hover:text-indigo-500" href="#">
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-5 h-5"
              viewBox="0 0 24 24"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
              <path d="M17.5 6.5h.01" />
            </svg>
          </a>
          <a className="text-gray-400 hover:text-indigo-500" href="#">
            <svg
              fill="currentColor"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="0"
              className="w-5 h-5"
              viewBox="0 0 24 24"
            >
              <path
                stroke="none"
                d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"
              />
              <circle cx="4" cy="4" r="2" stroke="none" />
            </svg>
          </a>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
