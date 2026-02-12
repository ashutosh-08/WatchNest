import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getAvatarSrc = (avatar, name = 'User') => {
    if (avatar) return avatar;
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='#e2e8f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='24' font-family='Arial, sans-serif' fill='#334155'>${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setShowUserMenu(false);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080A0C]/70 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <img
              src="/image.png"
              alt="WatchNest"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="text-xl font-sora font-bold text-white hidden sm:inline">WatchNest</span>
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos, channels..."
                className="w-full px-4 py-2 border border-white/15 bg-[#1C2128]/80 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-[#00F0FF] text-sm placeholder:text-white/45"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-[#00F0FF]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/upload"
                  className="bg-[#39FF14] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition hidden sm:block"
                >
                  Upload
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 hover:opacity-80 transition"
                  >
                    <img
                      src={getAvatarSrc(user?.avatar, user?.fullName)}
                      alt={user?.fullName}
                      className="w-8 h-8 rounded-full object-cover border border-[#00F0FF]/50"
                    />
                    <span className="text-sm font-medium text-white hidden sm:inline">{user?.fullName?.split(' ')[0]}</span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#1C2128]/95 rounded-lg shadow-lg border border-white/15 py-2 backdrop-blur-xl">
                      <Link
                        to={`/channel/${user?.username}`}
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition"
                      >
                        My Channel
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition"
                      >
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-[#FF3E3E] hover:bg-white/10 transition"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white/90 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-[#00F0FF] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
