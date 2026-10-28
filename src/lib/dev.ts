/**
 * Development-only pages and tools (/styleguide, /preview, the editor's publish toggle).
 * Production builds include them only when built with STYLEGUIDE_ENABLED=true (see next.config.ts).
 */
export const devToolsEnabled = process.env.NODE_ENV !== "production" || process.env.STYLEGUIDE_ENABLED === "true";
