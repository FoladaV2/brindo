import * as React from "react";
import { cn } from "@/lib/utils";
import { controlClass } from "./input";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(controlClass, "field-sizing-content min-h-32 px-4 py-3.5 leading-relaxed", className)}
      {...props}
    />
  );
}

export { Textarea };
