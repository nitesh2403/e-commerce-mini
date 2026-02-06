import React, { useState, useEffect } from "react";
import api from "../api";
import { Link } from "react-router-dom";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedItemForReport, setSelectedItemForReport] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportImage, setReportImage] = useState(null);

  // Remove Item Modal State
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [qtyToRemove, setQtyToRemove] = useState(1);

  const [orderIdForRemoval, setOrderIdForRemoval] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  
  // Cancel Order Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderIdToCancel, setOrderIdToCancel] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    // Basic role check if needed, or rely on backend permission
    if (localStorage.getItem("role") === "admin") {
      // Optional: Redirect admin
      navigate("/admin-dashboard");
      return;
    }
    try {
      const response = await api.get("orders/");
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = (orderId) => {
    setOrderIdToCancel(orderId);
    setCancelModalOpen(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderIdToCancel) return;
    try {
      await api.post(`orders/${orderIdToCancel}/cancel_order/`);
      // alert("Order cancelled successfully."); // Optional: replaced by modal close or UI update
      setCancelModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert(error.response?.data?.error || "Failed to cancel order");
    }
  };

  const openRemoveModal = (orderId, item) => {
    setOrderIdForRemoval(orderId);
    setItemToRemove(item);
    setQtyToRemove(1); // Default to 1
    setRemoveModalOpen(true);
  };

  const closeRemoveModal = () => {
    setRemoveModalOpen(false);
    setItemToRemove(null);
    setOrderIdForRemoval(null);
    setQtyToRemove(1);
  };

  const confirmRemoval = async () => {
    if (!itemToRemove || !orderIdForRemoval) return;

    try {
      await api.post(`orders/${orderIdForRemoval}/cancel_item/`, {
        item_id: itemToRemove.id,
        quantity: qtyToRemove,
      });
      // Success - just refresh and close
      fetchOrders();
      closeRemoveModal();
    } catch (error) {
      console.error("Error cancelling item:", error);
      // Optional: set some UI error state if we had one, but removing prompt is priority
    }
  };

  const openReportModal = (item) => {
    setSelectedItemForReport(item);
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setSelectedItemForReport(null);
    setReportReason("");
    setReportDescription("");
    setReportImage(null);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemForReport) return;

    const formData = new FormData();
    formData.append("order_item", selectedItemForReport.id);
    formData.append("reason", reportReason);
    formData.append("description", reportDescription);
    if (reportImage) {
      formData.append("image", reportImage);
    }

    try {
      await api.post("complaints/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // alert("Complaint submitted successfully. The vendor will be notified.");
      closeReportModal();
      setReportSuccess(true);
    } catch (error) {
      console.error("Error submitting complaint:", error);
      let errorMessage = "Failed to submit complaint.";
      if (error.response?.data) {
        if (error.response.data.error) errorMessage = error.response.data.error;
        else if (error.response.data.detail)
          errorMessage = error.response.data.detail;
        else if (Array.isArray(error.response.data))
          errorMessage = error.response.data.join(", ");
        else if (typeof error.response.data === "object") {
          // Handle field-specific errors
          errorMessage = Object.entries(error.response.data)
            .map(
              ([key, val]) =>
                `${key}: ${Array.isArray(val) ? val.join(", ") : val}`,
            )
            .join("\n");
        }
      }
      alert(errorMessage);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        Loading your orders...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif font-bold text-white mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 theme-card">
          <p className="text-gray-400 mb-4">
            You haven't placed any orders yet.
          </p>
          <Link to="/" className="btn-primary inline-block">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            // Group cancelled items logic
            // ... existing grouping logic ...
            const activeItems = order.items.filter(
              (i) => i.status !== "cancelled",
            );
            const cancelledItems = order.items.filter(
              (i) => i.status === "cancelled",
            );

            const groupedCancelled = {};
            cancelledItems.forEach((item) => {
              const key = `${item.product}-${item.price_at_purchase}`;
              if (groupedCancelled[key]) {
                groupedCancelled[key].quantity += item.quantity;
              } else {
                groupedCancelled[key] = { ...item };
              }
            });

            const displayItems = [
              ...activeItems,
              ...Object.values(groupedCancelled),
            ];

            return (
              <div key={order.id} className="theme-card overflow-hidden shadow-2xl border border-[#D4AF37]/10 group hover:border-[#D4AF37]/30 transition-all duration-300">
                <div className="bg-[#1a1a1a]/80 backdrop-blur-sm px-8 py-6 border-b border-[#D4AF37]/20 flex flex-wrap justify-between items-center gap-6">
                  {/* Order Header Info */}
                   <div className="flex gap-12 items-center flex-1 flex-wrap">
                      <div className="flex flex-col">
                        <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-bold mb-1">Order Placed</span>
                        <span className="text-white font-medium text-lg">
                          {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-bold mb-1">Total</span>
                        <span className="font-serif font-bold text-white text-xl">
                          ${order.total_price}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-bold mb-1">Order #</span>
                         <span className="font-mono text-gray-400 text-sm">#{order.id}</span>
                      </div>
                   </div>

                  <div className="flex items-center gap-6">
                    {/* Status Badge */}
                    <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest flex items-center gap-2
                      ${
                        order.status === "delivered"
                          ? "bg-green-900/20 text-green-400 border-green-900/50"
                          : order.status === "cancelled"
                            ? "bg-red-900/20 text-red-400 border-red-900/50"
                            : "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30"
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                             order.status === "delivered" ? "bg-green-400" :
                             order.status === "cancelled" ? "bg-red-400" : "bg-[#D4AF37]"
                        }`}></span>
                        {order.status}
                    </div>

                    {['placed', 'shipped'].includes(order.status) && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="text-gray-500 hover:text-red-400 text-sm font-medium transition-colors flex items-center gap-1 group-hover:text-red-400"
                        title="Cancel Order"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                         <span className="underline decoration-transparent group-hover:decoration-red-400 transition-all">Cancel Order</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {displayItems.map((item) => (
                      <div
                        key={item.id || `${item.product}-${item.status}`}
                        className="flex items-center gap-6 border-b border-[#333] last:border-0 pb-6 last:pb-0"
                      >
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-[#333] bg-black">
                          <img
                            src={
                              item.product_image ||
                              "https://via.placeholder.com/150"
                            }
                            alt={item.product_name || "Product"}
                            className="h-full w-full object-cover object-center opacity-90 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-serif font-bold text-white mb-1 truncate">
                            {item.product_name}
                          </h4>
                          <p className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                            <span>Qty: <span className="text-white font-medium">{item.quantity}</span></span>
                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            <span className="text-[#D4AF37]">Sold by {item.vendor_name || "Store"}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-3 min-w-[120px]">
                          <p className="text-xl font-serif font-bold text-[#D4AF37]">
                            ${item.price_at_purchase}
                          </p>
                          {item.status === "cancelled" ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-900/10 px-2 py-1 rounded border border-red-500/20">
                              Item Cancelled
                            </span>
                          ) : ['placed', 'shipped'].includes(order.status) ? (
                            <button
                              onClick={() =>
                                openRemoveModal(order.id, item)
                              }
                              className="text-xs text-gray-500 hover:text-red-400 transition-colors border border-gray-700 hover:border-red-400 px-3 py-1.5 rounded-full"
                            >
                              Remove Item
                            </button>
                          ) : (
                            order.status === "delivered" && (
                              <button
                                onClick={() => openReportModal(item)}
                                className="text-xs font-bold text-[#D4AF37] hover:text-[#b5952f] hover:underline px-3 py-1"
                              >
                                Returns / Issues
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="theme-card p-6 w-full max-w-md transform transition-all scale-100 border border-[#D4AF37]/20">
            <h2 className="text-xl font-serif font-bold mb-4 text-[#D4AF37]">Report Issue</h2>
            <p className="text-sm text-gray-400 mb-6">
              Reporting: <span className="font-semibold text-white">{selectedItemForReport?.product_name}</span>
            </p>
            <form onSubmit={handleReportSubmit}>
              {/* Form Content */}
              <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Reason</label>
                    <select
                        required
                        className="input-field"
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                    >
                        <option value="">Select a reason</option>
                        <option value="Damaged Product">Damaged Product</option>
                        <option value="Wrong Item">Wrong Item</option>
                        <option value="Poor Quality">Poor Quality</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                   <textarea
                        required
                        className="input-field"
                        rows="3"
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Please provide details about the issue..."
                   ></textarea>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Upload Photo</label>
                    <input
                        type="file"
                        accept="image/*"
                         className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-sm file:font-semibold file:bg-[#D4AF37] file:text-black hover:file:bg-[#b5952f] cursor-pointer"
                        onChange={(e) => setReportImage(e.target.files[0])}
                    />
                 </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeReportModal}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#333] rounded hover:bg-[#444] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Remove Item Modal */}
      {removeModalOpen && itemToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="theme-card p-6 w-full max-w-sm transform transition-all scale-100 border border-red-900/50">
            <h2 className="text-xl font-bold mb-4 text-red-500">Remove Item</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to remove <strong className="text-white">{itemToRemove.product_name}</strong> from your order?
            </p>

            {itemToRemove.quantity > 1 && (
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    Quantity to Remove (Max: {itemToRemove.quantity})
                </label>
                <div className="flex items-center justify-center border border-[#333] rounded-sm w-full max-w-[140px] overflow-hidden">
                    <button 
                        type="button"
                        className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#333] border-r border-[#333] transition-colors text-white"
                        onClick={() => setQtyToRemove(Math.max(1, qtyToRemove - 1))}
                    >
                        -
                    </button>
                    <input 
                        type="number" 
                        readOnly
                        className="w-12 text-center border-none p-0 focus:ring-0 bg-[#0F0F0F] text-white font-medium"
                        value={qtyToRemove}
                    />
                    <button 
                        type="button"
                        className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#333] border-l border-[#333] transition-colors text-white"
                        onClick={() => setQtyToRemove(Math.min(itemToRemove.quantity, qtyToRemove + 1))}
                    >
                        +
                    </button>
                </div>
            </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeRemoveModal}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#333] rounded hover:bg-[#444] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoval}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 shadow-sm transition-colors"
              >
                Remove Item
              </button>
            </div>
          </div>
        </div>

      )}

      {/* Success Modal */}
      {reportSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="theme-card p-8 w-full max-w-sm text-center transform transition-all scale-100 border border-green-500/30">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-900/20 mb-6">
              <svg
                className="h-10 w-10 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-2">
              Report Filed!
            </h3>
            <p className="text-gray-400 mb-8">
              Your report has been submitted successfully. The vendor will be notified immediately.
            </p>
            <button
              onClick={() => setReportSuccess(false)}
              className="w-full btn-primary py-3 text-lg"
            >
              OK, Got it
            </button>
          </div>
        </div>
      )}
      
       {/* Cancel Order Confirmation Modal */}
       {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="theme-card p-6 w-full max-w-md transform transition-all scale-100 border border-red-500/20 text-center">
             <div className="w-16 h-16 bg-[#1a1a1a] border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
             </div>
             
             <h2 className="text-xl font-serif font-bold mb-2 text-white">Cancel Order?</h2>
             <p className="text-gray-400 mb-6 text-sm">
               Are you sure you want to cancel this entire order? This action cannot be undone.
             </p>

             <div className="flex space-x-3">
               <button
                 onClick={() => setCancelModalOpen(false)}
                 className="flex-1 px-4 py-2 bg-[#1a1a1a] text-gray-300 rounded hover:bg-[#333] hover:text-white transition-colors border border-[#333]"
               >
                 No, Keep Order
               </button>
               <button
                 onClick={confirmCancelOrder}
                 className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
               >
                 Yes, Cancel It
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
