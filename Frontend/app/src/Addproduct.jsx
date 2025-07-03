import React, { useState, useEffect } from "react";
import axios from "axios";

const AddProduct = () => {
  const [productData, setProductData] = useState({
    product_name: "",
    product_price: "",
    descripition: "", // Note: Typo in original ('descripition' instead of 'description')
    category_id: "",
    is_preorder: false,
  });
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await axios.get(
        "http://localhost:10145/categories/active"
      );
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to fetch categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear messages when user starts typing
    if (message) setMessage("");
    if (error) setError("");
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    // Clear messages when user selects files
    if (message) setMessage("");
    if (error) setError("");
  };

  const validateForm = () => {
    if (!productData.product_name.trim()) {
      setError("Product name is required");
      return false;
    }
    if (!productData.product_price || productData.product_price <= 0) {
      setError("Valid product price is required");
      return false;
    }
    if (!productData.descripition.trim()) {
      setError("Product description is required");
      return false;
    }
    if (!productData.category_id) {
      setError("Please select a category");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("product_name", productData.product_name);
      formData.append("product_price", productData.product_price);
      formData.append("descripition", productData.descripition); // Typo remains for consistency
      formData.append("category_id", productData.category_id);
      formData.append("is_preorder", productData.is_preorder);

      // Append images
      images.forEach((image) => {
        formData.append("images", image);
      });

      console.log("Submitting product:", {
        product_name: productData.product_name,
        product_price: productData.product_price,
        descripition: productData.descripition,
        category_id: productData.category_id,
        is_preorder: productData.is_preorder,
        imageCount: images.length,
      });

      const response = await axios.post(
        "https://update-xrp4.onrender.com/products",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Product added successfully:", response.data);
      setMessage("Product added successfully!");

      // Reset form
      setProductData({
        product_name: "",
        product_price: "",
        descripition: "",
        category_id: "",
        is_preorder: false,
      });
      setImages([]);

      // Reset file input
      const fileInput = document.getElementById("images");
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Error adding product:", error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Failed to add product. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setProductData({
      product_name: "",
      product_price: "",
      descripition: "",
      category_id: "",
      is_preorder: false,
    });
    setImages([]);
    setMessage("");
    setError("");

    // Reset file input
    const fileInput = document.getElementById("images");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="add-product-header">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Add New Product
            </h2>
            <p className="text-gray-600">
              Fill in the details below to add a new product to your inventory
            </p>
          </div>

          {message && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-4 flex items-center">
              <span className="text-xl mr-2">✅</span>
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4 flex items-center">
              <span className="text-xl mr-2">❌</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label
                htmlFor="product_name"
                className="block text-sm font-medium text-gray-700"
              >
                Product Name *
              </label>
              <input
                type="text"
                id="product_name"
                name="product_name"
                value={productData.product_name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 p-2"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label
                htmlFor="category_id"
                className="block text-sm font-medium text-gray-700"
              >
                Category *
              </label>
              {categoriesLoading ? (
                <div className="mt-1 p-2 bg-gray-100 rounded-md text-gray-600">
                  Loading categories...
                </div>
              ) : (
                <select
                  id="category_id"
                  name="category_id"
                  value={productData.category_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 p-2"
                  required
                  disabled={loading}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.product_count} products)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label
                htmlFor="product_price"
                className="block text-sm font-medium text-gray-700"
              >
                Product Price (₹) *
              </label>
              <input
                type="number"
                id="product_price"
                name="product_price"
                value={productData.product_price}
                onChange={handleInputChange}
                placeholder="Enter product price"
                min="0"
                step="0.01"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 p-2"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label
                htmlFor="descripition"
                className="block text-sm font-medium text-gray-700"
              >
                Product Description *
              </label>
              <textarea
                id="descripition"
                name="descripition"
                value={productData.descripition}
                onChange={handleInputChange}
                placeholder="Enter product description"
                rows="4"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 p-2"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  name="is_preorder"
                  checked={productData.is_preorder}
                  onChange={handleInputChange}
                  className="mr-2 leading-tight"
                  disabled={loading}
                />
                <span className="text-gray-700">Pre-order Product</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Check this if the product is available for pre-order with
                customization options
              </p>
            </div>

            <div className="form-group">
              <label
                htmlFor="images"
                className="block text-sm font-medium text-gray-700"
              >
                Product Images
              </label>
              <input
                type="file"
                id="images"
                name="images"
                onChange={handleImageChange}
                multiple
                accept="image/*"
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:bg-gray-100"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                You can select multiple images. Supported formats: JPG, PNG, GIF
              </p>
              {images.length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-700">
                    Selected files: {images.length}
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    {images.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="form-actions flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Adding Product...
                  </>
                ) : (
                  "Add Product"
                )}
              </button>
              <button
                type="button"
                onClick={clearForm}
                disabled={loading}
                className="w-full inline-flex justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                Clear Form
              </button>
            </div>
          </form>

          <div className="form-info mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tips for adding products:
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Use clear, descriptive product names</li>
              <li>Select the appropriate category for better organization</li>
              <li>Set competitive and accurate prices</li>
              <li>Write detailed descriptions to help customers</li>
              <li>Upload high-quality images for better presentation</li>
              <li>Enable pre-order for customizable products</li>
              <li>All fields marked with * are required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
