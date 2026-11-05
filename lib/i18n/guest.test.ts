import { describe, expect, it } from "vitest";
import { guestLocale, guestText, guestTexts } from "./guest";

/** Every nested key path of an object, e.g. "form.confirm". Functions count as leaves. */
function keyPaths(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    child !== null && typeof child === "object" ? keyPaths(child, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

describe("guestText", () => {
  it("keeps the upstream English wording", () => {
    expect(guestText("en").form.confirm).toBe("Confirm booking");
  });

  it("returns the German wording", () => {
    expect(guestText("de").form.confirm).toBe("Termin bestätigen");
  });

  it("has the same keys in every language", () => {
    expect(keyPaths(guestTexts.de).sort()).toEqual(keyPaths(guestTexts.en).sort());
  });
});

describe("guestLocale", () => {
  it("maps each guest language to a formatting locale", () => {
    expect(guestLocale("de")).toBe("de-DE");
    expect(guestLocale("en")).toBe("en-US");
  });
});
