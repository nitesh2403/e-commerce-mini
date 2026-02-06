import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Reports = () => {
  const [salesData, setSalesData] = useState(null);
  const [lowStockData, setLowStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesRes, stockRes] = await Promise.all([
        api.get("reports/sales/"),
        api.get("reports/low-stock/"),
      ]);
      setSalesData(salesRes.data);
      setLowStockData(stockRes.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else if (error.response?.status === 403) {
        setLoading(false); // Stop loading to show forbidden state
        setSalesData(null); // Clear data
      }
    } finally {
      if (salesData || loading) setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading reports...</div>;

  if (!salesData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="text-gray-500 mb-2">
          You do not have permission to view this page.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Logged in as:{" "}
          <span className="font-semibold">
            {localStorage.getItem("username") || "Unknown"}
          </span>{" "}
          ({localStorage.getItem("role") || "No Role"})
        </p>
        <button onClick={() => navigate("/")} className="btn-primary">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif font-bold text-white mb-8">
        Analytics & Reports
      </h1>

      {/* Sales Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="relative theme-card p-6 border border-[#D4AF37]/30 overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#D4AF37] opacity-10 blur-2xl rounded-full group-hover:opacity-20 transition-opacity duration-500"></div>
          <h3 className="relative z-10 text-[#D4AF37] text-sm font-medium uppercase tracking-wider mb-2">
            Total Revenue
          </h3>
          <p className="relative z-10 text-3xl font-serif font-bold text-white group-hover:text-[#D4AF37] transition-colors duration-300">
            ${salesData?.total_revenue?.toFixed(2) || "0.00"}
          </p>
        </div>
        <div className="theme-card p-6 border border-[#333]">
          <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">
            Total Orders
          </h3>
          <p className="text-3xl font-serif font-bold text-white">
            {salesData?.total_orders || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Status Breakdown */}
        {/* Order Status Breakdown */}
        <div className="theme-card p-6">
          <h2 className="text-xl font-serif font-bold text-white mb-6">
            Order Status Breakdown
          </h2>
          <div className="space-y-4">
            {salesData?.status_breakdown?.map((status) => (
              <div
                key={status.status}
                className="flex items-center justify-between border-b border-[#333] pb-2 last:border-0"
              >
                <span className="capitalize text-gray-300">
                  {status.status}
                </span>
                <span className="font-bold bg-[#1a1a1a] text-[#D4AF37] border border-[#333] px-3 py-1 rounded-sm">
                  {status.count}
                </span>
              </div>
            ))}
            {(!salesData?.status_breakdown ||
              salesData.status_breakdown.length === 0) && (
              <p className="text-gray-500">No orders yet.</p>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        {/* Low Stock Alert */}
        <div className="theme-card p-6 border border-red-900/30">
          <h2 className="text-xl font-serif font-bold text-red-500 mb-6 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Low Stock Alerts
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-[#333]">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {lowStockData.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 text-white font-medium">
                      {item.name}
                    </td>
                    <td className="py-2 text-gray-500">
                      {item.category__name}
                    </td>
                    <td className="py-2 text-red-500 font-bold">
                      {item.stock_quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lowStockData.length === 0 && (
              <p className="text-green-400 mt-4 text-center">
                Inventory looks good!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Product Breakdown */}
      <div className="theme-card p-6 lg:col-span-2 mt-8">
        <h2 className="text-xl font-serif font-bold text-white mb-6">
          Product Sales by Status
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#333]">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Sales
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#0c0c0c] divide-y divide-[#333]">
              {salesData?.product_breakdown?.map((item, index) => (
                <tr key={index} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-bold uppercase tracking-wide rounded-sm border 
                                      ${
                                        item.order__status === "delivered"
                                          ? "bg-green-900/30 text-green-400 border-green-900"
                                          : item.order__status === "cancelled"
                                            ? "bg-red-900/30 text-red-400 border-red-900"
                                            : "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30"
                                      }`}
                    >
                      {item.order__status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                    {item.product__name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {item.total_quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#D4AF37] font-bold">
                    ${item.total_sales}
                  </td>
                </tr>
              ))}
              {(!salesData?.product_breakdown ||
                salesData.product_breakdown.length === 0) && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No sales data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
