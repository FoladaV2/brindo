import { describe, expect, it } from "vitest";
import { isOwnPhotoUrl, photoPath, publicPhotoUrl } from "./photos";

const SUPABASE = "https://abc.supabase.co";
const USER = "a0000000-0000-4000-8000-00000000000a";
const OTHER = "b0000000-0000-4000-8000-00000000000b";

describe("photo paths", () => {
  it("puts uploads in the user's folder under a random name the storage policy accepts", () => {
    const path = photoPath(USER, "webp");
    expect(path).toMatch(new RegExp(`^${USER}/[A-Za-z0-9_-]{22,64}\\.webp$`));
    expect(photoPath(USER, "webp")).not.toBe(path);
  });

  it("accepts only the user's own public photo URLs", () => {
    const own = publicPhotoUrl(SUPABASE, photoPath(USER, "webp"));
    expect(isOwnPhotoUrl(own, SUPABASE, USER)).toBe(true);
    expect(isOwnPhotoUrl(own, SUPABASE, OTHER)).toBe(false);
    expect(isOwnPhotoUrl(publicPhotoUrl(SUPABASE, photoPath(OTHER, "jpg")), SUPABASE, USER)).toBe(false);
    expect(isOwnPhotoUrl(own.replace("abc.supabase.co", "evil.example"), SUPABASE, USER)).toBe(false);
    expect(isOwnPhotoUrl(publicPhotoUrl(SUPABASE, `${USER}/../${OTHER}/x.webp`), SUPABASE, USER)).toBe(false);
    expect(isOwnPhotoUrl(publicPhotoUrl(SUPABASE, `${USER}/short.webp`), SUPABASE, USER)).toBe(false);
  });
});
