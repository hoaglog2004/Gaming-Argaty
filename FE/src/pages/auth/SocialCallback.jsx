import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setTokens } from "../../services/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const SocialCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshMe } = useAuth();
  const { showToast } = useToast();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const handleCallback = async () => {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");
      const message = searchParams.get("message");

      if (!accessToken || !refreshToken) {
        showToast(
          "error",
          "Đăng nhập thất bại",
          message || "Không nhận được token đăng nhập xã hội",
        );
        navigate("/auth/login", { replace: true });
        return;
      }

      setTokens(accessToken, refreshToken);
      await refreshMe();
      showToast("success", "Thành công", "Đăng nhập thành công");
      navigate("/", { replace: true });
    };

    handleCallback();
  }, [navigate, refreshMe, searchParams, showToast]);

  return (
    <div className="auth-header" style={{ textAlign: "center" }}>
      <h1 className="auth-title">Đang xử lý đăng nhập</h1>
      <p className="auth-subtitle">Vui lòng chờ trong giây lát...</p>
    </div>
  );
};

export default SocialCallback;
