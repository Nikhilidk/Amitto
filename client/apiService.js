import axios from 'axios';

export const CONFIG = {
  USE_MOCK: true, // Set to false when Person 2's backend route is ready!
  API_BASE_URL: 'http://localhost:5000/api', 
  REGISTER_ENDPOINT: '/auth/register' // Full URL: POST http://localhost:5000/api/auth/register
};

const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 15000
});

export async function registerUser({ name, email, password, idFile }, onProgress = () => {}) {
  // MODE 1: Mock API for parallel testing
  if (CONFIG.USE_MOCK) {
    for (let pct = 10; pct <= 100; pct += 20) {
      await new Promise(res => setTimeout(res, 180));
      onProgress(pct);
    }

    if (email.includes("error") || email.includes("exist")) {
      const error = new Error("Email already registered");
      error.response = { status: 400, data: { error: "Email already registered" } };
      throw error;
    }

    return {
      message: "Registration successful, pending admin verification",
      token: "mock-jwt-token-" + Date.now(),
      user: { id: "mock-uid-" + Date.now(), name, email, verificationStatus: "pending" }
    };
  }

  // MODE 2: Real Backend POST Request via FormData
  const formData = new FormData();
  formData.append('name', name);
  formData.append('email', email);
  formData.append('password', password);
  if (idFile) {
    formData.append('idPhoto', idFile, idFile.name); // Must match Multer 'idPhoto'
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
    return "Cannot connect to server. Please verify POST http://localhost:5000/api/auth/register is running.";
  } else {
    return error.message || "An unexpected error occurred.";
  }
}