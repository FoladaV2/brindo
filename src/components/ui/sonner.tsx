"use client";

import { useSyncExternalStore } from "react";
import { CircleAlert, CircleCheck, Info, Loader2 } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const WIDE = "(min-width: 1024px)";
const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

/**
 * Toasts: a raised card with a hairline and a soft onyx-tinted shadow, the icon in wine. Bottom
 * centre on phones, bottom right on desktop (DESIGN.md "Components"). Sonner animates them with
 * transform and opacity only, and drops the movement under reduced motion.
 */
function Toaster(props: ToasterProps) {
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(WIDE).matches, () => false);
  return (
    <Sonner
      theme="light"
      position={wide ? "bottom-right" : "bottom-center"}
      offset={wide ? 28 : 20}
      mobileOffset={{ bottom: "calc(env(safe-area-inset-bottom) + 84px)" }}
      gap={10}
      visibleToasts={3}
      className="toaster group"
      icons={{
        success: <CircleCheck className="size-5 text-primary" strokeWidth={1.75} />,
        info: <Info className="size-5" strokeWidth={1.75} />,
        warning: <CircleAlert className="size-5 text-primary" strokeWidth={1.75} />,
        error: <CircleAlert className="size-5 text-primary" strokeWidth={1.75} />,
        loading: <Loader2 className="size-5 animate-spin motion-reduce:animate-none" strokeWidth={1.75} />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!items-start !rounded-[1.125rem] !border-border !bg-card !text-foreground !shadow-float !font-body !text-[0.9375rem] !leading-snug !gap-3 !px-5 !py-4 !min-h-14",
          title: "!font-medium",
          description: "!mt-0.5 !text-[0.8125rem] !leading-snug !text-muted-foreground",
          icon: "!mt-px",
          actionButton: "!h-8 !rounded-full !bg-primary !px-3.5 !text-[0.8125rem] !font-medium !text-primary-foreground",
          cancelButton: "!h-8 !rounded-full !bg-sunken !px-3.5 !text-[0.8125rem] !text-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
