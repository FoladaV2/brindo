import { z } from "zod";

// Same rule as the invitations_slug_format constraint; rejects junk before it reaches the database.
// Kept apart from public.ts (server only), so client code can validate slugs too.
export const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/);
