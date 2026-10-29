"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { PlusIcon } from "lucide-react"
import { Accordion as AccordionPrimitive } from "radix-ui"

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/trigger flex flex-1 cursor-pointer items-start justify-between gap-6 rounded-md py-6 text-left text-[1.0625rem] leading-snug font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:pointer-events-none disabled:opacity-50 md:text-lg",
          className
        )}
        {...props}
      >
        {children}
        <span className="pointer-events-none grid size-8 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground">
          <PlusIcon className="size-4 transition-transform duration-300 ease-out group-data-[state=open]/trigger:rotate-45 motion-reduce:transition-none" strokeWidth={1.75} />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-base text-muted-foreground"
      {...props}
    >
      {/* Opens without animating height (DESIGN.md "Motion system"); the text fades in. */}
      <div className={cn("max-w-2xl pt-0 pb-6 leading-relaxed animate-in fade-in-0 slide-in-from-top-1 transition-none duration-300 motion-reduce:animate-none", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
