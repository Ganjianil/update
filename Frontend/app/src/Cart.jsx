import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Cart = ({
  isAuthenticated,
  cartItems,
  setCartItems,
  refreshCart,
  cartLoading,
}) => {
  const [loading, setLoading] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [clearingCart, setClearingCart] = useState(false);
  const [removingItems, setRemovingItems] = useState(new Set());
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [addressForm, setAddressForm] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    zip: "",
    country: "India",
  });

  useEffect(() => {
    console.log("Cart component received cartItems:", cartItems);
    setLoading(cartLoading || false);
  }, [cartItems, cartLoading]);

  const removeFromCart = async (itemId) => {
    setRemovingItems((prev) => new Set(prev).add(itemId));
    try {
      const token = localStorage.getItem("token");
      console.log(`Removing item ${itemId} from cart...`);

      await axios.delete(`http://localhost:10145/cart/item/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update local state immediately
      const newCartItems = cartItems.filter((item) => item.id !== itemId);
      setCartItems(newCartItems);

      // Update localStorage
      localStorage.setItem("cartItems", JSON.stringify(newCartItems));

      console.log("Updated cartItems after removal:", newCartItems);

      if (appliedCoupon) {
        calculateDiscount(newCartItems);
      }

      // Refresh cart from server to ensure sync
      if (typeof refreshCart === "function") {
        await refreshCart();
      }

      alert("Item removed from cart successfully!");
    } catch (error) {
      console.error(
        "Error removing item from cart:",
        error.response?.data || error.message
      );
      alert("Failed to remove item from cart");
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const clearCart = async () => {
    if (window.confirm("Are you sure you want to clear your entire cart?")) {
      setClearingCart(true);
      try {
        const token = localStorage.getItem("token");
        console.log("Clearing cart...");

        await axios.delete("http://localhost:10145/cart/clear", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Update local state immediately
        setCartItems([]);
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponCode("");

        // Update localStorage
        localStorage.setItem("cartItems", JSON.stringify([]));

        console.log("Cart cleared, cartItems:", []);

        // Refresh cart from server to ensure sync
        if (typeof refreshCart === "function") {
          await refreshCart();
        }

        alert("Cart cleared successfully!");
      } catch (error) {
        console.error(
          "Error clearing cart:",
          error.response?.data || error.message
        );
        alert("Failed to clear cart");
      } finally {
        setClearingCart(false);
      }
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      alert("Please enter a coupon code");
      return;
    }
    setCouponLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log("Applying coupon:", couponCode);
      const response = await axios.post(
        "http://localhost:10145/apply-coupon",
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
      calculateDiscount(cartItems, response.data.coupon);
      alert("Coupon applied successfully!");
    } catch (error) {
      console.error(
        "Error applying coupon:",
        error.response?.data || error.message
      );
      alert(error.response?.data?.error || "Failed to apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const calculateDiscount = (items, coupon = appliedCoupon) => {
    if (!coupon || !items.length) {
      setDiscount(0);
      return;
    }
    const subtotal = items.reduce(
      (total, item) =>
        total + parseFloat(item.product_price) * (item.quantity || 1),
      0
    );
    let discountAmount = 0;
    if (coupon.discount_type === "percentage") {
      discountAmount = (subtotal * coupon.discount_value) / 100;
    } else if (coupon.discount_type === "fixed") {
      discountAmount = Math.min(coupon.discount_value, subtotal);
    }
    setDiscount(discountAmount);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { name, email, phone, street, city, zip } = addressForm;
    if (!name.trim()) {
      alert("Please enter your full name");
      return false;
    }
    if (!email.trim()) {
      alert("Please enter your email address");
      return false;
    }
    if (!phone.trim()) {
      alert("Please enter your phone number");
      return false;
    }
    if (!street.trim()) {
      alert("Please enter your street address");
      return false;
    }
    if (!city.trim()) {
      alert("Please enter your city");
      return false;
    }
    if (!zip.trim()) {
      alert("Please enter your ZIP/postal code");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return false;
    }
    if (phone.length < 10) {
      alert("Please enter a valid phone number (at least 10 digits)");
      return false;
    }
    return true;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }
    setCheckoutLoading(true);
    try {
      const token = localStorage.getItem("token");
      console.log("Sending checkout request with address:", addressForm);
      const checkoutData = {
        address: {
          name: addressForm.name.trim(),
          email: addressForm.email.trim(),
          phone: addressForm.phone.trim(),
          street: addressForm.street.trim(),
          city: addressForm.city.trim(),
          zip: addressForm.zip.trim(),
          country: addressForm.country,
        },
      };
      if (appliedCoupon) checkoutData.coupon_code = appliedCoupon.code;
      const response = await axios.post(
        "http://localhost:10145/checkout",
        checkoutData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Checkout response:", response.data);
      setOrderSuccess({
        orderId: response.data.orderId,
        totalAmount: response.data.totalAmount,
        discount: response.data.discount || 0,
        orderDetails: response.data.orderDetails,
      });
      setCartItems([]);
      setShowCheckoutForm(false);
      setAppliedCoupon(null);
      setDiscount(0);
      setCouponCode("");
      setAddressForm({
        name: "",
        email: "",
        phone: "",
        street: "",
        city: "",
        zip: "",
        country: "India",
      });
      alert(`Order placed successfully! Order ID: ${response.data.orderId}`);
    } catch (error) {
      console.error("Checkout error:", error.response?.data || error.message);
      let errorMessage = "Checkout failed. Please try again.";
      if (error.response)
        errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          errorMessage;
      else if (error.request)
        errorMessage = "Network error. Please check your connection.";
      alert(errorMessage);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }
    setShowCheckoutForm(true);
  };

  const handleCancelCheckout = () => {
    setShowCheckoutForm(false);
    setAddressForm({
      name: "",
      email: "",
      phone: "",
      street: "",
      city: "",
      zip: "",
      country: "India",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Please login to view your cart
          </h2>
          <Link
            to="/login"
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading || cartLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce(
    (total, item) =>
      total + parseFloat(item.product_price || 0) * (item.quantity || 1),
    0
  );
  const totalAmount = subtotal - discount;

  if (orderSuccess) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-white p-6 rounded-lg shadow-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
            Order Placed Successfully!
          </h2>
          <div className="space-y-4 w-full max-w-md">
            <div className="flex justify-between text-gray-700">
              <strong>Order ID:</strong>
              <span>{orderSuccess.orderId}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <strong>Subtotal:</strong>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {orderSuccess.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <strong>Discount:</strong>
                <span>-₹{orderSuccess.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold text-gray-900">
              <strong>Total Amount:</strong>
              <span>₹{orderSuccess.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setOrderSuccess(null)}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Continue Shopping
            </button>
            <Link
              to="/orders"
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-300"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Your Cart ({cartItems.length} items)
        </h2>
        {cartItems.length > 0 && (
          <button
            onClick={clearCart}
            disabled={clearingCart}
            className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-300 disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            {clearingCart ? "Clearing..." : "Clear All"}
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
            Your cart is empty
          </h3>
          <p className="text-gray-600 mb-4">
            Add some products to get started!
          </p>
          <Link
            to="/categories"
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <>
          {!showCheckoutForm ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md border border-gray-200"
                  >
                    <div className="flex items-center space-x-4">
                      {item.image_path && (
                        <img
                          src={item.image_path}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {item.product_name || "Unknown Product"}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description || "No description available"}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-lg font-medium text-gray-900">
                            ₹{item.product_price || "0.00"}
                          </span>
                          <span className="text-sm text-gray-600">
                            Qty: {item.quantity || 1}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        disabled={removingItems.has(item.id)}
                        className="text-red-500 hover:text-red-700 font-medium disabled:text-red-300 disabled:cursor-not-allowed"
                      >
                        {removingItems.has(item.id) ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                ))}
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
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
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
                </div>

                <div className="flex justify-between items-center py-2 text-gray-700">
                  <span>Subtotal ({cartItems.length} items):</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center py-2 text-green-600">
                    <span>Discount:</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 text-lg font-semibold text-gray-900 border-t pt-4 mt-4">
                  <span>Total:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="mt-6 space-y-4">
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
                  >
                    Proceed to Checkout
                  </button>
                  <Link
                    to="/categories"
                    className="inline-block text-blue-600 hover:text-blue-800 text-center w-full"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  Checkout
                </h2>
                <button
                  onClick={handleCancelCheckout}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← Back to Cart
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Delivery Address
                  </h3>
                  <form onSubmit={handleCheckout} className="space-y-4">
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
                          value={addressForm.name}
                          onChange={handleInputChange}
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
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={addressForm.email}
                          onChange={handleInputChange}
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
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={addressForm.phone}
                          onChange={handleInputChange}
                          placeholder="Enter your phone number"
                          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="flex flex-col">
                        <label
                          htmlFor="zip"
                          className="text-sm font-medium text-gray-700 mb-1"
                        >
                          ZIP/Postal Code *
                        </label>
                        <input
                          type="text"
                          id="zip"
                          name="zip"
                          value={addressForm.zip}
                          onChange={handleInputChange}
                          placeholder="Enter ZIP code"
                          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="flex flex-col sm:col-span-2">
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
                          value={addressForm.street}
                          onChange={handleInputChange}
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
                          value={addressForm.city}
                          onChange={handleInputChange}
                          placeholder="Enter your city"
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
                          value={addressForm.country}
                          onChange={handleInputChange}
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
                    <div className="flex justify-end gap-4 mt-6">
                      <button
                        type="button"
                        onClick={handleCancelCheckout}
                        className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={checkoutLoading}
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {checkoutLoading ? (
                          <>
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Placing Order...
                          </>
                        ) : (
                          `Place Order - ₹${totalAmount.toFixed(2)}`
                        )}
                      </button>
                    </div>
                  </form>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Order Summary
                  </h3>
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center py-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-gray-800 font-medium">
                            {item.product_name}
                          </span>
                          <span className="text-sm text-gray-600">
                            Qty: {item.quantity || 1}
                          </span>
                        </div>
                        <span className="text-gray-900 font-medium">
                          ₹{item.product_price}
                        </span>
                      </div>
                    ))}
                  </div>
                  {appliedCoupon && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center p-2 bg-green-100 rounded-lg">
                        <span>🎫 {appliedCoupon.code}</span>
                        <span>-₹{discount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  <div className="mt-4">
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
                    <div className="flex justify-between items-center py-2 text-lg font-semibold text-gray-900">
                      <span>Total Amount:</span>
                      <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Cart;
