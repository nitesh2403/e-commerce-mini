import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api";

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchOrders();
    fetchComplaints();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tab") === "complaints") {
        setActiveTab("complaints");
    }
  }, [location.search]);

  const fetchOrders = async () => {
    try {
      const response = await api.get("orders/");
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 403 || error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const response = await api.get("complaints/");
      setComplaints(response.data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.patch(`orders/${orderId}/`, { status: newStatus });
      fetchOrders(); // Refresh list
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "placed":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-yellow-100 text-yellow-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending": // For complaints
        return "bg-yellow-100 text-yellow-800";
      case "resolved": // For complaints
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState({ show: false, id: null });

  const handleResolveComplaint = async () => {
    if (!showConfirmModal.id) return;
    
    try {
      await api.patch(`complaints/${showConfirmModal.id}/`, { status: "resolved" });
      fetchComplaints();
      setShowConfirmModal({ show: false, id: null });
    } catch (err) {
      console.error("Error resolving complaint:", err);
      alert("Failed to update status");
    }
  };

  if (loading)
    return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-white">Dashboard</h1>
        <div className="flex space-x-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#333]">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === "orders" ? "bg-[#D4AF37] text-black shadow-lg" : "text-gray-400 hover:text-white hover:bg-[#333]"}`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab("complaints")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === "complaints" ? "bg-[#D4AF37] text-black shadow-lg" : "text-gray-400 hover:text-white hover:bg-[#333]"}`}
          >
            Complaints
          </button>
        </div>
      </div>

      {activeTab === "orders" ? (
        <div className="theme-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#333]">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#0c0c0c] divide-y divide-[#333]">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#1a1a1a] transition-colors group"
                  >
                    <td className="px-6 py-6 whitespace-nowrap font-serif font-bold text-[#D4AF37] text-lg">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      <div className="text-sm font-medium text-white">
                        {order.full_name || order.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.phone_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#D4AF37] font-bold">
                      ${order.total_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-bold uppercase tracking-wide rounded-sm border ${
                          order.status === "placed"
                            ? "bg-blue-900/30 text-blue-400 border-blue-900"
                            : order.status === "shipped"
                              ? "bg-yellow-900/30 text-yellow-400 border-yellow-900"
                              : order.status === "delivered"
                                ? "bg-green-900/30 text-green-400 border-green-900"
                                : order.status === "cancelled"
                                  ? "bg-red-900/30 text-red-400 border-red-900"
                                  : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                       <select
                        className="bg-[#1a1a1a] border border-[#333] text-white rounded-md text-sm py-1 px-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                      >
                        <option value="placed">Placed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-[#D4AF37] hover:text-[#b5952f] font-medium transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="theme-card overflow-hidden">
          {complaints.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No complaints found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#333]">
                <thead className="bg-[#1a1a1a]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Issue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Evidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-[#0c0c0c] divide-y divide-[#333]">
                  {complaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {complaint.product_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Order Item ID: {complaint.order_item}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <div className="font-medium text-white">
                          {complaint.user}
                        </div>
                        <div className="text-xs text-gray-500">
                          {complaint.customer_email || "No Email"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {complaint.customer_phone || "No Phone"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 max-w-xs">
                        <div className="font-medium text-white">
                          {complaint.reason}
                        </div>
                        <div className="truncate" title={complaint.description}>
                          {complaint.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {complaint.image ? (
                          <a
                            href={complaint.image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#D4AF37] hover:text-[#b5952f] underline"
                          >
                            View Photo
                          </a>
                        ) : (
                          <span className="text-gray-600">No Photo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-bold uppercase tracking-wide rounded-sm border ${
                             complaint.status === 'resolved' 
                             ? 'bg-green-900/30 text-green-400 border-green-900' 
                             : 'bg-yellow-900/30 text-yellow-400 border-yellow-900'
                          }`}
                        >
                          {complaint.status.charAt(0).toUpperCase() +
                            complaint.status.slice(1)}
                        </span>
                        {complaint.status === "pending" && (
                          <button
                            onClick={() => setShowConfirmModal({ show: true, id: complaint.id })}
                            className="ml-2 text-xs text-indigo-600 hover:text-indigo-900 font-medium underline"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="theme-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative animate-fade-in border border-[#D4AF37]/20 shadow-2xl">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#D4AF37] transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>

            <h2 className="text-3xl font-serif font-bold text-white mb-8 border-b border-[#333] pb-4">
              Order Details <span className="text-[#D4AF37]">#{selectedOrder.id}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-4">
                  Customer Info
                </h3>
                <div className="bg-[#0c0c0c] rounded-lg p-5 border border-[#333] space-y-3">
                  <p className="text-gray-300">
                    <span className="text-gray-500 text-sm block mb-1">Name</span>
                    {selectedOrder.full_name || "N/A"}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500 text-sm block mb-1">Username</span>
                    {selectedOrder.username}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500 text-sm block mb-1">Phone</span>
                    {selectedOrder.phone_number || "N/A"}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-4">
                  Shipping Address
                </h3>
                <div className="bg-[#0c0c0c] rounded-lg p-5 border border-[#333] space-y-3">
                  <p className="text-gray-300">
                    <span className="text-gray-500 text-sm block mb-1">Address</span>
                    {selectedOrder.address || "No address provided"}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-500 text-sm block mb-1">City/Zip</span>
                    {selectedOrder.city} {selectedOrder.postal_code}
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-4">
              Order Items
            </h3>
            <div className="border border-[#333] rounded-lg overflow-hidden mb-8">
              <table className="min-w-full divide-y divide-[#333]">
                <thead className="bg-[#1a1a1a]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#333] bg-[#0c0c0c]">
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4 text-sm text-white font-medium">
                        {item.product_name}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        {item.quantity}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-400">
                        ${item.price_at_purchase}
                        {item.status === "cancelled" && (
                          <span className="ml-2 text-[10px] font-bold text-red-400 bg-red-900/20 px-2 py-0.5 rounded border border-red-900/30">
                            CANCELLED
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-[#D4AF37]">
                        ${(item.quantity * item.price_at_purchase).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-6 border-t border-[#333]">
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Order Total</p>
                <p className="text-3xl font-serif font-bold text-[#D4AF37]">
                  ${selectedOrder.total_price}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="theme-card max-w-sm w-full p-6 text-center border border-[#D4AF37]/20 shadow-2xl relative animate-fade-in">
             <div className="w-16 h-16 bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
             </div>
             <h3 className="text-xl font-serif font-bold text-white mb-2">Resolve Complaint?</h3>
             <p className="text-gray-400 mb-6 text-sm">
               Are you sure you want to mark this complaint as resolved? This action cannot be undone.
             </p>
             <div className="flex space-x-3">
               <button
                 onClick={() => setShowConfirmModal({ show: false, id: null })}
                 className="flex-1 px-4 py-2 bg-[#1a1a1a] text-gray-300 rounded-md hover:bg-[#333] hover:text-white transition-colors border border-[#333]"
               >
                 Cancel
               </button>
               <button
                 onClick={handleResolveComplaint}
                 className="flex-1 px-4 py-2 bg-[#D4AF37] text-black font-bold rounded-md hover:bg-[#b5952f] transition-colors"
               >
                 Yes, Resolve
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
