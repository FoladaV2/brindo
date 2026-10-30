"use client";

import { Copy, Ellipsis, Info, Pencil, Trash2 } from "lucide-react";
import { notify } from "@/lib/notify";
import { copy } from "@content/copy.ka";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Choice, ChoiceGroup } from "@/components/ui/choice";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const t = copy.brandStyleguide;

export function SelectSpecimen() {
  return (
    <div className="grid gap-2">
      <Label htmlFor="sg-type">{t.forms.eventType}</Label>
      <Select defaultValue={t.forms.eventTypes[2]}>
        <SelectTrigger id="sg-type">
          <SelectValue placeholder={t.forms.eventTypePlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {t.forms.eventTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ToggleSpecimens() {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
      <div className="flex items-center gap-3">
        <Checkbox id="sg-remember" defaultChecked />
        <Label htmlFor="sg-remember">{t.forms.remember}</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="sg-notify" defaultChecked />
        <Label htmlFor="sg-notify">{t.forms.reminders}</Label>
      </div>
    </div>
  );
}

export function QuestionSpecimen() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t.forms.questionStep}</span>
          <span className="tabular">30%</span>
        </div>
        <Progress value={30} aria-label={t.components.progress} />
      </div>
      <h3 className="font-display text-heading">{t.forms.question}</h3>
      <ChoiceGroup defaultValue="2" aria-label={t.forms.question}>
        {t.forms.answers.map((answer, i) => (
          <Choice key={answer.label} value={String(i + 1)} label={answer.label} hint={answer.hint} />
        ))}
      </ChoiceGroup>
    </div>
  );
}

export function TabsSpecimen() {
  return (
    <Tabs defaultValue="coming" className="gap-5">
      <TabsList>
        <TabsTrigger value="coming">{t.components.tabs.coming}</TabsTrigger>
        <TabsTrigger value="not">{t.components.tabs.notComing}</TabsTrigger>
      </TabsList>
      <TabsContent value="coming" className="text-muted-foreground">
        {t.components.tabsBody.coming}
      </TabsContent>
      <TabsContent value="not" className="text-muted-foreground">
        {t.components.tabsBody.notComing}
      </TabsContent>
    </Tabs>
  );
}

export function FaqSpecimen() {
  return (
    <Accordion type="single" collapsible defaultValue="0" className="border-t">
      {t.components.faq.map((item, i) => (
        <AccordionItem key={item.q} value={String(i)}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent>{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function OverlaySpecimens() {
  const c = t.components;
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-wrap items-center gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">{c.dialog.open}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{c.dialog.title}</DialogTitle>
              <DialogDescription>{c.dialog.body}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3">
              <DialogClose asChild>
                <Button variant="ghost">{c.dialog.cancel}</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button>{c.dialog.confirm}</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">{c.sheet.open}</Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>{c.sheet.title}</SheetTitle>
            </SheetHeader>
            <div className="grid gap-1 px-6 pb-8">
              {Object.values(t.nav).map((item) => (
                <a key={item} href="#" className="rounded-md px-3 py-3 text-lg hover:bg-accent">
                  {item}
                </a>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label={c.menu.open}>
              <Ellipsis strokeWidth={1.75} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>
              <Pencil strokeWidth={1.75} /> {c.menu.edit}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy strokeWidth={1.75} /> {c.menu.copy}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 strokeWidth={1.75} /> {c.menu.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost">
              <Info strokeWidth={1.75} /> {c.tooltip.trigger}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{c.tooltip.body}</TooltipContent>
        </Tooltip>

        <Button variant="secondary" onClick={() => notify.done(c.toast.body, { description: copy.toasts.linkCopiedHint })}>
          {c.toast.trigger}
        </Button>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}
