"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { copy } from "@content/copy.ka";
import { cn } from "@/lib/utils";
import { Input } from "./input";

/** A password field with a show/hide toggle inside it. */
function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={cn("pr-13", className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? copy.ui.hidePassword : copy.ui.showPassword}
        aria-pressed={visible}
        className="absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25"
      >
        {visible ? <EyeOff className="size-[18px]" strokeWidth={1.75} /> : <Eye className="size-[18px]" strokeWidth={1.75} />}
      </button>
    </div>
  );
}

export { PasswordInput };
