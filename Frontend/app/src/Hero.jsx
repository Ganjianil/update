import React from "react";
import { Link } from "react-router-dom";
import owner from "/owner.jpg";

const Hero = () => {
  return (
    <section className="text-gray-600 body-font pt-0">
      <div className="container mx-auto flex px-5 pt-0 pb-20 md:flex-row flex-col items-center">
        {/* Left Content */}
        <div className="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center">
          <h1 className="title-font sm:text-4xl text-3xl mb-4 font-medium text-gray-900">
            Timeless Craftsmanship in Every Idol.
            <br className="hidden lg:inline-block" />
            With Premium Brass & Silver
          </h1>
          <p className="mb-8 leading-relaxed">
            We are manufacturers and wholesalers of exquisite brass and silver
            idols, blending tradition with artistry. Whether for temples, homes,
            or gifting — find divine beauty in every piece.
          </p>

          {/* Buttons Side by Side */}
          <div className="flex justify-center space-x-4 mt-4">
            <Link to="/preorderproducts">
              <button className="inline-flex items-center text-white bg-gradient-to-r from-indigo-500 to-purple-500 border-0 py-2 px-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transform transition-transform duration-300 ease-in-out">
                PRE ORDER NOW
              </button>
            </Link>
            <Link to="/googleformbutton">
              <button className="inline-flex items-center text-white bg-gradient-to-r from-indigo-500 to-purple-500 border-0 py-2 px-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transform transition-transform duration-300 ease-in-out">
                Customize Order
              </button>
            </Link>
          </div>
        </div>

        {/* Image */}
        <div className="lg:max-w-lg lg:w-full md:w-1/2 w-5/6">
          <img
            className="object-cover object-center rounded"
            alt="hero"
            src={owner}
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
