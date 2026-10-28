import type { NextConfig } from "next";

// Couples' photos live in the Supabase Storage bucket; next/image may optimize only those.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const photoPattern = supabaseUrl ? new URL("/storage/v1/object/public/invitation-photos/**", supabaseUrl) : null;
const localSupabase = photoPattern !== null && ["127.0.0.1", "localhost"].includes(photoPattern.hostname);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Inlined at build time, so /styleguide and /preview (pages and route handlers alike) are decided
  // by the build, not by the environment of the server that runs it.
  env: {
    STYLEGUIDE_ENABLED: process.env.STYLEGUIDE_ENABLED ?? "false",
  },
  // Metadata goes in <head> for every client, not streamed. Link previews come from Viber, Telegram
  // and others that aren't on Next's default bot list, and invitation pages answer 404 from
  // generateMetadata, which only sets the status code when metadata blocks.
  htmlLimitedBots: /.*/,
  images: {
    remotePatterns: photoPattern ? [photoPattern] : [],
    // Only for the local Supabase stack (127.0.0.1); never true against a hosted project.
    dangerouslyAllowLocalIP: localSupabase,
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
