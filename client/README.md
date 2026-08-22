# 🚀 Person 1: Registration Form UI & Axios REST API Integration

Welcome Sanyam! This repository contains your updated **Person 1 (Client)** implementation for the Lost & Found Community Website.

---

## 💡 What Changed in Person 1's Architecture?

1. **REST API / Axios Integration**: Instead of calling Firebase SDK directly on the client, Person 1 now submits user registration details and the ID proof document as a `multipart/form-data` payload via **Axios**.
2. **Parallel Development (Mock API Mode)**: Person 1 does **NOT** have to wait for Person 2's backend route to be built! Person 1 includes a built-in **Mock API Mode** (`USE_MOCK: true` in `src/apiService.js`) to test the UI, drag-and-drop file upload, password strength, loading spinners, and upload progress right now.
3. **Seamless Backend Handoff**: Once Person 2 finishes building their `/api/register` backend route, Person 1 changes just 1 line of code in `src/apiService.js`: `USE_MOCK: false`.

---

## 🛠️ File Structure