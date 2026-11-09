import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  User,
  Database,
  PlusCircle,
  LogOut,
  Heart,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  onOpenLogModal: () => void;
  onOpenDbModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenLogModal, onOpenDbModal }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Readings History', to: '/readings', icon: ClipboardList },
    { label: 'Clinical Reports', to: '/reports', icon: BarChart3 },
    { label: 'Patient Profile', to: '/profile', icon: User },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/80 min-h-[calc(100vh-61px)] p-4 shrink-0">
        {/* Quick Action Button */}
        <div className="mb-6">
          <button
            onClick={onOpenLogModal}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-xs hover:shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Reading</span>
          </button>
        </div>

        {/* Primary Navigation */}
        <div className="space-y-1 flex-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-50 text-purple-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-purple-600" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Bottom User Profile */}
        <div className="pt-4 mt-auto border-t border-slate-100">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center text-xs font-bold shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name || 'Patient'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors ml-1 shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xs border-t border-slate-200 flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive ? 'text-purple-700 font-semibold' : 'text-slate-500'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          );
        })}
        <button
          onClick={onOpenLogModal}
          className="flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-medium text-purple-700"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add</span>
        </button>
      </nav>
    </>
  );
};
