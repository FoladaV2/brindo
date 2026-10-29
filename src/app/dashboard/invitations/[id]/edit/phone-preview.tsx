"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { X } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Button } from "@/components/ui/button";
import type { EventType } from "@/lib/events";
import type { InvitationContent } from "@/lib/invitations/schema";
import "./editor.css";

/** The phone the desktop preview imitates: a common 390 × 844 viewport. */
const PHONE = { width: 390, height: 844 };

export type PreviewMessage = {
  type: "brindo:preview";
  templateId: string;
  eventType: EventType;
  maxPartySize: number;
  content: InvitationContent;
};

type PhonePreviewProps = {
  src: string;
  templateId: string;
  eventType: EventType;
  maxPartySize: number;
  content: InvitationContent;
  /** Phones: shown full-screen. Desktop shows the phone frame regardless. */
  open: boolean;
  onClose: () => void;
};

/**
 * The real template in an iframe at phone width, so viewport units and breakpoints behave as on a
 * guest's phone. Content updates arrive by postMessage (same origin only), with no reload.
 */
export function PhonePreview({ src, templateId, eventType, maxPartySize, content, open, onClose }: PhonePreviewProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const latest = useRef<PreviewMessage>({ type: "brindo:preview", templateId, eventType, maxPartySize, content });

  const post = () => frameRef.current?.contentWindow?.postMessage(latest.current, location.origin);

  useEffect(() => {
    latest.current = { type: "brindo:preview", templateId, eventType, maxPartySize, content };
    post();
  }, [templateId, eventType, maxPartySize, content]);

  // The frame says when it is listening; send it the latest draft then.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin === location.origin && e.source === frameRef.current?.contentWindow && e.data?.type === "brindo:ready") post();
    };
    addEventListener("message", onMessage);
    return () => removeEventListener("message", onMessage);
  }, []);

  // Desktop: scale the phone to the height available in the sticky column.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      const scale = Math.min(1, entry.contentRect.height / (PHONE.height + 20), entry.contentRect.width / (PHONE.width + 20));
      box.style.setProperty("--phone-scale", scale.toFixed(3));
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // Phones, full-screen: lock page scroll, close on Escape, start focus on the close button.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <aside
      ref={boxRef}
      className="editor-preview"
      data-open={open ? "" : undefined}
      role={open ? "dialog" : undefined}
      aria-modal={open || undefined}
      aria-label={copy.editor.previewFrame}
      style={{ "--phone-w": `${PHONE.width}px`, "--phone-h": `${PHONE.height}px` } as CSSProperties}
    >
      <div className="editor-preview-bar inverted items-center justify-between px-4 py-3">
        <span className="text-sm text-muted-foreground">{copy.editor.previewFrame}</span>
        <Button ref={closeRef} variant="secondary" size="sm" onClick={onClose}>
          <X strokeWidth={1.75} aria-hidden /> {copy.editor.closePreview}
        </Button>
      </div>
      <div className="editor-phone">
        <div className="editor-phone-screen">
          <iframe ref={frameRef} src={src} title={copy.editor.previewFrame} />
        </div>
      </div>
    </aside>
  );
}
