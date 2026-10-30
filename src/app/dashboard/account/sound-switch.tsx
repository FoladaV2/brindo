"use client";

import { useId, useSyncExternalStore } from "react";
import { Switch } from "@/components/ui/switch";
import { notify } from "@/lib/notify";
import { setSoundEnabled, soundEnabled, subscribeSoundPreference } from "@/lib/sound";

/** Turns the interface sounds on or off on this device. */
export function SoundSwitch({ label, body, on, off }: { label: string; body: string; on: string; off: string }) {
  const id = useId();
  // The choice lives in this browser's storage, so the server renders it as unknown.
  const enabled = useSyncExternalStore(subscribeSoundPreference, soundEnabled, () => null);

  return (
    <div className="flex items-start justify-between gap-6">
      <div className="grid gap-1">
        <label htmlFor={id} className="font-display text-heading">
          {label}
        </label>
        <p id={`${id}-body`} className="text-muted-foreground">
          {body}
        </p>
      </div>
      <Switch
        id={id}
        aria-describedby={`${id}-body`}
        checked={enabled ?? true}
        disabled={enabled === null}
        className="mt-1"
        onCheckedChange={(checked) => {
          setSoundEnabled(checked);
          // Turning sound on plays the chime, so the host hears what they chose.
          if (checked) notify.success(on);
          else notify.done(off);
        }}
      />
    </div>
  );
}
