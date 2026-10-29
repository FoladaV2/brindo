import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

/*
 * Pill buttons (DESIGN.md "Components"). Hover colour comes from a layer that fades in, so only
 * opacity and transform ever animate. Press scales to 0.98.
 */
const buttonVariants = cva(
  [
    "group/button relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full font-medium whitespace-nowrap select-none",
    "transition-transform duration-150 ease-out active:scale-[0.98]",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45",
    "before:absolute before:inset-0 before:-z-10 before:opacity-0 before:transition-opacity before:duration-200 hover:before:opacity-100",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.15em]",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground inset-shadow-highlight before:bg-primary-hover",
        outline: "border border-foreground/20 bg-transparent text-foreground before:bg-accent",
        secondary: "bg-secondary text-secondary-foreground before:bg-foreground/5",
        ghost: "bg-transparent text-foreground before:bg-accent",
        link: "rounded-sm px-0! text-primary underline decoration-primary/30 underline-offset-4 before:hidden hover:decoration-primary active:scale-100",
        destructive: "border border-destructive/40 bg-transparent text-destructive before:bg-selected",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        default: "h-12 px-6 text-[0.9375rem]",
        lg: "h-14 px-8 text-base",
        icon: "size-12",
        "icon-sm": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant = "default", size = "default", asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

/** A trailing arrow that nudges forward when its button is hovered. */
function ButtonArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(
        "size-4 transition-transform duration-200 ease-out group-hover/button:translate-x-0.5 motion-reduce:transition-none",
        className,
      )}
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export { Button, ButtonArrow, buttonVariants };
