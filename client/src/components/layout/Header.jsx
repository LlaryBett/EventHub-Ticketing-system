import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  RiDashboardLine, 
  RiAdminLine, 
  RiCalendarEventLine, 
  RiLogoutBoxRLine,
  RiUser3Line,
  RiMailLine,
  RiSettings4Line,
  RiTicketLine  // added ticket icon
} from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';

const Header = () => {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart(); // removed toggleCart
  const { mobileMenuOpen, toggleMobileMenu } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const totalItems = getTotalItems(); // read once for effects

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animate cart when items are added
  useEffect(() => {
    if (totalItems > 0) {
      setCartBounce(true);
      const t = setTimeout(() => setCartBounce(false), 300);
      return () => clearTimeout(t);
    }
  }, [totalItems]);

  // Auth initialization: if there's a token but user is not yet populated,
  // wait a short grace period so AuthContext can finish getMe. If no token or user present,
  // mark authReady immediately.
  useEffect(() => {
    if (user) {
      setAuthReady(true);
      return;
    }
    if (!token) {
      setAuthReady(true);
      return;
    }
    // token exists but user not yet loaded — wait briefly
    setAuthReady(false);
    const timer = setTimeout(() => setAuthReady(true), 800); // tune if needed
    return () => clearTimeout(timer);
  }, [user, token]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    {
      path: '/',
      label: 'Home',
      // Use a different home icon (e.g. Heroicons HomeSolid)
      icon: (
        <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7A1 1 0 003 11h1v6a1 1 0 001 1h4a1 1 0 001-1v-4h2v4a1 1 0 001 1h4a1 1 0 001-1v-6h1a1 1 0 00.707-1.707l-7-7z" />
        </svg>
      ),
    },
    { path: '/discover', label: 'Discover', icon: <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
    { path: '/events', label: 'Events', icon: <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" /></svg> },
    // Pricing link temporarily disabled
    // { path: '/pricing', label: 'Pricing', icon: <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 8v8" /></svg> },
    { path: '/about', label: 'About', icon: <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20h.01" /></svg> },
    { path: '/contact', label: 'Contact', icon: <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10a9 9 0 11-18 0 9 9 0 0118 0zm-9 4v2m0-8v2" /></svg> }
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-xl border-b border-gray-100' 
        : 'bg-white shadow-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-18">
          
          {/* Enhanced Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                EventHub
              </span>
              <span className="text-xs text-gray-500 -mt-1 hidden sm:block">Create Amazing Events</span>
            </div>
          </Link>

          {/* Enhanced Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2.5 rounded-lg font-bold text-lg transition-all duration-300 group ${
                  isActive(link.path)
                    ? 'text-blue-600 bg-blue-50 shadow-sm'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50 hover:rounded-lg'
                }`}
                style={{ fontWeight: 'bold', fontSize: '1.15rem' }} // extra font size and bold for clarity
              >
                <span className="flex items-center">
                  {link.icon}
                  <span>{link.label}</span>
                </span>
                {isActive(link.path) && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full"></div>
                )}
              </Link>
            ))}
          </nav>

          {/* Enhanced Right Side */}
          <div className="flex items-center space-x-3">
            {/* Find My Tickets Button */}
            <button
              onClick={() => navigate('/tickets')}
              className="relative flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              aria-label="Find my tickets"
            >
              <RiTicketLine className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Find my tickets</span>

              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {/* Enhanced User Menu */}
            { !authReady ? (
              // while auth not ready (token present but user not fetched) show skeleton
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="hidden sm:flex flex-col">
                  <div className="w-20 h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="w-12 h-2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ) : user ? (
               <div className="relative">
                 <button
                   onClick={() => setUserMenuOpen(!userMenuOpen)}
                   className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                 >
                   <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-200">
                     <span className="text-white font-semibold text-sm">
                       {user.data?.name?.charAt(0).toUpperCase()}
                     </span>
                   </div>
                   <div className="hidden sm:flex flex-col items-start">
                     <span className="text-sm font-medium text-gray-700">
                       {user.data?.name?.split(' ')[0]}
                     </span>
                     <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                   </div>
                   <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                   </svg>
                 </button>

                {/* Enhanced User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center">
                        <RiUser3Line className="w-4 h-4 text-violet-500 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.data?.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{user.data?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <RiDashboardLine className="w-4 h-4 mr-3 text-blue-500" />
                      Dashboard
                    </Link>

                    {/* Admin Dashboard link for admin users */}
                    {(user.data?.userType === 'admin') && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <RiAdminLine className="w-4 h-4 mr-3 text-emerald-500" />
                        Admin Dashboard
                      </Link>
                    )}

                    {(user.data?.userType === 'organizer' || user.data?.userType === 'admin') && (
                      <Link
                        to="/organizer"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <RiCalendarEventLine className="w-4 h-4 mr-3 text-indigo-500" />
                        Organizer Panel
                      </Link>
                    )}
                    
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                      >
                        <RiLogoutBoxRLine className="w-4 h-4 mr-3 text-red-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="relative inline-flex items-center px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden group whitespace-nowrap"
                >
                  <span className="relative z-10">Create Events</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            )}

            {/* Enhanced Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 z-50 lg:hidden">
            <div className="rounded-b-xl bg-white shadow-xl border-x-0 border-b border-gray-100">
              <div className="py-3 px-4 space-y-1">
                {navLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      isActive(link.path)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50 hover:rounded-lg'
                    }`}
                    onClick={toggleMobileMenu}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
                
                {!user && (
                  <div className="pt-3 flex flex-col gap-2 border-t border-gray-100 mt-3">
                    <Link
                      to="/login"
                      className="flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 font-medium rounded-lg transition-all duration-200"
                      onClick={toggleMobileMenu}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg transition-all duration-200"
                      onClick={toggleMobileMenu}
                    >
                      Create Events
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;