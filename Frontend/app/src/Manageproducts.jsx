import React, { useState, useEffect } from "react";
import axios from "axios";

const Manageproducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "https://update-xrp4.onrender.com/viewproducts"
      );
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error(
        "Error fetching products:",
        error.message,
        error.response?.status
      );
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(
          `http://localhost:10145/deleteproducts/${productId}`
        );
        setMessage("Product deleted successfully!");
        fetchProducts(); // Refresh the list
      } catch (error) {
        console.error(
          "Error deleting product:",
          error.message,
          error.response?.status
        );
        setMessage("Failed to delete product. Check console for details.");
      }
    }
  };

  const deleteAllProducts = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete ALL products? This action cannot be undone!"
      )
    ) {
      try {
        await axios.delete(
          "https://update-xrp4.onrender.com/deleteallproducts"
        );
        setMessage("All products deleted successfully!");
        fetchProducts(); // Refresh the list
      } catch (error) {
        console.error(
          "Error deleting all products:",
          error.message,
          error.response?.status
        );
        setMessage("Failed to delete all products. Check console for details.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-600">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="manage-header flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Products
            </h2>
            <button
              onClick={deleteAllProducts}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Delete All Products
            </button>
          </div>

          {message && (
            <div
              className={`mb-4 p-4 rounded-md ${
                message.includes("successfully")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          {products.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No products found.</p>
          ) : (
            <div className="products-table overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.image_path ? (
                          <img
                            src={`https://update-xrp4.onrender.com/${product.image_path}`}
                            alt={product.product_name}
                            className="h-16 w-16 object-cover rounded-md"
                          />
                        ) : (
                          <div className="h-16 w-16 flex items-center justify-center bg-gray-200 text-gray-500 rounded-md">
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ₹{product.product_price}
                      </td>
                      <td className="px-6 py-4">{product.descripition}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Manageproducts;
