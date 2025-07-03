import React, { useState } from "react";

const initialState = {
  materialType: "",
  description: "",
  baseWeight: "",
  baseQuantity: "",
  photos: []
};

export default function AddPreOrderProduct() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  // Handle text/number change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  // Handle file input
  const handleFileChange = (e) => {
    setForm({ ...form, photos: e.target.files });
  };
  
  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(""); setErrorMsg("");
    setLoading(true);

    // Validation
    if (
      !form.materialType ||
      !form.description ||
      !form.baseWeight ||
      !form.baseQuantity ||
      form.photos.length === 0
    ) {
      setErrorMsg("All fields including at least 1 photo are required.");
      setLoading(false); return;
    }

    const formData = new FormData();
    formData.append("materialType", form.materialType);
    formData.append("description", form.description);
    formData.append("baseWeight", form.baseWeight);
    formData.append("baseQuantity", form.baseQuantity);
    for (let i = 0; i < form.photos.length; i++) {
      formData.append("photos", form.photos[i]);
    }

    try {
      const resp = await fetch("/api/admin/preorder-products", {
        method: "POST",
        body: formData,
      });
      if (resp.ok) {
        setSuccessMsg("Pre-order product created!");
        setForm(initialState);
      } else {
        const data = await resp.json();
        setErrorMsg(data.error || "Creation failed.");
      }
    } catch {
      setErrorMsg("Network or server error!");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 mt-8 rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-indigo-700">Add Pre-Order Product</h2>
      {errorMsg && <div className="mb-3 text-red-500">{errorMsg}</div>}
      {successMsg && <div className="mb-3 text-green-600">{successMsg}</div>}
      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-5">
        <div>
          <label className="block font-medium mb-1">Material Type</label>
          <input
            type="text"
            name="materialType"
            className="w-full border rounded px-3 py-2"
            value={form.materialType}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea
            name="description"
            className="w-full border rounded px-3 py-2"
            value={form.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        <div>
          <label className="block font-medium mb-1">Base Weight (kg)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            name="baseWeight"
            className="w-full border rounded px-3 py-2"
            value={form.baseWeight}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Base Quantity</label>
          <input
            type="number"
            min="0"
            name="baseQuantity"
            className="w-full border rounded px-3 py-2"
            value={form.baseQuantity}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Photos</label>
          <input
            type="file"
            accept="image/*"
            multiple
            name="photos"
            onChange={handleFileChange}
            required
            className="w-full"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700"
        >
          {loading ? "Submitting..." : "Add Pre-order Product"}
        </button>
      </form>
    </div>
  );
}