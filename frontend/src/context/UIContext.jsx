import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiAlertTriangle } from 'react-icons/fi';

const UIContext = createContext();

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export const UIProvider = ({ children }) => {
  // Toast State
  const [toasts, setToasts] = useState([]);
  
  // Confirm State
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning', // 'warning', 'danger', 'info'
  });
  const confirmPromiseRef = useRef(null);

  // ─── TOAST LOGIC ──────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // ─── CONFIRM LOGIC ────────────────────────────────────────────────────────
  const confirm = useCallback(({ 
    title, 
    message, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel',
    type = 'warning'
  }) => {
    return new Promise((resolve) => {
      confirmPromiseRef.current = resolve;
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type
      });
    });
  }, []);

  const handleConfirm = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (confirmPromiseRef.current) {
      confirmPromiseRef.current(true);
      confirmPromiseRef.current = null;
    }
  };

  const handleCancel = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (confirmPromiseRef.current) {
      confirmPromiseRef.current(false);
      confirmPromiseRef.current = null;
    }
  };

  return (
    <UIContext.Provider value={{ showToast, confirm }}>
      {children}

      {/* ─── TOAST RENDERER ──────────────────────────────────────────────── */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[280px]
              transform transition-all duration-300 ease-out animate-slide-in-right
              ${toast.type === 'success' ? 'bg-white border-green-100' : ''}
              ${toast.type === 'error' ? 'bg-white border-red-100' : ''}
              ${toast.type === 'info' ? 'bg-white border-blue-100' : ''}
            `}
          >
            {toast.type === 'success' && <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><FiCheckCircle className="text-green-600 w-4 h-4" /></div>}
            {toast.type === 'error' && <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0"><FiAlertCircle className="text-red-600 w-4 h-4" /></div>}
            {toast.type === 'info' && <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><FiInfo className="text-blue-600 w-4 h-4" /></div>}
            
            <p className="text-sm font-semibold text-gray-800 flex-1">{toast.message}</p>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ─── CONFIRM MODAL RENDERER ──────────────────────────────────────── */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={handleCancel}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all animate-scale-in border border-gray-100">
            <div className="flex flex-col items-center text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                confirmState.type === 'danger' ? 'bg-red-50 text-red-600' : 
                confirmState.type === 'warning' ? 'bg-yellow-50 text-yellow-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                {confirmState.type === 'danger' ? <FiAlertCircle className="w-7 h-7" /> : 
                 confirmState.type === 'warning' ? <FiAlertTriangle className="w-7 h-7" /> : 
                 <FiInfo className="w-7 h-7" />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmState.title}</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">{confirmState.message}</p>
            </div>
            
            <div className="flex gap-3 w-full">
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {confirmState.cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white transition-colors ${
                  confirmState.type === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                  confirmState.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
};
