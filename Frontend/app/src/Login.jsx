import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const Login = ({ onLogin = () => {} }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Username or email is required");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
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
      const response = await axios.post("http://localhost:10145/login", {
        username: formData.username,
        password: formData.password,
      });

      console.log("Login response:", response.data);

      if (response.data.token && response.data.user) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        onLogin(response.data.token, response.data.user); // Won't break if not passed
        navigate("/");
      } else {
        setError("Invalid response from server");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.status === 401) {
        setError("Invalid username or password");
      } else if (error.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
    if (response.data.token && response.data.user) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      onLogin(response.data.token, response.data.user); // triggers App.jsx login and cart refresh
      // Optional: refresh categories/products for first login sync
      // fetchCategories(); // if available as prop/context
      navigate("/");
    }
  };

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-24 mx-auto flex flex-wrap items-center">
        <div className="lg:w-3/5 md:w-1/2 md:pr-16 lg:pr-0 pr-0">
          <h1 className="title-font font-medium text-3xl text-gray-900">
            Welcome Back to Nandhini Crafts
          </h1>
          <p className="leading-relaxed mt-4">
            Sign in to manage your orders, explore new arrivals, and stay
            connected with our latest collections.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0"
        >
          <h2 className="text-gray-900 text-lg font-medium title-font mb-5">
            Login
          </h2>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="relative mb-4">
            <label
              htmlFor="username"
              className="leading-7 text-sm text-gray-600"
            >
              Username or Email
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm outline-none text-gray-700 py-2 px-3"
            />
          </div>

          <div className="relative mb-4">
            <label
              htmlFor="password"
              className="leading-7 text-sm text-gray-600"
            >
              Password
            </label>
            <div className="relative">
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <p className="text-xs text-gray-500 mt-3">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-indigo-500">
              Sign up here
            </Link>
            .
          </p>

          <div className="mt-2 text-right">
            <Link
              to="/forgotpassword"
              className="text-sm text-indigo-500 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Login;




