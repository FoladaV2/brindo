/** A guest's answer as the host sees it. */
export type HostResponse = {
  id: string;
  firstName: string;
  lastName: string;
  attending: boolean;
  /** People coming, the guest included; null when not coming. */
  partySize: number | null;
  /** When the answer was first given, ISO. */
  createdAt: string;
  updatedAt: string;
};

export type ResponseSummary = {
  coming: HostResponse[];
  notComing: HostResponse[];
  /** Everyone coming, every party counted in full: the number the venue needs. */
  people: number;
  replies: number;
  /** Ids of answers that share a name with another answer (case and spacing ignored). */
  possibleDuplicates: ReadonlySet<string>;
};

const nameKey = (r: HostResponse) => `${r.firstName} ${r.lastName}`.normalize("NFC").toLocaleLowerCase("ka").replace(/\s+/g, " ").trim();

/** Splits answers into coming and not coming (newest first) and adds up the people. */
export function summarize(responses: readonly HostResponse[]): ResponseSummary {
  const newestFirst = [...responses].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
  const coming = newestFirst.filter((r) => r.attending);
  const notComing = newestFirst.filter((r) => !r.attending);

  const byName = new Map<string, string[]>();
  for (const r of responses) byName.set(nameKey(r), [...(byName.get(nameKey(r)) ?? []), r.id]);
  const possibleDuplicates = new Set([...byName.values()].filter((ids) => ids.length > 1).flat());

  return {
    coming,
    notComing,
    people: coming.reduce((sum, r) => sum + (r.partySize ?? 1), 0),
    replies: responses.length,
    possibleDuplicates,
  };
}
