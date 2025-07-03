import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Wishlist = ({ isAuthenticated: propIsAuthenticated, setCartItems }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingItems, setRemovingItems] = useState(new Set());
  const [clearingWishlist, setClearingWishlist] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const authStatus = !!token;
    setIsAuthenticated(authStatus);
    if (authStatus) {
      fetchWishlistItems();
    } else {
      navigate("/login", { state: { from: location.pathname } });
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      const authStatus = !!token;
      setIsAuthenticated(authStatus);
      if (authStatus && !wishlistItems.length) {
        fetchWishlistItems();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      const authStatus = !!token;
      if (authStatus !== isAuthenticated) {
        setIsAuthenticated(authStatus);
        if (authStatus) {
          fetchWishlistItems();
        } else {
          navigate("/login", { state: { from: location.pathname } });
        }
      }
    }, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [isAuthenticated, wishlistItems.length, navigate, location.pathname]);

  const fetchWishlistItems = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      console.log("Fetching wishlist items...");
      const response = await axios.get(
        "https://update-xrp4.onrender.com/wishlist",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Wishlist response:", response.data);

      if (Array.isArray(response.data)) {
        setWishlistItems(response.data);
      } else {
        console.error("Expected array but got:", typeof response.data);
        setWishlistItems([]);
        setError("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching wishlist items:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        navigate("/login", { state: { from: location.pathname } });
      } else if (error.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError("Failed to load wishlist. Please try again.");
      }

      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId) => {
    if (!itemId) {
      alert("Invalid item ID");
      return;
    }

    setRemovingItems((prev) => new Set(prev).add(itemId));

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      console.log(`Removing wishlist item with ID: ${itemId}`);
      const response = await axios.delete(
        `https://update-xrp4.onrender.com/wishlist/${itemId}`, // Ensure this matches backend
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(`Remove response:`, response.status, response.data);

      setWishlistItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemId)
      );
      alert("Item removed from wishlist successfully!");
    } catch (error) {
      console.error("Error removing item from wishlist:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        navigate("/login", { state: { from: location.pathname } });
      } else if (error.response?.status === 404) {
        setError("Wishlist service is unavailable. Please try again later.");
        alert("Wishlist service is unavailable.");
      } else if (error.response?.status === 500) {
        setError("Server error. Please contact support.");
        alert("Server error. Please contact support.");
      } else {
        const errorMessage =
          error.response?.data?.error || "Failed to remove item from wishlist";
        setError(errorMessage);
        alert(errorMessage);
      }
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const clearWishlist = async () => {
    if (
      !window.confirm("Are you sure you want to clear your entire wishlist?")
    ) {
      return;
    }

    setClearingWishlist(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      console.log("Clearing entire wishlist...");
      await axios.delete("https://update-xrp4.onrender.com/wishlist/clear", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setWishlistItems([]);
      alert("Wishlist cleared successfully!");
    } catch (error) {
      console.error("Error clearing wishlist:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        navigate("/login", { state: { from: location.pathname } });
      } else {
        const errorMessage =
          error.response?.data?.error || "Failed to clear wishlist";
        alert(errorMessage);
      }
    } finally {
      setClearingWishlist(false);
    }
  };

  const addToCart = async (productId) => {
    if (!productId) {
      alert("Invalid product ID");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      console.log("Adding to cart from wishlist:", productId);
      await axios.post(
        "https://update-xrp4.onrender.com/cart",
        { product_id: [productId] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Product added to cart successfully!");
      fetchCartItems();
    } catch (error) {
      console.error("Error adding to cart:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        navigate("/login", { state: { from: location.pathname } });
      } else {
        const errorMessage =
          error.response?.data?.error || "Failed to add product to cart";
        alert(errorMessage);
      }
    }
  };

  const fetchCartItems = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await axios.get(
        "https://update-xrp4.onrender.com/viewcart",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (Array.isArray(response.data)) {
        setCartItems(response.data);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
    }
  };

  const getItemPrice = (item) => {
    if (item.variant_id && item.price_multiplier && item.additional_price) {
      const basePrice = parseFloat(item.product_price || 0);
      const multiplier = parseFloat(item.price_multiplier || 1);
      const additional = parseFloat(item.additional_price || 0);
      return (basePrice * multiplier + additional).toFixed(2);
    }
    return parseFloat(item.product_price || 0).toFixed(2);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-100 min-h-screen font-sans">
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Please login to view your wishlist
          </h2>
          <button
            onClick={() =>
              navigate("/login", { state: { from: location.pathname } })
            }
            className="bg-yellow-500 text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-600 transition-colors duration-200 shadow"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-100 min-h-screen font-sans">
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-100 min-h-screen font-sans">
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-red-600 mb-2">
            Error Loading Wishlist
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchWishlistItems}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-600 transition-colors duration-200 shadow"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-100 min-h-screen font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
          My Wishlist ({wishlistItems.length} items)
        </h2>
        {wishlistItems.length > 0 && (
          <button
            onClick={clearWishlist}
            disabled={clearingWishlist}
            className="bg-red-600 text-white px-4 py-2 rounded-md font-medium text-sm sm:text-base hover:bg-red-700 transition-colors duration-200 disabled:bg-red-400 disabled:cursor-not-allowed shadow"
          >
            {clearingWishlist ? "Clearing..." : "Clear All"}
          </button>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
          <div className="text-4xl mb-4">💝</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Your wishlist is empty
          </h3>
          <p className="text-gray-600 mb-4">
            Add some products to your wishlist to see them here!
          </p>
          <button
            onClick={() => navigate("/categories")}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-600 transition-colors duration-200 shadow"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {wishlistItems.map((item) => {
            if (!item || !item.id) {
              console.warn("Invalid wishlist item:", item);
              return null;
            }

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md p-4 flex flex-col hover:shadow-lg transition-shadow duration-200"
              >
                <div className="relative w-full h-48 mb-4">
                  {item.image_path ? (
                    <img
                      src={`https://update-xrp4.onrender.com/${item.image_path}`}
                      alt={item.product_name || "Product"}
                      className="w-full h-full object-cover rounded-md"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`flex items-center justify-center w-full h-full bg-gray-200 rounded-md text-gray-500 text-sm font-medium ${
                      item.image_path ? "hidden" : "flex"
                    }`}
                  >
                    No Image
                  </div>
                </div>

                <div className="flex flex-col flex-grow">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {item.product_name || "Unnamed Product"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 flex-grow">
                    {item.description || "No description available"}
                  </p>

                  {item.variant_name && (
                    <p className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">Variant:</span>{" "}
                      {item.variant_name}
                      {item.variant_description && (
                        <span className="text-gray-500">
                          {" "}
                          - {item.variant_description}
                        </span>
                      )}
                    </p>
                  )}

                  <p className="text-lg font-bold text-green-600 mb-4">
                    ₹{getItemPrice(item)}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => addToCart(item.product_id)}
                    disabled={!item.product_id}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed shadow"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    disabled={removingItems.has(item.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-red-700 transition-colors duration-200 disabled:bg-red-400 disabled:cursor-not-allowed shadow"
                  >
                    {removingItems.has(item.id) ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
