/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useRef } from 'react';

const TOAST_ICONS = {
  success: 'bx-check-circle',
  error: 'bx-error-circle',
  warning: 'bx-error',
  info: 'bx-info-circle',
};

const ToastContext = createContext();

export const useToast = () => {
  return useContext(ToastContext);
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idCounter = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, show: false } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const showToast = useCallback((type, title, message, duration = 4000) => {
    const id = idCounter.current++;
    setToasts((prev) => [...prev, { id, type, title, message, show: false }]);

    // Trigger animation frame trick for initial 'show' state
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, show: true } : t));
    }, 10);

    // Auto remove
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" id="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type} ${toast.show ? 'show' : ''}`}>
            <i className={`bx ${TOAST_ICONS[toast.type]} toast-icon`}></i>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-message">{toast.message}</div>
            </div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>
              <i className="bx bx-x"></i>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
