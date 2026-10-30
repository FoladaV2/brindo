"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ellipsis, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { notify } from "@/lib/notify";
import { copy } from "@content/copy.ka";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { summarize, type HostResponse } from "@/lib/responses/summary";
import { fill } from "@/lib/text";
import { deleteResponse } from "./actions";

const t = copy.responses;

type ResponsesViewProps = {
  invitationId: string;
  title: string;
  responses: HostResponse[];
  /** The preview page: deleting works on the page only. */
  demo?: boolean;
};

const fullName = (r: HostResponse) => `${r.firstName} ${r.lastName}`.trim();

/** Who is coming, who is not, and the total the venue needs. */
export function ResponsesView({ invitationId, title, responses: initial, demo = false }: ResponsesViewProps) {
  const router = useRouter();
  const [responses, setResponses] = useState(initial);
  const [confirming, setConfirming] = useState<HostResponse | null>(null);
  const [deleting, startDeleting] = useTransition();
  const summary = summarize(responses);

  const remove = (response: HostResponse) =>
    startDeleting(async () => {
      const result = demo ? { ok: true } : await deleteResponse(invitationId, response.id);
      if (!result.ok) {
        notify.error(t.deleteFailed);
        return;
      }
      setResponses((list) => list.filter((r) => r.id !== response.id));
      setConfirming(null);
      notify.success(t.deleted);
      if (!demo) router.refresh();
    });

  return (
    <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-8 px-gutter-brand pt-6 pb-28 sm:pt-10">
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard" className="-ml-2 inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
          {t.back}
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/invitations/${invitationId}/edit`}>
            <Pencil strokeWidth={1.75} /> {t.edit}
          </Link>
        </Button>
      </div>

      <div className="grid gap-2">
        <span className="eyebrow">{t.title}</span>
        <h1 className="font-display text-title">{title}</h1>
      </div>

      <section aria-label={t.totalLabel} className="inverted grid gap-6 rounded-2xl p-7 sm:grid-cols-[1fr_auto] sm:items-end sm:p-9">
        <div className="grid gap-1">
          <span className="text-sm text-muted-foreground">{t.totalLabel}</span>
          <span className="font-display text-[clamp(3.5rem,2.8rem+3vw,5.5rem)] leading-none tabular">{summary.people}</span>
          <span className="text-muted-foreground">{t.peopleUnit}</span>
        </div>
        <dl className="flex gap-8 text-sm">
          <div className="grid gap-0.5">
            <dt className="text-muted-foreground">{t.coming}</dt>
            <dd className="font-display text-heading tabular">{summary.coming.length}</dd>
          </div>
          <div className="grid gap-0.5">
            <dt className="text-muted-foreground">{t.notComing}</dt>
            <dd className="font-display text-heading tabular">{summary.notComing.length}</dd>
          </div>
        </dl>
      </section>

      {responses.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-display text-heading">{t.empty.heading}</p>
          <p className="max-w-sm text-muted-foreground">{t.empty.body}</p>
        </div>
      ) : (
        <Tabs defaultValue="coming" className="gap-5">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="coming">
              {t.coming} <span className="text-muted-foreground tabular">{summary.coming.length}</span>
            </TabsTrigger>
            <TabsTrigger value="not">
              {t.notComing} <span className="text-muted-foreground tabular">{summary.notComing.length}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="coming">
            <ResponseList
              items={summary.coming}
              empty={t.emptyComing}
              duplicates={summary.possibleDuplicates}
              onDelete={setConfirming}
              line={(r) => (
                <>
                  <span className="min-w-0 truncate font-medium">{fullName(r)}</span>
                  <span className="shrink-0 text-muted-foreground tabular">{fill(t.comingLine, { n: r.partySize ?? 1 })}</span>
                </>
              )}
            />
          </TabsContent>
          <TabsContent value="not">
            <ResponseList
              items={summary.notComing}
              empty={t.emptyNotComing}
              duplicates={summary.possibleDuplicates}
              onDelete={setConfirming}
              line={(r) => <span className="min-w-0 truncate">{fill(t.notComingLine, { name: fullName(r) })}</span>}
            />
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteTitle}</DialogTitle>
            <DialogDescription>{confirming ? fill(t.deleteBody, { name: fullName(confirming) }) : null}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <DialogClose asChild>
              <Button variant="ghost">{t.cancel}</Button>
            </DialogClose>
            <Button disabled={deleting} onClick={() => confirming && remove(confirming)}>
              <Trash2 strokeWidth={1.75} /> {t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResponseList({
  items,
  empty,
  duplicates,
  onDelete,
  line,
}: {
  items: HostResponse[];
  empty: string;
  duplicates: ReadonlySet<string>;
  onDelete: (r: HostResponse) => void;
  line: (r: HostResponse) => ReactNode;
}) {
  if (items.length === 0) return <p className="py-8 text-center text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {items.map((r) => (
        <li key={r.id} className="flex min-h-16 items-center gap-3 py-2 pr-2 pl-5">
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
            {line(r)}
            {duplicates.has(r.id) ? (
              <Badge variant="outline" className="h-6 text-xs">
                <TriangleAlert strokeWidth={1.75} aria-hidden /> {t.duplicate}
              </Badge>
            ) : null}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`${fullName(r)}: ${t.delete}`}>
                <Ellipsis strokeWidth={1.75} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(r)}>
                <Trash2 strokeWidth={1.75} /> {t.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
      ))}
    </ul>
  );
}
