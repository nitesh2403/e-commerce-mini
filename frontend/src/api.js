import axios from "axios";

const api = axios.create({
  baseURL: "https://e-commerce-mini-uyv4.onrender.com/api/",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh");

      if (refreshToken) {
        try {
          // We use axios directly here to avoid interceptor loop
          const response = await axios.post(
            "https://e-commerce-mini-uyv4.onrender.com/api/users/token/refresh/",
            {
              refresh: refreshToken,
            },
          );

          if (response.status === 200) {
            localStorage.setItem("access", response.data.access);
            api.defaults.headers.common["Authorization"] =
              "Bearer " + response.data.access;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          // Logout user if refresh fails
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          localStorage.removeItem("role");
          window.location.href = "/login";
        }
      } else {
        // No refresh token available
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
