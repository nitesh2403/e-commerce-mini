import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useCart } from "../context/CartContext";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [filters, setFilters] = useState({ search: "" });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [addedProductId, setAddedProductId] = useState(null);
  const { fetchCartCount } = useCart();

  useEffect(() => {
    fetchCategories();
    fetchVendors();
    fetchProducts();
  }, [filters, selectedCategory, selectedVendor]);

  const fetchCategories = async () => {
    try {
      const response = await api.get("categories/");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await api.get("users/vendors/");
      setVendors(response.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      let query = "products/?";
      if (filters.search) query += `search=${filters.search}&`;
      if (selectedCategory) query += `category=${selectedCategory}&`;
      if (selectedVendor) query += `created_by=${selectedVendor}&`;

      const response = await api.get(query);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const addToCart = async (e, productId) => {
    e.preventDefault(); // Prevent link click if wrapped
    try {
      await api.post("cart/add/", { product_id: productId, quantity: 1 });
      setAddedProductId(productId);
      fetchCartCount(); // Update navbar
      setTimeout(() => setAddedProductId(null), 2000); // Reset after 2 seconds
    } catch (error) {
      if (error.response && error.response.status === 401) {
        alert("Please login to add items to cart");
      } else {
        console.error("Error adding to cart:", error);
      }
    }
  };

  const toggleWishlist = async (e, productId) => {
    e.preventDefault();
    try {
      await api.post("wishlist/toggle/", { product_id: productId });
      setFilters({ ...filters }); // Trigger re-render to update icon style if needed (or just let parent/fetch handle it)
      // alert("Wishlist updated!"); // Removed annoying popup
    } catch (error) {
      if (error.response && error.response.status === 401) {
        alert("Please login to use Wishlist");
      } else {
        console.error("Error toggling wishlist:", error);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 space-y-6">
          <div className="theme-card p-6 h-fit sticky top-24">
            <h3 className="text-xl font-bold mb-6 text-[#D4AF37] font-serif border-b border-[#D4AF37]/20 pb-4">
              Search & Filter
            </h3>
            <input
              type="text"
              placeholder="Search products..."
              className="input-field mb-6 bg-[#0F0F0F] border-[#333]"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
            <h4 className="font-serif text-[#D4AF37] text-lg mb-4">Categories</h4>
            <div className="flex flex-col gap-3">
              <button
                className={`text-left px-3 py-2 rounded transition-colors ${!selectedCategory ? "bg-[#D4AF37] text-black font-medium" : "text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"}`}
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`text-left px-3 py-2 rounded transition-colors ${selectedCategory === cat.id ? "bg-[#D4AF37] text-black font-medium" : "text-gray-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="border-t border-[#D4AF37]/20 my-6 pt-6">
              <h4 className="font-serif text-[#D4AF37] text-lg mb-4">Vendors</h4>
              <select
                className="input-field bg-[#0F0F0F] border-[#333]"
                value={selectedVendor || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedVendor(val === "" ? null : parseInt(val));
                }}
              >
                <option value="">All Vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="theme-card overflow-hidden group flex flex-col h-full"
              >
                <div className="relative aspect-w-1 aspect-h-1 w-full overflow-hidden bg-[#0a0a0a]">
                  <img
                    src={
                      product.image ||
                      product.image_url ||
                      "https://via.placeholder.com/300"
                    }
                    alt={product.name}
                    className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  {/* Badge positioned absolutely */}
                  {product.discount_percentage > 0 && (
                      <div className="absolute top-4 right-4 bg-[#D4AF37] text-black text-xs font-bold px-2 py-1 rounded-sm shadow-lg">
                          {parseFloat(product.discount_percentage)}% OFF
                      </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-2">
                         <p className="text-xs text-[#D4AF37] tracking-wider uppercase mb-1">
                            {product.category_name}
                          </p>
                          <h3 className="text-2xl font-serif font-medium text-white leading-tight">
                            {product.name}
                          </h3>
                    </div>
                  
                  {product.vendor_name && (
                    <p className="text-sm text-gray-500 mb-4">
                      Sold by: <span className="text-gray-400">{product.vendor_name}</span>
                    </p>
                  )}
                  
                  <div className="mt-auto">
                      <div className="flex items-baseline gap-3 mb-6">
                        {product.discount_percentage > 0 ? (
                            <>
                                <span className="text-3xl font-serif text-[#D4AF37]">
                                    ${product.discounted_price}
                                </span>
                                <span className="text-gray-600 line-through text-lg font-serif">
                                    ${product.price}
                                </span>
                            </>
                        ) : (
                             <span className="text-3xl font-serif text-[#D4AF37]">
                                ${product.price}
                            </span>
                        )}
                      </div>

                   {localStorage.getItem("role") !== "admin" && (
                     <div className="space-y-3">
                       <div className="flex gap-3">
                           <button
                             onClick={(e) => addToCart(e, product.id)}
                             className={`flex-1 btn-primary ${
                               addedProductId === product.id
                                 ? "bg-green-600 hover:bg-green-700 text-white"
                                 : ""
                             }`}
                           >
                             {addedProductId === product.id ? "ADDED" : "ADD TO CART"}
                           </button>
                            <button
                             onClick={(e) => toggleWishlist(e, product.id)}
                             className="p-3 border border-[#333] hover:border-[#D4AF37] rounded-md text-gray-400 hover:text-[#D4AF37] transition-colors"
                             title="Add to Wishlist"
                           >
                             <svg
                               className="w-5 h-5"
                               fill="none"
                               stroke="currentColor"
                               viewBox="0 0 24 24"
                             >
                               <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth="1.5"
                                 d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                               />
                             </svg>
                           </button>
                       </div>
                        <Link
                           to={`/products/${product.id}`}
                           className="block w-full text-center py-2 border border-[#333] hover:border-[#D4AF37] text-xs text-gray-400 hover:text-[#D4AF37] uppercase tracking-wider transition-colors rounded-md"
                         >
                           View Details &rarr;
                         </Link>
                     </div>
                   )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
