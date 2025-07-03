import React, { useState, useEffect } from "react";
import axios from "axios";

const ManageCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_amount: "",
    max_discount: "",
    expiry_date: "",
    is_active: true,
    usage_limit: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:10145/admin/coupons"
      );
      setCoupons(response.data);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setError("Failed to fetch coupons");
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

  const clearMessages = () => {
    if (message) setMessage("");
    if (error) setError("");
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_order_amount: "",
      max_discount: "",
      expiry_date: "",
      is_active: true,
      usage_limit: "",
    });
    setEditingCoupon(null);
    setShowForm(false);
    clearMessages();
  };

  const validateForm = () => {
    if (!formData.code.trim()) {
      setError("Coupon code is required");
      return false;
    }

    if (!formData.discount_value || formData.discount_value <= 0) {
      setError("Valid discount value is required");
      return false;
    }

    if (
      formData.discount_type === "percentage" &&
      formData.discount_value > 100
    ) {
      setError("Percentage discount cannot exceed 100%");
      return false;
    }

    if (formData.expiry_date && new Date(formData.expiry_date) <= new Date()) {
      setError("Expiry date must be in the future");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    clearMessages();

    try {
      const dataToSend = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        min_order_amount: formData.min_order_amount || 0,
        max_discount: formData.max_discount || null,
        usage_limit: formData.usage_limit || null,
        expiry_date: formData.expiry_date || null,
      };

      if (editingCoupon) {
        await axios.put(
          `http://localhost:10145/admin/coupons/${editingCoupon.id}`,
          dataToSend
        );
        setMessage("Coupon updated successfully!");
      } else {
        await axios.post("http://localhost:10145/admin/coupons", dataToSend);
        setMessage("Coupon created successfully!");
      }

      await fetchCoupons();
      resetForm();
    } catch (error) {
      console.error("Error saving coupon:", error);
      setError(error.response?.data?.error || "Failed to save coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount || "",
      max_discount: coupon.max_discount || "",
      expiry_date: coupon.expiry_date ? coupon.expiry_date.split("T")[0] : "",
      is_active: coupon.is_active,
      usage_limit: coupon.usage_limit || "",
    });
    setShowForm(true);
    clearMessages();
  };

  const handleDelete = async (couponId, couponCode) => {
    if (
      !window.confirm(
        `Are you sure you want to delete coupon "${couponCode}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await axios.delete(`http://localhost:10145/admin/coupons/${couponId}`);
      setMessage("Coupon deleted successfully!");
      await fetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
      setError(error.response?.data?.error || "Failed to delete coupon");
    }
  };

  const toggleCouponStatus = async (couponId, currentStatus) => {
    try {
      const coupon = coupons.find((c) => c.id === couponId);
      const updatedData = {
        ...coupon,
        is_active: !currentStatus,
        expiry_date: coupon.expiry_date
          ? coupon.expiry_date.split("T")[0]
          : null,
      };

      await axios.put(
        `http://localhost:10145/admin/coupons/${couponId}`,
        updatedData
      );
      setMessage(
        `Coupon ${!currentStatus ? "activated" : "deactivated"} successfully!`
      );
      await fetchCoupons();
    } catch (error) {
      console.error("Error updating coupon status:", error);
      setError("Failed to update coupon status");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No expiry";
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) <= new Date();
  };

  const getDiscountDisplay = (coupon) => {
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}% OFF`;
    } else {
      return `₹${coupon.discount_value} OFF`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-lg text-gray-600">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Manage Coupons</h2>
            <button
              onClick={() => setShowForm(true)}
              className={`bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 ${
                showForm ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={showForm}
            >
              + Add New Coupon
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
                  {editingCoupon ? "Edit Coupon" : "Add New Coupon"}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="code"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="Enter coupon code (e.g., SAVE20)"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 p-2"
                      required
                      disabled={submitting}
                      style={{ textTransform: "uppercase" }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="discount_type"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Discount Type *
                    </label>
                    <select
                      id="discount_type"
                      name="discount_type"
                      value={formData.discount_type}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 p-2"
                      required
                      disabled={submitting}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="discount_value"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Discount Value *{" "}
                      {formData.discount_type === "percentage" ? "(%)" : "(₹)"}
                    </label>
                    <input
                      type="number"
                      id="discount_value"
                      name="discount_value"
                      value={formData.discount_value}
                      onChange={handleInputChange}
                      placeholder={
                        formData.discount_type === "percentage"
                          ? "e.g., 10"
                          : "e.g., 500"
                      }
                      min="0"
                      max={
                        formData.discount_type === "percentage"
                          ? "100"
                          : undefined
                      }
                      step="0.01"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 p-2"
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="min_order_amount"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Minimum Order Amount (₹)
                    </label>
                    <input
                      type="number"
                      id="min_order_amount"
                      name="min_order_amount"
                      value={formData.min_order_amount}
                      onChange={handleInputChange}
                      placeholder="e.g., 1000"
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 p-2"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="max_discount"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Maximum Discount (₹)
                    </label>
                    <input
                      type="number"
                      id="max_discount"
                      name="max_discount"
                      value={formData.max_discount}
                      onChange={handleInputChange}
                      placeholder="e.g., 2000"
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 p-2"
                      disabled={submitting}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty for no maximum limit
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="usage_limit"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      id="usage_limit"
                      name="usage_limit"
                      value={formData.usage_limit}
                      onChange={handleInputChange}
                      placeholder="e.g., 100"
                      min="1"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 p-2"
                      disabled={submitting}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty for unlimited usage
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="expiry_date"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      id="expiry_date"
                      name="expiry_date"
                      value={formData.expiry_date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 p-2"
                      disabled={submitting}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave empty for no expiry
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
                      <span className="text-gray-700">Active Coupon</span>
                    </label>
                  </div>
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
                    placeholder="Enter coupon description"
                    rows="3"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 p-2"
                    disabled={submitting}
                  />
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
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-md hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
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
                        {editingCoupon ? "Updating..." : "Creating..."}
                      </>
                    ) : editingCoupon ? (
                      "Update Coupon"
                    ) : (
                      "Create Coupon"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative bg-gradient-to-r from-purple-100 to-purple-200 p-4">
                    <div className="text-2xl font-bold text-purple-800">
                      {coupon.code}
                    </div>
                    <span
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        coupon.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {coupon.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="text-xl font-semibold text-gray-900 mb-2">
                      {getDiscountDisplay(coupon)}
                    </div>
                    {coupon.min_order_amount > 0 && (
                      <p className="text-sm text-gray-600">
                        Min. order: ₹{coupon.min_order_amount}
                      </p>
                    )}

                    <p className="text-gray-600 text-sm mt-2">
                      {coupon.description || "No description available"}
                    </p>

                    <div className="mt-4 space-y-1 text-sm text-gray-500">
                      <p>
                        Type:{" "}
                        {coupon.discount_type === "percentage"
                          ? "Percentage"
                          : "Fixed Amount"}
                      </p>
                      {coupon.max_discount && (
                        <p>Max Discount: ₹{coupon.max_discount}</p>
                      )}
                      <p>
                        Usage: {coupon.used_count || 0}
                        {coupon.usage_limit
                          ? ` / ${coupon.usage_limit}`
                          : " / Unlimited"}
                      </p>
                      <p
                        className={`${
                          isExpired(coupon.expiry_date) ? "text-red-500" : ""
                        }`}
                      >
                        Expires: {formatDate(coupon.expiry_date)}
                      </p>
                      <p>
                        Created:{" "}
                        {new Date(coupon.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="mt-4 flex justify-between">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="text-blue-500 hover:text-blue-700 focus:outline-none"
                        title="Edit Coupon"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() =>
                          toggleCouponStatus(coupon.id, coupon.is_active)
                        }
                        className={`px-2 py-1 rounded text-sm ${
                          coupon.is_active
                            ? "text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200"
                            : "text-green-500 hover:text-green-700 bg-green-100 hover:bg-green-200"
                        } focus:outline-none`}
                        title={coupon.is_active ? "Deactivate" : "Activate"}
                      >
                        {coupon.is_active ? "🔒 Deactivate" : "🔓 Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        className="text-red-500 hover:text-red-700 focus:outline-none"
                        title="Delete Coupon"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {coupons.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <div className="text-4xl mb-4 text-gray-400">🎫</div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No coupons found
                </h3>
                <p className="text-gray-600 mt-2">
                  Create your first coupon to get started!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCoupons;
