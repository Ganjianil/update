import React from "react";
import co from "/co.jpeg"
import dr from "/dr.jpeg"

const Ratings = () => {
  return (
    <section className="text-gray-600 body-font">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-wrap -m-4">
          {/* First Card */}
          <div className="lg:w-1/3 w-full mb-6 p-4">
            <div className="h-full text-center">
              <img
                alt="testimonial"
                className="w-20 h-20 mb-8 object-cover object-center rounded-full inline-block border-2 border-gray-200 bg-gray-100"
                src={dr}
              />
              <p className="leading-relaxed">
                Established as a Proprietor firm in the year 1980, we “Nandini
                Metal Kraft” are a leading Manufacturer of a wide range of Brass
                God Statues, Brass Door, Silver God Statues, etc. Situated in
                Hyderabad (Telangana, India),
              </p>
              <span className="inline-block h-1 w-10 rounded bg-indigo-500 mt-6 mb-4"></span>
              <h2 className="text-gray-900 font-medium title-font tracking-wider text-sm">
                Kanchana Chary
              </h2>
              <p className="text-gray-500">Director</p>
            </div>
          </div>

          {/* Second Card */}
          <div className="lg:w-1/3 w-full mb-6 p-4">
            <div className="h-full text-center">
              <img
                alt="testimonial"
                className="w-20 h-20 mb-8 object-cover object-center rounded-full inline-block border-2 border-gray-200 bg-gray-100"
                src={co}
              />
              <p className="leading-relaxed">
                We have constructed a wide and well functional infrastructural
                unit that plays an important role in the growth of our company.
                We offer these products at reasonable rates and deliver these
                within the promised time-frame. Under the headship{" "}
              </p>
              <span className="inline-block h-1 w-10 rounded bg-indigo-500 mt-6 mb-4"></span>
              <h2 className="text-gray-900 font-medium title-font tracking-wider text-sm">
                Sreekanth
              </h2>
              <p className="text-gray-500">CO Founder</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ratings;
