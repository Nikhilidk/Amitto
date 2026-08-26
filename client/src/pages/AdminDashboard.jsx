import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, lostItems: 0, foundItems: 0, resolvedItems: 0 });
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('items');

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await axios.get('http://localhost:5000/api/admin/stats', authHeader);
        const itemsRes = await axios.get('http://localhost:5000/api/admin/items', authHeader);
        const usersRes = await axios.get('http://localhost:5000/api/admin/users', authHeader);
        setStats(statsRes.data);
        setItems(itemsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        alert('Failed to load admin data.');
      }
    };
    fetchData();
  }, []);

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/items/${id}`, authHeader);
      setItems(items.filter(item => item._id !== id));
    } catch (err) {
      alert('Error deleting item');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Ban/Remove this user?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, authHeader);
      setUsers(users.filter(user => user._id !== id));
    } catch (err) {
      alert('Error removing user');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Amitto Admin Control Panel</h1>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', margin: '2rem 0' }}>
        <div style={cardStyle}>Total Users <h3>{stats.totalUsers}</h3></div>
        <div style={cardStyle}>Active Lost Reports <h3>{stats.lostItems}</h3></div>
        <div style={cardStyle}>Active Found Items <h3>{stats.foundItems}</h3></div>
        <div style={cardStyle}>Resolved Items <h3>{stats.resolvedItems}</h3></div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setActiveTab('items')} style={tabStyle(activeTab === 'items')}>
          Item Moderation
        </button>
        <button onClick={() => setActiveTab('users')} style={tabStyle(activeTab === 'users')}>
          User Management
        </button>
      </div>

      {/* Item Table */}
      {activeTab === 'items' && (
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              <th style={cellStyle}>Title</th>
              <th style={cellStyle}>Type</th>
              <th style={cellStyle}>Posted By</th>
              <th style={cellStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item._id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={cellStyle}>{item.title}</td>
                <td style={cellStyle}>{item.type.toUpperCase()}</td>
                <td style={cellStyle}>{item.userId?.name || 'Unknown'}</td>
                <td style={cellStyle}>
                  <button onClick={() => handleDeleteItem(item._id)} style={btnStyle('#dc3545')}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* User Table */}
      {activeTab === 'users' && (
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              <th style={cellStyle}>Name</th>
              <th style={cellStyle}>Email</th>
              <th style={cellStyle}>Role</th>
              <th style={cellStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={cellStyle}>{user.name}</td>
                <td style={cellStyle}>{user.email}</td>
                <td style={cellStyle}>{user.role}</td>
                <td style={cellStyle}>
                  {user.role !== 'admin' && (
                    <button onClick={() => handleDeleteUser(user._id)} style={btnStyle('#dc3545')}>
                      Remove User
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const cardStyle = { padding: '1rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const cellStyle = { padding: '0.75rem', textAlign: 'left' };
const btnStyle = (bg) => ({ background: bg, color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' });
const tabStyle = (active) => ({ padding: '0.5rem 1rem', marginRight: '0.5rem', background: active ? '#0d6efd' : '#e9ecef', color: active ? '#fff' : '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' });