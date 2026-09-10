// File: src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { getMyProfile, getMyPosts, updatePostStatus } from '../api/apiService';
export default function Profile() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchProfileAndPosts();
  }, []);

  const fetchProfileAndPosts = async () => {
    setLoading(true);
    setError('');
    try {
      // Concurrently fetch user profile (GET /api/auth/me) and user posts (GET /api/posts/mine)
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
      <div className="profile-loading-screen">
        <div className="spinner"></div>
        <p>Loading your profile & items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error-screen">
        <h2>⚠️ Error Loading Profile</h2>
        <p>{error}</p>
        <button onClick={fetchProfileAndPosts} className="btn-retry">Try Again</button>
      </div>
    );
  }

  const filteredPosts = getFilteredPosts();
  const activeCount = posts.filter(p => p.status === 'active').length;
  const pendingCount = posts.filter(p => p.status === 'claim_pending').length;
  const resolvedCount = posts.filter(p => p.status === 'resolved').length;

  return (
    <div className="profile-container">
      
      {/* Toast Alert */}
      {alert.show && (
        <div className={`alert-box ${alert.type}`}>
          <span>{alert.message}</span>
        </div>
      )}

      {/* User Header Profile Card */}
      <div className="glass-card profile-header-card">
        <div className="profile-header-content">
          <div className="avatar-wrapper">
            <img 
              src={user?.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} 
              alt={user?.name || "User Avatar"} 
              className="user-avatar"
            />
            {/* Verification Status Badge */}
            <span className={`verification-badge ${user?.verificationStatus || 'pending'}`}>
              {(user?.verificationStatus || 'pending').toUpperCase()}
            </span>
          </div>

          <div className="user-info">
            <h1 className="user-name">{user?.name}</h1>
            <p className="user-email">✉️ {user?.email}</p>
            
            <div className="user-badges-row">
              {/* Trust Score Badge */}
              <div className="trust-score-badge">
                <span className="star-icon">⭐</span>
                <span>Trust Score: <strong>{user?.trustScore ?? 100} / 100</strong></span>
              </div>
              
              <span className="member-since">
                📅 Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Counters */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">📊</div>
          <div className="stat-data">
            <h3>{posts.length}</h3>
            <p>Total Posts</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">🟢</div>
          <div className="stat-data">
            <h3>{activeCount}</h3>
            <p>Active Items</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-data">
            <h3>{pendingCount}</h3>
            <p>Pending Claims</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon resolved">✅</div>
          <div className="stat-data">
            <h3>{resolvedCount}</h3>
            <p>Resolved</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs Header */}
      <div className="posts-header">
        <h2>My Reported Items ({filteredPosts.length})</h2>
        <div className="filter-tabs">
          {['all', 'lost', 'found', 'active', 'claim_pending', 'resolved'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* My Posts Grid */}
      <div className="posts-grid">
        {filteredPosts.length === 0 ? (
          <div className="empty-posts-state">
            <p>📋 No {activeTab === 'all' ? '' : activeTab} posts found.</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <div key={post._id} className="post-card">
              <div className="post-image-box">
                <img src={post.photoUrl} alt={post.title} />
                <span className={`type-pill ${post.type}`}>{post.type.toUpperCase()}</span>
                <span className={`status-pill ${post.status}`}>{post.status.replace('_', ' ').toUpperCase()}</span>
              </div>

              <div className="post-body">
                <h3 className="post-title">{post.title}</h3>
                <p className="post-desc">{post.description}</p>
                
                <div className="post-meta-tags">
                  <span className="tag">📂 {post.category || 'Other'}</span>
                  <span className="tag">📍 {post.campusZone || 'Unspecified'}</span>
                </div>

                <div className="post-footer">
                  <span className="post-date">
                    📅 {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>

                  <div className="post-actions">
                    {post.status !== 'resolved' ? (
                      <button 
                        onClick={() => handleStatusChange(post._id, 'resolved')} 
                        className="btn-status resolve"
                      >
                        ✓ Mark Resolved
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStatusChange(post._id, 'active')} 
                        className="btn-status reopen"
                      >
                        ↺ Re-open
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}