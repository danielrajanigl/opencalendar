import { describe, expect, it } from "vitest";
import { DEFAULT_EMAIL_BRANDING } from "@/features/instance/email-branding";
import { defaultReminderFor } from "@/features/workflows/schemas";
import { renderEmail } from "./templates";

const view = {
  audience: "attendee" as const,
  title: "Erstgespräch",
  start: Date.parse("2030-01-07T09:00:00Z"), // a Monday
  end: Date.parse("2030-01-07T09:15:00Z"),
  timeZone: "Europe/Berlin",
  locale: "de-DE",
  hour12: false,
  hostName: "Buchhaltungsservice RS",
  attendeeName: "Grace",
  attendeeEmail: "grace@example.com",
  location: "Telefon (wir rufen Sie an)",
};

describe("booking emails in German (GUEST_LANGUAGE=de)", () => {
  it("confirms a booking in German with German dates", async () => {
    const email = await renderEmail(
      {
        template: "booking-scheduled",
        props: { ...view, ics: { method: "REQUEST", content: "BEGIN:VCALENDAR" }, rescheduled: false, manageUrl: "https://x.test/booking/u1?token=t1" },
      },
      DEFAULT_EMAIL_BRANDING,
      "de",
    );
    expect(email.subject.startsWith("Termin bestätigt:")).toBe(true);
    expect(email.html).toContain('lang="de"');
    expect(email.text).toContain("Montag");
    expect(email.text).toContain("Zeitzone");
    expect(email.text).toContain("Verschieben oder absagen");
    expect(email.text).not.toMatch(/\bWhen:|\bWhere:/);
  });

  it("names a cancellation in German", async () => {
    const email = await renderEmail(
      { template: "booking-cancelled", props: { ...view, cancelledBy: "attendee" } },
      DEFAULT_EMAIL_BRANDING,
      "de",
    );
    expect(email.subject.startsWith("Termin abgesagt:")).toBe(true);
    expect(email.text).toContain("Abgesagt von Grace.");
  });

  it("keeps English as the default", async () => {
    const email = await renderEmail({ template: "booking-cancelled", props: { ...view, locale: "en", cancelledBy: "attendee" } });
    expect(email.subject.startsWith("Cancelled:")).toBe(true);
    expect(email.html).toContain('lang="en"');
  });
});

describe("defaultReminderFor", () => {
  it("writes the default reminder in German", () => {
    expect(defaultReminderFor("de").subject).toBe("Erinnerung: {event_name} am {date}");
    expect(defaultReminderFor("de").name).toBe("Erinnerung 24 Stunden vorher");
  });

  it("keeps the upstream reminder for English", () => {
    expect(defaultReminderFor("en").subject).toBe("Reminder: {event_name} on {date}");
  });
});
