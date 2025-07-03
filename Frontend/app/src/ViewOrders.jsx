import React, { useState, useEffect } from "react";
import axios from "axios";

const ViewOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(
        "http://localhost:10145/admin/orders"
      );
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      setUpdatingStatus(orderId);
      await axios.put(`http://localhost:10145/order/${orderId}/status`, {
        status,
      });
      alert(
        `Order status updated to ${status}. Customer has been notified via email.`
      );
      fetchOrders(); // Refresh the list
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "processing":
        return "#ffa500";
      case "shipped":
        return "#2196f3";
      case "delivered":
        return "#4caf50";
      case "cancelled":
        return "#f44336";
      default:
        return "#757575";
    }
  };

  const getStatusActions = (currentStatus) => {
    const status = currentStatus?.toLowerCase();
    const actions = [];

    if (status === "processing" || status === "pending") {
      actions.push("shipped", "cancelled");
    } else if (status === "shipped") {
      actions.push("delivered");
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-lg text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  // Group orders by order_id
  const groupedOrders = orders.reduce((acc, order) => {
    if (!acc[order.order_id]) {
      acc[order.order_id] = {
        order_id: order.order_id,
        order_date: order.order_date,
        status: order.status,
        username: order.username,
        // Address details
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

  const ordersList = Object.values(groupedOrders);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              All Orders Management
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <h3 className="text-xl font-semibold text-blue-700">
                {ordersList.length}
              </h3>
              <p className="text-gray-600">Total Orders</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <h3 className="text-xl font-semibold text-yellow-700">
                {ordersList.filter((o) => o.status === "processing").length}
              </h3>
              <p className="text-gray-600">Processing</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <h3 className="text-xl font-semibold text-indigo-700">
                {ordersList.filter((o) => o.status === "shipped").length}
              </h3>
              <p className="text-gray-600">Shipped</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <h3 className="text-xl font-semibold text-green-700">
                {ordersList.filter((o) => o.status === "delivered").length}
              </h3>
              <p className="text-gray-600">Delivered</p>
            </div>
          </div>

          {ordersList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <div className="text-4xl mb-4 text-gray-400">📦</div>
              <h3 className="text-lg font-semibold text-gray-900">
                No orders found
              </h3>
              <p className="text-gray-600 mt-2">
                No orders have been placed yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {ordersList.map((order) => (
                <div
                  key={order.order_id}
                  className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg"
                >
                  <div className="p-4 flex justify-between items-center bg-gray-50">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.order_id}
                      </h3>
                      <div className="text-sm text-gray-600 mt-1 space-y-1">
                        <p>
                          <strong>Customer:</strong> {order.username}
                        </p>
                        <p>
                          <strong>Contact:</strong> {order.name}
                        </p>
                        <p>
                          <strong>Email:</strong> {order.email}
                        </p>
                        <p>
                          <strong>Phone:</strong> {order.phone}
                        </p>
                        <p>
                          <strong>Date:</strong>{" "}
                          {new Date(order.order_date).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Status:</strong>
                          <span
                            className="ml-2 px-2 py-1 rounded-full text-white text-xs font-medium"
                            style={{
                              backgroundColor: getStatusColor(order.status),
                            }}
                          >
                            {order.status?.charAt(0).toUpperCase() +
                              order.status?.slice(1) || "Pending"}
                          </span>
                        </p>
                        <p>
                          <strong>Total:</strong> ₹{order.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleOrderDetails(order.order_id)}
                      className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {expandedOrder === order.order_id
                        ? "Hide Details"
                        : "View Details"}
                    </button>
                  </div>

                  {expandedOrder === order.order_id && (
                    <div className="p-4 bg-gray-50 animate-fade-in">
                      {/* Customer Address Information */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          🏠 Delivery Address
                        </h4>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">
                                <strong>Full Name:</strong> {order.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Email:</strong> {order.email}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Phone:</strong> {order.phone}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                <strong>ZIP Code:</strong> {order.zip}
                              </p>
                              <p className="text-sm text-gray-600">
                                <strong>Street:</strong> {order.street}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">
                              <strong>City:</strong> {order.city}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Country:</strong> {order.country}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          📦 Order Items ({order.items.length})
                        </h4>
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-100 text-sm font-medium text-gray-700">
                            <span>Product Name</span>
                            <span>Quantity</span>
                            <span>Unit Price</span>
                            <span>Total</span>
                          </div>
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-4 gap-4 p-4 border-t border-gray-200 text-sm text-gray-600"
                            >
                              <span>{item.product_name}</span>
                              <span>{item.quantity}</span>
                              <span>₹{item.product_price}</span>
                              <span>
                                ₹
                                {(
                                  parseFloat(item.product_price) * item.quantity
                                ).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 text-sm font-semibold text-gray-900 border-t border-gray-200">
                            <span>
                              <strong>Grand Total:</strong>
                            </span>
                            <span></span>
                            <span></span>
                            <span>
                              <strong>₹{order.total.toFixed(2)}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Order Actions */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          ⚡ Update Order Status
                        </h4>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                          <p className="text-sm text-gray-600">
                            Current Status:{" "}
                            <span
                              className="ml-2 px-2 py-1 rounded-full text-white text-xs font-medium"
                              style={{
                                backgroundColor: getStatusColor(order.status),
                              }}
                            >
                              {order.status?.charAt(0).toUpperCase() +
                                order.status?.slice(1) || "Pending"}
                            </span>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {getStatusActions(order.status).map((status) => (
                            <button
                              key={status}
                              onClick={() =>
                                updateOrderStatus(order.order_id, status)
                              }
                              className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                status === "shipped"
                                  ? "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500"
                                  : status === "delivered"
                                  ? "bg-green-500 hover:bg-green-600 focus:ring-green-500"
                                  : "bg-red-500 hover:bg-red-600 focus:ring-red-500"
                              }`}
                              disabled={updatingStatus === order.order_id}
                            >
                              {updatingStatus === order.order_id
                                ? "Updating..."
                                : `Mark as ${
                                    status.charAt(0).toUpperCase() +
                                    status.slice(1)
                                  }`}
                            </button>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500">
                          <small>
                            📧 Customer will be automatically notified via email
                            when status is updated.
                          </small>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewOrders;
