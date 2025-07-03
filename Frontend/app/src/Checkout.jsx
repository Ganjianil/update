import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const Checkout = ({ selectedProduct }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [address, setAddress] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    zip: "",
    country: "India",
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
        console.log(
          "Fetching product - selectedProduct:",
          selectedProduct,
          "productId:",
          productId
        );
        const productToFetch = selectedProduct?.product_id || productId;
        if (!productToFetch) {
          setError("No product selected for checkout.");
          setLoading(false);
          return;
        }
        const productResponse = await axios.get(
          `https://update-xrp4.onrender.com/products/${productToFetch}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Fetched product:", productResponse.data);
        setProduct(productResponse.data);
      } catch (error) {
        console.error("Error fetching checkout data:", error);
        setError(
          "Failed to load product details: " +
            (error.response?.data?.error || error.message)
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [productId, selectedProduct?.product_id, navigate]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }
    setCouponLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://update-xrp4.onrender.com/apply-coupon",
        { coupon_code: couponCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Coupon response:", response.data);
      setAppliedCoupon(response.data.coupon);
      calculateDiscount([selectedProduct || product], response.data.coupon);
      setError("");
    } catch (error) {
      console.error(
        "Error applying coupon:",
        error.response?.data || error.message
      );
      setAppliedCoupon(null);
      setDiscount(0);
      setError(error.response?.data?.error || "Failed to apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode("");
    setError("");
  };

  const calculateDiscount = (items, coupon = appliedCoupon) => {
    if (!coupon || !items.length || !items[0]) {
      setDiscount(0);
      return;
    }
    const subtotal = items[0] ? parseFloat(items[0].product_price || 0) : 0;
    let discountAmount = 0;
    if (coupon.discount_type === "percentage") {
      discountAmount = (subtotal * coupon.discount_value) / 100;
    } else if (coupon.discount_type === "fixed") {
      discountAmount = Math.min(coupon.discount_value, subtotal);
    }
    setDiscount(discountAmount);
  };

  const handlePayment = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const checkoutItem = selectedProduct || product;
      if (!checkoutItem || !checkoutItem.product_id) {
        setError("Invalid product selected for checkout.");
        return;
      }
      const requiredFields = [
        "name",
        "email",
        "phone",
        "street",
        "city",
        "zip",
        "country",
      ];
      const missingFields = requiredFields.filter(
        (field) => !address[field].trim()
      );
      if (missingFields.length > 0) {
        setError(
          `Missing required address details: ${missingFields.join(", ")}`
        );
        return;
      }
      console.log("Address before payment:", address);
      console.log("Checkout item:", checkoutItem);

      const payload = {
        product_ids: [checkoutItem.product_id],
        address,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        discount,
        action_type: "buy_now",
      };
      console.log("Sending payload to /checkout:", payload);

      const response = await axios.post(
        "https://update-xrp4.onrender.com/checkout",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Checkout response:", response.data);
      alert(`Payment successful! Order ID: ${response.data.orderId}`);
      navigate("/orders");
    } catch (error) {
      console.error("Error processing payment:", error);
      const errorData = error.response?.data || {};
      console.log("Full error response:", errorData);
      const errorMsg =
        errorData.error || errorData.message || "Server error during payment.";
      setError(
        errorMsg.includes("address") ? errorMsg : `Server error: ${errorMsg}`
      );
      alert(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">Loading...</div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {error || "Product not found"}
      </div>
    );
  }

  const checkoutItem = selectedProduct || product;
  const subtotal = checkoutItem
    ? parseFloat(checkoutItem.product_price || 0)
    : 0;
  const totalAmount = subtotal - discount;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Checkout - {checkoutItem?.product_name || "Selected Product"}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Delivery Address
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-700 mb-1"
              >
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={address.name}
                onChange={handleAddressChange}
                placeholder="Enter your full name"
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 mb-1"
              >
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={address.email}
                onChange={handleAddressChange}
                placeholder="Enter your email"
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="phone"
                className="text-sm font-medium text-gray-700 mb-1"
              >
                Phone *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={address.phone}
                onChange={handleAddressChange}
                placeholder="Enter your phone number"
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="street"
                className="text-sm font-medium text-gray-700 mb-1"
              >
                Street Address *
              </label>
              <input
                type="text"
                id="street"
                name="street"
                value={address.street}
                onChange={handleAddressChange}
                placeholder="Enter your street address"
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="city"
                className="text-sm font-medium text-gray-700 mb-1"
              >
                City *
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={address.city}
                onChange={handleAddressChange}
                placeholder="Enter your city"
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="zip"
                className="text-sm font-medium text-gray-700 mb-1"
              >
                ZIP Code *
              </label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={address.zip}
                onChange={handleAddressChange}
                placeholder="Enter ZIP code"
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="country"
                className="text-sm font-medium text-gray-700 mb-1"
              >
                Country
              </label>
              <select
                id="country"
                name="country"
                value={address.country}
                onChange={handleAddressChange}
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="India">India</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
              </select>
            </div>
          </div>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Order Summary
          </h3>

          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-800 mb-2">
              Apply Coupon
            </h4>
            {!appliedCoupon ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {couponLoading ? "Applying..." : "Apply"}
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center p-2 bg-green-100 rounded-lg">
                <div className="flex gap-2">
                  <span className="text-green-700 font-medium">
                    🎫 {appliedCoupon.code}
                  </span>
                  <span className="text-green-700">
                    {appliedCoupon.discount_type === "percentage"
                      ? `${appliedCoupon.discount_value}% OFF`
                      : `₹${appliedCoupon.discount_value} OFF`}
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            )}
            {error && <p className="text-red-600 mt-2">{error}</p>}
          </div>

          <div className="space-y-2">
            {checkoutItem && (
              <div className="flex justify-between items-center py-2">
                <div className="flex flex-col">
                  <span className="text-gray-800 font-medium">
                    {checkoutItem.product_name || "Unknown Product"}
                  </span>
                  <span className="text-sm text-gray-600">Qty: 1</span>
                </div>
                <span className="text-gray-900 font-medium">
                  ₹{checkoutItem.product_price || "0.00"}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center py-2 text-gray-700">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center py-2 text-green-600">
                <span>Discount:</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 text-lg font-semibold text-gray-900 border-t pt-4">
              <span>Total:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handlePayment}
            className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={
              !checkoutItem ||
              !address.name ||
              !address.email ||
              !address.phone ||
              !address.street ||
              !address.city ||
              !address.zip ||
              !address.country
            }
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
