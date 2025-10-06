import { toast as sonnerToast } from 'sonner';

/**
 * Custom toast utilities with styled variants
 */

export const toast = {
  /**
   * Success toast with blue shimmer gradient (matches send button)
   */
  success: (message: string, options?: { description?: string; duration?: number }) => {
    return sonnerToast.success(message, {
      ...options,
      className: 'toast-success',
    });
  },

  /**
   * Error toast with red shimmer gradient (matches stop button)
   */
  error: (message: string, options?: { description?: string; duration?: number }) => {
    return sonnerToast.error(message, {
      ...options,
      className: 'toast-error',
    });
  },
};
