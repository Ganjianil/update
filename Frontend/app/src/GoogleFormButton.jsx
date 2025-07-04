import React from "react";

const GoogleFormEmbed = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full shadow-lg">
        <iframe
          src="https://forms.gle/bSEvvyKp3jFVs6dE6"
          width="100%"
          height="800"
          frameBorder="0"
          marginHeight="0"
          marginWidth="0"
          title="Google Form"
        >
          Loading…
        </iframe>
      </div>
    </div>
  );
};

export default GoogleFormEmbed;
