import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createPost, getFriendlyErrorMessage } from '../api/apiService.js';
import { CATEGORIES, CAMPUS_ZONES } from '../constants.js';

// Mirror the backend limits for found posts
const QUESTION_MIN = 5;
const QUESTION_MAX = 200;
const ANSWER_MAX = 100;

export default function CreatePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { user, isVerified } = useAuth();

  const userIsVerified = Boolean(
    isVerified ?? (user?.verificationStatus === 'approved')
  );

  const initialType = searchParams.get('type') === 'found' ? 'found' : 'lost';
  const [type, setType] = useState(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [campusZone, setCampusZone] = useState('unspecified');
  const [claimQuestion, setClaimQuestion] = useState('');
  const [claimAnswer, setClaimAnswer] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
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

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!userIsVerified) {
      setErrorMessage('Verification required. Your account must be approved before publishing a post.');
      return;
    }

    if (!type || !title.trim() || !description.trim() || !photo) {
      setErrorMessage('Please fill in all required fields (Type, Title, Description, and Photo).');
      return;
    }

    const question = claimQuestion.trim();
    const answer = claimAnswer.trim();

    if (type === 'found') {
      if (question.length < QUESTION_MIN || question.length > QUESTION_MAX) {
        setErrorMessage(`Verification question must be ${QUESTION_MIN}–${QUESTION_MAX} characters.`);
        return;
      }
      if (!answer || answer.length > ANSWER_MAX) {
        setErrorMessage(`Answer is required and must be at most ${ANSWER_MAX} characters.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      await createPost({
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        campusZone,
        // Only sent for found posts
        claimQuestion: type === 'found' ? question : undefined,
        claimAnswer: type === 'found' ? answer : undefined,
        photoFile: photo,
      });

      setSuccessMessage('Post created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        <Link
          to="/"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition"
        >
          &larr; Back to Home Feed
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">

          <div className="mb-6 border-b border-slate-100 pb-5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Create a Lost or Found Post
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Provide clear details and an image to help identify the item on campus.
            </p>
          </div>

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

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <span>✅</span> {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
              <span>❌</span> {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Found posts only: verification question + answer */}
            {type === 'found' && (
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4">
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Something only the real owner would know, like a brand, a color or a sticker.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Verification question <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. What sticker is on the back of the laptop?"
                    value={claimQuestion}
                    onChange={(e) => setClaimQuestion(e.target.value)}
                    maxLength={QUESTION_MAX}
                    minLength={QUESTION_MIN}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 text-right">
                    {claimQuestion.trim().length}/{QUESTION_MAX} (min {QUESTION_MIN})
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Answer <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="The correct answer to your question"
                    value={claimAnswer}
                    onChange={(e) => setClaimAnswer(e.target.value)}
                    maxLength={ANSWER_MAX}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1 text-right">
                    {claimAnswer.trim().length}/{ANSWER_MAX}
                  </p>
                </div>
              </div>
            )}

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
                  'Publish Post'
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