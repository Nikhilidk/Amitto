import axios from "axios";
// =========================================================================
// CONFIGURATION FOR PERSON 1
// =========================================================================
// Set USE_MOCK = true to test Person 1 UI in parallel without backend.
// Set USE_MOCK = false when Person 2's backend API route is ready!
export const CONFIG = {
  USE_MOCK: true, // Toggle between Mock API and Real Backend API
  API_BASE_URL: 'http://localhost:5000/api', // Person 2's backend base URL
  REGISTER_ENDPOINT: '/register'
};

// Create Axios Instance with default settings
const apiClient = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data'
  },
  timeout: 15000 // 15s timeout
});

/**
 * Registers a user by posting multipart form data (Form + ID Proof Image) via Axios.
 * Supports upload progress tracking callback.
 * 
 * @param {Object} userData 
 * @param {string} userData.fullName
 * @param {string} userData.email
 * @param {string} userData.phone
 * @param {string} userData.password
 * @param {File} userData.idFile
 * @param {Function} onProgress - Upload progress callback (0-100%)
 * @returns {Promise<Object>} API Response data
 */
export async function registerUser({ fullName, email, phone, password, idFile }, onProgress = () => {}) {
  
  // -----------------------------------------------------------------------
  // MODE 1: MOCK API (For parallel development while Person 2 builds backend)
  // -----------------------------------------------------------------------
  if (CONFIG.USE_MOCK) {
    console.log("🛠️ [Mock Mode] Registering user locally:", { fullName, email, phone, fileName: idFile?.name });
    // Simulate Network Delay & Upload Progress
    for (let pct = 10; pct <= 100; pct += 20) {
      await new Promise(res => setTimeout(res, 200));
      onProgress(pct);
    }
    // Simulate mock validation error if email contains 'error'
    if (email.includes("error")) {
      const error = new Error("User with this email already exists.");
      error.response = { status: 409, data: { message: "Email already registered in system." } };
      throw error;
    }
    return {
      success: true,
      message: "Registration submitted successfully! Account status: PENDING verification.",
      data: {
        userId: "mock-uid-" + Date.now(),
        email: email,
        fullName: fullName,
        verificationStatus: "pending"
      }
    };
  }

  // -----------------------------------------------------------------------
  // MODE 2: REAL BACKEND API CALL (Swapped in when Person 2's route is ready)
  // -----------------------------------------------------------------------
  const formData = new FormData();
  formData.append('fullName', fullName);
  formData.append('email', email);
  formData.append('phone', phone);
  formData.append('password', password);
  if (idFile) {
    formData.append('idProof', idFile, idFile.name);
  }
  try {
    const response = await apiClient.post(CONFIG.REGISTER_ENDPOINT, formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
    return response.data;
  } catch (error) {
    console.error("Axios API Error:", error);
    throw error;
  }
}
/**
 * Friendly error handler for Axios and backend API errors
 */
export function getFriendlyErrorMessage(error) {
  if (error.response) {
    // Server responded with an error status code (4xx, 5xx)
    return error.response.data?.message || `Server Error (${error.response.status}). Please try again.`;
  } else if (error.request) {
    // Request was made but no response was received (Network error / server offline)
    return "Cannot connect to server. Please check if Person 2's backend server is running.";
  } else {
    return error.message || "An unexpected error occurred.";
  }
}