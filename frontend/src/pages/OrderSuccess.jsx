import React from "react";
import { Link } from "react-router-dom";

const OrderSuccess = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center flex-col">
      <div className="theme-card p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border border-[#D4AF37]/20 relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#D4AF37] opacity-10 blur-3xl rounded-full"></div>
        
        <div className="relative w-24 h-24 bg-[#1a1a1a] border border-[#D4AF37]/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <svg
            className="w-12 h-12 text-[#D4AF37]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h1 className="text-4xl font-serif font-bold text-white mb-4 tracking-wide">Order Placed!</h1>
        <p className="text-gray-400 mb-8 font-light leading-relaxed">
          Thank you for your purchase. Your order has been successfully placed
          and is being processed.
        </p>
        <div className="space-y-4">
          <Link to="/" className="block w-full btn-primary py-3 font-bold tracking-wider shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.23)] transition-shadow">
            Continue Shopping
          </Link>
          <Link to="/my-orders" className="block w-full text-sm text-[#D4AF37] hover:text-[#b5952f] transition-colors underline-offset-4 hover:underline">
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
