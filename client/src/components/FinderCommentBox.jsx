import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createComment, withdrawComment, getCommentError } from '../api/apiService.js';

const MAX_LENGTH = 500;

export default function FinderCommentBox({ postId, comment, canComment, onCreated, onWithdrawn, onRefresh }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Please describe what you found.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const created = await createComment(postId, trimmed);
      setText('');
      onCreated(created);
    } catch (err) {
      const { status, message } = getCommentError(err);
      setError(message);
      if (status === 409) onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    setBusy(true);
    setError('');
    try {
      await withdrawComment(comment._id);
      onWithdrawn(comment._id);
    } catch (err) {
      const { status, message } = getCommentError(err);
      setError(message);
      if (status === 409) onRefresh();
    } finally {
      setBusy(false);
    }
  };

  // If already commented: replace box with status
  if (comment) {
    const convoId = comment.conversation?._id || comment.conversation;
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Your comment</p>
        <p className="text-sm text-gray-800 whitespace-pre-line">{comment.text}</p>

        {comment.status === 'pending' && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-yellow-700">Waiting for the owner’s response</p>
            {canComment && (
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={busy}
                className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? 'Withdrawing...' : 'Withdraw'}
              </button>
            )}
          </div>
        )}

        {comment.status === 'accepted' && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-green-700">The owner accepted your comment.</p>
            <Link
              to={convoId ? `/messages/${convoId}` : '/messages'}
              className="text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
            >
              💬 Open chat
            </Link>
          </div>
        )}

        {comment.status === 'declined' && (
          <p className="text-sm text-gray-500">The poster didn’t accept this comment.</p>
        )}

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
    );
  }

  if (!canComment) return null;

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">I found this</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={MAX_LENGTH}
        rows={4}
        disabled={busy}
        placeholder="Describe what you found and where."
        className="w-full px-4 py-2.5 rounded-lg text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 resize-none"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          Describe what you found and where. The owner will decide whether to chat with you.
        </p>
        <span className="text-xs text-gray-400 shrink-0">{text.length}/{MAX_LENGTH}</span>
      </div>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <button
        type="submit"
        disabled={busy || !text.trim()}
        className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        {busy ? 'Posting...' : 'Post comment'}
      </button>
    </form>
  );
}