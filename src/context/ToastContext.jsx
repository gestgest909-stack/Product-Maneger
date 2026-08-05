import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts(list => list.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3000, action = null) => {
    const id = ++counter.current;
    setToasts(list => [...list, { id, message, type, duration, action }]);
    window.setTimeout(() => {
      setToasts(list => list.map(t => (t.id === id ? { ...t, leaving: true } : t)));
      window.setTimeout(() => removeToast(id), 300);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div id="toastContainer">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}${t.leaving ? ' toast-leaving' : ''}`}>
            <div className="toast-row">
              <span dangerouslySetInnerHTML={{ __html: t.message }} />
              {t.action && (
                <button
                  type="button"
                  className="toast-action"
                  onClick={() => {
                    t.action.onClick();
                    removeToast(t.id);
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button type="button" className="toast-close" onClick={() => removeToast(t.id)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="toast-progress" style={{ animationDuration: `${t.duration}ms` }} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
