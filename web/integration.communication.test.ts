/**
 * Integration smoke: proves the canonical web/ channel tree is the single
 * source of truth, internal modules resolve to each other, channel consumers
 * still point at web/media, and pure shipped helpers actually run.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { parseVcard } from "./vcard.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const WEB_ROOT = resolve(REPO_ROOT, "web");
const WEB_COPY = resolve(REPO_ROOT, "web copy");

const REQUIRED_TOP_LEVEL = [
  "accounts.ts",
  "auth-store.ts",
  "active-listener.ts",
  "login.ts",
  "login-qr.ts",
  "session.ts",
  "media.ts",
  "outbound.ts",
  "inbound.ts",
  "reconnect.ts",
  "qr-image.ts",
  "vcard.ts",
  "test-helpers.ts",
  "auto-reply.ts",
  "auto-reply.impl.ts",
] as const;

const CONSUMER_MEDIA_IMPORTS = [
  { file: "signal/send.ts", importPath: "../web/media.js" },
  { file: "telegram/send.ts", importPath: "../web/media.js" },
  { file: "slack/send.ts", importPath: "../web/media.js" },
  { file: "telegram/bot/delivery.ts", importPath: "../../web/media.js" },
] as const;

function listProductionTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...listProductionTsFiles(full));
    } else if (name.endsWith(".ts") && !name.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

function resolveRelativeTs(fromFile: string, spec: string): string | null {
  const raw = normalize(join(dirname(fromFile), spec));
  const candidates = raw.endsWith(".js")
    ? [raw.slice(0, -3) + ".ts", raw]
    : [raw + ".ts", raw, join(raw, "index.ts")];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

/** True when a path normalizes to something inside web/. */
function staysInsideWeb(fromFile: string, spec: string): boolean {
  const dest = normalize(join(dirname(fromFile), spec));
  const destTs = dest.endsWith(".js") ? dest.slice(0, -3) + ".ts" : dest + ".ts";
  const rel = relative(WEB_ROOT, destTs);
  return rel !== ".." && !rel.startsWith(`..${"/"}`) && !rel.startsWith("/");
}

describe("web channel communication", () => {
  it("has no duplicate staging tree (web copy/)", () => {
    expect(existsSync(WEB_COPY)).toBe(false);
  });

  it("hosts the full OBJECTIVE inventory under web/", () => {
    for (const name of REQUIRED_TOP_LEVEL) {
      expect(existsSync(join(WEB_ROOT, name))).toBe(true);
    }
    expect(existsSync(join(WEB_ROOT, "auto-reply"))).toBe(true);
    expect(existsSync(join(WEB_ROOT, "inbound"))).toBe(true);
    expect(existsSync(join(WEB_ROOT, "media.ts"))).toBe(true);
  });

  it("resolves every internal web→web relative import", () => {
    const miss: string[] = [];
    for (const file of listProductionTsFiles(WEB_ROOT)) {
      const text = readFileSync(file, "utf-8");
      const re = /from\s+['"](\.[^'"]+)['"]/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        const spec = m[1];
        if (!staysInsideWeb(file, spec)) continue;
        if (!resolveRelativeTs(file, spec)) {
          miss.push(`${relative(REPO_ROOT, file)} -> ${spec}`);
        }
      }
    }
    expect(miss).toEqual([]);
  });

  it("keeps telegram/signal/slack loadWebMedia imports pointed at web/media.ts", () => {
    for (const { file, importPath } of CONSUMER_MEDIA_IMPORTS) {
      const abs = join(REPO_ROOT, file);
      expect(existsSync(abs)).toBe(true);
      const text = readFileSync(abs, "utf-8");
      expect(text).toContain(`from "${importPath}"`);
      const resolved = resolveRelativeTs(abs, importPath);
      expect(resolved).toBe(join(WEB_ROOT, "media.ts"));
      expect(readFileSync(resolved!, "utf-8")).toContain("export async function loadWebMedia");
    }
  });

  it("drives shipped parseVcard so pure web logic communicates end-to-end", () => {
    const parsed = parseVcard(
      ["BEGIN:VCARD", "FN:Comm User", "TEL:+15550102", "END:VCARD"].join("\n"),
    );
    expect(parsed.name).toBe("Comm User");
    expect(parsed.phones).toEqual(["+15550102"]);
  });
});
