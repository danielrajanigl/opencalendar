import { CalendarPlus, Check, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getDb } from "@/db/client";
import { CancelBookingForm, LocalTime } from "@/features/bookings/components/manage-booking";
import { mapLink } from "@/features/bookings/location";
import { bookingPagePath } from "@/features/bookings/server/booking-path";
import { attendeeMayCancel, remainingOccurrences } from "@/features/bookings/server/decisions";
import { findBookingForManage } from "@/features/bookings/server/service";
import { googleCalendarUrl, outlookCalendarUrl } from "@/lib/calendar-links";
import { requestTime } from "@/lib/clock";
import { getEnv } from "@/lib/env";
import { guestText, type GuestText } from "@/lib/i18n/guest";

// The URL carries the manage token: never send it as a referrer, never index it.
export function generateMetadata(): Metadata {
  return { title: guestText(getEnv().GUEST_LANGUAGE).confirmation.pageTitle, robots: { index: false }, referrer: "no-referrer" };
}

/**
 * Confirmation and self-service page (BKG-007/008/009). With a valid manage token the booker
 * sees attendee details and can cancel or reschedule; without it only the basics are shown.
 */
export default async function BookingPage({ params, searchParams }: PageProps<"/booking/[uid]">) {
  const { uid } = await params;
  const { token, new: isNew } = await searchParams;
  const t = guestText(getEnv().GUEST_LANGUAGE).confirmation;
  const tokenValue = typeof token === "string" ? token : null;
  const found = await findBookingForManage(getDb(), uid, tokenValue);
  if (!found) notFound();
  const { booking: b, host, eventType, seat } = found;
  // Seat holders (EVT-012) see their own booking details; other seats only if the host allows.
  const canManage = found.canManage || seat !== null;
  const attendees = seat && !eventType.seatsShowAttendees ? [seat] : found.attendees;

  const now = requestTime();
  const start = b.startAt.getTime();
  const end = b.endAt.getTime();
  const cancelled = b.status === "cancelled" || b.status === "rejected";
  const pending = b.status === "pending";
  const upcoming = !cancelled && end > now;
  const selfCancel = attendeeMayCancel(eventType, start, now);
  const selfReschedule = found.canManage && !eventType.disableRescheduling && !b.recurringSeriesId && selfCancel;
  const series = found.canManage && b.recurringSeriesId ? await remainingOccurrences(getDb(), b.recurringSeriesId, now) : [];
  // Where to book this event type again: /team/{team}/{slug} for team event types, not the
  // organizer's own page (that one 404s for them). Only looked up when a link is shown.
  const bookingPath = selfReschedule || cancelled ? await bookingPagePath(getDb(), b.eventTypeId, b.organizerId) : null;
  const location = canManage ? b.locationValue : null;
  const icsUrl = `/api/bookings/${encodeURIComponent(uid)}/ics${tokenValue ? `?token=${encodeURIComponent(tokenValue)}` : ""}`;
  // Without the manage token nobody learns who booked: show the event type, not the booking title.
  const title = canManage ? b.title : t.titleWith(eventType.title, host.name);
  const calendarEvent = { title, start, end, details: (seat ? seat.notes : found.canManage ? b.notes : null) ?? undefined, location: location ?? undefined };

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-12">
      <Card className="[--card-spacing:--spacing(6)]">
        <CardContent className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span
            className={`flex size-10 items-center justify-center rounded-full ${cancelled ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}
            aria-hidden
          >
            {cancelled ? <X className="size-5" /> : <Check className="size-5" />}
          </span>
          <h1 className="text-xl font-semibold">
            {b.status === "rejected"
              ? t.declined
              : cancelled
                ? b.rescheduled
                  ? t.rescheduled
                  : t.cancelled
                : pending
                  ? t.waiting
                  : isNew
                    ? t.scheduled
                    : t.yourBooking}
          </h1>
        </div>
        {isNew && !cancelled && !pending && <p className="text-sm text-muted-foreground">{t.invitationSent}</p>}
        {pending && <p className="text-sm text-muted-foreground">{t.pendingNote(host.name)}</p>}
        {series.length > 1 && <p className="text-sm text-muted-foreground">{t.seriesNote(series.length)}</p>}
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">{t.what}</dt>
          <dd className="font-medium">{title}</dd>
          <dt className="text-muted-foreground">{t.when}</dt>
          <dd className={cancelled ? "line-through" : ""}>
            <LocalTime start={start} end={end} />
          </dd>
          <dt className="text-muted-foreground">{found.hosts.length > 1 ? t.hosts : t.host}</dt>
          <dd>{found.hosts.map((h) => h.name).join(", ")}</dd>
          {canManage && (
            <>
              <dt className="text-muted-foreground">{t.invitees}</dt>
              <dd>
                <ul>
                  {attendees.map((a) => (
                    <li key={a.id}>
                      {a.isGuest ? a.email : `${a.name} (${a.email})`}
                    </li>
                  ))}
                </ul>
              </dd>
            </>
          )}
          {canManage && b.locationKind && (
            <>
              <dt className="text-muted-foreground">{t.where}</dt>
              <dd className="break-all">
                <LocationDetails kind={b.locationKind} value={location} t={t} />
              </dd>
            </>
          )}
          {canManage && (b.cancellationReason || b.rejectionReason) && cancelled && (
            <>
              <dt className="text-muted-foreground">{t.reason}</dt>
              <dd>{b.rejectionReason ?? b.cancellationReason}</dd>
            </>
          )}
        </dl>

        {upcoming && !pending && (
          <>
          <Separator />
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <CalendarPlus className="size-4" aria-hidden /> {t.addToCalendar}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href={googleCalendarUrl(calendarEvent)} target="_blank" rel="noopener noreferrer">
                  Google
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={outlookCalendarUrl(calendarEvent)} target="_blank" rel="noopener noreferrer">
                  Outlook
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={icsUrl} download="invite.ics">
                  Apple / .ics
                </a>
              </Button>
            </div>
          </div>
          </>
        )}

        {canManage && upcoming && tokenValue && (selfCancel ? (
          <>
          <Separator />
          <div className="flex flex-wrap items-start gap-2">
            {selfReschedule && bookingPath && (
              <Button asChild>
                <Link href={`${bookingPath}?reschedule=${encodeURIComponent(uid)}&token=${encodeURIComponent(tokenValue)}`}>{t.reschedule}</Link>
              </Button>
            )}
            <CancelBookingForm uid={uid} token={tokenValue} label={seat ? t.cancelSeat : pending ? t.withdraw : t.cancel} series={series.length > 1} />
          </div>
          </>
        ) : (
          <>
          <Separator />
          <p className="text-sm text-muted-foreground">{t.cannotChange(host.name)}</p>
          </>
        ))}
        {cancelled && bookingPath && (
          <Alert>
            <AlertDescription>
              {t.needNewTime}{" "}
              <Link className="font-medium" href={bookingPath}>
                {t.bookAgain}
              </Link>
            </AlertDescription>
          </Alert>
        )}
        </CardContent>
      </Card>
    </main>
  );
}

const videoNames = (t: GuestText["confirmation"]): Record<string, string> => ({ google_meet: "Google Meet", ms_teams: "Microsoft Teams", zoom: "Zoom", jitsi: "Jitsi Meet", link: t.meetingLink });

/** Location details for participants (INT-010/011). */
function LocationDetails({ kind, value, t }: { kind: string; value: string | null; t: GuestText["confirmation"] }) {
  const VIDEO_NAMES = videoNames(t);
  const link = (url: string, label?: string) => (
    <a href={url} className="underline" rel="noopener noreferrer" target="_blank">
      {label ?? url}
    </a>
  );
  if (kind in VIDEO_NAMES) {
    if (value && /^https?:\/\//.test(value)) return <>{VIDEO_NAMES[kind]}: {link(value)}</>;
    return <>{VIDEO_NAMES[kind]} {t.linkInEmail}</>;
  }
  if (kind === "in_person" && value) return <>{value} · {link(mapLink(value), t.openMap)}</>;
  if ((kind === "phone_host" || kind === "phone") && value) return <>{t.call} {link(`tel:${value}`, value)}</>;
  if (kind === "phone_attendee" && value) return <>{t.hostWillCall(value)}</>;
  return <>{value}</>;
}
