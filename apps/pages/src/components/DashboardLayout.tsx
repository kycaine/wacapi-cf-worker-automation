import React, { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, LogOut, Menu, X, BarChart3 } from 'lucide-react';
import { logout } from '../services/api';

const DashboardLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4 gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl text-gray-900">Bot Admin</span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              <NavLink to="/overview" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <LayoutDashboard className="mr-4 h-6 w-6 text-gray-500 group-hover:text-gray-500" />
                Overview
              </NavLink>
              <NavLink to="/chats" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <MessageSquare className="mr-4 h-6 w-6 text-gray-500 group-hover:text-gray-500" />
                Chat History
              </NavLink>
              <NavLink to="/stats" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `group flex items-center px-2 py-2 text-base font-medium rounded-md ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <BarChart3 className="mr-4 h-6 w-6 text-gray-500 group-hover:text-gray-500" />
                Statistics
              </NavLink>
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button onClick={handleLogout} className="flex-shrink-0 group block w-full flex items-center text-left">
              <LogOut className="inline-block h-5 w-5 text-gray-400 group-hover:text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 gap-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                <span className="font-bold text-xl text-gray-900">Bot Admin</span>
              </div>
              <nav className="mt-8 flex-1 px-2 bg-white space-y-1">
                <NavLink to="/overview" className={({ isActive }) => `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <LayoutDashboard className="mr-3 h-6 w-6 text-gray-500 group-hover:text-gray-500" />
                  Overview
                </NavLink>
                <NavLink to="/chats" className={({ isActive }) => `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <MessageSquare className="mr-3 h-6 w-6 text-gray-500 group-hover:text-gray-500" />
                  Chat History
                </NavLink>
                <NavLink to="/stats" className={({ isActive }) => `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <BarChart3 className="mr-3 h-6 w-6 text-gray-500 group-hover:text-gray-500" />
                  Statistics
                </NavLink>
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button onClick={handleLogout} className="flex-shrink-0 w-full group block flex items-center text-left">
                <LogOut className="inline-block h-5 w-5 text-gray-400 group-hover:text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex border-b border-gray-200 bg-white shadow-sm">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex items-center px-4">
            <span className="font-bold text-lg text-gray-900">Dashboard</span>
          </div>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
