import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    address: "",
    city: "",
    postal_code: "",
  });

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    if (localStorage.getItem("role") === "admin") {
      navigate("/admin-dashboard");
      return;
    }
    try {
      const [cartResponse, profileResponse] = await Promise.all([
        api.get("cart/"),
        api.get("users/profile/"),
      ]);

      setCart(cartResponse.data);
      if (
        !cartResponse.data ||
        !cartResponse.data.items ||
        cartResponse.data.items.length === 0
      ) {
        navigate("/cart"); // Redirect if empty
      }

      // Pre-fill form with profile data if available
      if (profileResponse.data) {
        const {
          full_name,
          username,
          phone_number,
          address,
          city,
          postal_code,
        } = profileResponse.data;
        setFormData((prev) => ({
          ...prev,
          full_name: full_name || username || "", // Fallback to provided name or username
          phone_number: phone_number || "",
          address: address || "",
          city: city || "",
          postal_code: postal_code || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      // Even if profile fails, don't block checkout if cart exists (but here we redirect if cart fails)
      if (!cart) navigate("/cart");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("orders/place_order/", formData);
      navigate("/order-success");
    } catch (error) {
      console.error("Error placing order:", error);
      alert(error.response?.data?.error || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <div className="p-8 text-center">Loading checkout...</div>;
  if (!cart) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif font-bold text-white mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Shipping Form */}
        <div>
          <form onSubmit={handleSubmit} className="theme-card p-8 space-y-6">
            <h2 className="text-xl font-serif font-bold text-[#D4AF37] mb-4">
              Shipping Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                required
                className="input-field"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                name="phone_number"
                required
                className="input-field"
                value={formData.phone_number}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Address
              </label>
              <textarea
                name="address"
                required
                rows="3"
                className="input-field"
                value={formData.address}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  required
                  className="input-field"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postal_code"
                  required
                  className="input-field"
                  value={formData.postal_code}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-3 text-lg mt-6 disabled:opacity-50"
            >
              {submitting
                ? "Processing..."
                : `Place Order ($${cart.total_price})`}
            </button>
          </form>
        </div>

        {/* Order Summary Preview */}
        <div>
          <div className="theme-card p-8">
            <h2 className="text-xl font-serif font-bold text-[#D4AF37] mb-6">
              Order Summary
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto mb-6 pr-2">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 py-2 border-b border-[#333] last:border-0"
                >
                  <img
                    src={
                      item.product.image ||
                      item.product.image_url ||
                      "https://via.placeholder.com/80"
                    }
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-white">
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-gray-400">
                      Qty: {item.quantity}
                    </p>
                    <p className="text-sm font-bold text-[#D4AF37]">
                      ${item.subtotal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#333] pt-4">
              <div className="flex justify-between font-serif font-bold text-lg text-white">
                <span>Total</span>
                <span>${cart.total_price}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
