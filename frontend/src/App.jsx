import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import AdminDashboard from "./pages/AdminDashboard";
import Reports from "./pages/Reports";
import Wishlist from "./pages/Wishlist";
import ManageInventory from "./pages/ManageInventory";
import MyOrders from "./pages/MyOrders";
import Profile from "./pages/Profile";

import { CartProvider } from "./context/CartContext";

function App() {
  return (
    <Router>
      <CartProvider>
        <div className="min-h-screen bg-[#0F0F0F] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#2a2a2a] via-[#0F0F0F] to-[#0F0F0F] text-white">
          <Navbar />
          <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin-reports" element={<Reports />} />
          <Route path="/admin-inventory" element={<ManageInventory />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        </div>
      </CartProvider>
    </Router>
  );
}

export default App;
