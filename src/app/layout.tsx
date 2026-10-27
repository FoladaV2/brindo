import type { Metadata, Viewport } from "next";
import { copy } from "@content/copy.ka";
import { body, display } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: copy.meta.siteName, template: `%s · ${copy.meta.siteName}` },
  description: copy.meta.description,
  applicationName: copy.meta.siteName,
  openGraph: {
    type: "website",
    siteName: copy.meta.siteName,
    locale: "ka_GE",
    title: copy.meta.siteName,
    description: copy.meta.description,
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: "#faf6ef",
  colorScheme: "light",
};

// Runs before first paint: lets CSS hide scroll-reveal content only when JS is running,
// and un-hides it if the app has not hydrated within 4s (slow in-app browsers).
const bootScript = `(function(d){d.classList.add('js');setTimeout(function(){if(!window.__brindoHydrated)d.classList.add('no-hydrate')},4000)})(document.documentElement)`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ka" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
