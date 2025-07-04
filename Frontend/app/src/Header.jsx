import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import hp from "/hp.jpeg";
import axios from "axios";
import {
  HeartIcon,
  ShoppingCartIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const Header = ({ isLoggedIn, onLogout, cartItems }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsAuthenticated(isLoggedIn);
    if (isLoggedIn) fetchWishlistCount();
    else setWishlistCount(0);
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
      if (Array.isArray(response.data)) setWishlistCount(response.data.length);
    } catch (err) {
      console.error("Wishlist fetch error:", err);
    }
  };

  const handleLogout = () => {
    onLogout();
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setWishlistCount(0);
    navigate("/login", { state: { from: location.pathname } });
    setMobileMenuOpen(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await axios.get(
        `https://update-xrp4.onrender.com/products/search?q=${encodeURIComponent(
          searchQuery.trim()
        )}`
      );
      const products = response.data;

      if (Array.isArray(products)) {
        if (products.length === 1) {
          navigate(`/product/${products[0].id}`);
        } else if (products.length > 1) {
          navigate(
            `/products?search=${encodeURIComponent(searchQuery.trim())}`
          );
        } else {
          navigate(
            `/products?search=${encodeURIComponent(searchQuery.trim())}`
          );
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      // Fallback to search page even if the API fails
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } finally {
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  const cartItemCount = cartItems.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  return (
    <header className="bg-white shadow-md fixed top-0 w-full z-50">
      {/* Desktop Layout */}
      <div className="hidden md:flex max-w-7xl mx-auto px-4 py-3 items-center justify-between space-x-4">
        <Link to="/" className="flex items-center space-x-2">
          <img
            src={hp}
            alt="Logo"
            className="w-10 h-10 rounded-full border-2 border-blue-600"
          />
          <span className="text-lg font-semibold text-gray-800">
            Nandhini Brass & Metal Crafts
          </span>
        </Link>
        {/* Search */}
        <div className="flex-1 mx-6 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search idols, materials, collections..."
            className="w-full px-4 py-2 pr-10 border rounded-md text-sm focus:outline-none focus:ring focus:border-blue-300"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            🔍
          </button>
        </div>
        {/* Navigation and Icons */}
        <nav className="flex items-center space-x-6">
          <Link
            to="/"
            className="text-gray-600 hover:text-blue-600 transition-colors"
          >
            <HomeIcon className="w-6 h-6" />
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/wishlist"
                className="relative text-gray-600 hover:text-blue-600 transition-colors"
              >
                <HeartIcon className="w-6 h-6" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/signup"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Signup
              </Link>
              <Link
                to="/login"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                Login
              </Link>
            </>
          )}
          <Link
            to="/cart"
            className="relative text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ShoppingCartIcon className="w-6 h-6" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden pl-4 pr-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            className="text-blue-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
          <Link to="/" className="flex items-center space-x-2">
            <img
              src={hp}
              alt="Logo"
              className="w-10 h-10 rounded-full border-2 border-blue-600"
            />
            <span className="text-base font-semibold text-gray-800">
              Nandhini Brass & Metal Crafts
            </span>
          </Link>
        </div>

        <Link to="/cart" className="relative hover:text-blue-600 ml-auto pr-2">
          <ShoppingCartIcon className="w-5 h-5" />
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </Link>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search products..."
            className="w-full px-4 py-2 pr-10 border rounded-md text-sm focus:outline-none focus:ring focus:border-blue-300"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            🔍
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="px-4 pb-3 border-t bg-white md:hidden">
          <nav className="flex flex-col space-y-3 pt-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-4 py-2 rounded-md hover:bg-blue-50 text-gray-800 hover:text-blue-600 transition-all"
            >
              <HomeIcon className="w-4 h-4 mr-1" />
              Home
            </Link>
            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center px-4 py-2 rounded-md hover:bg-blue-50 text-gray-800 hover:text-blue-600 transition-all"
            >
              Surge
            </Link>
            {!isAuthenticated ? (
              <>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-2 rounded-md hover:bg-blue-50 text-gray-800 hover:text-blue-600 transition-all"
                >
                  Signup
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-2 rounded-md hover:bg-blue-50 text-gray-800 hover:text-blue-600 transition-all"
                >
                  Login
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-2 rounded-md hover:bg-blue-50 text-gray-800 hover:text-blue-600 transition-all relative"
                >
                  <HeartIcon className="w-5 h-5 mr-1" />
                  Wishlist
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 rounded-md hover:bg-red-50 text-gray-800 hover:text-red-600 transition-all text-left"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
