import { toast, type ExternalToast } from "sonner";
import { play } from "./sound";

/**
 * Toasts with their sound, so every confirmation looks and sounds the same across the app. Needs an
 * <AppToaster /> on the page (dashboard, sign-in, onboarding, admin).
 */
export const notify = {
  success(message: string, options?: ExternalToast) {
    play("success");
    return toast.success(message, options);
  },
  error(message: string, options?: ExternalToast) {
    play("error");
    return toast.error(message, options);
  },
  /** Small confirmations (a copied link): a quieter sound. */
  done(message: string, options?: ExternalToast) {
    play("tap");
    return toast.success(message, options);
  },
  /** The big moments (an invitation goes live): the clink. */
  celebrate(message: string, options?: ExternalToast) {
    play("clink");
    return toast.success(message, options);
  },
  dismiss: toast.dismiss,
};
