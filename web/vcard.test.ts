import { describe, expect, it } from "bun:test";

import { parseVcard } from "./vcard.js";

describe("parseVcard", () => {
  it("returns empty phones for missing or empty input", () => {
    expect(parseVcard(undefined)).toEqual({ phones: [] });
    expect(parseVcard("")).toEqual({ phones: [] });
  });

  it("parses FN name and TEL phones from a real vCard payload", () => {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "FN:Ada Lovelace",
      "N:Lovelace;Ada;;;",
      "TEL;TYPE=CELL:+15551234567",
      "TEL:tel:+1-555-987-6543",
      "EMAIL:ada@example.com",
      "END:VCARD",
    ].join("\n");

    const parsed = parseVcard(vcard);
    expect(parsed.name).toBe("Ada Lovelace");
    expect(parsed.phones).toEqual(["+15551234567", "+1-555-987-6543"]);
  });

  it("prefers FN over N and normalizes escaped values", () => {
    const vcard = "N:Byron\\;Lord;;;\nFN:Lord Byron\nTEL:555-0100\n";
    const parsed = parseVcard(vcard);
    expect(parsed.name).toBe("Lord Byron");
    expect(parsed.phones).toEqual(["555-0100"]);
  });

  it("ignores non-allowed keys and blank values", () => {
    const vcard = "ORG:Analytical Engine\nFN:\nTEL:\nNOTE:skip me\nTEL:+1000\n";
    const parsed = parseVcard(vcard);
    expect(parsed.name).toBeUndefined();
    expect(parsed.phones).toEqual(["+1000"]);
  });
});
