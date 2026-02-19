import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { videoService } from '../services/api.service';

const STATUS_THEME = {
  none: 'bg-white/10 text-white/75 border-white/20',
  processing: 'bg-amber-500/15 text-amber-300 border-amber-300/40',
  ready: 'bg-emerald-500/15 text-emerald-300 border-emerald-300/40',
  failed: 'bg-rose-500/15 text-rose-300 border-rose-300/40',
};

export default function Profile() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [videoError, setVideoError] = useState('');
  const [retryingIds, setRetryingIds] = useState([]);
  const [togglingPublishIds, setTogglingPublishIds] = useState([]);
  const [deletingIds, setDeletingIds] = useState([]);

  const getAvatarSrc = (avatar, name = 'User') => {
    if (avatar) return avatar;
    const initials = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#1C2128'/><stop offset='100%' stop-color='#101419'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='44' font-family='Arial, sans-serif' fill='#00F0FF'>${initials}</text></svg>`;
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

  const handleTogglePublish = async (videoId) => {
    if (togglingPublishIds.includes(videoId)) return;
    setTogglingPublishIds((prev) => [...prev, videoId]);
    try {
      const res = await videoService.togglePublishStatus(videoId);
      const updated = res?.data?.data;
      const nextIsPublished =
        typeof updated?.isPublished === 'boolean' ? updated.isPublished : undefined;

      setVideos((prev) =>
        prev.map((video) =>
          video._id !== videoId
            ? video
            : {
                ...video,
                isPublished:
                  typeof nextIsPublished === 'boolean' ? nextIsPublished : !Boolean(video.isPublished),
              }
        )
      );
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to update publish status');
    } finally {
      setTogglingPublishIds((prev) => prev.filter((id) => id !== videoId));
    }
  };

  const handleDeleteVideo = async (videoId, title) => {
    if (deletingIds.includes(videoId)) return;
    const confirmed = window.confirm(`Delete "${title}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingIds((prev) => [...prev, videoId]);
    try {
      await videoService.deleteVideo(videoId);
      setVideos((prev) => prev.filter((video) => video._id !== videoId));
    } catch (error) {
      alert(error?.response?.data?.message || 'Failed to delete video');
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== videoId));
    }
  };

  return (
    <section className="-mx-4 px-4 py-6 lg:py-8 min-h-[calc(100vh-120px)] text-white bg-[linear-gradient(160deg,#080A0C_0%,#0f141a_45%,#080A0C_100%)] rounded-[30px] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-20 w-[360px] h-[360px] rounded-full bg-[#39FF14]/15 blur-[90px]" />
      <div className="pointer-events-none absolute top-[18%] right-[-80px] w-[320px] h-[320px] rounded-full bg-[#00F0FF]/18 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-140px] left-[35%] w-[340px] h-[340px] rounded-full bg-[#00FF94]/12 blur-[100px]" />

      <div className="relative max-w-6xl mx-auto">
        <div className="bg-[#1C2128]/95 border border-white/10 rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.35)] p-8">
          <div className="text-center mb-8">
          <img
            src={getAvatarSrc(user?.avatar, user?.fullName)}
            alt={user?.fullName}
            className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-2 border-[#00F0FF]/60 shadow-[0_0_30px_rgba(0,240,255,0.2)]"
          />
          <h1 className="text-3xl font-bold text-white">{user?.fullName}</h1>
          <p className="text-white/65 mt-2">@{user?.username}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 py-8 border-y border-white/10">
            <div className="text-center bg-white/[0.04] border border-white/10 rounded-xl py-4">
              <p className="text-2xl font-bold text-[#39FF14]">{user?.videosCount || videos.length || 0}</p>
              <p className="text-white/65 text-sm">Videos</p>
            </div>
            <div className="text-center bg-white/[0.04] border border-white/10 rounded-xl py-4">
              <p className="text-2xl font-bold text-[#00F0FF]">{user?.subscribersCount || 0}</p>
              <p className="text-white/65 text-sm">Subscribers</p>
            </div>
            <div className="text-center bg-white/[0.04] border border-white/10 rounded-xl py-4">
              <p className="text-2xl font-bold text-[#00FF94]">{totalReadyStoryboards}</p>
              <p className="text-white/65 text-sm">Storyboards Ready</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-white">About</h2>
            <p className="text-white/75">{user?.bio || 'No bio added yet'}</p>
          </div>
        </div>

      <div className="mt-8 bg-[#1C2128]/95 border border-white/10 rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.35)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-semibold text-white">My Videos</h2>
          <button
            type="button"
            onClick={fetchMyVideos}
            className="px-3 py-2 text-sm rounded-lg border border-[#00F0FF]/50 text-[#00F0FF] hover:bg-[#00F0FF]/10 transition"
          >
            Refresh List
          </button>
        </div>

        {loadingVideos ? (
          <div className="py-10 text-center text-white/60">Loading videos...</div>
        ) : videoError ? (
          <div className="py-10 text-center text-rose-300">{videoError}</div>
        ) : videos.length === 0 ? (
          <div className="py-10 text-center text-white/60">No videos uploaded yet.</div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => {
              const status = video?.storyboard?.status || 'none';
              const isRetrying = retryingIds.includes(video._id);
              const isToggling = togglingPublishIds.includes(video._id);
              const isDeleting = deletingIds.includes(video._id);
              return (
                <div key={video._id} className="border border-white/10 bg-white/[0.03] rounded-xl p-4 flex gap-4 items-start">
                  <img
                    src={video.thumbnail || '/placeholder.png'}
                    alt={video.title}
                    className="w-44 h-24 object-cover rounded-lg border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <Link to={`/watch/${video._id}`} className="font-semibold text-white hover:text-[#00F0FF] line-clamp-1 transition">
                      {video.title}
                    </Link>
                    <p className="text-sm text-white/60 mt-1">
                      {Number(video.views || 0).toLocaleString()} views
                    </p>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs border px-2 py-1 rounded-full ${
                          video?.isPublished
                            ? 'bg-[#39FF14]/15 text-[#39FF14] border-[#39FF14]/40'
                            : 'bg-white/10 text-white/75 border-white/20'
                        }`}
                      >
                        {video?.isPublished ? 'visibility: public' : 'visibility: private'}
                      </span>
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
                        className="text-xs px-2 py-1 rounded border border-white/20 text-white/85 hover:bg-white/10 transition"
                      >
                        Refresh Status
                      </button>

                      {(status === 'failed' || status === 'none') && (
                        <button
                          type="button"
                          onClick={() => handleRetryStoryboard(video._id)}
                          disabled={isRetrying}
                          className="text-xs px-2 py-1 rounded bg-[#00F0FF] text-black hover:brightness-110 disabled:opacity-60 transition"
                        >
                          {isRetrying ? 'Queueing...' : 'Retry Storyboard'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleTogglePublish(video._id)}
                        disabled={isToggling || isDeleting}
                        className="text-xs px-2 py-1 rounded border border-[#00F0FF]/45 text-[#00F0FF] hover:bg-[#00F0FF]/10 disabled:opacity-60 transition"
                      >
                        {isToggling
                          ? 'Updating...'
                          : video?.isPublished
                            ? 'Make Private'
                            : 'Make Public'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteVideo(video._id, video.title)}
                        disabled={isDeleting || isToggling}
                        className="text-xs px-2 py-1 rounded border border-rose-300/50 text-rose-300 hover:bg-rose-500/10 disabled:opacity-60 transition"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>

                      {status === 'ready' && video?.storyboard?.vttUrl && (
                        <a
                          href={video.storyboard.vttUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-2 py-1 rounded border border-emerald-300/50 text-emerald-300 hover:bg-emerald-500/10 transition"
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
    </section>
  );
}
