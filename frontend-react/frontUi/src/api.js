import axios from 'axios';

let logoutHandler = null;

export const setLogoutHandler = (fn) => {
  logoutHandler = fn;
};

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/users"
});

api.interceptors.request.use(
    (config) => {
        let tokens;
        try {
            const raw = localStorage.getItem('tokens');
            tokens = raw ? JSON.parse(raw) : null;
        } catch {
            tokens = null;
                }
        if (tokens?.access) {
            config.headers.Authorization = `Bearer ${tokens.access}`;
        }
        return config;
    },
        (error) => Promise.reject(error)
)

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const tokens = JSON.parse(localStorage.getItem('tokens'));
                const res = await axios.post("http://127.0.0.1:8000/api/users/token/refresh/",
                     {refresh:tokens?.refresh,})
            
                localStorage.setItem('tokens', JSON.stringify(res.data))
                originalRequest.headers.Authorization = `Bearer ${res.data.access}`
                return api(originalRequest)
            } catch (refreshError) {
                if (logoutHandler) logoutHandler();    
            }
        }
        return Promise.reject(error);
    }
)

export default api