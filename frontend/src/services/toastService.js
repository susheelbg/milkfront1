// Toast notification service
let toastCallbacks = [];

export const toastService = {
  subscribe: (callback) => {
    toastCallbacks.push(callback);
    return () => {
      toastCallbacks = toastCallbacks.filter(cb => cb !== callback);
    };
  },

  show: (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const toast = {
      id,
      message,
      type,
    };

    toastCallbacks.forEach(callback => callback(toast));

    if (duration) {
      setTimeout(() => {
        toastCallbacks.forEach(callback => callback({ id, remove: true }));
      }, duration);
    }

    return id;
  },

  success: (message, duration = 3000) => {
    return toastService.show(message, 'success', duration);
  },

  error: (message, duration = 3000) => {
    return toastService.show(message, 'error', duration);
  },

  info: (message, duration = 3000) => {
    return toastService.show(message, 'info', duration);
  },
};
