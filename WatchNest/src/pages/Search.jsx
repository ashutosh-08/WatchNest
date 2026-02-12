import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { videoService } from '../services/api.service';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setVideos([]);
        setLoading(false);
        return;
      }

      try {
        const res = await videoService.searchVideos(query);
        const payload = res?.data?.data;
        const list = Array.isArray(payload) ? payload : payload?.videos;
        setVideos(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Search failed:', err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const formatViews = (views) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Search results for "<span className="text-indigo-600">{query}</span>"
      </h1>

      {loading ? (
        <div className="flex justify-center items-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-slate-700">No videos found</h3>
          <p className="text-slate-500 mt-2">Try searching for something else</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Link to={`/watch/${video._id}`} key={video._id} className="group">
              <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden mb-3">
                <img
                  src={video.thumbnail || '/placeholder.png'}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              </div>
              <h3 className="font-medium line-clamp-2 group-hover:text-indigo-600">{video.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{video.owner?.fullName || 'Unknown'}</p>
              <p className="text-sm text-slate-500">{formatViews(video.views)} views</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
