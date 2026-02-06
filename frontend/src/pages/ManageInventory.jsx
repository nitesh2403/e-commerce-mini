import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const ManageInventory = () => {
  const [activeTab, setActiveTab] = useState("products"); // 'products' or 'categories'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Form States
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    price: "",
    discount_percentage: "0",
    stock_quantity: "",
    description: "",
    image: null,
  });
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get("products/my_inventory/"),
        api.get("categories/"),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const [editingProduct, setEditingProduct] = useState(null);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", productForm.name);
    formData.append("category", productForm.category);
    formData.append("category", productForm.category);
    formData.append("price", productForm.price);
    formData.append("discount_percentage", productForm.discount_percentage);
    formData.append("stock_quantity", productForm.stock_quantity);
    formData.append("description", productForm.description);
    if (productForm.image instanceof File) {
      formData.append("image", productForm.image);
    }
    // Handle image_url field too if provided, though we are hiding it in UI now
    // Or we just rely on image upload.

    try {
      if (editingProduct) {
        await api.patch(`products/${editingProduct.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Product Updated!");
        setEditingProduct(null);
      } else {
        await api.post("products/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("Product Added!");
      }
      setProductForm({
        name: "",
        category: "",
        price: "",
        discount_percentage: "0",
        stock_quantity: "",
        description: "",
        image: null,
      });
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product");
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      discount_percentage: product.discount_percentage || "0",
      stock_quantity: product.stock_quantity,
      description: product.description,
      image: null, // We don't load the file object back
    });
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      category: "",
      category: "",
      price: "",
      discount_percentage: "0",
      stock_quantity: "",
      description: "",
      image: null,
    });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("categories/", categoryForm);
      alert("Category Added!");
      setCategoryForm({ name: "", description: "" });
      fetchData();
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Failed to add category");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`products/${id}/`);
      fetchData();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure? This might delete associated products."))
      return;
    try {
      await api.delete(`categories/${id}/`);
      fetchData();
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  if (loading)
    return <div className="p-8 text-center">Loading inventory...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif font-bold text-white mb-8">
        Manage Inventory
      </h1>
      {/* Tabs */}
      <div className="flex space-x-4 mb-8 border-b border-[#333]">
        <button
          className={`pb-4 px-4 font-medium transition-colors ${activeTab === "products" ? "text-[#D4AF37] border-b-2 border-[#D4AF37]" : "text-gray-400 hover:text-white"}`}
          onClick={() => setActiveTab("products")}
        >
          Products
        </button>
        <button
          className={`pb-4 px-4 font-medium transition-colors ${activeTab === "categories" ? "text-[#D4AF37] border-b-2 border-[#D4AF37]" : "text-gray-400 hover:text-white"}`}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </button>
      </div>

      {activeTab === "products" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Product Form */}
          <div className="lg:col-span-1">
            <div className="theme-card p-6 sticky top-24 border border-[#D4AF37]/20">
              <h2 className="text-xl font-serif font-bold text-white mb-4">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Product Name"
                  className="input-field"
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({ ...productForm, name: e.target.value })
                  }
                  required
                />
                <select
                  className="input-field"
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm({ ...productForm, category: e.target.value })
                  }
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    placeholder="Price"
                    className="input-field"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: e.target.value })
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder="Discount %"
                    className="input-field"
                    value={productForm.discount_percentage}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        discount_percentage: e.target.value,
                      })
                    }
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <input
                    type="number"
                    placeholder="Stock Quantity"
                    className="input-field"
                    value={productForm.stock_quantity}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        stock_quantity: e.target.value,
                      })
                    }
                    required
                  />
                <textarea
                  placeholder="Description"
                  className="input-field"
                  rows="3"
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      description: e.target.value,
                    })
                  }
                ></textarea>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Product Image
                  </label>
                  <input
                    type="file"
                    className="input-field p-2"
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        image: e.target.files[0],
                      })
                    }
                    accept="image/*"
                  />
                  {editingProduct && !productForm.image && (
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to keep existing image
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary flex-1">
                    {editingProduct ? "Update Product" : "Add Product"}
                  </button>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-[#333] rounded-sm hover:bg-[#333] text-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Product List */}
          <div className="lg:col-span-2 space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="theme-card p-4 flex items-center gap-4 border border-[#333] hover:border-[#D4AF37]/20"
              >
                <img
                  src={
                    product.image ||
                    product.image_url ||
                    "https://via.placeholder.com/50"
                  }
                  alt={product.name}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h3 className="font-serif font-medium text-white">{product.name}</h3>
                  <p className="text-sm text-gray-400">
                    Stock: <span className={product.stock_quantity < 5 ? "text-red-500 font-bold" : ""}>{product.stock_quantity}</span> | <span className="text-[#D4AF37]">${product.price}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleEditProduct(product)}
                  className="text-[#D4AF37] hover:text-[#b5952f] font-medium px-3 py-1 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 rounded-sm mr-2 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-red-500 hover:text-red-400 font-medium px-3 py-1 border border-red-900 hover:bg-red-900/20 rounded-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Category Form */}
          <div className="lg:col-span-1">
            <div className="theme-card p-6 sticky top-24 border border-[#D4AF37]/20">
              <h2 className="text-xl font-serif font-bold text-white mb-4">
                Add New Category
              </h2>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Category Name"
                  className="input-field"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  required
                />
                <textarea
                  placeholder="Description"
                  className="input-field"
                  rows="3"
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      description: e.target.value,
                    })
                  }
                ></textarea>
                <button type="submit" className="btn-primary w-full">
                  Add Category
                </button>
              </form>
            </div>
          </div>

          {/* Category List */}
          <div className="lg:col-span-2 space-y-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="theme-card p-4 flex items-center justify-between border border-[#333]"
              >
                <div>
                  <h3 className="font-serif font-medium text-white">{category.name}</h3>
                  <p className="text-sm text-gray-400">
                    {category.description}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-red-500 hover:text-red-400 font-medium px-3 py-1 border border-red-900 hover:bg-red-900/20 rounded-sm transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageInventory;
