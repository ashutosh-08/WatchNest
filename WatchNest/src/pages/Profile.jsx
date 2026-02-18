import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { videoService } from '../services/api.service';

const STATUS_THEME = {
  none: 'bg-slate-100 text-slate-700 border-slate-300',
  processing: 'bg-amber-100 text-amber-700 border-amber-300',
  ready: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  failed: 'bg-rose-100 text-rose-700 border-rose-300',
};

export default function Profile() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [videoError, setVideoError] = useState('');
  const [retryingIds, setRetryingIds] = useState([]);

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

  const fetchMyVideos = async () => {
    try {
      setVideoError('');
      const res = await videoService.getUserVideos(1, 30);
      const payload = res?.data?.data;
      const list = Array.isArray(payload) ? payload : payload?.videos;
      setVideos(Array.isArray(list) ? list : []);
    } catch (error) {
      setVideoError(error?.response?.data?.message || 'Failed to fetch your videos');
      setVideos([]);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchMyVideos();
  }, []);

  const totalReadyStoryboards = useMemo(
    () => videos.filter((video) => video?.storyboard?.status === 'ready').length,
    [videos]
  );

  const refreshStoryboardStatus = async (videoId) => {
    try {
      const res = await videoService.getVideoStoryboard(videoId);
      const storyboard = res?.data?.data;
      if (!storyboard) return;
      setVideos((prev) =>
        prev.map((video) =>
          video._id !== videoId
            ? video
            : {
                ...video,
                storyboard: {
                  ...(video.storyboard || {}),
                  ...storyboard,
                },
              }
        )
      );
    } catch (error) {
      console.error('Failed to refresh storyboard status:', error);
    }
  };

  const handleRetryStoryboard = async (videoId) => {
    if (retryingIds.includes(videoId)) return;
    setRetryingIds((prev) => [...prev, videoId]);
    try {
      await videoService.retryVideoStoryboard(videoId);
      setVideos((prev) =>
        prev.map((video) =>
          video._id !== videoId
            ? video
            : {
                ...video,
                storyboard: {
                  ...(video.storyboard || {}),
                  status: 'processing',
                },
              }
        )
      );
    } catch (error) {
      alert(error?.response?.data?.message || 'Retry request failed');
    } finally {
      setRetryingIds((prev) => prev.filter((id) => id !== videoId));
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
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
            <p className="text-2xl font-bold text-indigo-600">{user?.videosCount || videos.length || 0}</p>
            <p className="text-slate-600 text-sm">Videos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{user?.subscribersCount || 0}</p>
            <p className="text-slate-600 text-sm">Subscribers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{totalReadyStoryboards}</p>
            <p className="text-slate-600 text-sm">Storyboards Ready</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <p className="text-slate-700">{user?.bio || 'No bio added yet'}</p>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-semibold">My Videos</h2>
          <button
            type="button"
            onClick={fetchMyVideos}
            className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-50"
          >
            Refresh List
          </button>
        </div>

        {loadingVideos ? (
          <div className="py-10 text-center text-slate-500">Loading videos...</div>
        ) : videoError ? (
          <div className="py-10 text-center text-rose-600">{videoError}</div>
        ) : videos.length === 0 ? (
          <div className="py-10 text-center text-slate-500">No videos uploaded yet.</div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => {
              const status = video?.storyboard?.status || 'none';
              const isRetrying = retryingIds.includes(video._id);
              return (
                <div key={video._id} className="border rounded-lg p-4 flex gap-4 items-start">
                  <img
                    src={video.thumbnail || '/placeholder.png'}
                    alt={video.title}
                    className="w-44 h-24 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <Link to={`/watch/${video._id}`} className="font-semibold hover:text-indigo-600 line-clamp-1">
                      {video.title}
                    </Link>
                    <p className="text-sm text-slate-500 mt-1">
                      {Number(video.views || 0).toLocaleString()} views
                    </p>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs border px-2 py-1 rounded-full ${
                          STATUS_THEME[status] || STATUS_THEME.none
                        }`}
                      >
                        storyboard: {status}
                      </span>

                      <button
                        type="button"
                        onClick={() => refreshStoryboardStatus(video._id)}
                        className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-50"
                      >
                        Refresh Status
                      </button>

                      {(status === 'failed' || status === 'none') && (
                        <button
                          type="button"
                          onClick={() => handleRetryStoryboard(video._id)}
                          disabled={isRetrying}
                          className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {isRetrying ? 'Queueing...' : 'Retry Storyboard'}
                        </button>
                      )}

                      {status === 'ready' && video?.storyboard?.vttUrl && (
                        <a
                          href={video.storyboard.vttUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-2 py-1 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        >
                          Open VTT
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
