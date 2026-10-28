"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { X } from "lucide-react";
import { copy } from "@content/copy.ka";
import type { InvitationContent } from "@/lib/invitations/schema";

/** The phone the desktop preview imitates: a common 390 × 844 viewport. */
const PHONE = { width: 390, height: 844 };

export type PreviewMessage = { type: "brindo:preview"; templateId: string; content: InvitationContent };

type PhonePreviewProps = {
  src: string;
  templateId: string;
  content: InvitationContent;
  /** Mobile: shown full-screen. Desktop shows the phone frame regardless. */
  open: boolean;
  onClose: () => void;
};

/**
 * The real template in an iframe at phone width, so viewport units and breakpoints behave as on a
 * guest's phone. Content updates arrive by postMessage (same origin only), with no reload.
 */
export function PhonePreview({ src, templateId, content, open, onClose }: PhonePreviewProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const latest = useRef<PreviewMessage>({ type: "brindo:preview", templateId, content });

  const post = () => frameRef.current?.contentWindow?.postMessage(latest.current, location.origin);

  useEffect(() => {
    latest.current = { type: "brindo:preview", templateId, content };
    post();
  }, [templateId, content]);

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
      const scale = Math.min(1, entry.contentRect.height / (PHONE.height + 24), entry.contentRect.width / (PHONE.width + 24));
      box.style.setProperty("--phone-scale", scale.toFixed(3));
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // Mobile full-screen: lock page scroll, close on Escape, start focus on the close button.
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
      <div aria-hidden className="editor-preview-halo" />
      <div className="editor-phone">
        <div className="editor-phone-screen">
          <iframe ref={frameRef} src={src} title={copy.editor.previewFrame} />
        </div>
      </div>
      <button ref={closeRef} type="button" onClick={onClose} className="editor-preview-close">
        <X size={18} strokeWidth={1.25} aria-hidden />
        {copy.editor.closePreview}
      </button>
    </aside>
  );
}
