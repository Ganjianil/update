import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "https://update-xrp4.onrender.com/categories"
      );
      
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    clearMessages();
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
    clearMessages();
  };

  const clearMessages = () => {
    if (message) setMessage("");
    if (error) setError("");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      is_active: true,
    });
    setImage(null);
    setEditingCategory(null);
    setShowForm(false);
    clearMessages();

    // Reset file input
    const fileInput = document.getElementById("category-image");
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Category name is required");
      return;
    }

    setSubmitting(true);
    clearMessages();

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("description", formData.description);
      formDataToSend.append("is_active", formData.is_active);

      if (image) {
        formDataToSend.append("image", image);
      }

      if (editingCategory) {
        await axios.put(
          `https://update-xrp4.onrender.com/admin/categories/${editingCategory.id}`,
          formDataToSend,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        setMessage("Category updated successfully!");
      } else {
        await axios.post(
          "https://update-xrp4.onrender.com/admin/categories",
          formDataToSend,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        setMessage("Category created successfully!");
      }

      await fetchCategories();
      resetForm();
    } catch (error) {
      console.error("Error saving category:", error);
      setError(error.response?.data?.error || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      is_active: category.is_active,
    });
    setShowForm(true);
    clearMessages();
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await axios.delete(
        `https://update-xrp4.onrender.com/admin/categories/${categoryId}`
      );
      setMessage("Category deleted successfully!");
      await fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      setError(error.response?.data?.error || "Failed to delete category");
    }
  };

  const toggleCategoryStatus = async (categoryId, currentStatus) => {
    try {
      const formData = new FormData();
      const category = categories.find((c) => c.id === categoryId);
      formData.append("name", category.name);
      formData.append("description", category.description || "");
      formData.append("is_active", !currentStatus);

      await axios.put(
        `https://update-xrp4.onrender.com/admin/categories/${categoryId}`,
        formData
      );

      setMessage(
        `Category ${!currentStatus ? "activated" : "deactivated"} successfully!`
      );
      await fetchCategories();
    } catch (error) {
      console.error("Error updating category status:", error);
      setError("Failed to update category status");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-lg text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Categories
            </h2>
            <button
              onClick={() => setShowForm(true)}
              className={`bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 ${
                showForm ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={showForm}
            >
              + Add New Category
            </button>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center">
              <span className="text-xl mr-2">✅</span>
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
              <span className="text-xl mr-2">❌</span>
              <span>{error}</span>
            </div>
          )}

          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 transform transition-all duration-300 ease-in-out">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Category Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter category name"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 p-2"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter category description"
                    rows="3"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 p-2"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label
                    htmlFor="category-image"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Category Image
                  </label>
                  <input
                    type="file"
                    id="category-image"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:bg-gray-100"
                    disabled={submitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Upload an image to represent this category
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="mr-2 leading-tight"
                      disabled={submitting}
                    />
                    <span className="text-gray-700">Active Category</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={submitting}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-md hover:from-indigo-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 mr-2 inline-block"
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
                        {editingCategory ? "Updating..." : "Creating..."}
                      </>
                    ) : editingCategory ? (
                      "Update Category"
                    ) : (
                      "Create Category"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative">
                    {category.image_path ? (
                      <img
                        src={`https://update-xrp4.onrender.com/${category.image_path}`}
                        alt={category.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                    <span
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        category.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {category.description || "No description available"}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      <p>
                        Products: {category.product_count}{" "}
                        {category.product_count === 1 ? "product" : "products"}
                      </p>
                      <p>
                        Created:{" "}
                        {new Date(category.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="mt-4 flex justify-between">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-500 hover:text-blue-700 focus:outline-none"
                        title="Edit Category"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() =>
                          toggleCategoryStatus(category.id, category.is_active)
                        }
                        className={`text-sm px-2 py-1 rounded ${
                          category.is_active
                            ? "text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200"
                            : "text-green-500 hover:text-green-700 bg-green-100 hover:bg-green-200"
                        } focus:outline-none`}
                        title={category.is_active ? "Deactivate" : "Activate"}
                      >
                        {category.is_active ? "🔒 Deactivate" : "🔓 Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className="text-red-500 hover:text-red-700 focus:outline-none"
                        title="Delete Category"
                        disabled={category.product_count > 0}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {categories.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <div className="text-4xl mb-4 text-gray-400">📂</div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No categories found
                </h3>
                <p className="text-gray-600 mt-2">
                  Create your first category to get started!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCategories;
