"use client";

import { CalendarDays, CalendarRange, Rows3 } from "lucide-react";
import { useSyncExternalStore } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BOOKING_LAYOUTS, type BookingLayout } from "@/features/embed/target";
import { parseLayout } from "@/lib/embed/booking-link";
import { useGuestText } from "@/features/i18n/guest-text";

const ICONS: Record<BookingLayout, typeof CalendarDays> = {
  month: CalendarDays,
  week: CalendarRange,
  column: Rows3,
};

/** Month / Week / Column switcher in the booking widget (hidden on phones, which get Column). */
export function LayoutSwitcher({ value, onChange }: { value: BookingLayout; onChange: (layout: BookingLayout) => void }) {
  const { t } = useGuestText();
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      spacing={0}
      aria-label={t.layout.label}
      value={value}
      onValueChange={(v) => {
        const layout = parseLayout(v);
        if (layout) onChange(layout); // clicking the active item would clear it; keep one selected
      }}
    >
      {BOOKING_LAYOUTS.map((layout) => {
        const Icon = ICONS[layout];
        const label = t.layout[layout];
        return (
          <ToggleGroupItem key={layout} value={layout} className="px-2.5">
            <Icon aria-hidden data-icon="inline-start" />
            {label}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

const NARROW_QUERY = "(max-width: 639px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(NARROW_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** True on phone-width viewports (an embed iframe's own width counts). False on the server. */
export function useNarrowScreen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
}
