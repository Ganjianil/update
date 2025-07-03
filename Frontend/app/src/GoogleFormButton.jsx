import React, { useState } from "react";

const GoogleFormButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* Button */}
      <button
        onClick={toggleModal}
        className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        aria-label="Open Google Form"
      >
        Open Google Form
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={toggleModal} // Close modal when clicking outside
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white p-6 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto relative"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {/* Close Button */}
            <button
              onClick={toggleModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 focus:outline-none"
              aria-label="Close form"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Google Form Iframe */}
            <iframe
              src="https://form.typeform.com/to/g7NAkWHr"
              width="100%"
              height="500"
              frameBorder="0"
              marginHeight="0"
              marginWidth="0"
              title="Google Form"
            >
              Loading…
            </iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleFormButton;
