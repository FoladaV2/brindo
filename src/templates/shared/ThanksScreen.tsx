import { copy } from "@content/copy.ka";
import { templateSurface } from "@/templates/registry";
import { Grain } from "@/templates/ui/Grain";
import { Halo } from "@/templates/ui/Halo";
import { ThanksCard } from "./Thanks";
import "../invitation.css";
import "../noir/noir.css";

type ThanksScreenProps = {
  templateId: string;
  rsvp: { slug: string; submit: "live" | "demo" };
  invitationHref: string;
};

/** The thank-you card over the invitation's own colors, so it feels like the same moment. */
export function ThanksScreen({ templateId, rsvp, invitationHref }: ThanksScreenProps) {
  const surface = templateSurface(templateId);
  return (
    <main data-surface={surface} data-template={templateId} className="thanks isolate bg-bg text-fg">
      <Grain />
      <Halo />
      <ThanksCard strings={copy.invitation.thanks} closeLabel={copy.ui.close} rsvp={rsvp} invitationHref={invitationHref} surface={surface} />
    </main>
  );
}
