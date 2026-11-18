import axios from 'axios';

export const CONFIG = {
  USE_MOCK: false,
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  REGISTER_ENDPOINT: '/auth/register',
  LOGIN_ENDPOINT: '/auth/login',
  ME_ENDPOINT: '/auth/me',
  POSTS_ENDPOINT: '/posts',
  MY_POSTS_ENDPOINT: '/posts/mine',
  CONVERSATIONS_ENDPOINT: '/conversations',
  COMMENTS_ENDPOINT: '/comments',
};

const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 15000
});

const getAuthHeader = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// =========================================================================
// AUTH & USER APIs
// =========================================================================

export async function registerUser({ name, email, password, idFile }, onProgress = () => { }) {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('email', email);
  formData.append('password', password);
  if (idFile) {
    formData.append('idPhoto', idFile, idFile.name); // Matches upload.single('idPhoto')
  }

  const response = await apiClient.post(CONFIG.REGISTER_ENDPOINT, formData, {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  });

  return response.data;
}

export async function loginUser({ email, password }) {
  const response = await apiClient.post(CONFIG.LOGIN_ENDPOINT, { email, password });
  return response.data;
}

/**
 * GET /api/auth/me — Fetches logged-in user profile (requires Auth token)
 */
export async function getMyProfile() {
  const response = await apiClient.get(CONFIG.ME_ENDPOINT, {
    headers: getAuthHeader()
  });
  return response.data;
}

// =========================================================================
// POSTS APIs
// =========================================================================

/**
 * POST /api/posts — Create a new post with photo upload (requires Auth token)
 * Expects FormData matching Multer upload.single('photo')
 * Found posts must also send claimQuestion and claimAnswer.
 */
export async function createPost(
  { type, title, description, category, campusZone, claimQuestion, claimAnswer, photoFile },
  onProgress = () => { }
) {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('title', title);
  formData.append('description', description);
  if (category) formData.append('category', category);
  if (campusZone) formData.append('campusZone', campusZone);
  if (type === 'found') {
    if (claimQuestion) formData.append('claimQuestion', claimQuestion);
    if (claimAnswer) formData.append('claimAnswer', claimAnswer);
  }
  if (photoFile) {
    formData.append('photo', photoFile, photoFile.name); // Matches upload.single('photo')
  }

  const response = await apiClient.post(CONFIG.POSTS_ENDPOINT, formData, {
    headers: getAuthHeader(),
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  });

  return response.data;
}

/**
 * GET /api/posts — Browse all community posts (public, no auth needed)
 */
export async function getPosts(filters = {}) {
  const response = await apiClient.get(CONFIG.POSTS_ENDPOINT, { params: filters });
  return response.data;
}

export async function deletePost(postId) {
  const response = await apiClient.delete(`${CONFIG.POSTS_ENDPOINT}/${postId}`, {
    headers: getAuthHeader()
  });
  return response.data;
}

/**
 * GET /api/posts/mine — Fetch posts created by logged-in user (requires Auth token)
 * Lost posts also carry pendingCommentCount.
 */
export async function getMyPosts() {
  const response = await apiClient.get(CONFIG.MY_POSTS_ENDPOINT, {
    headers: getAuthHeader()
  });
  return response.data;
}

/**
 * PATCH /api/posts/:id/status — Update a post's status (owner or admin, requires Auth token)
 */
export async function updatePostStatus(postId, status) {
  const response = await apiClient.patch(
    `${CONFIG.POSTS_ENDPOINT}/${postId}/status`,
    { status },
    { headers: getAuthHeader() }
  );
  return response.data;
}

/**
 * POST /api/posts/:id/claim — Claim a found item by answering the owner's question.
 * Errors carry { error, attemptsLeft } in err.response.data (use getClaimError).
 */
export async function claimPost(postId, answer) {
  const response = await apiClient.post(
    `${CONFIG.POSTS_ENDPOINT}/${postId}/claim`,
    { answer },
    { headers: getAuthHeader() }
  );
  return response.data;
}

/**
 * POST /api/posts/:id/claim/release — Owner rejects the pending claim.
 */
export async function releaseClaim(postId) {
  const response = await apiClient.post(
    `${CONFIG.POSTS_ENDPOINT}/${postId}/claim/release`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
}

// =========================================================================
// FOUND-POST CHAT REQUEST APIs (after 3 wrong answers)
// =========================================================================

/**
 * POST /api/posts/:id/chat-request — Ask the finder to chat after using all attempts.
 * Returns { requestStatus: 'pending' }.
 * Errors: 403 (attempts not used up), 409 (already sent / item no longer available).
 */
export async function sendChatRequest(postId, note = '') {
  const response = await apiClient.post(
    `${CONFIG.POSTS_ENDPOINT}/${postId}/chat-request`,
    { note },
    { headers: getAuthHeader() }
  );
  return response.data;
}

/**
 * GET /api/posts/:id/chat-requests — Poster only. Returns { postStatus, requests }.
 * Each request: { _id, user: { _id, name, photoUrl, trustScore }, answers, requestNote, requestStatus, updatedAt }
 */
export async function getChatRequests(postId) {
  const response = await apiClient.get(
    `${CONFIG.POSTS_ENDPOINT}/${postId}/chat-requests`,
    { headers: getAuthHeader() }
  );
  return response.data;
}

/**
 * POST /api/posts/:id/chat-requests/:userId/accept — Poster accepts: that user becomes the claimant.
 * Returns { message, conversationId }.
 * Errors: 409 (item already has a pending claim / request already handled).
 */
export async function acceptChatRequest(postId, userId) {
  const response = await apiClient.post(
    `${CONFIG.POSTS_ENDPOINT}/${postId}/chat-requests/${userId}/accept`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
}

/**
 * POST /api/posts/:id/chat-requests/:userId/decline — Poster declines the request.
 */
export async function declineChatRequest(postId, userId) {
  const response = await apiClient.post(
    `${CONFIG.POSTS_ENDPOINT}/${postId}/chat-requests/${userId}/decline`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
}

// =========================================================================
// LOST-POST COMMENT APIs
// =========================================================================

/**
 * POST /api/posts/:postId/comments — A finder comments on a lost post.
 * Returns the created comment.
 * Errors: 409 (already commented / post no longer open), 429 (too many comments).
 */
export async function createComment(postId, text) {
  const response = await apiClient.post(
    `${CONFIG.POSTS_ENDPOINT}/${postId}/comments`,
    { text },
    { headers: getAuthHeader() }
  );
  return response.data.comment || response.data;
}

/**
 * GET /api/posts/:postId/comments — Returns { isOwner, maxAccepted, comments }.
 * Poster: everyone's comments (author name, photo). Finder: only their own.
 */
export async function getComments(postId) {
  const response = await apiClient.get(
    `${CONFIG.POSTS_ENDPOINT}/${postId}/comments`,
    { headers: getAuthHeader() }
  );
  return response.data;
}

/**
 * POST /api/comments/:id/accept — Poster opens a chat with this finder.
 * Returns { comment, conversationId }.
 * Errors: 409 (already handled, chat cap reached, post no longer open).
 */
export async function acceptComment(commentId) {
  const response = await apiClient.post(
    `${CONFIG.COMMENTS_ENDPOINT}/${commentId}/accept`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
}

/**
 * POST /api/comments/:id/decline — Poster declines. Returns the comment.
 */
export async function declineComment(commentId) {
  const response = await apiClient.post(
    `${CONFIG.COMMENTS_ENDPOINT}/${commentId}/decline`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data.comment || response.data;
}

/**
 * DELETE /api/comments/:id — Finder withdraws a comment that is still pending.
 */
export async function withdrawComment(commentId) {
  const response = await apiClient.delete(
    `${CONFIG.COMMENTS_ENDPOINT}/${commentId}`,
    { headers: getAuthHeader() }
  );
  return response.data;
}

// =========================================================================
// ADMIN APIs
// =========================================================================

export async function getPendingUsers() {
  const response = await apiClient.get('/admin/pending-users', {
    headers: getAuthHeader()
  });
  return response.data;
}

export async function updateUserStatus(userId, status) {
  const response = await apiClient.patch(
    `/admin/users/${userId}/status`,
    { status },
    { headers: getAuthHeader() }
  );
  return response.data;
}

// =========================================================================
// ERROR HELPERS
// =========================================================================

// Passes the server's own message through (error.response.data.error)
export function getFriendlyErrorMessage(error) {
  if (error.response && error.response.data) {
    return error.response.data.error || error.response.data.message || `Server Error (${error.response.status}).`;
  } else if (error.request) {
    return 'Cannot connect to server. Please verify the backend is running on port 5000.';
  } else {
    return error.message || 'An unexpected error occurred.';
  }
}

// For claim calls: returns the status code, the server message and attemptsLeft
export function getClaimError(error) {
  return {
    status: error.response?.status,
    message: getFriendlyErrorMessage(error),
    attemptsLeft: error.response?.data?.attemptsLeft
  };
}

// For comment calls: status code (409 / 429 ...) plus the server's own message
export function getCommentError(error) {
  return {
    status: error.response?.status,
    message: getFriendlyErrorMessage(error)
  };
}

export async function updateProfilePhoto(photoFile) {
  const formData = new FormData();
  formData.append('photo', photoFile, photoFile.name);

  const response = await apiClient.patch(
    `${CONFIG.ME_ENDPOINT}/photo`,
    formData,
    { headers: getAuthHeader() }
  );
  return response.data;
}

// Sends the token when logged in, so the backend can set claimedByMe
export async function getPostById(postId) {
  const response = await apiClient.get(`${CONFIG.POSTS_ENDPOINT}/${postId}`, {
    headers: getAuthHeader()
  });
  return response.data;
}

// =========================================================================
// CHAT APIs
// =========================================================================

export async function getMyConversations() {
  const response = await apiClient.get(CONFIG.CONVERSATIONS_ENDPOINT, {
    headers: getAuthHeader()
  });
  return response.data; // array of inbox items
}

// Returns { conversationId, status }. Throws 404 if you have no chat for this post.
export async function getConversationByPost(postId) {
  const response = await apiClient.get(
    `${CONFIG.CONVERSATIONS_ENDPOINT}/by-post/${postId}`,
    { headers: getAuthHeader() }
  );
  return response.data;
}

// Returns { status, messages, hasMore }. Pass `before` (a message _id) for older pages.
export async function getMessages(conversationId, { before, limit } = {}) {
  const response = await apiClient.get(
    `${CONFIG.CONVERSATIONS_ENDPOINT}/${conversationId}/messages`,
    { headers: getAuthHeader(), params: { before, limit } }
  );
  return response.data;
}

// REST fallback, used when the socket is down
export async function sendMessage(conversationId, text) {
  const response = await apiClient.post(
    `${CONFIG.CONVERSATIONS_ENDPOINT}/${conversationId}/messages`,
    { text },
    { headers: getAuthHeader() }
  );
  return response.data; // { message }
}