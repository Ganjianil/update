import React, { useState, useEffect } from "react";
import axios from "axios";

const Photos = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [deleting, setDeleting] = useState(new Set());

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const res = await axios.get("http://localhost:10145/photos");
      setPhotos(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("photos", file));

    try {
      await axios.post("http://localhost:10145/photos", formData);
      setSelectedFiles([]);
      setPreviewUrls([]);
      fetchPhotos();
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (id) => {
    if (!confirm("Delete this photo?")) return;
    setDeleting((prev) => new Set(prev).add(id));
    try {
      await axios.delete(`http://localhost:10145/photos/${id}`);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL photos?")) return;
    setClearingAll(true);
    try {
      await axios.delete("http://localhost:10145/photos");
      setPhotos([]);
    } catch (err) {
      console.error(err);
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-semibold mb-4 text-gray-800">
        🖼️ Photo Gallery Manager
      </h2>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-10 border">
        <h3 className="text-xl font-medium mb-2">Upload New Photos</h3>
        <input
          id="file"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="mb-4"
        />

        {previewUrls.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="rounded overflow-hidden border">
                  <img
                    src={url}
                    alt={`preview-${idx}`}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-2 text-sm text-gray-600 truncate">
                    {selectedFiles[idx].name}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setSelectedFiles([]);
                  setPreviewUrls([]);
                }}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
              >
                Clear
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Gallery Section */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-medium">Gallery ({photos.length})</h3>
        {photos.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="text-sm text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-100"
          >
            {clearingAll ? "Deleting..." : "Delete All"}
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : photos.length === 0 ? (
        <p className="text-gray-500">No photos uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded shadow hover:shadow-md overflow-hidden border"
            >
              <div
                onClick={() => setSelectedPhoto(photo)}
                className="cursor-pointer"
              >
                <img
                  src={`http://localhost:10145${photo.image_path}`}
                  alt={photo.original_name}
                  className="w-full h-40 object-cover"
                />
              </div>
              <div className="p-3 text-sm">
                <p className="font-medium truncate">
                  {photo.original_name || "Untitled"}
                </p>
                <p className="text-gray-500 text-xs">
                  {new Date(photo.upload_date).toLocaleDateString()}
                </p>
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  disabled={deleting.has(photo.id)}
                  className="mt-2 inline-block text-red-600 hover:text-red-800 text-xs"
                >
                  {deleting.has(photo.id) ? "⏳ Deleting..." : "🗑 Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded max-w-md w-full relative shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
            >
              ✖
            </button>
            <img
              src={`http://localhost:10145/${selectedPhoto.image_path}`}
              alt="modal"
              className="w-full max-h-[75vh] object-contain rounded-t"
            />
            <div className="p-4">
              <p className="font-medium">{selectedPhoto.original_name}</p>
              <p className="text-sm text-gray-500">
                Uploaded {new Date(selectedPhoto.upload_date).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Photos;
