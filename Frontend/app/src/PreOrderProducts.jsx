import React, { useState, useEffect } from "react";

export default function PreOrderProducts() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({
    client_name: "",
    contact_email: "",
    shipping_address: "",
    client_phone: "",
    required_specifications: "",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null); // State for zoomed image URL
  const [zoomLevel, setZoomLevel] = useState(1); // State for zoom scale

  // Fetch all products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const resp = await fetch("http://localhost:10145/api/preorder-products");
      if (!resp.ok) {
        throw new Error(`HTTP error! Status: ${resp.status}`);
      }
      const contentType = resp.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }
      const data = await resp.json();
      setProducts(Array.isArray(data) ? data : []);
      if (data.error) setErrorMsg(data.error);
    } catch (err) {
      console.error("Fetch error:", err);
      setProducts([]);
      setErrorMsg(`Could not fetch products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSelectedOption(null);
    setQuantity(1);
    setForm({
      client_name: "",
      contact_email: "",
      shipping_address: "",
      client_phone: "",
      required_specifications: "",
    });
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handlePlaceOrder = async () => {
    if (!selectedProduct || !selectedOption) {
      setErrorMsg("Please select a product and an option.");
      return;
    }
    if (quantity < 1) {
      setErrorMsg("Quantity must be at least 1.");
      return;
    }
    if (
      !form.client_name ||
      !form.contact_email ||
      !form.shipping_address ||
      !form.client_phone ||
      !form.required_specifications
    ) {
      setErrorMsg("All fields are required.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const orderData = {
        preorder_product_id: selectedProduct.id,
        option_id: selectedOption.id,
        quantity: quantity,
        client_name: form.client_name,
        contact_email: form.contact_email,
        shipping_address: form.shipping_address,
        client_phone: form.client_phone,
        required_specifications: form.required_specifications,
      };

      const resp = await fetch("http://localhost:10145/api/preorder/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (resp.ok) {
        setSuccessMsg("Order placed successfully!");
        setSelectedProduct(null);
        setSelectedOption(null);
        setQuantity(1);
        setForm({
          client_name: "",
          contact_email: "",
          shipping_address: "",
          client_phone: "",
          required_specifications: "",
        });
      } else {
        const data = await resp.json();
        setErrorMsg(data.error || "Failed to place order.");
      }
    } catch (err) {
      console.error("Order error:", err);
      setErrorMsg(`Failed to place order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3)); // Max zoom level of 3x
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1)); // Min zoom level of 1x
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">
        Pre-order Products
      </h2>
      {errorMsg && <div className="mb-3 text-red-600">{errorMsg}</div>}
      {successMsg && <div className="mb-3 text-green-600">{successMsg}</div>}

      {loading && <div className="text-center">Loading products...</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {products.length === 0 && !loading && (
          <div>No products available...</div>
        )}
        {products.map((prod) => (
          <div key={prod.id} className="border shadow bg-white rounded p-3">
            {" "}
            {/* Reduced padding to p-3 */}
            <div className="mb-2 font-bold text-lg">{prod.name}</div>
            <div>
              <div className="mb-3">
                {prod.photos && prod.photos.length > 0 ? (
                  prod.photos.map((url, i) => (
                    <img
                      key={i}
                      src={`http://localhost:10145${url}`}
                      alt={`${prod.name} photo ${i + 1}`}
                      className="w-24 h-24 rounded object-cover border cursor-pointer inline-block mr-2" /* Increased to w-24 h-24 */
                      onClick={() => {
                        setZoomedImage(`http://localhost:10145${url}`);
                        setZoomLevel(1); // Reset zoom level when opening
                      }}
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
              <div className="text-sm text-gray-600 w-full">
                {" "}
                {/* Full width description */}
                {prod.description}
              </div>
            </div>
            <div className="mt-4">
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
            <button
              className="px-4 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 mt-4"
              onClick={() => handleSelectProduct(prod)}
            >
              Select Product
            </button>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <div className="bg-white rounded shadow p-6">
          <h3 className="text-2xl font-bold mb-3 text-indigo-700">
            Order: {selectedProduct.name}
          </h3>
          <div className="mb-4">
            <label className="font-medium block mb-1">Your Name</label>
            <input
              name="client_name"
              value={form.client_name}
              onChange={handleFormChange}
              className="border px-3 py-2 w-full rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="font-medium block mb-1">Your Email</label>
            <input
              type="email"
              name="contact_email"
              value={form.contact_email}
              onChange={handleFormChange}
              className="border px-3 py-2 w-full rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="font-medium block mb-1">Shipping Address</label>
            <textarea
              name="shipping_address"
              value={form.shipping_address}
              onChange={handleFormChange}
              className="border px-3 py-2 w-full rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="font-medium block mb-1">Your Phone Number</label>
            <input
              type="tel"
              name="client_phone"
              value={form.client_phone}
              onChange={handleFormChange}
              className="border px-3 py-2 w-full rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="font-medium block mb-1">
              Required Specifications
            </label>
            <textarea
              name="required_specifications"
              value={form.required_specifications}
              onChange={handleFormChange}
              className="border px-3 py-2 w-full rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="font-medium block mb-1">Select Option</label>
            <select
              className="border px-3 py-2 w-full rounded"
              onChange={(e) =>
                setSelectedOption(selectedProduct.options[e.target.value])
              }
              value={
                selectedOption
                  ? selectedProduct.options.findIndex(
                      (opt) => opt === selectedOption
                    )
                  : ""
              }
            >
              <option value="" disabled>
                Select an option
              </option>
              {selectedProduct.options.map((opt, i) => (
                <option key={i} value={i}>
                  {opt.material_type} | {opt.weight}kg | {opt.quantity} pcs | ₹
                  {opt.price}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="font-medium block mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="border px-3 py-2 w-20 rounded"
            />
          </div>
          <div className="flex gap-3">
            <button
              className="bg-indigo-600 text-white font-bold py-2 px-6 rounded hover:bg-indigo-700"
              onClick={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? "Placing Order..." : "Place Order"}
            </button>
            <button
              className="bg-gray-300 px-4 py-2 rounded"
              onClick={() => setSelectedProduct(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <button
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => {
              setZoomedImage(null);
              setZoomLevel(1); // Reset zoom on close
            }}
          >
            ×
          </button>
          <div className="relative">
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="max-w-none"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: "center",
                transition: "transform 0.2s ease",
              }}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <button
                className="bg-white text-black px-3 py-1 rounded"
                onClick={handleZoomIn}
              >
                +
              </button>
              <button
                className="bg-white text-black px-3 py-1 rounded"
                onClick={handleZoomOut}
              >
                -
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
