import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, anon, createCouple, deleteCouple, type Couple } from "./helpers";

const BUCKET = "invitation-photos";
// A valid 1x1 PNG. Storage checks the declared type, not the bytes.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

let a: Couple;
let b: Couple;
let photoOfB: string;
const uploaded: string[] = [];

const photoPath = (owner: Couple, ext = "png") => `${owner.id}/${randomUUID()}.${ext}`;

async function upload(couple: Couple | null, path: string, body: Buffer = PNG, contentType = "image/png") {
  const client = couple ? couple.client : anon();
  const result = await client.storage.from(BUCKET).upload(path, body, { contentType });
  if (!result.error) uploaded.push(path);
  return result;
}

beforeAll(async () => {
  [a, b] = await Promise.all([createCouple("storage-a"), createCouple("storage-b")]);
  photoOfB = photoPath(b);
  const { error } = await upload(b, photoOfB);
  if (error) throw error;
});

afterAll(async () => {
  if (uploaded.length) await admin().storage.from(BUCKET).remove(uploaded);
  await Promise.all([deleteCouple(a), deleteCouple(b)]);
});

describe("invitation photo uploads", () => {
  it.each([
    ["jpg", "image/jpeg"],
    ["png", "image/png"],
    ["webp", "image/webp"],
  ])("a couple can upload a .%s into their own folder, and it is served publicly", async (ext, type) => {
    const path = photoPath(a, ext);
    const { error } = await upload(a, path, PNG, type);
    expect(error).toBeNull();

    const { publicUrl } = a.client.storage.from(BUCKET).getPublicUrl(path).data;
    const response = await fetch(publicUrl);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(type);
  });

  it("rejects an upload into another couple's folder", async () => {
    const { error } = await upload(a, photoPath(b));
    expect(error).not.toBeNull();
  });

  it.each([
    ["the bucket root", () => `${randomUUID()}.png`],
    ["a nested folder", () => `${a.id}/nested/${randomUUID()}.png`],
    ["a guessable name", () => `${a.id}/photo.png`],
    ["a disallowed extension", () => `${a.id}/${randomUUID()}.svg`],
  ])("rejects an upload to %s", async (_label, path) => {
    const { error } = await upload(a, path());
    expect(error).not.toBeNull();
  });

  it.each(["image/gif", "image/svg+xml", "text/html", "application/pdf"])("rejects the type %s", async (type) => {
    const { error } = await upload(a, photoPath(a), PNG, type);
    expect(error).not.toBeNull();
  });

  it("rejects a file over 5 MB", async () => {
    const { error } = await upload(a, photoPath(a, "jpg"), Buffer.alloc(5 * 1024 * 1024 + 1), "image/jpeg");
    expect(error).not.toBeNull();
  });

  it("accepts a file of exactly 5 MB", async () => {
    const { error } = await upload(a, photoPath(a, "jpg"), Buffer.alloc(5 * 1024 * 1024), "image/jpeg");
    expect(error).toBeNull();
  });

  it("rejects uploads from visitors who are not signed in", async () => {
    const { error } = await upload(null, `${a.id}/${randomUUID()}.png`);
    expect(error).not.toBeNull();
  });
});

describe("other couples' photos", () => {
  it("cannot be listed", async () => {
    const own = await b.client.storage.from(BUCKET).list(b.id);
    const other = await a.client.storage.from(BUCKET).list(b.id);
    const visitor = await anon().storage.from(BUCKET).list(b.id);
    expect(own.data?.length).toBeGreaterThan(0); // positive control
    expect(other.data ?? []).toEqual([]);
    expect(visitor.data ?? []).toEqual([]);
  });

  it("cannot be overwritten", async () => {
    const { error } = await a.client.storage
      .from(BUCKET)
      .upload(photoOfB, Buffer.from("replaced"), { contentType: "image/png", upsert: true });
    expect(error).not.toBeNull();
    const original = await admin().storage.from(BUCKET).download(photoOfB);
    expect(Buffer.from(await original.data!.arrayBuffer())).toEqual(PNG);
  });

  it("cannot be deleted", async () => {
    await a.client.storage.from(BUCKET).remove([photoOfB]);
    await anon().storage.from(BUCKET).remove([photoOfB]);
    const stillThere = await admin().storage.from(BUCKET).download(photoOfB);
    expect(stillThere.error).toBeNull();
  });

  it("cannot be moved into the attacker's folder", async () => {
    const { error } = await a.client.storage.from(BUCKET).move(photoOfB, photoPath(a));
    expect(error).not.toBeNull();
  });
});
