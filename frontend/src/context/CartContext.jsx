import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = async () => {
    // Only fetch if logged in
    if (!localStorage.getItem("access")) {
      setCartCount(0);
      return;
    }

    try {
      const response = await api.get("cart/");
      // cart.items is the array. Calculate total quantity or just unique items?
      // Usually "cart count" is sum of quantities.
      const items = response.data.items || [];
      const count = items.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    } catch (error) {
      console.error("Error fetching cart count:", error);
      // If 404 (no cart yet) or 401, count is 0
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, fetchCartCount }}>
      {children}
    </CartContext.Provider>
  );
};
