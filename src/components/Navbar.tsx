import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Plus, Database, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenLogModal?: () => void;
  onOpenDbModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogModal, onOpenDbModal }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xs border-b border-purple-100/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand wordmark */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-xs">
            <Heart className="w-5 h-5 fill-rose-300 text-purple-700" />
          </div>
          <span className="text-xl font-bold tracking-tight text-purple-950 font-sans">
            Glucose Tracker
          </span>
        </Link>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  location.pathname === '/dashboard' ? 'text-purple-700 font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/readings"
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  location.pathname === '/readings' ? 'text-purple-700 font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Readings
              </Link>
              <Link
                to="/reports"
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  location.pathname === '/reports' ? 'text-purple-700 font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Reports
              </Link>
              <Link
                to="/profile"
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  location.pathname === '/profile' ? 'text-purple-700 font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Profile
              </Link>
            </>
          ) : (
            <>
              <a href="#features" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
                Features
              </a>
              <a href="#clinical-slots" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
                Clinical Slots
              </a>
              <a href="#reports-preview" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
                Reports
              </a>
              <a href="#neon-database" className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0">
                Architecture
              </a>
            </>
          )}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {onOpenLogModal && (
                <button
                  onClick={onOpenLogModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors shadow-xs whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Reading</span>
                </button>
              )}
              <button
                onClick={logout}
                title="Log out"
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors md:hidden"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-colors shadow-xs whitespace-nowrap shrink-0"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
