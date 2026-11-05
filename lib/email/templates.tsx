import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, render, Text } from "@react-email/components";
import type { CSSProperties, ReactElement } from "react";
import { DEFAULT_EMAIL_BRANDING, type EmailBranding } from "@/features/instance/email-branding";
import type { CalendarPart } from "@/lib/email/transport";
import { formatDateTimeRange, timeZoneLabel } from "@/lib/format";
import { guestText, type GuestLanguage, type GuestText } from "@/lib/i18n/guest";
import type { EmailContent } from "@/lib/jobs/queues";

/**
 * Transactional email templates. Rendered by the worker from a template name + props, so job
 * payloads stay small and never contain rendered HTML.
 */

export type EmailTemplateInput = EmailContent;

export type RenderedEmail = { subject: string; html: string; text: string; calendar?: CalendarPart };

const styles = {
  body: { backgroundColor: "#f6f7f9", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" },
  container: { backgroundColor: "#ffffff", borderRadius: 8, margin: "32px auto", maxWidth: 480, padding: 32 },
  heading: { fontSize: 20, margin: "0 0 16px" },
  text: { color: "#334155", fontSize: 14, lineHeight: "22px" },
  muted: { color: "#64748b", fontSize: 12, lineHeight: "18px" },
  logo: { height: 32, margin: "0 0 20px", width: "auto" },
};

/** Call-to-action button in the instance's email button color (ADM-011). */
const buttonStyle = (b: EmailBranding): CSSProperties => ({
  backgroundColor: b.buttonColor,
  borderRadius: 6,
  color: b.buttonTextColor,
  fontSize: 14,
  padding: "10px 18px",
});

function Layout(props: { branding: EmailBranding; preview: string; heading: string; footer?: string; lang?: GuestLanguage; children: React.ReactNode }) {
  return (
    <Html lang={props.lang ?? "en"}>
      <Head />
      <Preview>{props.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {props.branding.logoUrl ? <Img src={props.branding.logoUrl} alt={props.branding.appName} style={styles.logo} /> : null}
          <Heading style={styles.heading}>{props.heading}</Heading>
          {props.children}
          <Hr />
          <Text style={styles.muted}>{props.footer ?? props.branding.accountFooter}</Text>
        </Container>
      </Body>
    </Html>
  );
}

function ActionEmail(props: { branding: EmailBranding; preview: string; heading: string; intro: string; cta: string; url: string; note: string }) {
  return (
    <Layout branding={props.branding} preview={props.preview} heading={props.heading}>
      <Text style={styles.text}>{props.intro}</Text>
      <Button href={props.url} style={buttonStyle(props.branding)}>
        {props.cta}
      </Button>
      <Text style={styles.muted}>{props.note}</Text>
      <Text style={styles.muted}>Or paste this link into your browser: {props.url}</Text>
    </Layout>
  );
}

type BookingProps = Extract<EmailContent, { template: "booking-scheduled" | "booking-cancelled" | "booking-requested" | "booking-rejected" }>["props"];

function Occurrences({ props, e }: { props: { occurrences?: { start: number; end: number }[]; timeZone: string; locale: string; hour12: boolean }; e: Mail }) {
  if (!props.occurrences?.length) return <></>;
  return (
    <Text style={styles.text}>
      <strong>{e.allDates(props.occurrences.length)}</strong>
      {props.occurrences.map((o) => (
        <span key={o.start}>
          <br />• {formatDateTimeRange(o.start, o.end, props)}
        </span>
      ))}
    </Text>
  );
}

function Answers({ answers }: { answers?: { label: string; value: string }[] }) {
  if (!answers?.length) return <></>;
  return (
    <Text style={styles.text}>
      {answers.map((a, i) => (
        <span key={a.label}>
          {i > 0 ? <br /> : null}
          <strong>{a.label}:</strong> {a.value}
        </span>
      ))}
    </Text>
  );
}

/** The booking facts every booking email lists. */
type BookingSummary = Pick<BookingProps, "audience" | "title" | "start" | "end" | "timeZone" | "locale" | "hour12" | "hostName" | "attendeeName" | "attendeeEmail" | "location">;

type Mail = GuestText["email"];

function BookingDetails({ props, e }: { props: BookingSummary; e: Mail }) {
  const when = formatDateTimeRange(props.start, props.end, props);
  const other = props.audience === "attendee" ? props.hostName : `${props.attendeeName} (${props.attendeeEmail})`;
  return (
    <>
      <Text style={styles.text}>
        <strong>{e.what}:</strong> {props.title}
        <br />
        <strong>{e.when}:</strong> {when}
        <br />
        <strong>{e.timeZone}:</strong> {timeZoneLabel(props.timeZone, props.start, props.locale)}
        <br />
        <strong>{props.audience === "attendee" ? e.host : e.invitee}:</strong> {other}
        {props.location ? (
          <>
            <br />
            <strong>{e.where}:</strong> {props.location}
          </>
        ) : null}
      </Text>
    </>
  );
}

function build(input: EmailTemplateInput, b: EmailBranding, lang: GuestLanguage): { subject: string; element: ReactElement; calendar?: CalendarPart } {
  const button = buttonStyle(b);
  const e = guestText(lang).email;
  const BOOKING_FOOTER = b.bookingFooter;
  switch (input.template) {
    case "verify-email":
      return {
        subject: "Verify your email address",
        element: (
          <ActionEmail
            branding={b}
            preview={`Confirm your email to finish setting up ${b.appName}`}
            heading={`Welcome, ${input.props.name}`}
            intro="Confirm your email address to finish setting up your account."
            cta="Verify email"
            url={input.props.url}
            note="This link expires in 24 hours."
          />
        ),
      };
    case "reset-password":
      return {
        subject: "Reset your password",
        element: (
          <ActionEmail
            branding={b}
            preview={`Reset your ${b.appName} password`}
            heading={`Hi ${input.props.name}`}
            intro="We received a request to reset your password."
            cta="Reset password"
            url={input.props.url}
            note="This link can be used once and expires in 60 minutes."
          />
        ),
      };
    case "booking-scheduled": {
      const p = input.props;
      const verb = p.rescheduled ? e.scheduledVerb.rescheduled : p.reassigned ? e.scheduledVerb.updated : e.scheduledVerb.confirmed;
      const subject = `${verb}: ${p.title} — ${formatDateTimeRange(p.start, p.end, p)}`;
      const heading = p.rescheduled ? e.headingRescheduled : p.reassigned ? e.headingReassigned(p.hostName) : p.accepted ? e.headingAccepted : p.occurrences?.length ? e.headingRecurring : e.headingBooked;
      return {
        subject,
        calendar: p.ics,
        element: (
          <Layout branding={b} preview={subject} heading={heading} footer={BOOKING_FOOTER} lang={lang}>
            <BookingDetails props={p} e={e} />
            <Occurrences props={p} e={e} />
            <Answers answers={p.answers} />
            {p.notes ? <Text style={styles.text}>{e.notes(p.notes)}</Text> : <></>}
            <Button href={p.manageUrl} style={button}>
              {p.audience === "attendee" ? e.rescheduleOrCancel : e.viewIn(b.appName)}
            </Button>
            <Text style={styles.muted}>{e.calendarAttached}</Text>
          </Layout>
        ),
      };
    }
    case "booking-cancelled": {
      const p = input.props;
      const subject = `${e.cancelledVerb}: ${p.title} — ${formatDateTimeRange(p.start, p.end, p)}`;
      const by = p.cancelledBy === "host" ? p.hostName : p.cancelledBy === "attendee" ? p.attendeeName : b.appName;
      return {
        subject,
        calendar: p.ics,
        element: (
          <Layout branding={b} preview={subject} heading={e.headingCancelled} footer={BOOKING_FOOTER} lang={lang}>
            <BookingDetails props={p} e={e} />
            <Text style={styles.text}>
              {e.cancelledBy(by)}{p.reason ? e.reasonSuffix(p.reason) : ""}
            </Text>
            {p.rebookUrl ? (
              <Button href={p.rebookUrl} style={button}>
                {e.pickNewTime}
              </Button>
            ) : (
              <></>
            )}
          </Layout>
        ),
      };
    }
    case "booking-requested": {
      const p = input.props;
      const host = p.audience === "host";
      const subject = `${host ? e.requestedHost : e.requestedGuest}: ${p.title} — ${formatDateTimeRange(p.start, p.end, p)}`;
      return {
        subject,
        element: (
          <Layout branding={b} preview={subject} heading={host ? e.headingRequestedHost : e.headingRequestedGuest} footer={BOOKING_FOOTER} lang={lang}>
            <BookingDetails props={p} e={e} />
            <Occurrences props={p} e={e} />
            <Answers answers={p.answers} />
            {p.notes ? <Text style={styles.text}>{e.notes(p.notes)}</Text> : <></>}
            {host && p.acceptUrl && p.rejectUrl ? (
              <Text style={styles.text}>
                <Button href={p.acceptUrl} style={button}>
                  {e.accept}
                </Button>{" "}
                <Button href={p.rejectUrl} style={{ ...button, backgroundColor: "#b91c1c", color: "#ffffff" }}>
                  {e.reject}
                </Button>
              </Text>
            ) : (
              <Text style={styles.text}>{e.needsConfirmation(p.hostName)}</Text>
            )}
            <Button href={p.manageUrl} style={button}>
              {host ? e.openBookings : e.viewOrCancelRequest}
            </Button>
          </Layout>
        ),
      };
    }
    case "booking-rejected": {
      const p = input.props;
      const subject = `${e.declinedVerb}: ${p.title} — ${formatDateTimeRange(p.start, p.end, p)}`;
      return {
        subject,
        element: (
          <Layout branding={b} preview={subject} heading={e.headingDeclined} footer={BOOKING_FOOTER} lang={lang}>
            <BookingDetails props={p} e={e} />
            <Text style={styles.text}>
              {e.cantMake(p.hostName)}{p.reason ? e.reasonSuffix(p.reason) : ""}
            </Text>
            {p.rebookUrl ? (
              <Button href={p.rebookUrl} style={button}>
                {e.pickAnotherTime}
              </Button>
            ) : (
              <></>
            )}
          </Layout>
        ),
      };
    }
    case "reschedule-requested": {
      const p = input.props;
      const subject = e.pickNewTimeSubject(p.title);
      return {
        subject,
        element: (
          <Layout branding={b} preview={subject} heading={e.headingPickNewTime(p.hostName)} footer={BOOKING_FOOTER} lang={lang}>
            <Text style={styles.text}>
              {e.pickNewTimeBody(p.hostName)}
            </Text>
            {p.message ? <Text style={styles.text}>{e.messageFrom(p.hostName, p.message)}</Text> : <></>}
            <BookingDetails props={p} e={e} />
            <Button href={p.rescheduleUrl} style={button}>
              {e.pickNewTime}
            </Button>
            <Text style={styles.muted}>
              {e.cantFindTime} <a href={p.manageUrl}>{e.viewOrCancelBooking}</a>.
            </Text>
          </Layout>
        ),
      };
    }
    case "workflow": {
      const p = input.props;
      return {
        subject: p.subject,
        element: (
          <Layout branding={b} preview={p.subject} heading={p.subject} footer={BOOKING_FOOTER} lang={lang}>
            {p.body.split(/\n{2,}/).map((para, i) => (
              <Text key={i} style={{ ...styles.text, whiteSpace: "pre-line" }}>
                {para}
              </Text>
            ))}
            <Button href={p.bookingUrl} style={button}>
              {e.viewBooking}
            </Button>
          </Layout>
        ),
      };
    }
    case "integration-error":
      return {
        subject: `Reconnect ${input.props.provider} to keep your calendar in sync`,
        element: (
          <ActionEmail
            branding={b}
            preview={`${input.props.provider} stopped working`}
            heading={`Hi ${input.props.name}`}
            intro={`${b.appName} can no longer access your ${input.props.provider} account (${input.props.account}). Until you reconnect it, new bookings won’t appear in that calendar and its events won’t block your availability.`}
            cta="Reconnect"
            url={input.props.url}
            note="Bookings keep working in the meantime."
          />
        ),
      };
    case "team-invitation":
      return {
        subject: `${input.props.inviterName} invited you to ${input.props.teamName} on ${b.appName}`,
        element: (
          <ActionEmail
            branding={b}
            preview={`Join ${input.props.teamName}`}
            heading={`Join ${input.props.teamName}`}
            intro={`${input.props.inviterName} invited you to join ${input.props.teamName} as ${input.props.role === "member" ? "a member" : `an ${input.props.role}`}. Sign in with this email address to accept or decline — new here? Use “Email me a sign-in link” on the sign-in page with this address to create your account.`}
            cta="View invitation"
            url={input.props.url}
            note="The invitation expires in 14 days."
          />
        ),
      };
    case "magic-link":
      return {
        subject: "Your sign in link",
        element: (
          <ActionEmail
            branding={b}
            preview={`Sign in to ${b.appName}`}
            heading={`Sign in to ${b.appName}`}
            intro="Use the button below to sign in."
            cta="Sign in"
            url={input.props.url}
            note="This link can be used once and expires in 15 minutes."
          />
        ),
      };
  }
}

/** `lang` is the guest language (GUEST_LANGUAGE); it applies to booking emails, account emails stay English. */
export async function renderEmail(input: EmailTemplateInput, branding: EmailBranding = DEFAULT_EMAIL_BRANDING, lang: GuestLanguage = "en"): Promise<RenderedEmail> {
  const { subject, element, calendar } = build(input, branding, lang);
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return calendar ? { subject, html, text, calendar } : { subject, html, text };
}
