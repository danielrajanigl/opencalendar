"use client";

import { createContext, useContext, type ReactNode } from "react";
import { guestLocale, guestText, type GuestLanguage, type GuestText } from "@/lib/i18n/guest";

type GuestTextValue = { t: GuestText; lang: GuestLanguage; locale: string };

const GuestTextContext = createContext<GuestTextValue>({ t: guestText("en"), lang: "en", locale: guestLocale("en") });

/** Hands the server's GUEST_LANGUAGE to client components on public pages. */
export function GuestTextProvider({ lang, children }: { lang: GuestLanguage; children: ReactNode }) {
  return <GuestTextContext.Provider value={{ t: guestText(lang), lang, locale: guestLocale(lang) }}>{children}</GuestTextContext.Provider>;
}

export const useGuestText = (): GuestTextValue => useContext(GuestTextContext);
