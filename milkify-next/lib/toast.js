import { toast as hotToast } from "react-hot-toast";

const defaultOptions = {
  duration: 3500,
};

function show(message, options = {}) {
  return hotToast(message, {
    ...defaultOptions,
    ...options,
  });
}

show.success = (message, options = {}) =>
  hotToast.success(message, {
    ...defaultOptions,
    ...options,
  });

show.error = (message, options = {}) =>
  hotToast.error(message, {
    ...defaultOptions,
    ...options,
  });

show.loading = (message, options = {}) =>
  hotToast.loading(message, {
    ...defaultOptions,
    ...options,
  });

show.dismiss = (toastId) => hotToast.dismiss(toastId);

export const toast = show;
