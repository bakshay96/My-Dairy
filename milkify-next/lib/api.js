            import axios from "axios";

            // In browser, always use same-origin Next.js rewrite (/api) so cookies remain first-party.
            // This prevents production redirect loops caused by cross-site cookie restrictions.
            const baseURL =
              typeof window !== "undefined"
                ? "/api"
                : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3030/api";

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
                // If the response is a Blob (for PDF downloads), don't try to unwrap it
                if (response.data instanceof Blob) {
                  return response;
                }
                
                if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
                  // Modify the response so res.data points directly to the actual payload
                  response.data = response.data.data;
                }
                return response;
              },
              (error) => {
                if (error.response?.status === 402 && typeof window !== "undefined") {
                  if (window.location.pathname !== "/dashboard/subscription") {
                    window.location.href = "/dashboard/subscription";
                  }
                  return Promise.reject(error);
                }

                if (error.response?.status === 401 && typeof window !== "undefined") {
                  const requestUrl = String(error.config?.url || "");
                  const pathname = window.location.pathname;
                  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/master/login";
                  const isAuthEndpoint =
                    requestUrl.includes("/admin/login") ||
                    requestUrl.includes("/master/login") ||
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
