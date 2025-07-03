import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import AddProduct from "./Addproduct";
import Manageproducts from "./Manageproducts";
import ViewOrders from "./ViewOrders";
import ManageCategories from "./ManageCategories";
import ManageCoupons from "./ManageCoupons";
import ManagePreOrderProducts from "./ManagePreOrderProducts";
import ManagePreOrderSubmissions from "./ManagePreOrderSubmissions";
import ManagePermissions from "./ManagePreOrderSubmissions"; // New component
import Photos from "./Photos";

const AdminDashboard = ({ isAdminAuthenticated, onAdminLogout }) => {
  const [activeTab, setActiveTab] = useState("add-product");

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "add-product":
        return <AddProduct />;
      case "add-preorder-product":
        return <ManagePreOrderProducts />;
      case "manage-products":
        return <Manageproducts />;
      case "manage-categories":
        return <ManageCategories />;
      case "manage-coupons":
        return <ManageCoupons />;
      case "manage-preorder-submissions":
        return <ManagePreOrderSubmissions />;
      case "view-orders":
        return <ViewOrders />;
      case "photos":
        return <Photos />;
      case "manage-permissions":
        return <ManagePermissions />;
      default:
        return <AddProduct />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between bg-white shadow px-6 py-4">
        <h1 className="text-2xl font-bold text-indigo-700">Admin Dashboard</h1>
        <button
          onClick={onAdminLogout}
          className="text-sm px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
        >
          Logout
        </button>
      </div>

      {/* Layout */}
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white shadow-md p-4">
          <nav className="space-y-6">
            {/* Products Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Products
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab("add-product")}
                    className={`w-full text-left px-4 py-2 rounded ${
                      activeTab === "add-product"
                        ? "bg-indigo-100 text-indigo-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    ➕ Add Product
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("add-preorder-product")}
                    className={`w-full text-left px-4 py-2 rounded ${
                      activeTab === "add-preorder-product"
                        ? "bg-indigo-100 text-indigo-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    🛠️ Add Pre-order Product
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("manage-products")}
                    className={`w-full text-left px-4 py-2 rounded ${
                      activeTab === "manage-products"
                        ? "bg-indigo-100 text-indigo-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    📦 Manage Products
                  </button>
                </li>
              </ul>
            </div>

            {/* Categories & Coupons */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Categories & Coupons
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab("manage-categories")}
                    className={`w-full text-left px-4 py-2 rounded ${
                      activeTab === "manage-categories"
                        ? "bg-indigo-100 text-indigo-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    📂 Manage Categories
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("manage-coupons")}
                    className={`w-full text-left px-4 py-2 rounded ${
                      activeTab === "manage-coupons"
                        ? "bg-indigo-100 text-indigo-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    🎫 Manage Coupons
                  </button>
                </li>
              </ul>
            </div>

            {/* Orders */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Orders
              </h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab("view-orders")}
                    className={`w-full text-left px-4 py-2 rounded ${
                      activeTab === "view-orders"
                        ? "bg-indigo-100 text-indigo-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    📋 View Orders
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("manage-preorder-submissions")}
                    className={`w-full text-left px-4 py-2 rounded ${
                      activeTab === "manage-preorder-submissions"
                        ? "bg-indigo-100 text-indigo-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    🛒 Manage Pre-order Submissions
                  </button>
                </li>
              </ul>
            </div>

            {/* Media */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Media
              </h3>
              <ul>
                <li>
                  <button
                    onClick={() => setActiveTab("photos")}
                    className={`w-full text-left px-4 py-2 rounded ${
                      activeTab === "photos"
                        ? "bg-indigo-100 text-indigo-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    📸 Manage Photos
                  </button>
                </li>
              </ul>
            </div>

            {/* Permissions */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Permissions
              </h3>
              <ul>
                <li>
                  <button
                    onClick={() => setActiveTab("manage-permissions")}
                    className={`w-full text-left px-4 py-2 rounded ${
                      activeTab === "manage-permissions"
                        ? "bg-indigo-100 text-indigo-700 font-medium"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    🔐 Manage Permissions
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 bg-gray-50">{renderActiveComponent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
