import { previewMetadata, ShortPreview } from "../../template-preview";

export const metadata = previewMetadata("lumiere", true);

export default function Page() {
  return <ShortPreview id="lumiere" />;
}
