import axios from "axios";

// Using the Next.js rewrite proxy setup in next.config.js, or direct API URL
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030/api";

const api = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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
      const requestUrl = String(error.config?.url || "");
      const pathname = window.location.pathname;
      const isAuthPage = pathname === "/login" || pathname === "/register";
      const isAuthEndpoint =
        requestUrl.includes("/admin/login") ||
        requestUrl.includes("/admin/register") ||
        requestUrl.includes("/admin/me");

      // Avoid reload loops on auth pages and form submissions.
      if (!isAuthPage && !isAuthEndpoint) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
