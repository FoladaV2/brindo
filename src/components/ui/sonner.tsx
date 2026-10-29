"use client";

import { CircleAlert, CircleCheck, Info, Loader2 } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Toasts: raised card, floating shadow, bottom centre on phones (DESIGN.md "Components"). */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      className="toaster group"
      icons={{
        success: <CircleCheck className="size-[18px] text-primary" strokeWidth={1.75} />,
        info: <Info className="size-[18px]" strokeWidth={1.75} />,
        warning: <CircleAlert className="size-[18px] text-primary" strokeWidth={1.75} />,
        error: <CircleAlert className="size-[18px] text-primary" strokeWidth={1.75} />,
        loading: <Loader2 className="size-[18px] animate-spin motion-reduce:animate-none" strokeWidth={1.75} />,
      }}
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border-border !bg-card !text-foreground !shadow-float !font-body !text-[0.9375rem] !gap-3 !px-5 !py-4",
          description: "!text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
