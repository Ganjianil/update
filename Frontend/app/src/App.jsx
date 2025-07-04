import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import Header from "./Header";
import Signup from "./Signup";
import Home from "./Home";
import Login from "./Login";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import Cart from "./Cart";
import Category from "./Category";
import Orders from "./Orders";
import Wishlist from "./Wishlist";
import Checkout from "./Checkout";
import Search from "./Search";
import Product from "./Product";
import Products from "./Products";
import PreOrderProducts from "./PreOrderProducts";
import ForgotPassword from "./ForgotPassword";
import GoogleFormButton from "./GoogleFormButton";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem("token");
  const location = useLocation();
  console.log(
    "ProtectedRoute - isAuthenticated:",
    isAuthenticated,
    "Path:",
    location.pathname
  );
  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location.pathname }} replace />
  );
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    localStorage.getItem("admin-auth") === "true"
  );
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    const onFocus = () => {
      fetchCartItems();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const fetchCartItems = async (showLoading = false) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, clearing cart items");
      setCartItems([]);
      return;
    }

    if (showLoading) setCartLoading(true);

    try {
      console.log("🔄 Fetching cart items from server...");
      const response = await axios.get("http://localhost:10145/viewcart", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Cart items fetched from server:", response.data);
      const items = Array.isArray(response.data) ? response.data : [];

      setCartItems(items);
      console.log("🔄 Cart state updated with items:", items);

      localStorage.setItem("cartItems", JSON.stringify(items));
      console.log("💾 Cart items saved to localStorage");
    } catch (error) {
      console.error(
        "❌ Error fetching cart items:",
        error.response?.data || error.message
      );

      const localCartItems = localStorage.getItem("cartItems");
      if (localCartItems) {
        try {
          const parsedItems = JSON.parse(localCartItems);
          const items = Array.isArray(parsedItems) ? parsedItems : [];
          setCartItems(items);
          console.log("📦 Loaded cart items from localStorage:", items);
        } catch (parseError) {
          console.error("❌ Error parsing local cart items:", parseError);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    } finally {
      if (showLoading) setCartLoading(false);
    }
  };

  const refreshCart = async () => {
    console.log("🔄 RefreshCart called - forcing cart update...");
    await fetchCartItems(false);
    console.log("✅ RefreshCart completed");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    const adminAuth = localStorage.getItem("admin-auth");
    setIsAdminAuthenticated(adminAuth === "true");

    if (token) {
      console.log("🚀 App mounted - fetching initial cart items");
      fetchCartItems(true);
    } else {
      setCartItems([]);
      localStorage.removeItem("cartItems");
    }
  }, []);

  useEffect(() => {
    console.log("📊 Cart items state changed:", cartItems);
  }, [cartItems]);

  const handleLogin = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setIsLoggedIn(true);
    console.log("🔐 User logged in - fetching cart items");
    fetchCartItems(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("cartItems");
    setIsLoggedIn(false);
    setCartItems([]);
    console.log("🚪 User logged out - cart cleared");
  };

  const handleAdminLogin = () => {
    localStorage.setItem("admin-auth", "true");
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("admin-auth");
    setIsAdminAuthenticated(false);
  };

  console.log("🔧 App render - refreshCart function:", typeof refreshCart);

  return (
    <Router>
      <Header
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        cartItems={cartItems}
        className="fixed-header" // Add a class for styling
      />
      <div className="content-container pt-28">
        {" "}
        {/* Add padding-top to avoid content overlap */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route
            path="/admin/login"
            element={<AdminLogin onAdminLogin={handleAdminLogin} />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard
                  isAdminAuthenticated={isAdminAuthenticated}
                  onAdminLogout={handleAdminLogout}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart
                  isAuthenticated={isLoggedIn}
                  cartItems={cartItems}
                  setCartItems={setCartItems}
                  refreshCart={refreshCart}
                  cartLoading={cartLoading}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <Category
                refreshCart={refreshCart}
                isAuthenticated={isLoggedIn}
              />
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders isAuthenticated={isLoggedIn} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist
                  isAuthenticated={isLoggedIn}
                  setCartItems={setCartItems}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/:productId"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/products" element={<Products />} />
          <Route path="/preorderproducts" element={<PreOrderProducts />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/googleformbutton" element={<GoogleFormButton />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
