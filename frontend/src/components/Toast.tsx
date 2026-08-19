import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const borderStyle = type === 'success' 
    ? 'border-green-500/30 dark:border-green-400/20 shadow-green-500/10'
    : type === 'error'
    ? 'border-red-500/30 dark:border-red-400/20 shadow-red-500/10'
    : 'border-blue-500/30 dark:border-blue-400/20 shadow-blue-500/10';

  const icon = type === 'success' 
    ? <CheckCircle2 className="text-green-500" size={24} />
    : type === 'error'
    ? <XCircle className="text-red-500" size={24} />
    : <Info className="text-blue-500" size={24} />;

  return (
    <div className="fixed top-6 right-6 z-50 animate-fade-in transition-all duration-300">
      <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border backdrop-blur-md shadow-lg bg-white/90 dark:bg-[#0f172a]/90 ${borderStyle}`}>
        <div className="flex-shrink-0">
          {icon}
        </div>
        <p className="font-medium text-sm pr-6 text-gray-900 dark:text-white max-w-sm">
          {message}
        </p>
        <button 
          onClick={onClose}
          className="ml-auto text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
