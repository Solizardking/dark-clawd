import { runTui } from "../tui/tui.js";

const args = process.argv.slice(2);
function opt(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

runTui({
  url: opt("url"),
  token: opt("token"),
  password: opt("password"),
  session: opt("session"),
  deliver: args.includes("--deliver"),
  thinking: opt("thinking"),
  message: opt("message"),
  timeoutMs: opt("timeout-ms") ? Number(opt("timeout-ms")) : undefined,
  historyLimit: opt("history-limit") ? Number(opt("history-limit")) : undefined,
}).catch((err) => {
  console.error(String(err));
  process.exit(1);
});
