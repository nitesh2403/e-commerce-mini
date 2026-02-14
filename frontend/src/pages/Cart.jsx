import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useCart } from "../context/CartContext";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { fetchCartCount } = useCart();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    if (localStorage.getItem("role") === "admin") {
      navigate("/admin-dashboard");
      return;
    }
    try {
      const response = await api.get("cart/");
      setCart(response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
      if (error.response && error.response.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
      // Force sync context with the latest cart state
      fetchCartCount();
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const response = await api.post("cart/update_item/", {
        item_id: itemId,
        quantity: newQuantity,
      });
      setCart(response.data);
      fetchCartCount();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const response = await api.post("cart/remove/", { item_id: itemId });
      setCart(response.data);
      fetchCartCount();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (loading) return <div className="p-8 text-center">Loading cart...</div>;

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-white">
        <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-[#1a1a1a] border border-[#D4AF37]/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                </svg>
            </div>
        </div>
        <h2 className="text-3xl font-serif font-bold text-white mb-4">
          Your Cart is Empty
        </h2>
        <p className="text-gray-400 mb-8">
          Looks like you haven't added anything yet.
        </p>
        <Link to="/" className="btn-primary inline-block px-8 py-3">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif font-bold text-white mb-8">Shopping Cart</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="theme-card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="w-full sm:w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={
                    item.product.image || item.product.image_url || "https://via.placeholder.com/150"
                  }
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 w-full">
                <h3 className="text-lg font-serif font-bold text-white">
                  {item.product.name}
                </h3>
                <p className="text-[#D4AF37] text-sm uppercase tracking-wider">
                  {item.product.category_name}
                </p>
                <div className="mt-2">
                    {item.product.discount_percentage > 0 ? (
                        <div className="flex flex-col">
                            <span className="text-[#D4AF37] font-serif font-bold text-lg">${item.product.discounted_price}</span>
                            <span className="text-gray-500 text-xs line-through font-serif">${item.product.price}</span>
                        </div>
                    ) : (
                        <div className="text-[#D4AF37] font-serif font-bold text-lg">${item.product.price}</div>
                    )}
                </div>
              </div>
              <div className="flex items-center justify-between w-full sm:w-auto gap-4 mt-2 sm:mt-0">
                <div className="flex items-center border border-[#333] rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-3 py-1 hover:bg-[#333] text-gray-300 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 font-medium text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="px-3 py-1 hover:bg-[#333] text-gray-300 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center gap-4">
                     <div className="text-right font-serif font-bold text-lg text-[#D4AF37] sm:hidden">
                        ${item.subtotal.toFixed(2)}
                      </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-500 hover:text-red-500 p-2 transition-colors"
                    >
                      Remove
                    </button>
                </div>
              </div>
              <div className="hidden sm:block w-24 text-right font-serif font-bold text-lg text-[#D4AF37]">
                ${item.subtotal.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96">
          <div className="theme-card p-6 sticky top-24">
            <h2 className="text-xl font-serif font-bold text-[#D4AF37] mb-6 border-b border-[#D4AF37]/20 pb-4">
              Order Summary
            </h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>${cart.total_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t border-[#333] pt-4 flex justify-between font-serif font-bold text-lg text-white">
                <span>Total</span>
                <span>${cart.total_price.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? "Processing..." : "Proceed to Checkout"}
            </button>
            <Link
              to="/"
              className="block text-center text-[#D4AF37] hover:text-[#b5952f] mt-4 text-sm font-medium uppercase tracking-wider"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
