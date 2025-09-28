import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext({ showToast: (_t) => {} });

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((toast) => {
    // toast: { id?, type: 'success'|'error'|'info', message, duration }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const t = { id, type: toast.type || 'info', message: toast.message || '', duration: toast.duration ?? 4000 };
    setToasts((s) => [...s, t]);
    // auto remove
    setTimeout(() => {
      setToasts((s) => s.filter(x => x.id !== id));
    }, t.duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => setToasts((s) => s.filter(t => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export default ToastContext;
