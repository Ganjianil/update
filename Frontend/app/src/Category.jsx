
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { HeartIcon } from "@heroicons/react/24/solid";

const Category = ({ refreshCart, isAuthenticated: propIsAuthenticated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(8);
  const [addingToCart, setAddingToCart] = useState(new Set());
  const [togglingWishlist, setTogglingWishlist] = useState(new Set());
  const [wishlistItems, setWishlistItems] = useState(new Set());
  const [imageErrors, setImageErrors] = useState(new Set());
  const navigate = useNavigate();

  console.log("🔧 Category component props:", {
    refreshCart: typeof refreshCart,
    propIsAuthenticated,
  });

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "https://dummyimage.com/420x260/cccccc/ffffff&text=No+Image";
    }
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    let cleanPath = imagePath.replace(/\\/g, "/");
    if (cleanPath.startsWith("upload/")) {
      return `https://update-xrp4.onrender.com/${cleanPath}`;
    }
    return `https://update-xrp4.onrender.com/upload/${cleanPath}`;
  };

  const testImageExists = async (filename) => {
    try {
      const response = await axios.get(
        `https://update-xrp4.onrender.com/test-image/${filename}`
      );
      console.log(`Image test for ${filename}:`, response.data);
      return response.data.exists;
    } catch (error) {
      console.error(`Error testing image ${filename}:`, error);
      return false;
    }
  };

  const handleImageError = (itemId, itemName, imagePath) => {
    console.log(
      `❌ Image failed to load for ${itemName} (ID: ${itemId}), Path: ${imagePath}`
    );
    setImageErrors((prev) => new Set(prev).add(itemId));
    if (imagePath && !imagePath.startsWith("http")) {
      testImageExists(imagePath);
    }
  };

  const getFallbackImage = (itemName, itemType = "product") => {
    const encodedName = encodeURIComponent(itemName || "Unknown");
    return `https://dummyimage.com/420x260/e5e7eb/374151&text=${encodedName}`;
  };

  const fetchWishlistItems = async () => {
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
        const wishlistProductIds = new Set(
          response.data.map((item) => item.product_id)
        );
        setWishlistItems(wishlistProductIds);
      } else {
        console.error("Expected array but got:", typeof response.data);
      }
    } catch (error) {
      console.error("Error fetching wishlist items:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const authStatus = !!token;
    setIsAuthenticated(authStatus);
    console.log("Category component - Auth status:", authStatus);

    // Fetch categories for all users
    fetchCategories();
    // Fetch wishlist only if authenticated
    if (authStatus) {
      fetchWishlistItems();
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      const authStatus = !!token;
      setIsAuthenticated(authStatus);
      console.log("Storage change detected - Auth status:", authStatus);
      if (authStatus) {
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
        }
      }
    }, 1000);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log(
        "Fetching categories from https://update-xrp4.onrender.com/categories/active..."
      );
      const response = await axios.get(
        "https://update-xrp4.onrender.com/categories/active"
      );
      console.log("Categories fetched:", response.data);
      if (Array.isArray(response.data)) {
        setCategories(response.data);
      } else {
        console.error("Expected array but got:", typeof response.data);
        setCategories([]);
        setError("Invalid data from server.");
      }
    } catch (error) {
      console.error(
        "Error fetching categories:",
        error.response?.data || error.message
      );
      setCategories([]);
      setError("Failed to fetch categories from server.");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchProductsByCategory = async (categoryId) => {
    setProductsLoading(true);
    try {
      console.log(`Fetching products for category ${categoryId}...`);
      const response = await axios.get(
        `https://update-xrp4.onrender.com/products/category/${categoryId}`
      );
      console.log("Products fetched:", response.data);
      if (Array.isArray(response.data)) {
        response.data.forEach((product) => {
          const fullImageUrl = getImageUrl(product.image_path);
          console.log(`📸 Product: ${product.product_name}`);
          console.log(`   - Database image_path: ${product.image_path}`);
          console.log(`   - Full URL: ${fullImageUrl}`);
        });
        setProducts(response.data);
      } else {
        console.error("Expected array but got:", typeof response.data);
        setProducts([]);
      }
    } catch (error) {
      console.error(
        "Error fetching products:",
        error.response?.data || error.message
      );
      setProducts([]);
      setError("Failed to fetch products.");
    } finally {
      setProductsLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    fetchProductsByCategory(category.id);
    setCurrentPage(1);
    setImageErrors(new Set());
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setProducts([]);
    setCurrentPage(1);
    setImageErrors(new Set());
  };

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem("token");
    console.log(
      "🛒 Add to cart - Auth status:",
      isAuthenticated,
      "Token:",
      token ? "exists" : "none"
    );
    if (!isAuthenticated || !token) {
      alert("Please login to add items to cart");
      navigate("/login");
      return;
    }
    if (!product.id || isNaN(product.id)) {
      console.error("❌ Invalid Product ID:", product);
      setError("Cannot add product: Invalid or missing product ID.");
      alert("Cannot add product: Invalid or missing product ID.");
      return;
    }
    setAddingToCart((prev) => new Set(prev).add(product.id));
    try {
      const payload = { product_id: [Number(product.id)] };
      console.log(`🛒 Adding product to cart with payload:`, payload);
      const response = await axios.post(
        "https://update-xrp4.onrender.com/cart",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("✅ Add to cart response:", response.data);
      if (typeof refreshCart === "function") {
        console.log("🔄 Calling refreshCart function...");
        await refreshCart();
        console.log("✅ Cart refreshed successfully");
      }
      setError("");
      alert("Product added to cart successfully!");
    } catch (error) {
      console.error(
        "❌ Error adding to cart:",
        error.response?.data || error.message
      );
      let errorMessage = "Failed to add item to cart.";
      if (error.response) {
        errorMessage = `Error ${error.response.status}: ${
          error.response.data.error || error.message
        }`;
        if (error.response.status === 401) {
          errorMessage = "Session expired. Please login again.";
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          navigate("/login");
        } else if (error.response.status === 404) {
          errorMessage = "Cart service is currently unavailable.";
        }
      }
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setAddingToCart((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  };

  const handleBuyNow = async (product) => {
    const token = localStorage.getItem("token");
    if (!isAuthenticated || !token) {
      alert("Please login to proceed to checkout");
      navigate("/login");
      return;
    }
    try {
      const payload = { product_id: [Number(product.id)] };
      await axios.post("https://update-xrp4.onrender.com/cart", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (typeof refreshCart === "function") {
        await refreshCart();
      }
      navigate(`/checkout/${product.id}`);
    } catch (error) {
      alert("Failed to add to cart before buying. Try again.");
    }
  };

  const handleToggleWishlist = async (product) => {
    const token = localStorage.getItem("token");
    if (!isAuthenticated || !token) {
      alert("Please login to add items to wishlist");
      navigate("/login");
      return;
    }
    if (!product.id || isNaN(product.id)) {
      console.error("❌ Invalid Product ID for wishlist:", product);
      alert("Cannot add to wishlist: Invalid or missing product ID.");
      return;
    }
    setTogglingWishlist((prev) => new Set(prev).add(product.id));
    try {
      console.log(`🔄 Toggling wishlist for product ID: ${product.id}`);
      if (wishlistItems.has(product.id)) {
        console.log(`🗑️ Removing product ${product.id} from wishlist`);
        const response = await axios.delete(
          `https://update-xrp4.onrender.com/wishlist/${product.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(`✅ Remove response:`, response.status, response.data);
        setWishlistItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(product.id);
          console.log(`📊 Wishlist after removal:`, Array.from(newSet));
          return newSet;
        });
        alert("Removed from wishlist successfully!");
      } else {
        console.log(`❤️ Adding product ${product.id} to wishlist`);
        const response = await axios.post(
          "https://update-xrp4.onrender.com/wishlist",
          { product_id: product.id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log(`✅ Add response:`, response.status, response.data);
        setWishlistItems((prev) => {
          const newSet = new Set(prev);
          newSet.add(product.id);
          console.log(`📊 Wishlist after addition:`, Array.from(newSet));
          return newSet;
        });
        alert("Added to wishlist successfully!");
      }
    } catch (error) {
      console.error(
        "Error toggling wishlist:",
        error.response?.data || error.message
      );
      let errorMessage = wishlistItems.has(product.id)
        ? "Failed to remove from wishlist."
        : "Failed to add to wishlist.";
      if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = "Session expired. Please login again.";
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        navigate("/login");
      } else if (error.response?.status === 404) {
        errorMessage = "Wishlist service is unavailable.";
      }
      alert(errorMessage);
    } finally {
      setTogglingWishlist((prev) => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
    }
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const paginatedProducts = products.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(products.length / productsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-100 min-h-screen font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
          {selectedCategory
            ? `${selectedCategory.name} Products`
            : "Product Categories"}
        </h2>
        {selectedCategory && (
          <button
            onClick={handleBackToCategories}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md font-medium text-sm sm:text-base hover:bg-yellow-600 transition-colors duration-200 shadow"
          >
            Back to Categories
          </button>
        )}
      </div>

      {(categoriesLoading || productsLoading) && (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() =>
              selectedCategory
                ? fetchProductsByCategory(selectedCategory.id)
                : fetchCategories()
            }
            className="bg-yellow-500 text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-600 transition-colors duration-200 shadow"
          >
            Try Again
          </button>
        </div>
      )}

      {!categoriesLoading && !productsLoading && !error && (
        <>
          {selectedCategory ? (
            products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
                <div className="text-4xl mb-4">😕</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No products available
                </h3>
                <p className="text-gray-600 mb-4">
                  No products found in this category.
                </p>
                <button
                  onClick={handleBackToCategories}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-600 transition-colors duration-200 shadow"
                >
                  Back to Categories
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {paginatedProducts.map((product) => (
                    <div
                      key={product.id || `product-${Math.random()}`}
                      className="bg-white rounded-lg shadow-md p-4 flex flex-col hover:shadow-lg transition-shadow duration-200"
                    >
                      <div className="relative w-full h-48 mb-4">
                        <img
                          alt={product.product_name || "Product"}
                          className="w-full h-full object-cover rounded-md"
                          src={
                            imageErrors.has(product.id)
                              ? getFallbackImage(product.product_name)
                              : getImageUrl(product.image_path)
                          }
                          onError={() =>
                            handleImageError(
                              product.id,
                              product.product_name,
                              product.image_path
                            )
                          }
                          onLoad={() =>
                            console.log(
                              `✅ Image loaded successfully for ${product.product_name}`
                            )
                          }
                        />
                        <div
                          className={`flex items-center justify-center w-full h-full bg-gray-200 rounded-md text-gray-500 text-sm font-medium ${
                            imageErrors.has(product.id) ? "flex" : "hidden"
                          }`}
                        >
                          No Image
                        </div>
                      </div>
                      <div className="flex flex-col flex-grow">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {product.product_name || "Unnamed Product"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 flex-grow">
                          {selectedCategory.description ||
                            "No description available"}
                        </p>
                        <p className="text-lg font-bold text-green-600 mb-4">
                          ₹{product.product_price || "0.00"}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleBuyNow(product)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                        >
                          Buy Now
                        </button>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={addingToCart.has(product.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                        >
                          {addingToCart.has(product.id)
                            ? "Adding..."
                            : "Add to Cart"}
                        </button>
                        <button
                          onClick={() => handleToggleWishlist(product)}
                          disabled={togglingWishlist.has(product.id)}
                          className={`p-2 rounded-full ${
                            wishlistItems.has(product.id)
                              ? "bg-red-100 text-red-500 hover:bg-red-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          } transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow`}
                          title={
                            wishlistItems.has(product.id)
                              ? "Remove from Wishlist"
                              : "Add to Wishlist"
                          }
                        >
                          <HeartIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6 space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-200 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <button
                          key={page}
                          onClick={() => paginate(page)}
                          className={`px-4 py-2 rounded-md text-sm font-medium ${
                            currentPage === page
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 hover:bg-gray-300"
                          } transition-colors duration-200 shadow`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-200 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-4">😕</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No categories available
              </h3>
              <p className="text-gray-600 mb-4">No categories found.</p>
              <button
                onClick={fetchCategories}
                className="bg-yellow-500 text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-600 transition-colors duration-200 shadow"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {categories.map((category) => (
                <div
                  key={category.id || `category-${Math.random()}`}
                  className="bg-white rounded-lg shadow-md p-4 flex flex-col hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="relative w-full h-48 mb-4">
                    <img
                      alt={category.name || "Category"}
                      className="w-full h-full object-cover rounded-md"
                      src={
                        imageErrors.has(category.id)
                          ? getFallbackImage(category.name, "category")
                          : getImageUrl(category.image_path)
                      }
                      onError={() =>
                        handleImageError(
                          category.id,
                          category.name,
                          category.image_path
                        )
                      }
                      onLoad={() =>
                        console.log(
                          `✅ Category image loaded successfully for ${category.name}`
                        )
                      }
                    />
                    <div
                      className={`flex items-center justify-center w-full h-full bg-gray-200 rounded-md text-gray-500 text-sm font-medium ${
                        imageErrors.has(category.id) ? "flex" : "hidden"
                      }`}
                    >
                      No Image
                    </div>
                  </div>
                  <div className="flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {category.name || "Unnamed Category"}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 flex-grow">
                      {category.description || "No description available"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Category;