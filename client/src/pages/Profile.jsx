import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getMyProfile, getMyPosts, updatePostStatus, updateProfilePhoto } from '../api/apiService';
import DeleteButton from '../components/DeleteButton.jsx';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfileAndPosts();
  }, []);

  const fetchProfileAndPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const [userData, userPostsData] = await Promise.all([
        getMyProfile(),
        getMyPosts()
      ]);
      setUser(userData);
      setPosts(userPostsData);
    } catch (err) {
      console.error("Profile loading error:", err);
      setError(err.response?.data?.error || err.message || "Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (postId, newStatus) => {
    try {
      await updatePostStatus(postId, newStatus);
      showAlert(`Post status updated to ${newStatus.toUpperCase()}`, 'success');
      const updatedPosts = await getMyPosts();
      setPosts(updatedPosts);
    } catch (err) {
      showAlert("Failed to update status. Please try again.", "error");
    }
  };

  // Called by <DeleteButton> after the server confirms the delete.
  // Stats and tab counts are derived from `posts`, so they update automatically.
  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    showAlert('Post deleted', 'success');
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const result = await updateProfilePhoto(file);
      setUser(result.user);
      showAlert('Profile photo updated', 'success');
    } catch (err) {
      showAlert(err.response?.data?.error || 'Failed to update photo. Please try again.', 'error');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'success' }), 3000);
  };

  const getFilteredPosts = () => {
    if (activeTab === 'lost') return posts.filter(p => p.type === 'lost');
    if (activeTab === 'found') return posts.filter(p => p.type === 'found');
    if (activeTab === 'active') return posts.filter(p => p.status === 'active');
    if (activeTab === 'claim_pending') return posts.filter(p => p.status === 'claim_pending');
    if (activeTab === 'resolved') return posts.filter(p => p.status === 'resolved');
    return posts;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading your profile & items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-lg font-semibold text-red-600 mb-2">⚠️ Error Loading Profile</h2>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button
          onClick={fetchProfileAndPosts}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const filteredPosts = getFilteredPosts();
  const activeCount = posts.filter(p => p.status === 'active').length;
  const pendingCount = posts.filter(p => p.status === 'claim_pending').length;
  const resolvedCount = posts.filter(p => p.status === 'resolved').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* Toast Alert */}
      {alert.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            alert.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {alert.message}
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Gradient banner */}
        <div className="h-28 bg-gradient-to-r from-blue-100 via-indigo-100 to-amber-50" />

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {/* Avatar, overlapping the banner */}
            <button
              type="button"
              onClick={handlePhotoClick}
              disabled={uploadingPhoto}
              className="relative shrink-0 rounded-full ring-4 ring-white disabled:cursor-wait"
              title="Click to change profile photo"
            >
              <img
                src={user?.photoUrl || "https://placehold.net/avatar.svg"}
                alt={user?.name || "User Avatar"}
                className={`w-24 h-24 rounded-full object-cover ${uploadingPhoto ? 'opacity-50' : ''}`}
              />
              {uploadingPhoto ? (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white bg-black/30 rounded-full">
                  Uploading...
                </span>
              ) : (
                <span className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs shadow">
                  ✎
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg"
              onChange={handlePhotoChange}
              className="hidden"
            />

            {/* Name + email + verification */}
            <div className="flex-1 pt-2 sm:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    user?.verificationStatus === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : user?.verificationStatus === 'rejected'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {(user?.verificationStatus || 'pending').toUpperCase()}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-0.5">✉️ {user?.email}</p>
            </div>

            {/* Trust score + member since */}
            <div className="flex flex-col items-start sm:items-end gap-1 pt-2 sm:pt-0">
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                <span>⭐</span>
                <span>Trust Score: {user?.trustScore ?? 100} / 100</span>
              </div>
              <span className="text-gray-400 text-xs">
                📅 Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Posts', value: posts.length, icon: '📊' },
          { label: 'Active Items', value: activeCount, icon: '🟢' },
          { label: 'Pending Claims', value: pendingCount, icon: '⏳' },
          { label: 'Resolved', value: resolvedCount, icon: '✅' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="text-2xl">{stat.icon}</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-none">{stat.value}</h3>
              <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-800">My Reported Items ({filteredPosts.length})</h2>
        <div className="flex flex-wrap gap-2">
          {['all', 'lost', 'found', 'active', 'claim_pending', 'resolved'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-12 text-center text-gray-400 text-sm">
          📋 No {activeTab === 'all' ? '' : activeTab} posts found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => (
            <div key={post._id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative">
                <Link to={`/posts/${post._id}`}>
                  <img src={post.photoUrl} alt={post.title} className="w-full h-40 object-cover" />
                </Link>
                <span
                  className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                    post.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {post.type}
                </span>
                <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase bg-white/90 text-gray-700">
                  {post.status.replace('_', ' ')}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm">
                  <Link to={`/posts/${post._id}`} className="hover:underline">{post.title}</Link>
                </h3>
                <p className="text-gray-500 text-xs mt-1 line-clamp-2">{post.description}</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">📂 {post.category || 'Other'}</span>
                  <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">📍 {post.campusZone || 'Unspecified'}</span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-gray-400 text-[11px]">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>

                  <div className="flex items-center gap-2">
                    {post.status !== 'resolved' ? (
                      <button
                        onClick={() => handleStatusChange(post._id, 'resolved')}
                        className="text-xs font-medium bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
                      >
                        ✓ Mark Resolved
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(post._id, 'active')}
                        className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition"
                      >
                        ↺ Re-open
                      </button>
                    )}

                    <DeleteButton
                      post={post}
                      className="text-xs px-3 py-1.5"
                      onDeleted={() => handlePostDeleted(post._id)}
                      onError={(message) => showAlert(message, 'error')}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}