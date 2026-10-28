import { previewMetadata, ShortPreview } from "../../template-preview";

export const metadata = previewMetadata("noir", true);

export default function Page() {
  return <ShortPreview id="noir" />;
}
