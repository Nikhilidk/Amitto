import axios from 'axios';

export const CONFIG = {
  USE_MOCK: false,
  API_BASE_URL: 'http://localhost:5000/api',
  REGISTER_ENDPOINT: '/auth/register',
  LOGIN_ENDPOINT: '/auth/login',
  POSTS_ENDPOINT: '/posts'
};

const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 15000
});

const getAuthHeader = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

export async function getPosts() {
  const response = await apiClient.get(CONFIG.POSTS_ENDPOINT);
  return response.data;
}

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

export function getFriendlyErrorMessage(error) {
  if (error.response && error.response.data) {
    return error.response.data.error || error.response.data.message || `Server Error (${error.response.status}).`;
  } else if (error.request) {
    return 'Cannot connect to server. Please verify the backend is running on port 5000.';
  } else {
    return error.message || 'An unexpected error occurred.';
  }
}