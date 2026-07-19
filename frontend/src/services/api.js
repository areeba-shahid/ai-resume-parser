// frontend/src/services/api.js
import axios from "axios";
import io from "socket.io-client";

// Use environment variables with fallback for local development
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

console.log("🔗 API URL:", API_URL);
console.log("🔗 Socket URL:", SOCKET_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Socket connection
let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem("token");
  if (token && !socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket");
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from WebSocket");
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Auth
export const auth = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    disconnectSocket();
  },
};

// Jobs
export const jobs = {
  getAll: () => api.get("/jobs"),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post("/jobs", data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  getCandidates: (id) => api.get(`/jobs/${id}/candidates`),
};

// Candidates
export const candidates = {
  apply: (formData) =>
    api.post("/candidates/apply", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getMyApplications: () => api.get("/candidates/my-applications"),
  getJobCandidates: (jobId) => api.get(`/candidates/job/${jobId}`),
  checkApplication: (jobId) => {
    console.log(`Calling check-application for job: ${jobId}`);
    return api.get(`/candidates/check-application/${jobId}`);
  },
};

export default api;
