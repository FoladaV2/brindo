import { copy } from "@content/copy.ka";
import { AppToaster } from "./app-toaster";

/** The toaster for app pages, with the redirect messages it may need to show (see lib/flash-keys.ts). */
export function Toasts() {
  return <AppToaster flash={copy.toasts.flash} />;
}
