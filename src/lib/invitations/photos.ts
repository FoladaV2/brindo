/**
 * Couples' photos in Supabase Storage. Layout and rules match supabase/migrations/*_storage.sql:
 * invitation-photos/<owner user id>/<random name>.<webp|jpg>
 */
export const PHOTO_BUCKET = "invitation-photos";
/** Longest side after the client-side resize. */
export const PHOTO_MAX_EDGE = 1600;
export const PHOTO_QUALITY = 0.82;

const FILE_NAME = /^[A-Za-z0-9_-]{22,64}\.(jpg|jpeg|png|webp)$/;

/** Where the browser uploads: the owner's folder and a random name nobody can guess. */
export function photoPath(userId: string, extension: "webp" | "jpg") {
  return `${userId}/${crypto.randomUUID()}.${extension}`;
}

export function publicPhotoUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

/** True only for a photo in this user's own folder of our bucket. Content may point nowhere else. */
export function isOwnPhotoUrl(url: string, supabaseUrl: string, userId: string) {
  const prefix = publicPhotoUrl(supabaseUrl, `${userId}/`);
  return url.startsWith(prefix) && FILE_NAME.test(url.slice(prefix.length));
}
