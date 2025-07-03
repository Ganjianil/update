import React, { useState, useEffect } from "react";

// Helpers for blank option and main product initial state
const emptyOption = { material_type: "", weight: "", quantity: "", price: "" };
const initialProduct = {
  name: "",
  description: "",
  photos: [],
  options: [{ ...emptyOption }],
};

export default function ManagePreOrderProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialProduct);
  const [editingId, setEditingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch all products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const resp = await fetch("http://localhost:10145/api/preorder-products");
      console.log("Fetch Response Status:", resp.status);
      if (!resp.ok) throw new Error(`HTTP error! Status: ${resp.status}`);
      const data = await resp.json();
      setProducts(Array.isArray(data) ? data : []);
      if (data.error) setErrorMsg(data.error);
    } catch (err) {
      console.error("Fetch Error:", err);
      setErrorMsg(`Could not fetch products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleMainChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setForm({ ...form, photos: e.target.files });
  const handleOptionChange = (idx, e) => {
    const updated = form.options.map((opt, i) =>
      i === idx ? { ...opt, [e.target.name]: e.target.value } : opt
    );
    setForm({ ...form, options: updated });
  };

  const addOption = () => {
    setForm({ ...form, options: [...form.options, { ...emptyOption }] });
  };
  const removeOption = (idx) => {
    setForm({ ...form, options: form.options.filter((_, i) => i !== idx) });
  };

  // Handle create or update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    if (
      !form.name ||
      !form.description ||
      form.options.length === 0 ||
      form.options.some(
        (opt) =>
          !opt.material_type || !opt.weight || !opt.quantity || !opt.price
      )
    ) {
      setErrorMsg("All fields and at least one option are required.");
      setLoading(false);
      return;
    }
    if (!editingId && (!form.photos || form.photos.length === 0)) {
      setErrorMsg("At least one photo is required for new products.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("description", form.description);
    formData.append("options", JSON.stringify(form.options));
    if (form.photos && form.photos.length) {
      for (let i = 0; i < form.photos.length; i++) {
        formData.append("photos", form.photos[i]);
      }
    }

    try {
      let resp;
      if (editingId) {
        resp = await fetch(
          `http://localhost:10145/api/admin/preorder-products/${editingId}`,
          {
            method: "PUT",
            body: formData,
          }
        );
      } else {
        resp = await fetch(
          "http://localhost:10145/api/admin/preorder-products",
          {
            method: "POST",
            body: formData,
          }
        );
      }
      console.log("Submit Response Status:", resp.status);
      const data = await resp.json();
      if (resp.ok) {
        setSuccessMsg(editingId ? "Product updated!" : "Product created!");
        setForm(initialProduct);
        setEditingId(null);
        fetchProducts();
      } else {
        setErrorMsg(data.error || `Failed to save: HTTP ${resp.status}`);
      }
    } catch (err) {
      console.error("Submit Error:", err);
      setErrorMsg(`Failed to save: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Start editing
  const handleEdit = (prod) => {
    setEditingId(prod.id);
    setForm({
      name: prod.name,
      description: prod.description,
      photos: [],
      options: prod.options.map((o) => ({
        material_type: o.material_type,
        weight: o.weight,
        quantity: o.quantity,
        price: o.price,
      })),
    });
    window.scrollTo(0, 0);
  };

  // Delete product
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:10145/api/admin/preorder-products/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Delete Response Status:", response.status);
      const data = await response.json();
      if (response.ok) {
        setSuccessMsg("Product deleted successfully");
        await fetchProducts();
      } else {
        setErrorMsg(data.error || `Failed to delete: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Delete Error:", error);
      setErrorMsg(`Failed to delete: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setForm(initialProduct);
    setEditingId(null);
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">
        {editingId ? "Edit" : "Add"} Pre-order Product
      </h2>
      {errorMsg && <div className="mb-3 text-red-600">{errorMsg}</div>}
      {successMsg && <div className="mb-3 text-green-600">{successMsg}</div>}
      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="bg-white rounded shadow p-6 mb-12"
      >
        <div className="mb-4">
          <label className="font-medium block mb-1">Product Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleMainChange}
            className="border px-3 py-2 w-full rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="font-medium block mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleMainChange}
            className="border px-3 py-2 w-full rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="font-medium block mb-1">
            Upload Photos{" "}
            {editingId
              ? "(leave empty to keep current)"
              : "(at least one required)"}
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            multiple
            accept="image/*"
            className="block"
          />
        </div>
        <div>
          <label className="font-medium block mb-2">
            Options (material, weight, quantity, price)
          </label>
          {form.options.map((opt, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 mb-2">
              <input
                className="border px-2 py-1 rounded w-32"
                name="material_type"
                placeholder="Material"
                value={opt.material_type}
                onChange={(e) => handleOptionChange(i, e)}
                required
              />
              <input
                className="border px-2 py-1 rounded w-24"
                name="weight"
                type="number"
                step="0.01"
                min="0"
                placeholder="Weight"
                value={opt.weight}
                onChange={(e) => handleOptionChange(i, e)}
                required
              />
              <input
                className="border px-2 py-1 rounded w-20"
                name="quantity"
                type="number"
                min="1"
                placeholder="Qty"
                value={opt.quantity}
                onChange={(e) => handleOptionChange(i, e)}
                required
              />
              <input
                className="border px-2 py-1 rounded w-24"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                value={opt.price}
                onChange={(e) => handleOptionChange(i, e)}
                required
              />
              <button
                type="button"
                onClick={() => removeOption(i)}
                className="text-red-500"
                disabled={form.options.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="text-indigo-700 underline mt-2"
          >
            Add Option
          </button>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white font-bold py-2 px-6 rounded hover:bg-indigo-700"
          >
            {loading
              ? "Saving..."
              : (editingId ? "Update" : "Add") + " Product"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <h3 className="text-xl font-bold mb-3 text-indigo-700">
        Existing Pre-order Products
      </h3>
      <div className="grid md:grid-cols-2 gap-6">
        {products.length === 0 && !loading && (
          <div>No products available...</div>
        )}
        {loading && <div>Loading products...</div>}
        {products.map((prod) => (
          <div key={prod.id} className="border shadow bg-white rounded p-5">
            <div className="mb-2 font-bold text-lg">{prod.name}</div>
            <div className="mb-2">{prod.description}</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {prod.photos && prod.photos.length > 0 ? (
                prod.photos.map((url, i) => (
                  <img
                    key={i}
                    src={`http://localhost:10145${url}`}
                    alt={`${prod.name} photo ${i + 1}`}
                    className="w-16 h-16 rounded object-cover border"
                    onError={(e) => {
                      e.target.src = "/placeholder-image.jpg";
                      console.log("Image failed:", url);
                    }}
                  />
                ))
              ) : (
                <div>No photos available</div>
              )}
            </div>
            <div className="mb-2">
              <div className="font-semibold">Options:</div>
              <ul>
                {prod.options.map((opt, i) => (
                  <li key={i}>
                    {opt.material_type} | {opt.weight}kg | {opt.quantity} pcs |
                    ₹{opt.price}
                  </li>
                ))}
              </ul>
            </div>
            <div className="fir gap-2 mt-3">
              <button
                className="px-4 py-1 bg-green-600 text-white rounded text-sm"
                onClick={() => handleEdit(prod)}
              >
                Edit
              </button>
              <button
                className="px-4 py-1 bg-red-600 text-white rounded text-sm"
                onClick={() => handleDelete(prod.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
