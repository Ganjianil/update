import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const Product = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:10145/viewproducts/${id}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        console.log("Fetched product with image_path:", response.data);
        if (response.data && !response.data.error) {
          setProduct(response.data);
        } else {
          setError("Product not found or invalid data.");
        }
      } catch (error) {
        console.error(
          "Error fetching product:",
          error.response?.status,
          error.response?.data || error.message
        );
        if (error.response?.status === 404) {
          setError(`Product with ID ${id} not found.`);
        } else {
          setError("Failed to load product details. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { from: `/product/${id}` } });
      return;
    }

    try {
      console.log("Adding to cart, product ID:", id, "Token:", token);
      const response = await axios.post(
        "http://localhost:10145/addtocart",
        { product_id: id, quantity: 1 },
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
        <button
          onClick={() => navigate("/products")}
          className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-medium transition"
        >
          Back to Products
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Product not found.</p>
      </div>
    );
  }

  console.log("Rendering product with image_path:", product.image_path); // Debug log
  return (
    <section className="py-8 px-4 bg-white">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold mb-4">{product.product_name}</h1>
        <img
          src={
            product.image_path
              ? product.image_path.startsWith("http")
                ? product.image_path
                : `http://localhost:10145/upload/${product.image_path.replace(
                    /\\/g,
                    "/"
                  )}`
              : "https://via.placeholder.com/200"
          }
          alt={product.product_name}
          className="w-full h-48 object-cover rounded mb-4"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/200";
            console.error("Image load failed for:", product.product_name);
          }}
        />
        <p className="text-gray-600 mb-2">
          {/* Corrected to use 'description' with fallback to 'descripition' */}
          {product.description || product.descripition || "No description..."}
        </p>
        <p className="text-indigo-600 font-semibold mb-4">
          ₹{product.product_price !== undefined ? product.product_price : "N/A"}
        </p>

        <button
          onClick={handleAddToCart}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-medium transition"
        >
          Add to Cart
        </button>
        <button
          onClick={() => navigate("/products")}
          className="mt-4 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-medium transition"
        >
          Back to Products
        </button>
      </div>
    </section>
  );
};

export default Product;
