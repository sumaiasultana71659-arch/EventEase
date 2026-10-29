import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = '') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div id="toast-root" aria-live="polite">
        {toasts.map(t => <div key={t.id} className={'toast ' + t.type}>{t.msg}</div>)}
      </div>
    </ToastContext.Provider>
  );
}
