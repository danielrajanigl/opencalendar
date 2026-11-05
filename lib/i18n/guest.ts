import type { LocationKind } from "@/features/event-types/schemas";

/**
 * Wording for everything guests see (booking pages, forms, booking emails), switched by
 * GUEST_LANGUAGE. English is the upstream wording, unchanged; add a key to both languages.
 */

export type GuestLanguage = "en" | "de";

const en = {
  form: {
    confirm: "Confirm booking",
  },
  booking: {
    notFound: "Not found",
    loading: "Loading availability…",
    loadError: "Couldn't load available times. Please try again.",
    slotGone: (day: string) => `That time is no longer available — pick another time on ${day}.`,
    rescheduling: (date: string, time: string) => `Rescheduling your booking from ${date}, ${time}.`,
    canRepeat: (frequency: "weekly" | "monthly", maxCount: number) =>
      `Can repeat ${frequency === "weekly" ? "weekly" : "monthly"}, up to ${maxCount} times`,
    groupEvent: "Group event",
    duration: "Duration",
    pickMeeting: "Pick a meeting type to see available times.",
    noMeetings: "No meetings are available to book right now.",
  },
  calendar: {
    chooseDate: "Choose a date",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    days: "Days",
    noTimesSuffix: ", no times available",
    noTimesMonth: "No times available this month. Try the next month.",
    chooseTime: "Choose a time",
    selectDate: "Select a date to see available times.",
    chooseDateTime: "Choose a date and time",
    previousWeek: "Previous week",
    nextWeek: "Next week",
    week: "Week",
    noTimes: "No times available",
    noTimesWeek: "No times available this week. Try the next week.",
    seatsLeft: (seats: number) => `${seats} ${seats === 1 ? "seat" : "seats"} left`,
  },
  layout: {
    label: "Layout",
    month: "Month",
    week: "Week",
    column: "Column",
  },
  preferences: {
    done: "Done",
    change: "Change",
    timesIn: (zone: string) => `Times in ${zone}`,
    timeZone: "Time zone",
    clockFormat: "Clock format",
  },
  location: {
    inPersonAt: (place: string) => `In person: ${place}`,
    kinds: {
      in_person: "In person",
      phone_host: "Phone call (invitee calls you)",
      phone_attendee: "Phone call (you call the invitee)",
      link: "Custom meeting link",
      jitsi: "Jitsi Meet",
      google_meet: "Google Meet",
      ms_teams: "Microsoft Teams",
      zoom: "Zoom",
    } satisfies Record<LocationKind, string>,
  },
  footer: {
    poweredBy: "Powered by OpenCalendar · ",
    source: "Source code (AGPL-3.0)",
    about: "About",
  },
};

export type GuestText = typeof en;

const de: GuestText = {
  form: {
    confirm: "Termin bestätigen",
  },
  booking: {
    notFound: "Nicht gefunden",
    loading: "Freie Zeiten werden geladen …",
    loadError: "Die freien Zeiten konnten nicht geladen werden. Bitte versuchen Sie es erneut.",
    slotGone: (day: string) => `Diese Zeit ist nicht mehr frei. Bitte wählen Sie eine andere Zeit am ${day}.`,
    rescheduling: (date: string, time: string) => `Sie verschieben Ihren Termin vom ${date}, ${time} Uhr.`,
    canRepeat: (frequency: "weekly" | "monthly", maxCount: number) =>
      `Wiederholbar ${frequency === "weekly" ? "wöchentlich" : "monatlich"}, bis zu ${maxCount}-mal`,
    groupEvent: "Gruppentermin",
    duration: "Dauer",
    pickMeeting: "Wählen Sie eine Terminart, um die freien Zeiten zu sehen.",
    noMeetings: "Derzeit sind keine Termine buchbar.",
  },
  calendar: {
    chooseDate: "Datum wählen",
    previousMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    days: "Tage",
    noTimesSuffix: ", keine freien Zeiten",
    noTimesMonth: "In diesem Monat sind keine Zeiten frei. Versuchen Sie es im nächsten Monat.",
    chooseTime: "Uhrzeit wählen",
    selectDate: "Wählen Sie ein Datum, um die freien Zeiten zu sehen.",
    chooseDateTime: "Datum und Uhrzeit wählen",
    previousWeek: "Vorherige Woche",
    nextWeek: "Nächste Woche",
    week: "Woche",
    noTimes: "Keine freien Zeiten",
    noTimesWeek: "In dieser Woche sind keine Zeiten frei. Versuchen Sie es in der nächsten Woche.",
    seatsLeft: (seats: number) => `noch ${seats} ${seats === 1 ? "Platz" : "Plätze"} frei`,
  },
  layout: {
    label: "Ansicht",
    month: "Monat",
    week: "Woche",
    column: "Liste",
  },
  preferences: {
    done: "Fertig",
    change: "Ändern",
    timesIn: (zone: string) => `Zeiten in ${zone}`,
    timeZone: "Zeitzone",
    clockFormat: "Uhrzeitformat",
  },
  location: {
    inPersonAt: (place: string) => `Vor Ort: ${place}`,
    kinds: {
      in_person: "Vor Ort",
      phone_host: "Telefon (Sie rufen uns an)",
      phone_attendee: "Telefon (wir rufen Sie an)",
      link: "Online-Meeting",
      jitsi: "Jitsi Meet",
      google_meet: "Google Meet (Videocall)",
      ms_teams: "Microsoft Teams",
      zoom: "Zoom",
    },
  },
  footer: {
    poweredBy: "Bereitgestellt mit OpenCalendar · ",
    source: "Quellcode (AGPL-3.0)",
    about: "Über diese Seite",
  },
};

export const guestTexts: Record<GuestLanguage, GuestText> = { en, de };

export const guestText = (lang: GuestLanguage): GuestText => guestTexts[lang];

/** Locale for dates and times shown to guests. */
export const guestLocale = (lang: GuestLanguage): string => (lang === "de" ? "de-DE" : "en-US");
