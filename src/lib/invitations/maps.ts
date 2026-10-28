import type { InvitationContent } from "./schema";

/** Universal map links: they open the app when installed and the website otherwise. */
export function mapLinks(venue: InvitationContent["venue"]) {
  const query = venue.mapQuery ?? [venue.name, venue.address.split("\n")[0], venue.city].join(", ");
  const q = encodeURIComponent(query);
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${q}`,
    apple: `https://maps.apple.com/?q=${q}`,
  };
}
