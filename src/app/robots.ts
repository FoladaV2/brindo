import type { MetadataRoute } from "next";

// Messenger link-preview fetchers may read invitations (they also carry noindex); other crawlers may not.
const LINK_PREVIEW_BOTS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "WhatsApp",
  "TelegramBot",
  "Viber",
  "Slackbot",
  "LinkedInBot",
  "Discordbot",
  "SkypeUriPreview",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: LINK_PREVIEW_BOTS, allow: "/i/" },
      { userAgent: "*", disallow: ["/i/", "/dashboard", "/auth", "/preview", "/styleguide"] },
    ],
  };
}
