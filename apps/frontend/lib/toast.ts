import { toast as sonnerToast, type ExternalToast } from 'sonner';
import { MESSAGE_DURATION } from '@/lib/constants/ui.constants';

export const toast = {
  success: (message: string, options?: ExternalToast) =>
    sonnerToast.success(message, {
      duration: MESSAGE_DURATION.SUCCESS,
      ...options,
    }),

  error: (message: string, options?: ExternalToast) =>
    sonnerToast.error(message, {
      duration: MESSAGE_DURATION.ERROR,
      ...options,
    }),

  loading: (message: string, options?: ExternalToast) =>
    sonnerToast.loading(message, options),

  info: (message: string, options?: ExternalToast) =>
    sonnerToast.info(message, {
      duration: MESSAGE_DURATION.INFO,
      ...options,
    }),

  warning: (message: string, options?: ExternalToast) =>
    sonnerToast.warning(message, {
      duration: MESSAGE_DURATION.WARNING,
      ...options,
    }),

  dismiss: sonnerToast.dismiss,
  promise: sonnerToast.promise,
};