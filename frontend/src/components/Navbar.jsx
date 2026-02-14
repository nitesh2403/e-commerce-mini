import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");
  const { cartCount } = useCart();
  const [notifications, setNotifications] = React.useState([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  React.useEffect(() => {
    if (token) {
        fetchNotifications();
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
        const importApi = (await import("../api")).default;
        const res = await importApi.get("users/notifications/");
        setNotifications(res.data);
    } catch (err) {
        console.error("Failed to fetch notifications", err);
    }
  };

  const markRead = async (id) => {
    try {
        const importApi = (await import("../api")).default;
        await importApi.post(`users/notifications/${id}/read/`);
        setNotifications(prev => prev.map(n => n.id === id ? {...n, is_read: true} : n));
    } catch (err) {
        console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
        const importApi = (await import("../api")).default;
        await importApi.post(`users/notifications/mark-all-read/`);
        setNotifications(prev => prev.map(n => ({...n, is_read: true})));
    } catch (err) {
        console.error(err);
    }
  };

  const clearRead = async () => {
    try {
        const importApi = (await import("../api")).default;
        await importApi.delete(`users/notifications/clear-read/`);
        setNotifications(prev => prev.filter(n => !n.is_read));
    } catch (err) {
        console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-[#0c0c0c] border-b border-[#333] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              to={
                localStorage.getItem("role") === "admin"
                  ? "/admin-dashboard"
                  : "/"
              }
              className="text-2xl font-bold font-serif text-[#D4AF37] tracking-wider"
            >
              SHOPMINI
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-300 hover:text-white focus:outline-none focus:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {!token ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-[#D4AF37] font-medium transition-colors"
                >
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-black">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {localStorage.getItem("role") === "admin" ? (
                  <>
                    <Link
                      to="/admin-dashboard"
                      className="text-gray-300 hover:text-[#D4AF37] font-medium transition-colors"
                    >
                      Orders
                    </Link>
                    <Link
                      to="/admin-reports"
                      className="text-gray-300 hover:text-[#D4AF37] font-medium transition-colors"
                    >
                      Reports
                    </Link>
                    <Link
                      to="/admin-inventory"
                      className="text-gray-300 hover:text-[#D4AF37] font-medium transition-colors"
                    >
                      Inventory
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/my-orders"
                      className="text-gray-300 hover:text-[#D4AF37] font-medium transition-colors"
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      className="text-gray-300 hover:text-[#D4AF37] font-medium transition-colors"
                    >
                      Wishlist
                    </Link>
                    <Link
                      to="/cart"
                      className="flex items-center text-gray-300 hover:text-[#D4AF37] font-medium transition-colors relative"
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
                          strokeWidth="2"
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span className="ml-2">Cart</span>
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-3 bg-[#D4AF37] text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center flex items-center justify-center border border-[#0c0c0c]">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                    {/* Notification Bell (Shared) */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="text-gray-300 hover:text-[#D4AF37] font-medium transition-colors relative"
                        >
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                             </svg>
                             {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1 py-0.5 rounded-full min-w-[14px] text-center flex items-center justify-center">
                                    {unreadCount}
                                </span>
                             )}
                        </button>
                        
                        {/* Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-[#121212] rounded-lg shadow-xl py-2 z-50 border border-[#333] max-h-96 overflow-y-auto">
                                <div className="px-4 py-3 border-b border-[#333] flex justify-between items-center bg-[#1a1a1a]">
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-serif text-[#D4AF37] font-bold">Notifications</h3>
                                        <span className="text-xs text-gray-400">{unreadCount} unread</span>
                                    </div>
                                    <div className="flex space-x-1">
                                        <button 
                                            onClick={markAllRead} 
                                            title="Mark all as read"
                                            className="p-1 hover:bg-[#333] rounded-full text-gray-400 hover:text-[#D4AF37] transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                        <button 
                                            onClick={clearRead} 
                                            title="Clear read notifications"
                                            className="p-1 hover:bg-[#333] rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                {notifications.length > 0 ? (
                                    notifications.map(n => (
                                        <div 
                                            key={n.id} 
                                            onClick={() => {
                                                if (!n.is_read) markRead(n.id);
                                                if (n.action_link) {
                                                    navigate(n.action_link);
                                                    setShowNotifications(false);
                                                }
                                            }}
                                            className={`px-4 py-3 hover:bg-[#1a1a1a] border-b border-[#333] last:border-0 cursor-pointer transition-colors ${!n.is_read ? 'bg-[#D4AF37]/10' : ''}`}
                                        >
                                            <p className={`text-sm ${!n.is_read ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                                                {n.message}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                        No notifications yet
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                <Link
                  to="/profile"
                  className="text-gray-300 hover:text-[#D4AF37] font-medium transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-red-500 font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#0c0c0c] border-b border-[#333]">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {!token ? (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#D4AF37] hover:text-white hover:bg-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {localStorage.getItem("role") === "admin" ? (
                  <>
                    <Link
                      to="/admin-dashboard"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link
                      to="/admin-reports"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Reports
                    </Link>
                    <Link
                      to="/admin-inventory"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Inventory
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/my-orders"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Wishlist
                    </Link>
                    <Link
                      to="/cart"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Cart ({cartCount})
                    </Link>
                  </>
                )}
                
                {/* Mobile Notification Link */}
                 <div 
                    onClick={() => {
                        setShowNotifications(!showNotifications);
                        // Optional: close menu or keep it for notification viewing
                    }}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer"
                >
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                    {/* Mobile Notification Dropdown would need to be handled carefully here, simpler to just show count */}
                    {showNotifications && (
                        <div className="mt-2 bg-[#1a1a1a] rounded-lg p-2 max-h-60 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map(n => (
                                    <div 
                                        key={n.id} 
                                        onClick={(e) => {
                                             e.stopPropagation();
                                            if (!n.is_read) markRead(n.id);
                                            if (n.action_link) {
                                                navigate(n.action_link);
                                                setIsMenuOpen(false);
                                            }
                                        }}
                                        className={`p-2 border-b border-[#333] last:border-0 ${!n.is_read ? 'text-[#D4AF37]' : 'text-gray-400'}`}
                                    >
                                        {n.message}
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-500 text-sm p-2">No notifications</div>
                            )}
                        </div>
                    )}
                </div>

                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:text-red-400 hover:bg-gray-700"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
