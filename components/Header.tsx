
import React from 'react';
import { Page, User } from '../types';

interface HeaderProps {
  currentPage: Page;
  user: User | null;
  onNavigate: (page: Page) => void;
  onCallClick: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, user, onNavigate, onCallClick, onLogout }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => onNavigate(Page.Home)}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white mr-3 group-hover:bg-blue-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">ArcticFlow<span className="text-blue-600">AI</span></span>
          </div>

          <nav className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
            <button onClick={() => onNavigate(Page.Home)} className={`hover:text-blue-600 ${currentPage === Page.Home ? 'text-blue-600 font-semibold' : ''}`}>Home</button>
            {!user && <a href="#services" className="hover:text-blue-600">Services</a>}
            {!user && <a href="#about" className="hover:text-blue-600">About</a>}
            
            {user?.role === 'Admin' && (
              <button onClick={() => onNavigate(Page.AdminDashboard)} className={`hover:text-blue-600 ${currentPage === Page.AdminDashboard ? 'text-blue-600 font-semibold' : ''}`}>Bookings</button>
            )}
            {user?.role === 'Staff' && (
              <button onClick={() => onNavigate(Page.StaffDashboard)} className={`hover:text-blue-600 ${currentPage === Page.StaffDashboard ? 'text-blue-600 font-semibold' : ''}`}>My Schedule</button>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{user.role}</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button 
                  onClick={() => onNavigate(Page.Login)}
                  className="text-slate-600 hover:text-blue-600 font-semibold text-sm px-4 py-2"
                >
                  Staff Portal
                </button>
                <button 
                  onClick={onCallClick}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="hidden sm:inline font-bold">Call to Book</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
