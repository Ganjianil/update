import React from "react";
import { Link } from "react-router-dom"; 
import owner from "/owner.jpg";

const Hero = () => {
  return (
    <section className="text-gray-600 body-font">
      <div className="container mx-auto flex px-5 py-24 md:flex-row flex-col items-center">
        <div className="lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 flex flex-col md:items-start md:text-left mb-16 md:mb-0 items-center text-center">
          <h1 className="title-font sm:text-4xl text-3xl mb-4 font-medium text-gray-900">
            Timeless Craftsmanship in Every Idol.{" "}
            <br className="hidden lg:inline-block" />
            With Premium Brass & Silver
          </h1>
          <p className="mb-8 leading-relaxed">
            We are manufacturers and wholesalers of exquisite brass and silver
            idols, blending tradition with artistry. Whether for temples, homes,
            or gifting — find divine beauty in every piece.
          </p>
          <div className="flex justify-center space-x-4 mt-4">
  <Link to="/preorderproducts">
    <button className="inline-flex text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg">
      PRE ORDER NOW
    </button>
  </Link>
  <Link to="/googleformbutton">
    <button className="inline-flex text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg">
      Customize order
    </button>
  </Link>
</div>
</div>
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
