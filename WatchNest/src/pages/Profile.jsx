import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const getAvatarSrc = (avatar, name = 'User') => {
    if (avatar) return avatar;
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='100%' height='100%' fill='#e2e8f0'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='44' font-family='Arial, sans-serif' fill='#334155'>${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center mb-8">
          <img
            src={getAvatarSrc(user?.avatar, user?.fullName)}
            alt={user?.fullName}
            className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
          />
          <h1 className="text-3xl font-bold">{user?.fullName}</h1>
          <p className="text-slate-600 mt-2">@{user?.username}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8 py-8 border-y">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{user?.videosCount || 0}</p>
            <p className="text-slate-600 text-sm">Videos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{user?.subscribersCount || 0}</p>
            <p className="text-slate-600 text-sm">Subscribers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{user?.subscribedToCount || 0}</p>
            <p className="text-slate-600 text-sm">Subscribed</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <p className="text-slate-700">{user?.bio || 'No bio added yet'}</p>
        </div>
      </div>
    </div>
  );
}
