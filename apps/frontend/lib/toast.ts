import { toast as hotToast, type ToastOptions } from 'react-hot-toast';
import { MESSAGE_DURATION } from '@/lib/constants/ui.constants';

const defaultOptions: ToastOptions = {
  position: 'top-center',
};

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    hotToast.success(message, {
      ...defaultOptions,
      duration: MESSAGE_DURATION.SUCCESS,
      ...options,
    }),

  error: (message: string, options?: ToastOptions) =>
    hotToast.error(message, {
      ...defaultOptions,
      duration: MESSAGE_DURATION.ERROR,
      ...options,
    }),

  loading: (message: string, options?: ToastOptions) =>
    hotToast.loading(message, {
      ...defaultOptions,
      ...options,
    }),

  info: (message: string, options?: ToastOptions) =>
    hotToast(message, {
      ...defaultOptions,
      duration: MESSAGE_DURATION.INFO,
      icon: 'ℹ️',
      ...options,
    }),

  warning: (message: string, options?: ToastOptions) =>
    hotToast(message, {
      ...defaultOptions,
      duration: MESSAGE_DURATION.WARNING,
      icon: '⚠️',
      ...options,
    }),

  dismiss: hotToast.dismiss,
  promise: hotToast.promise,
};
