import api from '../utils/api';

// Video Service
export const videoService = {
  getAllVideos: (page = 1, limit = 12) =>
    api.get('/videos', { params: { page, limit } }),

  getVideoById: (videoId) =>
    api.get(`/videos/${videoId}`),

  uploadVideo: (formData) =>
    api.post('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateVideo: (videoId, data) =>
    api.patch(`/videos/${videoId}/update`, data),

  deleteVideo: (videoId) =>
    api.delete(`/videos/${videoId}/delete`),

  togglePublishStatus: (videoId) =>
    api.patch(`/videos/${videoId}/toggle-publish`),

  getUserVideos: (page = 1, limit = 10) =>
    api.get('/videos/my-videos', { params: { page, limit } }),

  incrementViews: (videoId) =>
    api.post(`/videos/${videoId}/views`),

  searchVideos: (query, page = 1) =>
    api.get('/videos', { params: { query, page } }),
};

// Comment Service
export const commentService = {
  getVideoComments: (videoId) =>
    api.get(`/comments/${videoId}`),

  addComment: (videoId, content) =>
    api.post(`/comments/${videoId}/add`, { content }),

  updateComment: (commentId, content) =>
    api.patch(`/comments/${commentId}/update`, { content }),

  deleteComment: (commentId) =>
    api.delete(`/comments/${commentId}/delete`),
};

// Like Service
export const likeService = {
  toggleVideoLike: (videoId) =>
    api.patch(`/likes/toggle/v/${videoId}`),

  toggleCommentLike: (commentId) =>
    api.patch(`/likes/toggle/c/${commentId}`),

  getUserLikes: () =>
    api.get('/likes/user'),
};

// Subscription Service
export const subscriptionService = {
  toggleSubscription: (channelId) =>
    api.patch(`/subscriptions/c/${channelId}`),

  getChannelSubscribers: (channelId) =>
    api.get(`/subscriptions/c/${channelId}/subscribers`),

  getSubscribedChannels: (userId) =>
    api.get(`/subscriptions/u/${userId}/subscribed`),
};

// Playlist Service
export const playlistService = {
  createPlaylist: (name, description) =>
    api.post('/playlists', { name, description }),

  updatePlaylist: (playlistId, name, description) =>
    api.patch(`/playlists/${playlistId}`, { name, description }),

  deletePlaylist: (playlistId) =>
    api.delete(`/playlists/${playlistId}`),

  addVideoToPlaylist: (playlistId, videoId) =>
    api.patch(`/playlists/add/${videoId}/${playlistId}`),

  removeVideoFromPlaylist: (playlistId, videoId) =>
    api.patch(`/playlists/remove/${videoId}/${playlistId}`),

  getUserPlaylists: (userId) =>
    api.get(`/playlists/user/${userId}`),

  getPlaylistById: (playlistId) =>
    api.get(`/playlists/${playlistId}`),
};

export default {
  videoService,
  commentService,
  likeService,
  subscriptionService,
  playlistService,
};
