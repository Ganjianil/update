import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = ({ onAdminLogin }) => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.username === "anil" && formData.password === "anil") {
      onAdminLogin();
      navigate("/admin/dashboard");
    } else {
      setError("Invalid admin credentials");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white shadow-lg rounded-lg p-8 border">
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">
          Admin Login
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="text-sm text-gray-700">
              Username
            </label>
            <input
              type="text"
              name="username"
              id="username"
              placeholder="Enter admin username"
              value={formData.username}
              onChange={handleChange}
              required
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-indigo-200 text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Enter admin password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-indigo-200 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors"
          >
            Login as Admin
          </button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-4">
          For testing: Username: <code className="font-mono">anil</code> |
          Password: <code className="font-mono">anil</code>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
