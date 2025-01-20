import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Home, Newspaper, TicketCheck, Settings, LogOut, LogIn, User } from 'lucide-react';

function Layout() {
  const { user, signOut } = useAuthStore();
  const location = useLocation();
  const isMobile = window.innerWidth < 768;

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/services', icon: Newspaper, label: 'Services' },
    { to: '/tickets', icon: TicketCheck, label: 'Tickets' },
    ...(user?.role === 'admin' ? [{ to: '/admin', icon: Settings, label: 'Admin' }] : []),
  ];

  const NavContent = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
              ${location.pathname === item.to
                ? 'bg-blue-100 text-blue-600'
                : 'hover:bg-gray-100'
              }`}
          >
            <Icon size={20} />
            <span className={isMobile ? 'sr-only' : ''}>{item.label}</span>
          </Link>
        );
      })}
      {user ? (
        <>
          <Link
            to={`/profile/${user.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            <User size={20} />
            <span className={isMobile ? 'sr-only' : ''}>Profile</span>
          </Link>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100"
          >
            <LogOut size={20} />
            <span className={isMobile ? 'sr-only' : ''}>Logout</span>
          </button>
        </>
      ) : (
        <Link
          to="/login"
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 text-blue-600"
        >
          <LogIn size={20} />
          <span className={isMobile ? 'sr-only' : ''}>Login</span>
        </Link>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation for desktop */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 items-center px-4 gap-4">
        <div className="flex-1 flex items-center gap-4">
          <NavContent />
        </div>
      </nav>

      {/* Bottom navigation for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around px-4">
        <NavContent />
      </nav>

      {/* Main content */}
      <main className={`container mx-auto px-4 ${isMobile ? 'pb-20' : 'pt-20'}`}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
