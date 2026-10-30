import { ThanksPreview } from "../../thanks-preview";

export default function Page({ searchParams }: PageProps<"/preview/lumiere/thanks">) {
  return <ThanksPreview id="lumiere" searchParams={searchParams} />;
}
