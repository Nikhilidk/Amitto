import { registerUser, getFriendlyErrorMessage, CONFIG } from "./apiService.js";

// DOM Elements
const registrationForm = document.getElementById("registrationForm");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const strengthMeter = document.getElementById("strengthMeter");
const idProofInput = document.getElementById("idProofInput");
const dropzone = document.getElementById("dropzone");
const filePreview = document.getElementById("filePreview");
const previewImage = document.getElementById("previewImage");
const previewName = document.getElementById("previewName");
const previewSize = document.getElementById("previewSize");
const btnRemoveFile = document.getElementById("btnRemoveFile");
const alertBox = document.getElementById("alertBox");
const alertMessage = document.getElementById("alertMessage");
const btnSubmit = document.getElementById("btnSubmit");
const btnText = document.getElementById("btnText");
const btnSpinner = document.getElementById("btnSpinner");
const uploadProgress = document.getElementById("uploadProgress");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");
const apiModeBadge = document.getElementById("apiModeBadge");

// Display current API Mode (Mock vs Real API)
if (apiModeBadge) {
  apiModeBadge.textContent = CONFIG.USE_MOCK ? "API Status: Mock Mode (Parallel Testing)" : "API Status: Real Backend Connected";
  apiModeBadge.style.color = CONFIG.USE_MOCK ? "#38bdf8" : "#10b981";
}

let selectedFile = null;

// Password Strength Indicator
passwordInput.addEventListener("input", (e) => {
  const val = e.target.value;
  let score = 0;
  if (val.length > 5) score += 25;
  if (val.length > 8) score += 25;
  if (/[A-Z]/.test(val)) score += 25;
  if (/[0-9]/.test(val) || /[^A-Za-z0-9]/.test(val)) score += 25;

  strengthMeter.style.width = `${score}%`;
  if (score <= 25) {
    strengthMeter.style.backgroundColor = "#ef4444";
  } else if (score <= 50) {
    strengthMeter.style.backgroundColor = "#f59e0b";
  } else if (score <= 75) {
    strengthMeter.style.backgroundColor = "#06b6d4";
  } else {
    strengthMeter.style.backgroundColor = "#10b981";
  }
});

// Drag & Drop File Handling
['dragenter', 'dragover'].forEach(eventName => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach(eventName => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('dragover');
  });
});

dropzone.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  if (files && files.length > 0) {
    handleSelectedFile(files[0]);
  }
});

idProofInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    handleSelectedFile(e.target.files[0]);
  }
});

function handleSelectedFile(file) {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showAlert("Please upload a valid image file (JPG, PNG, or WEBP).", "error");
    return;
  }

  // Validate file size (Max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showAlert("Image file size must be less than 5MB.", "error");
    return;
  }

  hideAlert();
  selectedFile = file;

  // Show Preview
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    previewName.textContent = file.name;
    previewSize.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    filePreview.style.display = "flex";
    dropzone.style.display = "none";
  };
  reader.readAsDataURL(file);
}

btnRemoveFile.addEventListener('click', () => {
  selectedFile = null;
  idProofInput.value = "";
  filePreview.style.display = "none";
  dropzone.style.display = "block";
});

// Alert Messages Helper
function showAlert(message, type = "error") {
  alertMessage.textContent = message;
  alertBox.className = `alert-box ${type}`;
}

function hideAlert() {
  alertBox.className = "alert-box";
  alertMessage.textContent = "";
}

// Form Submission Handler (Axios POST)
registrationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAlert();

  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Form Validations
  if (!fullName || !email || !phone || !password || !confirmPassword) {
    showAlert("Please fill in all required fields.", "error");
    return;
  }

  if (password !== confirmPassword) {
    showAlert("Passwords do not match. Please re-enter.", "error");
    return;
  }

  if (password.length < 6) {
    showAlert("Password must be at least 6 characters long.", "error");
    return;
  }

  if (!selectedFile) {
    showAlert("Please upload your ID Document / Photo for verification.", "error");
    return;
  }

  // Set Loading State
  btnSubmit.disabled = true;
  btnText.textContent = "Sending Registration via Axios...";
  btnSpinner.style.display = "block";
  uploadProgress.style.display = "flex";

  try {
    const result = await registerUser(
      {
        fullName,
        email,
        phone,
        password,
        idFile: selectedFile
      },
      (progress) => {
        progressPercent.textContent = `${progress}%`;
        progressFill.style.width = `${progress}%`;
      }
    );

    // Registration Success
    showAlert(result.message || `Registration submitted successfully for ${email}! Status: PENDING verification.`, "success");
    
    // Reset Form
    registrationForm.reset();
    btnRemoveFile.click();
    strengthMeter.style.width = "0%";
    
  } catch (error) {
    console.error("Axios Post Failed:", error);
    showAlert(getFriendlyErrorMessage(error), "error");
  } finally {
    // Reset Button State
    btnSubmit.disabled = false;
    btnText.textContent = "Register & Submit for Verification";
    btnSpinner.style.display = "none";
    setTimeout(() => {
      uploadProgress.style.display = "none";
      progressFill.style.width = "0%";
    }, 2500);
  }
});