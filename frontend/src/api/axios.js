import axios from 'axios';

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ||   'http://localhost:8000/', // Your backend URL
        timeout: 60000, // Optional: timeout after 10 seconds
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor to add the JWT token to headers
instance.interceptors.request.use(
    (config) => {
        const publicUrls = ['/auth/signup/', '/auth/login/', '/auth/google/', '/auth/verify-otp/', '/auth/resend-otp/']; // Add other public URLs as needed
        const isPublicUrl = publicUrls.some(url => config.url.includes(url));

        if (isPublicUrl) {
            delete config.headers.Authorization;
            config.headers.Authorization = undefined; // Explicitly set to undefined
        } else {
            const accessToken = localStorage.getItem('access_token');
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response interceptor to handle token refreshing
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error status is 401 and it's not a retry of the refresh token request
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return instance(originalRequest);
                })
                .catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                try {
                    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';
                    const formattedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

                    const response = await axios.post(
                        `${formattedBaseUrl}api/auth/token/refresh/`,
                        { refresh: refreshToken }
                    );

                    const newAccessToken = response.data.access;
                    localStorage.setItem('access_token', newAccessToken);

                    // Update the Authorization header for the original request
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                    processQueue(null, newAccessToken);
                    isRefreshing = false;

                    // Retry the original request
                    return instance(originalRequest);
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    isRefreshing = false;
                    console.error('Token refresh failed:', refreshError);
                    // If refresh token is invalid or expired, log out the user
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.dispatchEvent(new Event('auth_logout'));
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token available, just reject the error
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.dispatchEvent(new Event('auth_logout'));
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default instance;
