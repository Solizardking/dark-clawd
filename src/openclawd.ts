export const OPENCLAWD_SITE_NAME = 'OpenClawd';
export const OPENCLAWD_SITE_URL = normalizeBaseUrl(
  process.env.OPENCLAWD_SITE_URL ?? 'https://solanaclawd.com'
);
export const OPENCLAWD_BACKEND_URL = normalizeBaseUrl(
  process.env.OPENCLAWD_BACKEND_URL ?? OPENCLAWD_SITE_URL
);
export const OPENCLAWD_AGENT_API_URL = normalizeBaseUrl(
  process.env.OPENCLAWD_AGENT_API_URL ?? 'https://agents.openclawd.biz'
);

export const OPENCLAWD_ROUTES = {
  home: '/',
  vault: '/vault',
  chat: '/chat',
  trading: '/trading',
  agents: '/agents',
  staking: '/staking',
  mining: '/mining',
  docs: '/docs',
  /** Local sovereign runtime surface (vendored automaton/, not a remote page). */
  automaton: '/automaton',
} as const;

export type OpenClawdRoute = keyof typeof OPENCLAWD_ROUTES;

export const OPENCLAWD_CAPABILITIES = [
  { key: 'vault', route: 'vault', backendPath: '/api/vault' },
  { key: 'voice', route: 'chat', backendPath: '/api/voice' },
  { key: 'vim', route: 'chat', backendPath: '/api/editor/vim' },
  { key: 'trading', route: 'trading', backendPath: '/api/trading' },
  { key: 'agents', route: 'agents', backendPath: '/api/agents' },
  { key: 'staking', route: 'staking', backendPath: '/api/staking' },
  { key: 'mining', route: 'mining', backendPath: '/api/mining' },
  {
    key: 'automaton',
    route: 'automaton',
    backendPath: '/api/automaton',
    localPath: 'automaton/',
    description: 'Sovereign agent runtime (heartbeat, survival, constitution)',
  },
] as const;

/** Relative package path for the vendored Automaton runtime inside Dark Clawd. */
export const OPENCLAWD_AUTOMATON_PACKAGE = 'automaton' as const;

export function getOpenClawdRouteUrl(route: OpenClawdRoute): string {
  return `${OPENCLAWD_SITE_URL}${OPENCLAWD_ROUTES[route]}`;
}

export function getOpenClawdBackendUrl(path: string): string {
  return `${OPENCLAWD_BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getOpenClawdCapabilityMap(): Record<string, (typeof OPENCLAWD_CAPABILITIES)[number]> {
  return Object.fromEntries(OPENCLAWD_CAPABILITIES.map((capability) => [capability.key, capability]));
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}
