import axios from "axios";

let base_URL = import.meta.env.VITE_BACKEND_BASE_URL;
if (base_URL === undefined) {
  base_URL = 'https://pdf-editor-2hwn.onrender.com/api/users';
}


function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

const api = axios.create({
  baseURL: base_URL,
  withCredentials: true, 
});

api.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const isAuthRoute = (url = "") =>
  url.includes("/login/") ||
  url.includes("/logout/") ||
  url.includes("/csrf/") ||
  url.includes("/token/refresh/");


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    if (status !== 401 || originalRequest?._retry || isAuthRoute(originalRequest?.url)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {

      await axios.post(
        `${base_URL}/token/refresh/`,
        {},
        {
          withCredentials: true,
          headers: { "X-CSRFToken": getCookie("csrftoken") || "" },
        }
      );
      return api(originalRequest); 
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;
