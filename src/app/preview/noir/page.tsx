import { FullPreview, previewMetadata } from "../template-preview";

export const metadata = previewMetadata("noir");

export default function Page({ searchParams }: PageProps<"/preview/noir">) {
  return <FullPreview id="noir" searchParams={searchParams} />;
}
