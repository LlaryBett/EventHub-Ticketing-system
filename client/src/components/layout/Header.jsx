import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';

const Header = () => {
  const { user, logout } = useAuth();
  const { getTotalItems, toggleCart } = useCart();
  const { mobileMenuOpen, toggleMobileMenu } = useUI();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: <svg className="w-5 h-5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6m-6 0H7v6h6v-6z" /></svg> },
    { path: '/events', label: 'Events', icon: <svg className="w-5 h-5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4 4 4-4m0-5V3a1 1 0 00-1-1H7a1 1 0 00-1 1v9m8 0H5" /></svg> },
    { path: '/categories', label: 'Categories', icon: <svg className="w-5 h-5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
    { path: '/pricing', label: 'Pricing', icon: <svg className="w-5 h-5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 8v8" /></svg> },
    { path: '/about', label: 'About', icon: <svg className="w-5 h-5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20h.01" /></svg> },
    { path: '/contact', label: 'Contact', icon: <svg className="w-5 h-5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10a9 9 0 11-18 0 9 9 0 0118 0zm-9 4v2m0-8v2" /></svg> }
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto container-padding">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-xl font-bold text-gray-900">EventHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className="text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <button
              onClick={toggleCart}
              className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 7.5L5.5 20.5M7 13l-2-5m8 5a1 1 0 100 2 1 1 0 000-2zm-8 0a1 1 0 100 2 1 1 0 000-2z" />
              </svg>
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">{user.name?.charAt(0) || 'U'}</span>
                  </div>
                  <span className="hidden md:block font-medium">{user.name}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {user.role === 'organizer' || user.role === 'admin' ? (
                      <Link
                        to="/organizer"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Organizer Panel
                      </Link>
                    ) : null}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  style={{
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    padding: '8px 24px',
                    borderRadius: '9999px', // fully oval
                    textDecoration: 'none',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease-in-out',
                    display: 'inline-block'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#1D4ED8';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#2563EB';
                  }}
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="py-4 space-y-2">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block py-2 text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
                  onClick={toggleMobileMenu}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              
              {!user && (
                <div className="pt-4 space-y-2">
                  <Link
                    to="/login"
                    className="block py-2 text-gray-600 hover:text-primary-600 font-medium transition-colors duration-200"
                    onClick={toggleMobileMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block py-2 text-primary-600 font-medium transition-colors duration-200"
                    onClick={toggleMobileMenu}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;