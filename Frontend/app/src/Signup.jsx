import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const validateForm = () => {
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters long");
      return false;
    }
    if (!formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:10145/signup", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      alert("Account created successfully! Please login.");
      navigate("/login");
    } catch (error) {
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.status === 400) {
        setError("User with this username or email already exists");
      } else if (error.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-24 mx-auto flex flex-wrap items-center">
        <div className="lg:w-3/5 md:w-1/2 md:pr-16 lg:pr-0 pr-0">
          <h1 className="title-font font-medium text-3xl text-gray-900">
            Create Your Account at Nandhini Crafts
          </h1>
          <p className="leading-relaxed mt-4">
            Sign up to explore handcrafted brass and silver idols from our
            workshop to your doorstep.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0"
        >
          <h2 className="text-gray-900 text-lg font-medium title-font mb-5">
            Sign Up
          </h2>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <label htmlFor="username" className="text-sm text-gray-600 mb-1">
            Username
          </label>
          <input
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            className="mb-4 bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3"
          />

          <label htmlFor="email" className="text-sm text-gray-600 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            className="mb-4 bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3"
          />

          {/* Password Field */}
          <label htmlFor="password" className="text-sm text-gray-600 mb-1">
            Password
          </label>
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full pl-10 bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm outline-none text-gray-700 py-2 px-3"
            />
            <div
              className="absolute inset-y-0 left-0 flex items-center pl-3 cursor-pointer"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {showPassword ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0M3 3l18 18"
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Confirm Password Field */}
          <label
            htmlFor="confirmPassword"
            className="text-sm text-gray-600 mb-1"
          >
            Confirm Password
          </label>
          <div className="relative mb-4">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full pl-10 bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm outline-none text-gray-700 py-2 px-3"
            />
            <div
              className="absolute inset-y-0 left-0 flex items-center pl-3 cursor-pointer"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {showConfirmPassword ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0M3 3l18 18"
                  />
                )}
              </svg>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <p className="text-xs text-gray-500 mt-3">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-500">
              Login here
            </Link>
            .
          </p>
        </form>
      </div>
    </section>
  );
};

export default Signup;
