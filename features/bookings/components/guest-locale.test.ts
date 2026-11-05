import { describe, expect, it } from "vitest";
import { pickBookerLocale } from "./booker-view";

describe("pickBookerLocale", () => {
  it("uses the guest language's locale for German pages, whatever the browser says", () => {
    expect(pickBookerLocale("de", "en-US")).toBe("de-DE");
  });

  it("keeps the browser locale for English pages (upstream behaviour)", () => {
    expect(pickBookerLocale("en", "fr-FR")).toBe("fr-FR");
  });
});
