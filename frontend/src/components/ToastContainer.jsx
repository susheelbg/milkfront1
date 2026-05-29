import React, { useState, useEffect } from 'react';
import { toastService } from '../services/toastService';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = toastService.subscribe((toast) => {
      if (toast.remove) {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      } else {
        setToasts(prev => [...prev, toast]);
      }
    });

    return unsubscribe;
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-6 right-6 z-50 pointer-events-none">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const iconClass = 'w-5 h-5';
  const baseClasses = 'flex items-center gap-3 px-4 py-3 rounded-lg bg-white shadow-lg mb-3 pointer-events-auto animate-slide-up';

  const configs = {
    success: {
      icon: <CheckCircle className={`${iconClass} text-green-500`} />,
      className: 'border-l-4 border-green-500',
    },
    error: {
      icon: <AlertCircle className={`${iconClass} text-red-500`} />,
      className: 'border-l-4 border-red-500',
    },
    info: {
      icon: <Info className={`${iconClass} text-blue-500`} />,
      className: 'border-l-4 border-blue-500',
    },
  };

  const config = configs[toast.type] || configs.info;

  return (
    <div className={`${baseClasses} ${config.className}`}>
      {config.icon}
      <span className="text-gray-800 text-sm font-medium flex-1">{toast.message}</span>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
