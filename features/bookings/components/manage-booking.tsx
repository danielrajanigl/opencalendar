"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTimeRange, prefers12Hour } from "@/lib/format";
import { pickBookerLocale } from "./booker-view";
import { cancelBookingAction } from "../server/public-actions";
import { useGuestText } from "@/features/i18n/guest-text";

/** Booking time shown in the viewer's own zone and clock (BKG-007). */
export function LocalTime({ start, end }: { start: number; end: number }) {
  const [label, setLabel] = useState<string | null>(null);
  const { lang } = useGuestText();
  useEffect(() => {
    const locale = pickBookerLocale(lang, navigator.language || "en-US");
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only formatting
    setLabel(`${formatDateTimeRange(start, end, { locale, timeZone, hour12: prefers12Hour(locale) })} (${timeZone.replaceAll("_", " ")})`);
  }, [start, end, lang]);
  return <span suppressHydrationWarning>{label ?? new Date(start).toISOString().replace("T", " ").slice(0, 16) + " UTC"}</span>;
}

export function CancelBookingForm({ uid, token, label, series = false }: { uid: string; token: string; label?: string; series?: boolean }) {
  const router = useRouter();
  const { t } = useGuestText();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"booking" | "series">("booking");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        {label ?? t.confirmation.cancel}
      </Button>
    );
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "") || undefined;
    const result = await cancelBookingAction({ uid, token, reason, scope });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-3">
      {series && (
        <FieldSet className="gap-1.5">
          <FieldLegend variant="label" className="mb-1">
            {t.manage.whatToCancel}
          </FieldLegend>
          <RadioGroup name="scope" value={scope} onValueChange={(v) => setScope(v === "series" ? "series" : "booking")}>
            <Field orientation="horizontal">
              <RadioGroupItem id="scope-booking" value="booking" />
              <FieldLabel htmlFor="scope-booking" className="font-normal">
                {t.manage.onlyThis}
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem id="scope-series" value="series" />
              <FieldLabel htmlFor="scope-series" className="font-normal">
                {t.manage.thisAndRemaining}
              </FieldLabel>
            </Field>
          </RadioGroup>
        </FieldSet>
      )}
      <FormField label={t.manage.reason} htmlFor="reason">
        <Input id="reason" name="reason" maxLength={500} />
      </FormField>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending && <Spinner />}
          {pending ? t.manage.cancelling : t.manage.confirmCancel}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          {t.manage.keep}
        </Button>
      </div>
    </form>
  );
}
