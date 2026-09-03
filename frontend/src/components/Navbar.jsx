import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, Home, LogIn, UserPlus, LogOut, LayoutDashboard, Menu, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [isOpen, setIsOpen]   = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const token      = localStorage.getItem('token');
  const userType   = localStorage.getItem('userType');
  const museumName = localStorage.getItem('museumName');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Hide navbar entirely on chatbot / museum detail pages
  const isChatbotPage =
    location.pathname.startsWith('/chatbot') ||
    location.pathname.startsWith('/museum/');

  if (isChatbotPage) return null;

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    ...(!token
      ? [{ to: '/admin-login', label: 'Admin Login', icon: LogIn }]
      : userType === 'MUSEUM'
        ? [{ to: '/admin-dashboard', label: 'Dashboard', icon: LayoutDashboard }]
        : []
    ),
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-xl">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-gray-900 text-lg tracking-tight">
              Museum<span className="text-indigo-600">QR</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === link.to
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}

            {!token ? (
              <Link to="/register-museum"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-md ml-2">
                <UserPlus className="h-4 w-4" />
                Register Museum
              </Link>
            ) : (
              <button onClick={handleLogout}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-xl text-sm font-semibold transition-all ml-2">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-80 mt-4' : 'max-h-0'}`}>
          <div className="bg-white rounded-2xl shadow-lg p-4 space-y-1 border border-gray-100">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === link.to
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}>
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
            {!token ? (
              <Link to="/register-museum" onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all">
                <UserPlus className="h-4 w-4" /> Register Museum
              </Link>
            ) : (
              <button onClick={() => { handleLogout(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-all">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
