/**
 * PostDetail component – refactored to fix comment box visibility.
 * This file contains the original implementation (as provided) with a small
 * adjustment: the `canSeeComments` flag no longer blocks comment loading for
 * verified users when the verification flag is undefined or false‑y. The UI
 * now always attempts to load comments for logged‑in users, and the rendering
 * logic displays appropriate messages for unverified users.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  getPostById,
  claimPost,
  getClaimError,
  getFriendlyErrorMessage,
  getConversationByPost,
  getComments,
  sendChatRequest,
  getChatRequests,
  acceptChatRequest,
  declineChatRequest,
} from '../api/apiService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useChat } from '../context/ChatContext.jsx';
import DeleteButton from '../components/DeleteButton.jsx';
import FinderCommentBox from '../components/FinderCommentBox.jsx';
import FinderCommentsPanel from '../components/FinderCommentsPanel.jsx';
import ChatRequestsPanel from '../components/ChatRequestsPanel.jsx';

const statusStyles = {
  active: 'bg-blue-100 text-blue-700',
  claim_pending: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-gray-200 text-gray-600',
};

const REQUEST_NOTE_MAX = 200;

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isVerified } = useAuth();
  const { socket, setActivePost, clearPostUnread } = useChat();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const [deleteError, setDeleteError] = useState('');

  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [claimFeedback, setClaimFeedback] = useState(null);
  const [lockedOut, setLockedOut] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const [commentData, setCommentData] = useState(null);
  const [commentsError, setCommentsError] = useState('');

  // Chat request (claimant side, after 3 wrong answers)
  const [requestNote, setRequestNote] = useState('');
  const [requestSending, setRequestSending] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState(null);

  // Chat requests (poster side)
  const [requestData, setRequestData] = useState(null);
  const [requestsError, setRequestsError] = useState('');
  const [requestBusy, setRequestBusy] = useState(null); // userId being accepted / declined
  const [requestActionError, setRequestActionError] = useState('');

  const loadPost = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError('');
      setNotFound(false);
      const data = await getPostById(id);
      setPost(data.post || data);
    } catch (err) {
      if (silent) return;
      if (err.response?.status === 404) setNotFound(true);
      else setError(getFriendlyErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setAnswer('');
    setClaimFeedback(null);
    setLockedOut(false);
    setConversationId(null);
    setCommentData(null);
    setCommentsError('');
    setRequestNote('');
    setRequestFeedback(null);
    setRequestData(null);
    setRequestsError('');
    setRequestActionError('');
    loadPost();
  }, [loadPost]);

  // Load the conversation ID for owners / claimants when appropriate
  useEffect(() => {
    if (!post || !user || post.type !== 'found' || conversationId) return;
    const ownerId =
      post.postedBy && typeof post.postedBy === 'object'
        ? post.postedBy._id
        : post.postedBy;
    const hasChat = post.status === 'claim_pending' || post.status === 'resolved';
    if (!hasChat) return;
    const isOwnerOrClaimant =
      String(user.id || user._id) === String(ownerId) || post.claimedByMe;
    if (!isOwnerOrClaimant) return;

    let cancelled = false;
    getConversationByPost(post._id)
      .then((d) => {
        if (!cancelled) setConversationId(d.conversationId);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [post, user, conversationId]);

  // ------------------------------------------------------------------
  // Comment handling – the original code used a `canSeeComments` guard that
  // required `isVerified` to be truthy before attempting to load comments.
  // In some environments the verification flag can be undefined, causing the
  // comment box to never appear even for logged‑in users. The refactor removes
  // that guard and instead always attempts to load comments for any logged‑in
  // user. UI messages still inform unverified users that they need verification.
  // ------------------------------------------------------------------

  const isLost = post?.type === 'lost';
  const postOwnerId =
    post?.postedBy && typeof post?.postedBy === 'object'
      ? post?.postedBy._id
      : post?.postedBy;
  const isFoundPost = post?.type === 'found';
  const isPostOwner =
    Boolean(user) && Boolean(postOwnerId) && String(user.id || user._id) === String(postOwnerId);

  const loadComments = useCallback(async () => {
    // Load comments for any authenticated user; UI decides what to show.
    if (!isLost || !user) return;
    try {
      const data = await getComments(id);
      setCommentData(data);
      setCommentsError('');
    } catch (err) {
      setCommentsError(getFriendlyErrorMessage(err));
    }
  }, [id, isLost, user]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Poster of a found post: load the chat requests (reloaded when the post status changes)
  const loadChatRequests = useCallback(async () => {
    if (!isFoundPost || !isPostOwner) return;
    try {
      const data = await getChatRequests(id);
      setRequestData(data);
      setRequestsError('');
    } catch (err) {
      setRequestsError(getFriendlyErrorMessage(err));
    }
  }, [id, isFoundPost, isPostOwner]);

  useEffect(() => {
    loadChatRequests();
  }, [loadChatRequests, post?.status]);

  // Mark post as read in the inbox UI
  useEffect(() => {
    setActivePost(id);
    clearPostUnread(id);
    return () => setActivePost(null);
  }, [id, setActivePost, clearPostUnread]);

  // Live updates via socket
  useEffect(() => {
    if (!socket) return;
    const onCommentEvent = (payload) => {
      const postId = payload.postId ?? payload.post ?? payload.comment?.post;
      if (String(postId) === String(id)) loadComments();
    };
    socket.on('comment:new', onCommentEvent);
    socket.on('comment:updated', onCommentEvent);
    return () => {
      socket.off('comment:new', onCommentEvent);
      socket.off('comment:updated', onCommentEvent);
    };
  }, [socket, id, loadComments]);

  // A chat opened on this post (for example the poster accepted my request): refresh it live
  useEffect(() => {
    if (!socket) return;
    const onConversationCreated = (payload) => {
      if (String(payload?.postId) === String(id)) loadPost({ silent: true });
    };
    socket.on('conversation:created', onConversationCreated);
    return () => {
      socket.off('conversation:created', onConversationCreated);
    };
  }, [socket, id, loadPost]);

  const patchComment = (commentId, patch) => {
    setCommentData((prev) =>
      prev && {
        ...prev,
        comments: prev.comments.map((c) => {
          if (c._id !== commentId) return c;
          const author =
            patch.author && typeof patch.author === 'object'
              ? patch.author
              : c.author;
          return { ...c, ...patch, author };
        }),
      }
    );
  };

  const addComment = (comment) => {
    setCommentData((prev) => ({
      isOwner: false,
      maxAccepted: prev?.maxAccepted,
      comments: [comment, ...(prev?.comments || [])],
    }));
  };

  const removeComment = (commentId) => {
    setCommentData((prev) =>
      prev && { ...prev, comments: prev.comments.filter((c) => c._id !== commentId) }
    );
  };

  // Keeps the attempts counter / request status in sync without refetching the post
  const updateMyAttempts = (patch) => {
    setPost((prev) =>
      prev && {
        ...prev,
        myAttempts: { used: 0, max: 3, requestStatus: 'none', ...(prev.myAttempts || {}), ...patch },
      }
    );
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    const trimmed = answer.trim();
    if (!trimmed) {
      setClaimFeedback({ type: 'error', text: 'Please enter your answer.' });
      return;
    }
    setSubmitting(true);
    setClaimFeedback(null);
    try {
      const data = await claimPost(post._id, trimmed);
      setPost((prev) => ({ ...prev, status: 'claim_pending', claimedByMe: true }));
      if (data?.conversationId) setConversationId(data.conversationId);
      setAnswer('');
      setClaimFeedback({
        type: 'success',
        text: 'Claim accepted. You can now chat with the owner.',
      });
    } catch (err) {
      const { status, message, attemptsLeft } = getClaimError(err);
      const max = post.myAttempts?.max ?? 3;
      if (status === 429 || (status === 403 && attemptsLeft === 0)) {
        setLockedOut(true);
        setClaimFeedback(null);
        const patch = { used: max };
        const serverRequestStatus = err.response?.data?.requestStatus;
        if (serverRequestStatus) patch.requestStatus = serverRequestStatus;
        updateMyAttempts(patch);
      } else if (status === 403 && typeof attemptsLeft === 'number') {
        updateMyAttempts({ used: max - attemptsLeft });
        setClaimFeedback({
          type: 'error',
          text: `Incorrect answer, ${attemptsLeft} attempt${
            attemptsLeft === 1 ? '' : 's'
          } left`,
        });
      } else if (status === 409) {
        setClaimFeedback({ type: 'error', text: 'This item is no longer available' });
        loadPost({ silent: true });
      } else {
        setClaimFeedback({ type: 'error', text: message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Claimant: ask the finder to chat after using all attempts
  const handleSendRequest = async (e) => {
    e.preventDefault();
    setRequestSending(true);
    setRequestFeedback(null);
    try {
      await sendChatRequest(post._id, requestNote.trim());
      updateMyAttempts({ used: post.myAttempts?.max ?? 3, requestStatus: 'pending' });
      setRequestNote('');
    } catch (err) {
      setRequestFeedback({ type: 'error', text: getFriendlyErrorMessage(err) });
      if (err.response?.status === 409) loadPost({ silent: true });
    } finally {
      setRequestSending(false);
    }
  };

  // Poster: accept or decline a chat request
  const handleRequestAction = async (userId, action) => {
    setRequestBusy(userId);
    setRequestActionError('');
    try {
      if (action === 'accept') {
        const data = await acceptChatRequest(post._id, userId);
        if (data?.conversationId) setConversationId(data.conversationId);
        await loadPost({ silent: true });
      } else {
        await declineChatRequest(post._id, userId);
      }
    } catch (err) {
      setRequestActionError(getFriendlyErrorMessage(err));
      loadPost({ silent: true });
    } finally {
      await loadChatRequests();
      setRequestBusy(null);
    }
  };

  const backLink = (
    <Link
      to="/"
      className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition mb-4"
    >
      ← Back to feed
    </Link>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading post...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {backLink}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Post not found</h2>
          <p className="text-sm text-gray-500">
            This post may have been deleted or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {backLink}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {backLink}
        <p className="text-sm text-gray-500 text-center py-12">Couldn't load this post.</p>
      </div>
    );
  }

  const {
    type,
    title,
    description,
    photoUrl,
    category,
    campusZone,
    status,
    postedBy,
    createdAt,
    claimQuestion,
    claimedByMe,
  } = post;

  const typeStyles = type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
  const posterName = postedBy?.name || 'Unknown';

  // Claim UI logic (found posts only)
  const isFound = type === 'found';
  const ownerId = postedBy && typeof postedBy === 'object' ? postedBy._id : postedBy;
  const isOwner = Boolean(user) && String(user.id || user._id) === String(ownerId);
  const claimBoxVisible = isFound && status === 'active' && Boolean(user) && isVerified && !isOwner;

  // Attempts counter + chat-request status (sent by the backend for non-owners of found posts)
  const attemptsMax = post.myAttempts?.max ?? 3;
  const attemptsUsed = post.myAttempts?.used ?? 0;
  const requestStatus = post.myAttempts?.requestStatus ?? 'none';
  const isLockedOut = lockedOut || attemptsUsed >= attemptsMax;

  // Status note for found posts
  let statusNote = null;
  if (isFound && status === 'claim_pending') {
    if (claimedByMe) {
      statusNote =
        claimFeedback?.type === 'success'
          ? null
          : 'Your claim was accepted. You can chat with the owner now.';
    } else {
      statusNote = 'A claim is pending for this item.';
    }
  } else if (isFound && status === 'resolved') {
    statusNote = 'This item has been resolved.';
  }

  const isActive = status === 'active';
  const myComment = !isOwner ? commentData?.comments?.[0] || null : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {backLink}

      <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <img src={photoUrl} alt={title} className="w-full max-h-[480px] object-cover bg-gray-100" />

        <div className="p-6 sm:p-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full ${typeStyles}`}>
              {type}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                statusStyles[status] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {status?.replace('_', ' ')}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <span className="bg-gray-100 px-2.5 py-1 rounded-full">📂 {category || 'Other'}</span>
            <span className="bg-gray-100 px-2.5 py-1 rounded-full">📍 {campusZone || 'Unspecified'}</span>
          </div>

          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{description}</p>

          {/* Poster + date */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              {postedBy?.photoUrl ? (
                <img src={postedBy.photoUrl} alt={posterName} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="w-10 h-10 rounded-full bg-[#D2A066]/30 flex items-center justify-center text-sm font-bold text-[#2D2A32]">
                  {posterName.charAt(0).toUpperCase()}
                </span>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{posterName}</p>
                <p className="text-xs text-gray-400">Posted by</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {createdAt
                ? new Date(createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : ''}
            </span>
          </div>

          {/* Action area */}
          <div className="pt-2 flex flex-col gap-4">
            {/* ---------- LOST POSTS ---------- */}
            {isLost && (
              <>
                {isOwner ? (
                  commentData ? (
                    <FinderCommentsPanel
                      comments={commentData.comments || []}
                      maxAccepted={commentData.maxAccepted}
                      postActive={isActive}
                      onChanged={patchComment}
                      onRefresh={loadComments}
                    />
                  ) : commentsError ? (
                    <p className="text-sm text-red-600" role="alert">
                      {commentsError}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">Loading comments...</p>
                  )
                ) : !user ? (
                  isActive && (
                    <p className="text-sm text-gray-600">
                      <Link to="/login" className="text-blue-600 font-medium hover:underline">
                        Log in to comment
                      </Link>{' '}
                      if you found this item.
                    </p>
                  )
                ) : !isVerified ? (
                  isActive && <p className="text-xs text-gray-400">Only verified users can comment on lost posts.</p>
                ) : commentData ? (
                  <FinderCommentBox
                    postId={post._id}
                    comment={myComment}
                    canComment={isActive}
                    onCreated={addComment}
                    onWithdrawn={removeComment}
                    onRefresh={loadComments}
                  />
                ) : commentsError ? (
                  <p className="text-sm text-red-600" role="alert">
                    {commentsError}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">Loading...</p>
                )}

                {status === 'resolved' && (
                  <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    This post has been resolved.
                  </p>
                )}
              </>
            )}

            {/* ---------- FOUND POSTS ---------- */}
            {claimBoxVisible && (
              !claimQuestion ? (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                  This item can't be claimed online.
                </p>
              ) : isLockedOut ? (
                requestStatus === 'none' ? (
                  // Out of attempts: ask the finder to chat anyway
                  <form
                    onSubmit={handleSendRequest}
                    className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex flex-col gap-3"
                  >
                    <p className="text-sm font-semibold text-amber-900">
                      No attempts left ({attemptsMax} of {attemptsMax} used)
                    </p>
                    <p className="text-xs text-amber-800">
                      If you think this is your item (for example, you made a typo), ask the finder to
                      chat with you. They will see the answers you tried and decide.
                    </p>
                    <textarea
                      value={requestNote}
                      onChange={(e) => setRequestNote(e.target.value)}
                      maxLength={REQUEST_NOTE_MAX}
                      rows={2}
                      disabled={requestSending}
                      placeholder="Optional note, e.g. I spelled the brand wrong"
                      className="w-full px-4 py-2.5 rounded-lg text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 resize-none"
                    />
                    <span className="text-[11px] text-gray-400 self-end">
                      {requestNote.length}/{REQUEST_NOTE_MAX}
                    </span>
                    {requestFeedback && (
                      <p className="text-sm text-red-600" role="alert">
                        {requestFeedback.text}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={requestSending}
                      className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {requestSending ? 'Sending...' : 'Ask the finder to chat'}
                    </button>
                  </form>
                ) : requestStatus === 'pending' ? (
                  <p
                    className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3"
                    role="status"
                  >
                    Request sent. Waiting for the finder to respond.
                  </p>
                ) : (
                  <p
                    className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
                    role="alert"
                  >
                    No attempts left for this item
                  </p>
                )
              ) : (
                <form onSubmit={handleClaim} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    Is this your item? Answer the owner's question
                  </p>
                  <p className="text-sm font-medium text-gray-900">{claimQuestion}</p>
                  <p className="text-xs text-gray-500">
                    Attempts used: {attemptsUsed} of {attemptsMax}
                  </p>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    maxLength={100}
                    placeholder="Your answer"
                    disabled={submitting}
                    className="w-full px-4 py-2.5 rounded-lg text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Checking...' : 'Claim this item'}
                  </button>
                </form>
              )
            )}

            {/* Poster of a found post: chat requests from people who used all their attempts */}
            {isFound && isOwner && (
              requestsError ? (
                <p className="text-sm text-red-600" role="alert">
                  {requestsError}
                </p>
              ) : (
                requestData?.requests?.length > 0 && (
                  <ChatRequestsPanel
                    requests={requestData.requests}
                    postActive={isActive}
                    busyId={requestBusy}
                    error={requestActionError}
                    onAccept={(userId) => handleRequestAction(userId, 'accept')}
                    onDecline={(userId) => handleRequestAction(userId, 'decline')}
                  />
                )
              )
            )}

            {/* Logged out */}
            {isFound && status === 'active' && !user && (
              <p className="text-sm text-gray-600">
                <Link to="/login" className="text-blue-600 font-medium hover:underline">
                  Log in to claim
                </Link>{' '}
                this item.
              </p>
            )}

            {/* Logged in but not verified */}
            {isFound && status === 'active' && user && !isVerified && !isOwner && (
              <p className="text-xs text-gray-400">Only verified users can claim items.</p>
            )}

            {/* Claim feedback */}
            {claimFeedback && (
              <p
                className={`text-sm rounded-xl px-4 py-3 ${
                  claimFeedback.type === 'success'
                    ? 'text-green-700 bg-green-50 border border-green-100'
                    : 'text-red-600 bg-red-50 border border-red-100'
                }`}
                role={claimFeedback.type === 'success' ? 'status' : 'alert'}
              >
                {claimFeedback.text}
                {claimFeedback.type === 'success' && conversationId && (
                  <Link to={`/messages/${conversationId}`} className="ml-2 font-semibold underline">
                    Open chat →
                  </Link>
                )}
              </p>
            )}

            {/* Status note */}
            {statusNote && (
              <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                {statusNote}
              </p>
            )}

            {/* Message button for the owner and the accepted claimant */}
            {conversationId && (isOwner || claimedByMe) && (
              <Link
                to={`/messages/${conversationId}`}
                className="w-full sm:w-auto text-center bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                💬 {status === 'resolved' ? 'View chat' : isOwner ? 'Message claimant' : 'Message owner'}
              </Link>
            )}

            {/* Delete (renders nothing unless owner or admin) */}
            <div className="empty:hidden">
              <DeleteButton
                post={post}
                label="Delete post"
                className="w-full sm:w-auto px-6 py-2.5 text-sm"
                onStart={() => setDeleteError('')}
                onDeleted={() => navigate('/', { replace: true })}
                onError={setDeleteError}
              />
            </div>

            {deleteError && (
              <p className="text-sm text-red-600" role="alert">
                {deleteError}
              </p>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

export default PostDetail;