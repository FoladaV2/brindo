import { FullPreview, previewMetadata } from "../template-preview";

export const metadata = previewMetadata("lumiere");

export default function Page({ searchParams }: PageProps<"/preview/lumiere">) {
  return <FullPreview id="lumiere" searchParams={searchParams} />;
}
