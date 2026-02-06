import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    if (localStorage.getItem("role") === "admin") {
      navigate("/admin-dashboard");
      return;
    }
    try {
      const response = await api.get("wishlist/");
      setWishlistItems(response.data);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await api.post("wishlist/toggle/", { product_id: productId });
      fetchWishlist(); // Refresh list
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  if (loading)
    return <div className="p-8 text-center">Loading wishlist...</div>;

  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Your Wishlist is Empty
        </h2>
        <p className="text-gray-500 mb-8">
          Save items you love here for later.
        </p>
        <Link to="/" className="btn-primary inline-block">
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((item) => (
          <div
            key={item.id}
            className="glass-card overflow-hidden group hover:shadow-2xl transition-all duration-300"
          >
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200 relative">
              <img
                src={
                  item.product.image_url || "https://via.placeholder.com/300"
                }
                alt={item.product.name}
                className="w-full h-48 object-cover object-center group-hover:scale-110 transition-transform duration-300"
              />
              <button
                onClick={() => removeFromWishlist(item.product.id)}
                className="absolute top-2 right-2 bg-white/80 p-2 rounded-full text-red-500 hover:bg-white transition-colors"
                title="Remove from Wishlist"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {item.product.name}
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                {item.product.category_name}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xl font-bold text-indigo-600">
                  ${item.product.price}
                </span>
                <Link
                  to={`/products/${item.product.id}`}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                >
                  View Details →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
