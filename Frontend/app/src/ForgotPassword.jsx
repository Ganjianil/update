import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await axios.post("http://localhost:10145/forgot-password", {
        email,
      });
      setMessage("✅ Password reset email sent! Please check your inbox.");
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage =
        error.response?.data ||
        "❌ Failed to send reset email. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-indigo-700 mb-2">
          Nandini Brass & Metal Crafts
        </h1>
        <p className="text-center text-gray-500 mb-6">Reset your password</p>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded mb-4 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <span className="absolute right-3 top-2.5 text-gray-400">📧</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                Sending Reset Link...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-600">
          Remember your password?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
