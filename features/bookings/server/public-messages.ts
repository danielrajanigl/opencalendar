import { guestText, type GuestLanguage } from "@/lib/i18n/guest";

/** Messages the public booking actions send back to guests, in the guest language. */
export function publicMessages(lang: GuestLanguage) {
  const m = guestText(lang).messages;
  return { ...m, slotTaken: m.failures.SLOT_UNAVAILABLE };
}

/** Field errors come from shared (English) schemas; translate the ones the dictionary knows. */
export function localizeFieldErrors(errors: Record<string, string>, lang: GuestLanguage): Record<string, string> {
  const known = guestText(lang).messages.fields;
  return Object.fromEntries(Object.entries(errors).map(([key, message]) => [key, known[message] ?? message]));
}
