import type { ToastType } from '../components/Toast';

export const emitToast = (message: string, type: ToastType) => {
  window.dispatchEvent(new CustomEvent('showToast', { detail: { message, type } }));
};
