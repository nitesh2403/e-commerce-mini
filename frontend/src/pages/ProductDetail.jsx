import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { useCart } from "../context/CartContext";
import Toast from "../components/Toast";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { fetchCartCount } = useCart();

  // Toast State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };
  const closeToast = () => setToast(null);

  useEffect(() => {
    fetchProduct();
    checkWishlistStatus();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`products/${id}/`);
      setProduct(response.data);
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const response = await api.get(`wishlist/check/?product_id=${id}`);
      setIsInWishlist(response.data.is_in_wishlist);
    } catch (error) {
      // Likely not logged in, ignore
    }
  };

  const addToCart = async () => {
    try {
      await api.post("cart/add/", { product_id: product.id, quantity: 1 });
      fetchCartCount();
      setIsAdded(true);
      showToast("Added to Cart!", "success");
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        showToast("Please login to add items to cart", "error");
      } else {
        console.error("Error adding to cart:", error);
        showToast("Failed to add to cart", "error");
      }
    }
  };

  const toggleWishlist = async () => {
    try {
      const response = await api.post("wishlist/toggle/", { product_id: product.id });
      setIsInWishlist(!isInWishlist);
      if (response.data.status === 'added') {
          showToast("Added to Wishlist", "success");
      } else {
          showToast("Removed from Wishlist", "info");
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        showToast("Please login to use Wishlist", "error");
      } else {
        console.error("Error toggling wishlist:", error);
        showToast("Failed to update wishlist", "error");
      }
    }
  };

  if (!product) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
      )}
      <Link
        to="/"
        className="text-indigo-600 hover:text-indigo-800 mb-6 inline-block"
      >
        ← Back to Products
      </Link>
      <div className="theme-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
          {/* Image Section */}
          <div className="rounded-xl overflow-hidden bg-[#0a0a0a]">
            <img
              src={
                product.image ||
                product.image_url ||
                "https://via.placeholder.com/600"
              }
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Details Section */}
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <p className="text-sm text-[#D4AF37] font-semibold tracking-wide uppercase">
                {product.category_name}
              </p>
              <h1 className="text-3xl font-serif font-bold text-white mt-2">
                {product.name}
              </h1>
            </div>

            <div className="flex items-baseline space-x-4">
              {product.discount_percentage > 0 ? (
                <>
                  <div className="text-4xl font-serif font-bold text-[#D4AF37]">
                    ${product.discounted_price}
                  </div>
                  <div className="text-xl text-gray-600 line-through font-serif">
                    ${product.price}
                  </div>
                  <div className="bg-[#D4AF37] text-black px-3 py-1 rounded-sm font-bold text-sm">
                    {parseFloat(product.discount_percentage)}% OFF
                  </div>
                </>
              ) : (
                <div className="text-4xl font-serif font-bold text-[#D4AF37]">
                  ${product.price}
                </div>
              )}
            </div>

            {product.vendor_name && (
              <p className="text-sm text-gray-400">
                Sold by:{" "}
                <span className="font-semibold text-[#D4AF37]">
                  {product.vendor_name}
                </span>
              </p>
            )}

            <div className="prose prose-sm text-gray-400">
              <p>{product.description}</p>
            </div>

            {localStorage.getItem("role") !== "admin" && (
              <div className="border-t border-[#333] pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      product.stock_quantity > 0
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {product.stock_quantity} units available
                  </span>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={addToCart}
                    disabled={product.stock_quantity === 0}
                    className={`flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      isAdded ? "!bg-green-600 hover:!bg-green-700 text-white" : ""
                    }`}
                  >
                    {isAdded ? "Added to Cart!" : "Add to Cart"}
                  </button>
                  <button
                    onClick={toggleWishlist}
                    className={`px-6 py-3 border rounded-lg transition-colors font-medium flex items-center justify-center ${
                      isInWishlist
                        ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]"
                        : "border-[#333] text-gray-400 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                    }`}
                  >
                    <svg
                      className={`w-6 h-6 ${isInWishlist ? "fill-current" : "none"}`}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
