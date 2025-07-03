import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import hp from "/hp.jpeg";
import axios from "axios";
import {
  HeartIcon,
  ShoppingCartIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

const Header = ({ isLoggedIn, onLogout, cartItems }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsAuthenticated(isLoggedIn);
    if (isLoggedIn) {
      fetchWishlistCount();
    } else {
      setWishlistCount(0);
    }
  }, [isLoggedIn, cartItems]);

  const fetchWishlistCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(
        "https://update-xrp4.onrender.com/wishlist",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (Array.isArray(response.data)) {
        setWishlistCount(response.data.length);
      }
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      setWishlistCount(0);
    }
  };

  const handleLogout = () => {
    onLogout();
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setWishlistCount(0);
    navigate("/login", { state: { from: location.pathname } });
  };

  const cartItemCount = cartItems.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src={hp}
            alt="logo"
            className="w-10 h-10 object-cover rounded-full border-2 border-indigo-500"
          />
          <span className="ml-3 font-semibold text-lg text-gray-800">
            Nandhini Brass & Metal Crafts
          </span>
        </Link>

        <div className="md:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6 text-gray-700" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        <nav className="hidden md:flex items-center space-x-6 text-sm">
          <Link to="/" className="hover:text-indigo-600">
            Home
          </Link>
          <Link to="/admin/login" className="hover:text-indigo-600">
            Surge
          </Link>
          {isAuthenticated && (
            <Link to="/orders" className="hover:text-indigo-600">
              Orders
            </Link>
          )}
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="hover:text-indigo-600">
                Login
              </Link>
              <Link to="/signup" className="hover:text-indigo-600">
                Signup
              </Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="hover:text-indigo-600 bg-transparent text-sm"
            >
              Logout
            </button>
          )}
        </nav>

        <div className="hidden md:flex items-center space-x-3">
          {isAuthenticated && (
            <Link
              to="/wishlist"
              className="relative bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
            >
              <HeartIcon className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}
          <Link to="/cart">
            <div className="relative bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full">
              <ShoppingCartIcon className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-blue-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 p-4 space-y-4 text-sm">
          <nav className="flex flex-col gap-3">
            <Link
              to="/"
              className="text-gray-800 hover:text-indigo-600 font-medium"
            >
              🏠 Home
            </Link>
            <Link
              to="/surge"
              className="text-gray-800 hover:text-indigo-600 font-medium"
            >
              📦 Surge
            </Link>
            {isAuthenticated && (
              <Link
                to="/orders"
                className="text-gray-800 hover:text-indigo-600 font-medium"
              >
                📋 Orders
              </Link>
            )}
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-800 hover:text-indigo-600 font-medium"
                >
                  🔐 Login
                </Link>
                <Link
                  to="/signup"
                  className="text-gray-800 hover:text-indigo-600 font-medium"
                >
                  🆕 Signup
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="text-left text-red-600 hover:text-red-700 font-medium"
              >
                🚪 Logout
              </button>
            )}
          </nav>

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Your Essentials
            </h3>
            <div className="flex flex-col gap-3">
              {isAuthenticated && (
                <Link
                  to="/wishlist"
                  className="flex items-center justify-between text-gray-700 hover:text-red-500"
                >
                  <span className="flex items-center gap-2">
                    <HeartIcon className="w-5 h-5" />
                    Wishlist
                  </span>
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {wishlistCount}
                  </span>
                </Link>
              )}
              <Link
                to="/cart"
                className="flex items-center justify-between text-gray-700 hover:text-blue-600"
              >
                <span className="flex items-center gap-2">
                  <ShoppingCartIcon className="w-5 h-5" />
                  Cart
                </span>
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {cartItemCount}
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
