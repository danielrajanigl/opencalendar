import { describe, expect, it } from "vitest";
import { localizeFieldErrors, publicMessages } from "./public-messages";

describe("publicMessages", () => {
  it("keeps the upstream English wording", () => {
    expect(publicMessages("en").checkForm).toBe("Please check the form.");
    expect(publicMessages("en").slotTaken).toBe("Sorry, that time was just taken. Please pick another one.");
  });

  it("explains a taken slot in German and how to go on", () => {
    expect(publicMessages("de").slotTaken).toContain("bereits vergeben");
    expect(publicMessages("de").slotTaken).toContain("wählen Sie eine andere Zeit");
  });

  it("asks for the phone number in German", () => {
    expect(publicMessages("de").phoneRequired).toBe("Bitte geben Sie Ihre Telefonnummer an.");
  });
});

describe("localizeFieldErrors", () => {
  it("translates known validation messages and keeps unknown ones", () => {
    expect(localizeFieldErrors({ "booker.email": "Enter a valid email", x: "Something else" }, "de")).toEqual({
      "booker.email": "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      x: "Something else",
    });
  });

  it("leaves English untouched", () => {
    expect(localizeFieldErrors({ "booker.email": "Enter a valid email" }, "en")).toEqual({ "booker.email": "Enter a valid email" });
  });
});
