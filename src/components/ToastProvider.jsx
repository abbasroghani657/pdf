import React, { createContext, useContext, useState, useCallback } from 'react';
import { clsx } from 'clsx';

const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={clsx(
              "flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg border animate-in slide-in-from-right-4 fade-in duration-300",
              toast.type === 'success' ? "bg-white border-green-100 shadow-green-500/10" :
              toast.type === 'error' ? "bg-white border-red-100 shadow-red-500/10" :
              "bg-gray-900 border-gray-800 text-white shadow-gray-900/20"
            )}
          >
            {toast.type === 'success' && (
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <iconify-icon icon="solar:check-circle-bold" class="text-green-500 text-xl"></iconify-icon>
              </div>
            )}
            {toast.type === 'error' && (
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <iconify-icon icon="solar:danger-triangle-bold" class="text-red-500 text-xl"></iconify-icon>
              </div>
            )}
            {toast.type === 'info' && (
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                <iconify-icon icon="solar:info-circle-bold" class="text-white text-xl"></iconify-icon>
              </div>
            )}
            <p className={clsx("text-sm font-semibold", toast.type !== 'info' ? "text-gray-800" : "text-white")}>
              {toast.message}
            </p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
