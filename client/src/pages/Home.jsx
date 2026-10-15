import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPosts, getFriendlyErrorMessage } from '../api/apiService';
import { CATEGORIES, CAMPUS_ZONES } from '../constants';
import PostCard from '../components/PostCard';

export default function Home() {
  // Filter States
  const [type, setType] = useState('all'); // 'all' | 'lost' | 'found'
  const [category, setCategory] = useState('');
  const [campusZone, setCampusZone] = useState('');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Data & UI States
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Debounce Search Input (350ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchText]);

  // 2. Server-side Fetch whenever any filter or debounced search changes
  useEffect(() => {
    fetchFilteredPosts();
  }, [type, category, campusZone, debouncedSearch]);

  const fetchFilteredPosts = async () => {
    setLoading(true);
    setError('');

    try {
      // Pass undefined for 'all' or empty strings so the backend doesn't filter by them
      const queryParams = {
        type: type === 'all' ? undefined : type,
        category: category === 'all' || !category ? undefined : category,
        campusZone: campusZone === 'all' || !campusZone ? undefined : campusZone,
        q: debouncedSearch.trim() || undefined
      };

      const data = await getPosts(queryParams);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching filtered posts:', err);
      setError(getFriendlyErrorMessage(err));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // 3. Clear All Filters
  const handleClearFilters = () => {
    setType('all');
    setCategory('');
    setCampusZone('');
    setSearchText('');
    setDebouncedSearch('');
  };

  const hasActiveFilters = type !== 'all' || category !== '' || campusZone !== '' || searchText !== '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero / Header Section */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Lost & Found Community Feed
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Search, report, and recover missing items across campus with real-time community verification.
        </p>
      </div>

      {/* Filter & Search Bar Container */}
      <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl p-5 shadow-lg space-y-4">
        
        {/* Top Row: Type Tabs & Search Input */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Lost / Found / All Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-700/60 self-start md:self-auto">
            {['all', 'lost', 'found'].map((tab) => (
              <button
                key={tab}
                onClick={() => setType(tab)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold capitalize transition ${
                  type === tab
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'all' ? 'All Items' : `${tab} Items`}
              </button>
            ))}
          </div>

          {/* Search Box with Debouncing */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by title, description or keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white text-xs"
                title="Clear search text"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: Category & Campus Zone Dropdowns + Clear Filter Action */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-700/50">
          
          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="categorySelect" className="text-xs font-semibold text-slate-400 whitespace-nowrap">
              Category:
            </label>
            <select
              id="categorySelect"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition capitalize"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Campus Zone Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="zoneSelect" className="text-xs font-semibold text-slate-400 whitespace-nowrap">
              Campus Zone:
            </label>
            <select
              id="zoneSelect"
              value={campusZone}
              onChange={(e) => setCampusZone(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition capitalize"
            >
              <option value="">All Campus Zones</option>
              {CAMPUS_ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button (Visible when filters are active) */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline transition flex items-center gap-1"
            >
              <span>↺</span> Clear Filters
            </button>
          )}
        </div>

      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={fetchFilteredPosts} className="underline text-xs hover:text-white font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <div className="w-9 h-9 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Filtering community items...</p>
        </div>
      ) : posts.length === 0 ? (
        
        /* Empty State with Clear Filters Button */
        <div className="text-center py-16 bg-slate-800/40 border border-dashed border-slate-700/60 rounded-2xl space-y-3 px-4">
          <p className="text-4xl">🔍</p>
          <h3 className="text-lg font-bold text-white">No posts match your filters</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            We couldn't find any items matching your active search keywords or dropdown filters. Try broadening your criteria.
          </p>
          <div className="pt-2">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-md transition"
            >
              Clear All Filters
            </button>
          </div>
        </div>

      ) : (
        
        /* Posts Grid with Link to /posts/:id */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <Link
              to={`/posts/${post._id}`}
              key={post._id}
              className="block group focus:outline-none"
            >
              <PostCard post={post} />
            </Link>
          ))}
        </div>

      )}

    </div>
  );
}