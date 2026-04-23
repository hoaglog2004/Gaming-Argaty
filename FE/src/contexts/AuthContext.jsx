import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import apiClient, {
  clearTokens,
  setTokens,
  unwrapApiResponse,
  getAccessToken,
} from "../services/apiClient";

const AuthContext = createContext(null);

const normalizeRole = (role) =>
  String(role || "")
    .toUpperCase()
    .replace(/^ROLE_/, "");

const normalizeUser = (rawUser) => {
  if (!rawUser) return null;
  const normalizedRole = normalizeRole(rawUser.role);
  const isAdmin = Boolean(rawUser.isAdmin) || normalizedRole === "ADMIN";
  const isStaff = Boolean(rawUser.isStaff) || normalizedRole === "STAFF";

  return {
    ...rawUser,
    role: normalizedRole,
    isAdmin,
    isStaff,
    canAccessAdmin: isAdmin || isStaff,
  };
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const response = await apiClient.get("/auth/me");
      const me = unwrapApiResponse(response);
      const normalized = normalizeUser(me);
      setUser(normalized);
      return normalized;
    } catch {
      clearTokens();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(async ({ email, password, rememberMe }) => {
    const response = await apiClient.post("/auth/login", {
      email,
      password,
      rememberMe: Boolean(rememberMe),
    });
    const payload = unwrapApiResponse(response) || {};

    setTokens(payload.accessToken, payload.refreshToken, Boolean(rememberMe));

    const userInfo = normalizeUser({
      id: payload.id,
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role,
      authenticated: true,
    });
    setUser(userInfo);
    return userInfo;
  }, []);

  const register = useCallback(async (data) => {
    const response = await apiClient.post("/auth/register", data);
    return unwrapApiResponse(response);
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return response.data?.message || "Yêu cầu đã được xử lý";
  }, []);

  const validateResetToken = useCallback(async (token) => {
    const response = await apiClient.get("/auth/reset-password/validate", {
      params: { token },
    });
    return Boolean(unwrapApiResponse(response));
  }, []);

  const resetPassword = useCallback(
    async ({ token, newPassword, confirmPassword }) => {
      const response = await apiClient.post("/auth/reset-password", {
        token,
        newPassword,
        confirmPassword,
      });
      return response.data?.message || "Đặt lại mật khẩu thành công";
    },
    [],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user?.authenticated || user?.email),
      login,
      register,
      forgotPassword,
      validateResetToken,
      resetPassword,
      logout,
      refreshMe: fetchMe,
    }),
    [
      user,
      loading,
      login,
      register,
      forgotPassword,
      validateResetToken,
      resetPassword,
      logout,
      fetchMe,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
