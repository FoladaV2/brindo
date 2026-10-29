"use client";

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { copy } from "@content/copy.ka";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PHOTO_BUCKET, PHOTO_MAX_EDGE, PHOTO_QUALITY, photoPath, publicPhotoUrl } from "@/lib/invitations/photos";
import { createClient } from "@/lib/supabase/client";
import { supabaseAnonKey } from "@/lib/supabase/env";
import type { Photo } from "./form-state";

const t = copy.editor.photo;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const BLUR_EDGE = 12;
const FOCUS_STEP = 5;

type Status = { kind: "idle" } | { kind: "preparing" } | { kind: "uploading"; progress: number } | { kind: "error"; message: string };

type Prepared = { blob: Blob; extension: "webp" | "jpg"; blurDataUrl?: string };

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, PHOTO_QUALITY));

/** Resize to at most 1600px on the long side and re-encode as WebP (JPEG where WebP encoding is missing). */
async function prepare(file: File): Promise<Prepared> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);

  let blob = await toBlob(canvas, "image/webp");
  let extension: Prepared["extension"] = "webp";
  if (!blob || blob.type !== "image/webp") {
    blob = await toBlob(canvas, "image/jpeg");
    extension = "jpg";
  }
  if (!blob) throw new Error("encode");

  // A 12px copy, shown blurred on the invitation while the photo loads.
  const tiny = document.createElement("canvas");
  tiny.width = BLUR_EDGE;
  tiny.height = Math.max(1, Math.round((BLUR_EDGE * height) / width));
  tiny.getContext("2d")!.drawImage(bitmap, 0, 0, tiny.width, tiny.height);
  const blurDataUrl = tiny.toDataURL("image/webp", 0.5);
  bitmap.close();

  return { blob, extension, blurDataUrl: blurDataUrl.length <= 2000 ? blurDataUrl : undefined };
}

/** Upload with XMLHttpRequest, which reports progress; the storage policy checks the folder and name. */
function upload(supabaseUrl: string, path: string, blob: Blob, token: string, onProgress: (share: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${PHOTO_BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", supabaseAnonKey());
    xhr.setRequestHeader("Content-Type", blob.type);
    // Every upload gets a new random name, so the file never changes and can be cached for a year.
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`status ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(blob);
  });
}

type PhotoFieldProps = {
  photo: Photo | null;
  onChange: (photo: Photo | null) => void;
  userId: string;
  supabaseUrl: string;
};

export function PhotoField({ photo, onChange, userId, supabaseUrl }: PhotoFieldProps) {
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // Shows the resized photo immediately while the public URL is still on its way.
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      setStatus({ kind: "error", message: t.unsupported });
      return;
    }
    try {
      setStatus({ kind: "preparing" });
      const prepared = await prepare(file);
      const { data } = await createClient().auth.getSession();
      if (!data.session) throw new Error("session");

      const path = photoPath(userId, prepared.extension);
      setLocalUrl(URL.createObjectURL(prepared.blob));
      setStatus({ kind: "uploading", progress: 0 });
      await upload(supabaseUrl, path, prepared.blob, data.session.access_token, (progress) =>
        setStatus({ kind: "uploading", progress }),
      );
      setStatus({ kind: "idle" });
      onChange({ url: publicPhotoUrl(supabaseUrl, path), blurDataUrl: prepared.blurDataUrl, focus: { x: 50, y: 50 } });
    } catch {
      setLocalUrl(null);
      setStatus({ kind: "error", message: t.failed });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const focus = photo?.focus ?? { x: 50, y: 50 };
  const setFocus = (x: number, y: number) => {
    if (!photo) return;
    const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)) * 10) / 10;
    onChange({ ...photo, focus: { x: clamp(x), y: clamp(y) } });
  };
  const onPick = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFocus(((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100);
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-FOCUS_STEP, 0],
      ArrowRight: [FOCUS_STEP, 0],
      ArrowUp: [0, -FOCUS_STEP],
      ArrowDown: [0, FOCUS_STEP],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    setFocus(focus.x + move[0], focus.y + move[1]);
  };

  const busy = status.kind === "preparing" || status.kind === "uploading";
  const shown = localUrl ?? photo?.url;

  return (
    <div className="flex flex-col gap-6">
      {shown && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onPick}
            onKeyDown={onKey}
            disabled={busy || !photo}
            aria-describedby={hintId}
            aria-label={`${t.focusLabel}: ${Math.round(focus.x)}%, ${Math.round(focus.y)}%`}
            className="editor-focus"
          >
            {/* A plain img: the picker needs the photo's own box to map clicks to percentages. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown} alt="" draggable={false} />
            {photo && (
              <span aria-hidden className="editor-focus-mark" style={{ left: `${focus.x}%`, top: `${focus.y}%` } as CSSProperties} />
            )}
          </button>
          <p id={hintId} className="text-sm text-muted-foreground">
            {t.focus}
          </p>
        </div>
      )}

      {status.kind === "uploading" || status.kind === "preparing" ? (
        <div className="flex flex-col gap-3" role="status" aria-live="polite">
          <div className="flex justify-between text-sm text-muted-foreground tabular-nums">
            <span>{status.kind === "preparing" ? t.preparing : t.uploading}</span>
            {status.kind === "uploading" && <span>{Math.round(status.progress * 100)}%</span>}
          </div>
          <Progress value={status.kind === "uploading" ? status.progress * 100 : 4} aria-label={t.uploading} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPT.join(",")}
            className="editor-file sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <label htmlFor={inputId} className={buttonVariants({ variant: "outline" })}>
            <ImagePlus strokeWidth={1.75} aria-hidden />
            {photo ? t.replace : t.choose}
          </label>
          {photo && (
            <button
              type="button"
              onClick={() => {
                setLocalUrl(null);
                onChange(null);
              }}
              className={buttonVariants({ variant: "ghost" })}
            >
              <Trash2 strokeWidth={1.75} aria-hidden />
              {t.remove}
            </button>
          )}
        </div>
      )}
      {status.kind === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {status.message}
        </p>
      )}
      {!photo && status.kind === "idle" && <p className="text-sm text-muted-foreground">{t.hint}</p>}
    </div>
  );
}
