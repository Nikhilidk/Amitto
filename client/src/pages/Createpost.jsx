import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path based on your folder structure

const CAMPUS_ZONES = [
  'unspecified',
  'Library',
  'Cafeteria',
  'Science Block',
  'Academic Block A',
  'Academic Block B',
  'Hostel Zone',
  'Sports Complex',
  'Auditorium',
  'Main Gate / Parking',
];

const CATEGORIES = [
  { value: 'other', label: 'Other / General' },
  { value: 'electronics', label: 'Electronics (Phones, Laptops, Earphones)' },
  { value: 'wallet_id', label: 'Wallets, Purses & IDs' },
  { value: 'keys', label: 'Keys & Keychains' },
  { value: 'documents', label: 'Documents & Notebooks' },
  { value: 'clothing', label: 'Clothing & Accessories' },
  { value: 'bags', label: 'Bags & Backpacks' },
];

export default function CreatePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract auth state
  const { user, isVerified, token } = useAuth();

  // Determine verification status (checks isVerified or falls back to user object)
  const userIsVerified = Boolean(
    isVerified ?? (user?.verificationStatus === 'approved')
  );

  // Form states
  const initialType = searchParams.get('type') === 'found' ? 'found' : 'lost';
  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [campusZone, setCampusZone] = useState('unspecified');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle Photo selection & Preview
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (e.g. 5MB max) and image type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file (JPG, PNG, WebP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size should not exceed 5MB.');
        return;
      }

      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  // Clean up object URL memory on unmount
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Safety verification check
    if (!userIsVerified) {
      setErrorMessage('Verification required. Your account must be approved before publishing a post.');
      return;
    }

    if (!type || !title.trim() || !description.trim() || !photo) {
      setErrorMessage('Please fill in all required fields (Type, Title, Description, and Photo).');
      return;
    }

    try {
      setIsSubmitting(true);

      // Create multipart FormData to match upload.single('photo') on the backend
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('campusZone', campusZone);
      formData.append('photo', photo); // Key matches backend: upload.single('photo')

      // Retrieve auth token from context or fallback to localStorage
      const authToken = token || localStorage.getItem('token');

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          // Note: DO NOT set Content-Type header manually when sending FormData
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      setSuccessMessage('Post created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage(err.message || 'Something went wrong while publishing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Back navigation */}
        <Link
          to="/"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition"
        >
          &larr; Back to Home Feed
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          
          {/* Header */}
          <div className="mb-6 border-b border-slate-100 pb-5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Create a Lost or Found Post
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Provide clear details and an image to help identify the item on campus.
            </p>
          </div>

          {/* Unverified User Alert Banner */}
          {!userIsVerified && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Account Verification Pending
                </h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  You can browse and prepare your post, but <strong>submission is disabled</strong> until your student or campus account is approved by an administrator.
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <span>✅</span> {successMessage}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
              <span>❌</span> {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Post Type Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Post Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('lost')}
                  className={`py-3 px-4 rounded-xl font-bold text-sm border-2 transition flex items-center justify-center gap-2 ${
                    type === 'lost'
                      ? 'border-rose-600 bg-rose-50 text-rose-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-rose-600"></span>
                  I Lost An Item
                </button>
                <button
                  type="button"
                  onClick={() => setType('found')}
                  className={`py-3 px-4 rounded-xl font-bold text-sm border-2 transition flex items-center justify-center gap-2 ${
                    type === 'found'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  I Found An Item
                </button>
              </div>
            </div>

            {/* 2. Title / Subject */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Subject / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Blue Dell 65W Laptop Charger, Black Leather Wallet"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 focus:bg-white"
              />
            </div>

            {/* 3. Category and Campus Zone (Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 focus:bg-white capitalize"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campus Zone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Campus Zone / Location
                </label>
                <select
                  value={campusZone}
                  onChange={(e) => setCampusZone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 focus:bg-white"
                >
                  {CAMPUS_ZONES.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone === 'unspecified' ? 'Unspecified Zone' : zone}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Mention distinctive markings, brand, exact area where lost/found, or instructions on how to reclaim..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 focus:bg-white"
              />
            </div>

            {/* 5. Photo Upload with Preview */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Item Photo <span className="text-rose-500">*</span>
              </label>

              {!photoPreview ? (
                <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition">
                  <span className="text-3xl mb-2">📷</span>
                  <span className="text-sm font-semibold text-slate-700">
                    Click to upload a clear photo
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    PNG, JPG, or WebP up to 5MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    required
                  />
                </label>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-w-sm mx-auto">
                  <img
                    src={photoPreview}
                    alt="Uploaded preview"
                    className="w-full h-56 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-2 text-xs font-bold shadow-md transition"
                    title="Remove Photo"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>

            {/* 6. Submit Button */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={!userIsVerified || isSubmitting}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                  !userIsVerified
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : isSubmitting
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-600/30 transform hover:-translate-y-0.5'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin text-base">⏳</span>
                    Uploading Photo & Publishing...
                  </>
                ) : !userIsVerified ? (
                  '🔒 Account Verification Required to Submit'
                ) : (
                  '🚀 Publish Post'
                )}
              </button>
              
              {!userIsVerified && (
                <p className="text-center text-xs text-slate-400 mt-2">
                  Once an admin approves your profile, this button will unlock automatically.
                </p>
              )}
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}