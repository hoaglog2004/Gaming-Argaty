import axios from "axios";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_PERSIST_KEY = "authPersist";

const STORAGE_MODE = {
  local: "local",
  session: "session",
};

const getStorageMode = () => {
  const mode = localStorage.getItem(AUTH_PERSIST_KEY);
  if (mode === STORAGE_MODE.session) {
    return STORAGE_MODE.session;
  }
  return STORAGE_MODE.local;
};

const getTokenFromAnyStorage = (key) =>
  sessionStorage.getItem(key) || localStorage.getItem(key);

export const getAccessToken = () => getTokenFromAnyStorage(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => getTokenFromAnyStorage(REFRESH_TOKEN_KEY);

export const setTokens = (accessToken, refreshToken, rememberMe = true) => {
  const mode = rememberMe ? STORAGE_MODE.local : STORAGE_MODE.session;
  localStorage.setItem(AUTH_PERSIST_KEY, mode);

  const storage = mode === STORAGE_MODE.session ? sessionStorage : localStorage;
  const otherStorage = mode === STORAGE_MODE.session ? localStorage : sessionStorage;

  otherStorage.removeItem(ACCESS_TOKEN_KEY);
  otherStorage.removeItem(REFRESH_TOKEN_KEY);

  if (accessToken) {
    storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_PERSIST_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
};

const apiClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach((item) => {
    if (error) {
      item.reject(error);
      return;
    }
    item.resolve(token);
  });
  pendingQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const refreshToken = getRefreshToken();

    if (status !== 401 || originalRequest?._retry || !refreshToken) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(
        "/api/v1/auth/refresh",
        { refreshToken },
        { withCredentials: true },
      );

      const payload = refreshResponse?.data?.data || {};
      const newAccessToken = payload.accessToken;
      const newRefreshToken = payload.refreshToken || refreshToken;

      if (!newAccessToken) {
        throw new Error("Không thể làm mới token");
      }

      const isSessionMode = getStorageMode() === STORAGE_MODE.session;
      setTokens(newAccessToken, newRefreshToken, !isSessionMode);
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearTokens();
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const unwrapApiResponse = (response) => {
  const body = response?.data;
  if (
    body &&
    typeof body === "object" &&
    (Object.prototype.hasOwnProperty.call(body, "success") ||
      Object.prototype.hasOwnProperty.call(body, "status") ||
      Object.prototype.hasOwnProperty.call(body, "data"))
  ) {
    const isSuccess = body.success === true || body.status === "success";

    if (body.success === false || body.status === "error") {
      throw new Error(body.message || "Yêu cầu thất bại");
    }

    if (isSuccess) {
      return body.data;
    }

    return body.data ?? body;
  }
  return body;
};

export default apiClient;
