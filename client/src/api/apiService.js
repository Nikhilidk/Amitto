import axios from 'axios';

export const CONFIG = {
  USE_MOCK: false,
  API_BASE_URL: 'http://localhost:5000/api',
  REGISTER_ENDPOINT: '/auth/register',
  LOGIN_ENDPOINT: '/auth/login',
  ME_ENDPOINT: '/auth/me',
  POSTS_ENDPOINT: '/posts',
  MY_POSTS_ENDPOINT: '/posts/mine'
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
 */
export async function createPost({ type, title, description, category, campusZone, photoFile }, onProgress = () => { }) {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('title', title);
  formData.append('description', description);
  if (category) formData.append('category', category);
  if (campusZone) formData.append('campusZone', campusZone);
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
export async function getPosts() {
  const response = await apiClient.get(CONFIG.POSTS_ENDPOINT);
  return response.data;
}

/**
 * GET /api/posts/mine — Fetch posts created by logged-in user (requires Auth token)
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
// ERROR HELPER
// =========================================================================

export function getFriendlyErrorMessage(error) {
  if (error.response && error.response.data) {
    return error.response.data.error || error.response.data.message || `Server Error (${error.response.status}).`;
  } else if (error.request) {
    return 'Cannot connect to server. Please verify the backend is running on port 5000.';
  } else {
    return error.message || 'An unexpected error occurred.';
  }
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

export async function getLeaderboard() {
  const response = await apiClient.get('/auth/leaderboard');
  return response.data;
}