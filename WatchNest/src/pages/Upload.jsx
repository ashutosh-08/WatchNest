import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoService } from '../services/api.service';

export default function Upload() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoFile: null,
    thumbnail: null,
    isPublished: true,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.videoFile) {
      setError('Video file is required');
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('videoFile', formData.videoFile);
      if (formData.thumbnail) data.append('thumbnail', formData.thumbnail);
      data.append('isPublished', formData.isPublished);

      const response = await videoService.uploadVideo(data);
      navigate(`/watch/${response.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-[#1C2128]/95 border border-white/10 rounded-lg shadow-[0_20px_45px_rgba(0,0,0,0.35)] p-8 text-white">
        <h1 className="text-3xl font-bold mb-8">Upload Video</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Video Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="What's your video about?"
              maxLength={100}
              className="w-full px-4 py-2 border border-white/15 bg-[#0f141a] text-white placeholder:text-white/45 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
            />
            <p className="text-xs text-white/55 mt-1">{formData.title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell viewers about your video"
              maxLength={5000}
              rows={5}
              className="w-full px-4 py-2 border border-white/15 bg-[#0f141a] text-white placeholder:text-white/45 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00F0FF] resize-none"
            />
            <p className="text-xs text-white/55 mt-1">{formData.description.length}/5000</p>
          </div>

          {/* Video File */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Video File *</label>
            <div
              onClick={() => videoInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 bg-[#0f141a] rounded-lg p-8 text-center cursor-pointer hover:border-[#00F0FF] transition"
            >
              {formData.videoFile ? (
                <div>
                  <svg className="w-12 h-12 mx-auto text-green-500 mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium">{formData.videoFile.name}</p>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 mx-auto text-white/45 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-sm font-medium">Click to upload video</p>
                  <p className="text-xs text-white/55 mt-1">MP4, WebM, or Ogg (Max 1GB)</p>
                </div>
              )}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              name="videoFile"
              onChange={handleChange}
              accept="video/*"
              className="hidden"
            />
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">Thumbnail</label>
            <div
              onClick={() => thumbnailInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 bg-[#0f141a] rounded-lg p-8 text-center cursor-pointer hover:border-[#00F0FF] transition"
            >
              {formData.thumbnail ? (
                <div>
                  <img
                    src={URL.createObjectURL(formData.thumbnail)}
                    alt="Thumbnail"
                    className="w-24 h-24 object-cover rounded mx-auto mb-2"
                  />
                  <p className="text-sm font-medium">{formData.thumbnail.name}</p>
                </div>
              ) : (
                <div>
                  <svg className="w-12 h-12 mx-auto text-white/45 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Click to upload thumbnail</p>
                  <p className="text-xs text-white/55 mt-1">JPG, PNG (1280x720)</p>
                </div>
              )}
            </div>
            <input
              ref={thumbnailInputRef}
              type="file"
              name="thumbnail"
              onChange={handleChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Publish Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              className="w-4 h-4 text-[#39FF14] rounded focus:ring-2 focus:ring-[#00F0FF]"
            />
            <label htmlFor="isPublished" className="text-sm font-medium text-white/90">
              Publish immediately
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-[#39FF14] text-black py-2 rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 bg-white/10 text-white py-2 rounded-lg font-medium hover:bg-white/15 transition border border-white/15"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
