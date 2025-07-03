import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import axios from "axios";

const Orders = ({ isAuthenticated: propIsAuthenticated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const authStatus = !!token;
    setIsAuthenticated(authStatus);
    if (authStatus) {
      fetchOrders();
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      const authStatus = !!token;
      setIsAuthenticated(authStatus);
      if (authStatus && !orders.length) {
        fetchOrders();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      const authStatus = !!token;
      if (authStatus !== isAuthenticated) {
        setIsAuthenticated(authStatus);
        if (authStatus) {
          fetchOrders();
        }
      }
    }, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [isAuthenticated, orders.length]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }
      console.log("Fetching orders with token:", token);
      const response = await axios.get(
        "https://update-xrp4.onrender.com/myorders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const grouped = response.data.reduce((acc, order) => {
        if (!acc[order.order_id]) {
          acc[order.order_id] = {
            order_id: order.order_id,
            order_date: order.order_date,
            status: order.status || "processing",
            name: order.name,
            email: order.email,
            phone: order.phone,
            street: order.street,
            city: order.city,
            zip: order.zip,
            country: order.country,
            items: [],
            total: 0,
          };
        }
        acc[order.order_id].items.push({
          product_name: order.product_name,
          product_price: order.product_price,
          quantity: order.quantity || 1,
        });
        acc[order.order_id].total +=
          parseFloat(order.product_price) * (order.quantity || 1);
        return acc;
      }, {});

      setOrders(Object.values(grouped));
    } catch (err) {
      console.error(
        "Error fetching orders:",
        err.response?.data || err.message
      );
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        navigate("/login", { state: { from: location.pathname } });
      } else {
        setError("Failed to fetch orders. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      setCancellingOrder(orderId);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }
      console.log(`Cancelling order ${orderId} with token:`, token);
      const response = await axios.put(
        `https://update-xrp4.onrender.com/order/${orderId}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Cancel order response:", response.data);
      alert("Order cancelled successfully");
      fetchOrders();
    } catch (err) {
      console.error(
        "Error cancelling order:",
        err.response?.data || err.message
      );
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        navigate("/login", { state: { from: location.pathname } });
      } else if (err.response?.status === 400) {
        alert("Order cannot be cancelled or not found");
      } else {
        alert("Failed to cancel order");
      }
    } finally {
      setCancellingOrder(null);
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }
      console.log(
        `Downloading invoice for order ${orderId} with token:`,
        token
      );
      const res = await axios.get(
        `https://update-xrp4.onrender.com/order/${orderId}/invoice`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(
        "Error downloading invoice:",
        err.response?.data || err.message
      );
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        navigate("/login", { state: { from: location.pathname } });
      } else {
        alert("Failed to download invoice");
      }
    }
  };

  const getStatusClasses = (status) => {
    const base =
      "inline-block px-3 py-1 rounded-full text-xs font-semibold shadow";
    switch (status?.toLowerCase()) {
      case "processing":
        return `${base} bg-yellow-100 text-yellow-800`;
      case "shipped":
        return `${base} bg-blue-100 text-blue-800`;
      case "delivered":
        return `${base} bg-green-100 text-green-800`;
      case "cancelled":
        return `${base} bg-red-100 text-red-800`;
      default:
        return `${base} bg-gray-200 text-gray-800`;
    }
  };

  const canCancelOrder = (status) =>
    ["processing", "pending"].includes(status?.toLowerCase());

  const canDownloadInvoice = (status) => status?.toLowerCase() === "shipped";

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-100 min-h-screen font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
          My Orders
        </h1>
        <button
          onClick={() => navigate("/")}
          className="bg-yellow-500 text-white px-4 py-2 rounded-md font-medium text-sm sm:text-base hover:bg-yellow-600 transition-colors duration-200 shadow"
        >
          Continue Shopping
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Loading your orders...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
          <div className="text-4xl mb-4">😕</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-600 transition-colors duration-200 shadow"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
          <div className="text-4xl mb-4">😕</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No orders found
          </h3>
          <p className="text-gray-600 mb-4">
            You haven't placed any orders yet.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-600 transition-colors duration-200 shadow"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        !loading &&
        !error && (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.order_id}
                className="bg-white rounded-lg shadow-md p-4 sm:p-6 flex flex-col hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Order #{order.order_id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Placed on{" "}
                      {new Date(order.order_date).toLocaleDateString()}
                    </p>
                    <div className="mt-2">
                      <span className={getStatusClasses(order.status)}>
                        {order.status?.charAt(0).toUpperCase() +
                          order.status?.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <p className="text-sm text-gray-600 mb-1">Total</p>
                    <p className="text-lg font-bold text-indigo-600">
                      ₹{order.total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">
                    Items ({order.items.length})
                  </h4>
                  <ul className="divide-y text-sm text-gray-600">
                    {order.items.map((item, index) => (
                      <li key={index} className="flex justify-between py-2">
                        <span>{item.product_name}</span>
                        <span>Qty: {item.quantity}</span>
                        <span>₹{item.product_price}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">
                    Delivery Address
                  </h4>
                  <p className="text-sm text-gray-600">
                    <strong>{order.name}</strong>
                    <br />
                    {order.email} | {order.phone}
                    <br />
                    {order.street}
                    <br />
                    {order.city}, {order.zip}
                    <br />
                    {order.country}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  {canDownloadInvoice(order.status) && (
                    <button
                      onClick={() => downloadInvoice(order.order_id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition-colors duration-200 shadow"
                    >
                      📄 Download Invoice
                    </button>
                  )}
                  {canCancelOrder(order.status) && (
                    <button
                      onClick={() => cancelOrder(order.order_id)}
                      disabled={cancellingOrder === order.order_id}
                      className="bg-red-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                    >
                      {cancellingOrder === order.order_id
                        ? "Cancelling..."
                        : "❌ Cancel Order"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Orders;
