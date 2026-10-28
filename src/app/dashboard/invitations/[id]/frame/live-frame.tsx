"use client";

import { useEffect, useState } from "react";
import { invitationContentSchema, type InvitationContent } from "@/lib/invitations/schema";
import { InvitationRenderer } from "@/templates/InvitationRenderer";
import { isTemplateId } from "@/templates/registry";

type LiveFrameProps = { templateId: string; content: InvitationContent };

/**
 * Inside the editor's preview iframe: renders the real template and swaps in each draft the editor
 * posts. Accepts messages only from its own parent on the same origin, and only valid content.
 */
export function LiveFrame(initial: LiveFrameProps) {
  const [state, setState] = useState(initial);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== window.parent || e.data?.type !== "brindo:preview") return;
      const content = invitationContentSchema.safeParse(e.data.content);
      if (content.success && isTemplateId(e.data.templateId)) setState({ templateId: e.data.templateId, content: content.data });
    };
    addEventListener("message", onMessage);
    if (window.parent !== window) window.parent.postMessage({ type: "brindo:ready" }, location.origin);
    return () => removeEventListener("message", onMessage);
  }, []);

  return <InvitationRenderer templateId={state.templateId} content={state.content} calendarHref="#" />;
}
