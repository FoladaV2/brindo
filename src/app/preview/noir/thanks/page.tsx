import { ThanksPreview } from "../../thanks-preview";

export default function Page({ searchParams }: PageProps<"/preview/noir/thanks">) {
  return <ThanksPreview id="noir" searchParams={searchParams} />;
}
