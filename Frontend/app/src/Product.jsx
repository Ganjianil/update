import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get("search") || "";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "https://update-xrp4.onrender.com/viewproducts",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        console.log("Fetched products with image_paths:", response.data);
        let filteredProducts = response.data;
        if (searchTerm) {
          filteredProducts = response.data.filter((product) =>
            product.product_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          );
        }
        setProducts(filteredProducts);
      } catch (error) {
        console.error(
          "Error fetching products:",
          error.response?.status,
          error.response?.data || error.message
        );
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchTerm]);

  const handleProductClick = (id) => {
    navigate(`/product/${id}`);
  };

  const handleAddToCart = async (productId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", {
        state: { from: location.pathname + location.search },
      });
      return;
    }

    try {
      console.log("Adding to cart, product ID:", productId, "Token:", token);
      const response = await axios.post(
        "https://update-xrp4.onrender.com/addtocart",
        { product_id: productId, quantity: 1 },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Add to cart response:", response.data);
      alert("Product added to cart!");
    } catch (error) {
      console.error(
        "Error adding to cart:",
        error.response?.status,
        error.response?.data || error.message
      );
      setError(
        error.response?.data?.error ||
          "Failed to add product to cart. Please try again."
      );
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "https://placehold.co/200x200"; // Reliable fallback
    }
    return imagePath; // Use the full URL from the backend
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <section className="py-8 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          {searchTerm ? `Search Results for "${searchTerm}"` : "All Products"}
        </h1>
        {products.length === 0 && searchTerm ? (
          <p className="text-lg text-gray-600">
            No products found for "{searchTerm}".
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg shadow p-4 hover:shadow-lg transition cursor-pointer"
              >
                <img
                  src={getImageUrl(product.image_path)}
                  alt={product.product_name}
                  className="w-full h-48 object-cover rounded mb-4"
                  onError={(e) => {
                    e.target.src = "https://placehold.co/200x200";
                    console.log(
                      "Image failed to load for:",
                      product.product_name,
                      "URL:",
                      e.target.src
                    );
                  }}
                  onLoad={() =>
                    console.log(
                      "Image loaded for:",
                      product.product_name,
                      "Path:",
                      product.image_path
                    )
                  }
                />
                <h2
                  className="text-lg font-semibold mb-2"
                  onClick={() => handleProductClick(product.id)}
                >
                  {product.product_name}
                </h2>
                <p className="text-gray-600 mb-2">
                  {product.descripition?.slice(0, 100) || "No description"}...
                </p>
                <p className="text-indigo-600 font-semibold mb-4">
                  ₹{product.product_price || "N/A"}
                </p>
                <button
                  onClick={() => handleAddToCart(product.id)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-medium transition"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;
