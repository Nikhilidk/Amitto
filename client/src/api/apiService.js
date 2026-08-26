import axios from 'axios';

export const CONFIG = {
  USE_MOCK: false, // set true only for isolated UI testing without the backend running
  API_BASE_URL: 'http://localhost:5000/api',
  REGISTER_ENDPOINT: '/auth/register'
};

const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 15000
});

export async function registerUser({ name, email, password, idFile }, onProgress = () => {}) {
  if (CONFIG.USE_MOCK) {
    for (let pct = 10; pct <= 100; pct += 20) {
      await new Promise((res) => setTimeout(res, 180));
      onProgress(pct);
    }
    if (email.includes('error') || email.includes('exist')) {
      const error = new Error('Email already registered');
      error.response = { status: 400, data: { error: 'Email already registered' } };
      throw error;
    }
    return {
      message: 'Registration successful, pending admin verification',
      token: 'mock-jwt-token-' + Date.now(),
      user: { id: 'mock-uid-' + Date.now(), name, email, verificationStatus: 'pending' }
    };
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('email', email);
  formData.append('password', password);
  if (idFile) {
    formData.append('idPhoto', idFile, idFile.name);
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

export function getFriendlyErrorMessage(error) {
  if (error.response && error.response.data) {
    return error.response.data.error || error.response.data.message || `Server Error (${error.response.status}).`;
  } else if (error.request) {
    return 'Cannot connect to server. Please verify the backend is running on port 5000.';
  } else {
    return error.message || 'An unexpected error occurred.';
  }
}