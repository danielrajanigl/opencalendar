/**
 * Wording for everything guests see (booking pages, forms, booking emails), switched by
 * GUEST_LANGUAGE. English is the upstream wording, unchanged; add a key to both languages.
 */

export type GuestLanguage = "en" | "de";

const en = {
  form: {
    confirm: "Confirm booking",
  },
};

export type GuestText = typeof en;

const de: GuestText = {
  form: {
    confirm: "Termin bestätigen",
  },
};

export const guestTexts: Record<GuestLanguage, GuestText> = { en, de };

export const guestText = (lang: GuestLanguage): GuestText => guestTexts[lang];

/** Locale for dates and times shown to guests. */
export const guestLocale = (lang: GuestLanguage): string => (lang === "de" ? "de-DE" : "en-US");
