import React, { useEffect, useState } from "react";
import axios from "axios";

const Photo = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupIndex, setGroupIndex] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  useEffect(() => {
    if (photos.length > 6) {
      const interval = setInterval(() => {
        setGroupIndex((prev) => (prev + 1) % Math.ceil(photos.length / 6));
      }, 15000); // auto change every 15 seconds
      return () => clearInterval(interval);
    }
  }, [photos]);

  const fetchPhotos = async () => {
    try {
      const res = await axios.get(
        "https://update-xrp4.onrender.com/viewphotos"
      );
      setPhotos(res.data);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-24 mx-auto text-center">
          <p className="text-lg text-gray-500">Loading photos...</p>
        </div>
      </section>
    );
  }

  if (!photos.length) {
    return (
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-24 mx-auto text-center">
          <p className="text-lg text-gray-500">No photos uploaded yet.</p>
        </div>
      </section>
    );
  }

  // Show 6 photos per group
  const start = groupIndex * 6;
  const visiblePhotos = photos.slice(start, start + 6);
  const firstHalf = visiblePhotos.slice(0, 3);
  const secondHalf = visiblePhotos.slice(3, 6);

  return (
    <section className="text-gray-600 body-font transition-all duration-500 ease-in-out">
      <div className="container px-5 py-24 mx-auto flex flex-wrap">
        <div className="flex w-full mb-20 flex-wrap">
          <h1 className="sm:text-3xl text-2xl font-medium title-font text-gray-900 lg:w-1/3 lg:mb-0 mb-4">
            Featured Gallery
          </h1>
          <p className="lg:pl-6 lg:w-2/3 mx-auto leading-relaxed text-base">
            Moments captured through craftsmanship. Clicked, curated, and now
            displayed — straight from our admin uploads.
          </p>
        </div>

        <div className="flex flex-wrap md:-m-2 -m-1">
          <div className="flex flex-wrap w-1/2">
            {firstHalf.map((photo, index) => (
              <div
                key={photo.id}
                className={`${index === 2 ? "w-full" : "w-1/2"} md:p-2 p-1`}
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  alt={photo.original_name || "Gallery"}
                  className="w-full h-full object-cover object-center block rounded cursor-zoom-in hover:scale-105 transition-transform duration-300 ease-in-out"
                  src={`https://update-xrp4.onrender.com/${photo.image_path}`}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap w-1/2">
            {secondHalf.map((photo, index) => (
              <div
                key={photo.id}
                className={`${index === 0 ? "w-full" : "w-1/2"} md:p-2 p-1`}
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  alt={photo.original_name || "Gallery"}
                  className="w-full h-full object-cover object-center block rounded cursor-zoom-in hover:scale-105 transition-transform duration-300 ease-in-out"
                  src={`https://update-xrp4.onrender.com/${photo.image_path}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen modal with zoom */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-5xl w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-40 hover:bg-opacity-70 rounded-full p-2 focus:outline-none"
            >
              ✕
            </button>
            <img
              src={`https://update-xrp4.onrender.com/${selectedPhoto.image_path}`}
              alt={selectedPhoto.original_name}
              className="w-full h-auto rounded-lg shadow-2xl transform scale-100 hover:scale-105 transition-transform duration-700 ease-in-out"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default Photo;
