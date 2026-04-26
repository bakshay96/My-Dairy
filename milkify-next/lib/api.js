import axios from "axios";

// Using the Next.js rewrite proxy setup in next.config.js, or direct API URL
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030/api";

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to inject the token from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional response interceptor to handle global auth errors (e.g., 401)
api.interceptors.response.use(
  (response) => {
    // If the backend returned a standardized response, extract the inner data
    // The backend uses responseInterceptor.middleware.js which wraps the actual payload in response.data.data
    if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
      // Modify the response so res.data points directly to the actual payload
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Clear token and redirect to login if auth fails
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
