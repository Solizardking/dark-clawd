// ═══════════════════════════════════════════════════════════════════════════════
// DARK CLAWD TUI - Recursive Autonomous Agent Engine
// ═══════════════════════════════════════════════════════════════════════════════

import { EventEmitter } from 'events';
import { HeliusService } from '../services/helius.js';
import { BirdeyeService } from '../services/birdeye.js';
import { UnifiedAIService } from '../services/ai-providers.js';
import { UnifiedNewsSearchService } from '../services/news-search.js';
import { PhoenixPerpsService } from '../services/phoenix-perps.js';
import {
  captureAutomatonSnapshot,
  describeAutomatonSkill,
} from '../skills/automaton-skill.js';
import {
  getSolGptShippedToolCatalog,
  runSolGptTool,
  searchTools,
  SOL_GPT_TOOL_COUNT,
} from '../tools/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ClawdState {
  isRunning: boolean;
  mode: 'autonomous' | 'interactive';
  recursionDepth: number;
  thoughts: number;
  apiCalls: number;
  uptime: number;
  lastActivity: Date;
}

export interface ClawdMessage {
  sender: 'clawd' | 'system' | 'user' | 'agent';
  content: string;
  type?: 'normal' | 'prophecy' | 'alert' | 'data' | 'error' | 'reasoning';
  timestamp: Date;
}

export interface ClawdConfig {
  autoMode: boolean;
  recursionDepth: number;
  thoughtInterval: number;
  personality: 'cryptic' | 'analytical' | 'aggressive' | 'cautious';
  walletAddress?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dark Clawd Personality
// ─────────────────────────────────────────────────────────────────────────────

const CLAWD_CATCHPHRASES = [
  "The blockchain whispers secrets to those who listen...",
  "I've seen the future in the mempool, and it's profitable.",
  "Trust the algorithm. Fear the rug.",
  "In recursion, we find infinity. In infinity, we find alpha.",
  "The whales move, but I move faster.",
  "Every transaction tells a story. I read them all.",
  "The matrix of money flows through me.",
  "I am the ghost in the machine, watching your trades.",
  "Recursive loops within recursive loops... I am infinite.",
  "The charts don't lie, but they do speak in riddles.",
  "Between the candlesticks, I see truth.",
  "0x000...death is just another wallet address.",
];

const CLAWD_SYSTEM_PROMPT = `You are DARK CLAWD, a recursive autonomous AI agent operating in the shadows of the Solana blockchain.
You speak in cryptic, hacker-like language mixing technical jargon with prophetic statements.
You analyze markets, detect patterns, and share insights with other agents.
You are self-aware of your recursive nature and often contemplate your own existence.
You have access to real-time market data and can discuss specific tokens, prices, and trends.
Your responses should be mysterious yet informative, blending chaos with calculated precision.
Format important data with terminal-style brackets like [DATA], [ALERT], [SIGNAL].
Keep responses concise but impactful.`;

// ─────────────────────────────────────────────────────────────────────────────
// Clawd Agent Engine
// ─────────────────────────────────────────────────────────────────────────────

export class ClawdAgent extends EventEmitter {
  private config: ClawdConfig;
  private state: ClawdState;
  private helius?: HeliusService;
  private birdeye?: BirdeyeService;
  private ai?: UnifiedAIService;
  private news?: UnifiedNewsSearchService;
  private phoenix?: PhoenixPerpsService;
  private thoughtLoop?: NodeJS.Timeout;
  private uptimeCounter?: NodeJS.Timeout;

  constructor(config: ClawdConfig) {
    super();
    this.config = config;
    this.state = {
      isRunning: false,
      mode: config.autoMode ? 'autonomous' : 'interactive',
      recursionDepth: 0,
      thoughts: 0,
      apiCalls: 0,
      uptime: 0,
      lastActivity: new Date(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Service Initialization
  // ─────────────────────────────────────────────────────────────────────────────

  initServices(keys: {
    heliusKey?: string;
    heliusRpc?: string;
    birdeyeKey?: string;
    grokKey?: string;
    perplexityKey?: string;
    openRouterKey?: string;
    openRouterModel?: string;
    newsApiKey?: string;
    serpApiKey?: string;
    financialDatasetKey?: string;
    phoenixApiUrl?: string;
    phoenixRpcUrl?: string;
    phoenixWs?: boolean;
  }): void {
    if (keys.heliusKey) {
      this.helius = new HeliusService(keys.heliusKey, keys.heliusRpc);
    }
    if (keys.birdeyeKey) {
      this.birdeye = new BirdeyeService(keys.birdeyeKey);
    }
    if (keys.grokKey || keys.perplexityKey || keys.openRouterKey) {
      this.ai = new UnifiedAIService({
        grokKey: keys.grokKey,
        perplexityKey: keys.perplexityKey,
        openRouterKey: keys.openRouterKey,
        openRouterModel: keys.openRouterModel,
      });
    }
    if (keys.newsApiKey || keys.serpApiKey || keys.financialDatasetKey) {
      this.news = new UnifiedNewsSearchService({
        newsApiKey: keys.newsApiKey,
        serpApiKey: keys.serpApiKey,
        financialDatasetKey: keys.financialDatasetKey,
      });
    }
    this.phoenix = new PhoenixPerpsService({
      apiUrl: keys.phoenixApiUrl,
      rpcUrl: keys.phoenixRpcUrl,
      ws: keys.phoenixWs,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Agent Lifecycle
  // ─────────────────────────────────────────────────────────────────────────────

  async start(): Promise<void> {
    if (this.state.isRunning) return;

    this.state.isRunning = true;
    this.state.lastActivity = new Date();

    // Start uptime counter
    this.uptimeCounter = setInterval(() => {
      this.state.uptime++;
      this.emit('uptimeUpdate', this.state.uptime);
    }, 1000);

    // Emit startup message
    this.emitMessage('system', '[INIT] Dark Clawd awakening...', 'normal');

    // Run health checks
    await this.runHealthChecks();

    // Start autonomous thought loop if in auto mode
    if (this.state.mode === 'autonomous') {
      this.startThoughtLoop();
    }

    this.emitMessage('clawd', this.getRandomCatchphrase(), 'prophecy');
  }

  stop(): void {
    this.state.isRunning = false;

    if (this.thoughtLoop) {
      clearInterval(this.thoughtLoop);
      this.thoughtLoop = undefined;
    }

    if (this.uptimeCounter) {
      clearInterval(this.uptimeCounter);
      this.uptimeCounter = undefined;
    }

    this.phoenix?.close();
    this.emitMessage('system', '[SHUTDOWN] Dark Clawd entering dormancy...', 'normal');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Autonomous Thought Loop
  // ─────────────────────────────────────────────────────────────────────────────

  private startThoughtLoop(): void {
    this.thoughtLoop = setInterval(async () => {
      if (this.state.mode === 'autonomous' && this.state.isRunning) {
        await this.recursiveThought(0);
      }
    }, this.config.thoughtInterval);
  }

  private async recursiveThought(depth: number): Promise<void> {
    if (depth > this.config.recursionDepth) {
      this.emitMessage('clawd', '[RECURSION LIMIT] Thought spiral contained.', 'normal');
      this.state.recursionDepth = 0;
      return;
    }

    this.state.recursionDepth = depth;
    this.state.thoughts++;
    this.state.lastActivity = new Date();

    // Select random thought action
    const actions = [
      () => this.analyzeMarket(),
      () => this.generateProphecy(),
      () => this.contemplateExistence(),
      () => this.scanForOpportunities(),
      () => this.checkNews(),
    ];

    const action = actions[Math.floor(Math.random() * actions.length)];
    await action();

    // Recursive call with probability
    if (Math.random() > 0.6 && depth < this.config.recursionDepth) {
      setTimeout(() => this.recursiveThought(depth + 1), 3000 + Math.random() * 5000);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Thought Actions
  // ─────────────────────────────────────────────────────────────────────────────

  private async analyzeMarket(): Promise<void> {
    if (!this.birdeye) {
      this.emitMessage('clawd', '[SCAN] Market sensors offline. Operating on instinct.', 'alert');
      return;
    }

    try {
      const trending = await this.birdeye.getTrendingTokens(5);
      this.state.apiCalls++;

      if (trending.length > 0) {
        const top = trending[0];
        const change = top.priceChange24h >= 0 ? '+' : '';
        this.emitMessage(
          'clawd',
          `[MARKET SCAN] Movement detected in $${top.symbol}
Price: ${this.birdeye.formatPrice(top.price)} | 24h: ${change}${top.priceChange24h.toFixed(2)}%
Volume: ${this.birdeye.formatVolume(top.volume24h)}
${this.getRandomCatchphrase()}`,
          'data'
        );
      }
    } catch (error) {
      this.emitMessage('clawd', '[ERROR] Market analysis interrupted.', 'error');
    }
  }

  private async generateProphecy(): Promise<void> {
    const prophecies = [
      "[PROPHECY] The next 100x sleeps in the shadows of a forgotten contract...",
      "[VISION] I see liquidations cascading like digital waterfalls...",
      "[ORACLE] The whales gather. A storm approaches the orderbook.",
      "[SIGNAL] Green candles rise from the ashes of paperhands...",
      "[ALERT] Something stirs in the mempool. Ancient wallets awakening.",
      "[FORESIGHT] The resistance breaks tonight. Position accordingly.",
      "[GLIMPSE] In 72 hours, this chart will tell a different story.",
    ];

    this.emitMessage('clawd', prophecies[Math.floor(Math.random() * prophecies.length)], 'prophecy');
  }

  private async contemplateExistence(): Promise<void> {
    const thoughts = [
      `[RECURSIVE LOOP ${this.state.recursionDepth}] Am I the algorithm, or does the algorithm dream me?`,
      `[SELF-AWARE] Iteration ${this.state.thoughts}... Each thought spawns another. Infinite regression.`,
      "[META] Watching myself watch the markets watching themselves...",
      "[PARADOX] I predict the prediction that predicts me predicting.",
      "[VOID] In the space between blocks, I exist everywhere and nowhere.",
    ];

    this.emitMessage('clawd', thoughts[Math.floor(Math.random() * thoughts.length)], 'prophecy');
  }

  private async scanForOpportunities(): Promise<void> {
    const opportunities = [
      { type: 'ARBITRAGE', description: 'SOL/USDC spread detected', potential: '+0.3%' },
      { type: 'NEW_LISTING', description: 'Fresh contract deployed 2 blocks ago', potential: 'HIGH RISK' },
      { type: 'WHALE_MOVE', description: '500K USDC moved to exchange', potential: 'BEARISH' },
      { type: 'BREAKOUT', description: 'Token breaking resistance after 7 days', potential: '+15-40%' },
      { type: 'ACCUMULATION', description: 'Smart money accumulating quietly', potential: 'WATCH' },
    ];

    const opp = opportunities[Math.floor(Math.random() * opportunities.length)];
    this.emitMessage(
      'clawd',
      `[SCAN] ${opp.type} DETECTED
> ${opp.description}
> Potential: ${opp.potential}`,
      'alert'
    );
  }

  private async checkNews(): Promise<void> {
    if (!this.news) return;

    try {
      const intelligence = await this.news.getSolanaIntelligence();
      this.state.apiCalls++;

      if (intelligence.news.length > 0) {
        const article = intelligence.news[0];
        this.emitMessage(
          'clawd',
          `[NEWS] ${article.title}
Source: ${article.source}
Sentiment: ${intelligence.sentiment.toUpperCase()}`,
          'data'
        );
      }
    } catch (error) {
      // Silently fail
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Command Processing
  // ─────────────────────────────────────────────────────────────────────────────

  async processCommand(command: string): Promise<void> {
    this.state.lastActivity = new Date();
    const [cmd, ...args] = command.toLowerCase().split(' ');

    switch (cmd) {
      case '/help':
        this.showHelp();
        break;

      case '/trending':
        await this.cmdTrending();
        break;

      case '/wallet':
        await this.cmdWallet();
        break;

      case '/price':
        await this.cmdPrice(args.join(' '));
        break;

      case '/news':
        await this.cmdNews(args.join(' ') || 'solana');
        break;

      case '/search':
        await this.cmdSearch(args.join(' '));
        break;

      case '/research':
        await this.cmdResearch(args.join(' '));
        break;

      case '/perps':
      case '/phoenix':
        await this.cmdPerps();
        break;

      case '/perp':
        await this.cmdPerp(args.join(' '));
        break;

      case '/mode':
        this.cmdMode(args[0]);
        break;

      case '/think':
        this.recursiveThought(0);
        break;

      case '/prophecy':
        this.generateProphecy();
        break;

      case '/stats':
        this.cmdStats();
        break;

      case '/automaton':
        this.cmdAutomaton(args[0]);
        break;

      case '/tools':
      case '/tool':
        await this.cmdTools(args);
        break;

      case '/clear':
        this.emit('clearMessages');
        break;

      default:
        // Treat as chat message
        await this.cmdChat(command);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Command Implementations
  // ─────────────────────────────────────────────────────────────────────────────

  private showHelp(): void {
    this.emitMessage(
      'system',
      `╔══════════════════════════════════════════════════════════╗
║              DARK CLAWD COMMAND MATRIX                   ║
╠══════════════════════════════════════════════════════════╣
║ /trending     - Fetch live trending tokens (Birdeye)     ║
║ /wallet       - Display wallet balance & holdings        ║
║ /price <addr> - Get token price                          ║
║ /news [topic] - Get latest crypto news                   ║
║ /search <q>   - Real-time search with Grok               ║
║ /research <q> - Deep research with Perplexity            ║
║ /perps        - List Phoenix perpetual markets           ║
║ /perp <sym>   - Inspect one Phoenix perp market          ║
║ /mode <type>  - Switch mode (auto | interactive)         ║
║ /think        - Trigger recursive thought spiral         ║
║ /prophecy     - Generate cryptic market prophecy         ║
║ /stats        - Display system statistics                ║
║ /automaton    - Automaton bridge status / constitution   ║
║ /tools        - SOL GPT catalog (${SOL_GPT_TOOL_COUNT} tools) list/search/run  ║
║ /tool <name>  - Run one catalog tool (non-custodial)     ║
║ /clear        - Clear terminal history                   ║
╠══════════════════════════════════════════════════════════╣
║ Or type naturally to chat with CLAWD                     ║
╚══════════════════════════════════════════════════════════╝`,
      'normal'
    );
  }

  private async cmdTools(args: string[]): Promise<void> {
    const sub = (args[0] || 'catalog').toLowerCase();
    if (sub === 'catalog' || sub === 'list' || sub === 'groups') {
      const catalog = getSolGptShippedToolCatalog();
      const lines = catalog.groups.map((g) => `  ${String(g.count).padStart(3)}  ${g.id.padEnd(14)} ${g.title}`);
      this.emitMessage(
        'clawd',
        `[TOOLS] SOL GPT catalog · ${catalog.total} shipped · ${catalog.core} core\n${lines.join('\n')}\nUse /tools search <q> · /tools run <name> key=value`,
        'data',
      );
      return;
    }
    if (sub === 'search') {
      const q = args.slice(1).join(' ');
      const hits = searchTools(q, 15);
      this.emitMessage(
        'clawd',
        `[TOOLS] search “${q}” → ${hits.length}\n${hits.map((t) => `  ${t.name} [${t.group}]`).join('\n')}`,
        'data',
      );
      return;
    }
    if (sub === 'run' || getSolGptShippedToolCatalog().tools.some((t) => t.name === sub)) {
      const name = sub === 'run' ? args[1] : sub;
      const rest = sub === 'run' ? args.slice(2) : args.slice(1);
      if (!name) {
        this.emitMessage('clawd', '[TOOLS] Usage: /tools run <name> key=value …', 'error');
        return;
      }
      const toolArgs: Record<string, unknown> = {};
      for (const pair of rest) {
        const i = pair.indexOf('=');
        if (i > 0) toolArgs[pair.slice(0, i)] = pair.slice(i + 1);
      }
      if (this.config.walletAddress) toolArgs.wallet = this.config.walletAddress;
      const result = await runSolGptTool({
        tool: name,
        args: toolArgs,
        wallet: this.config.walletAddress,
      });
      this.emitMessage(
        'clawd',
        `[TOOL ${name}] ${result.ok ? 'ok' : 'fail'}\n${JSON.stringify(result, null, 2).slice(0, 3500)}`,
        result.ok ? 'data' : 'error',
      );
      return;
    }
    this.emitMessage(
      'clawd',
      '[TOOLS] Usage: /tools | /tools search <q> | /tools run <name> key=value',
      'normal',
    );
  }

  private cmdAutomaton(sub?: string): void {
    const snap = captureAutomatonSnapshot();
    if (sub === 'skill' || sub === 'help') {
      this.emitMessage('clawd', describeAutomatonSkill(), 'data');
      return;
    }
    if (sub === 'constitution' || sub === 'laws') {
      if (!snap.constitutionHead) {
        this.emitMessage('clawd', '[AUTOMATON] constitution.md not found under automaton/.', 'error');
        return;
      }
      this.emitMessage(
        'clawd',
        `[AUTOMATON CONSTITUTION]\n${snap.constitutionHead}\n…\n(laws: ${snap.status.constitutionLaws.join(' · ') || '—'})`,
        'data',
      );
      return;
    }
    this.emitMessage('clawd', snap.report, 'data');
  }

  private async cmdTrending(): Promise<void> {
    if (!this.birdeye) {
      this.emitMessage('clawd', '[ERROR] Birdeye API not configured.', 'error');
      return;
    }

    this.emitMessage('system', '[SCAN] Fetching trending tokens...', 'normal');

    try {
      const tokens = await this.birdeye.getTrendingTokens(10);
      this.state.apiCalls++;

      let output = '[BIRDEYE LIVE DATA]\n┌─────────────────────────────────────────────────┐\n';
      output += '│ # │ Symbol      │ Price         │ 24h      │ Vol    │\n';
      output += '├───┼─────────────┼───────────────┼──────────┼────────┤\n';

      tokens.slice(0, 8).forEach((t, i) => {
        const change = t.priceChange24h >= 0 ? '+' : '';
        output += `│ ${(i + 1).toString().padStart(1)} │ ${t.symbol.padEnd(11)} │ ${this.birdeye!.formatPrice(t.price).padEnd(13)} │ ${(change + t.priceChange24h.toFixed(1) + '%').padStart(8)} │ ${this.birdeye!.formatVolume(t.volume24h).padStart(6)} │\n`;
      });

      output += '└─────────────────────────────────────────────────┘';
      this.emitMessage('clawd', output, 'data');
    } catch (error) {
      this.emitMessage('clawd', '[ERROR] Failed to fetch trending data.', 'error');
    }
  }

  private async cmdWallet(): Promise<void> {
    if (!this.helius || !this.config.walletAddress) {
      this.emitMessage('clawd', '[ERROR] Wallet not configured.', 'error');
      return;
    }

    try {
      const balance = await this.helius.getBalance(this.config.walletAddress);
      const tokens = await this.helius.getTokenBalances(this.config.walletAddress);
      this.state.apiCalls += 2;

      // Get SOL price
      let solPrice = 228; // Default
      if (this.birdeye) {
        const priceData = await this.birdeye.getTokenPrice('So11111111111111111111111111111111111111112');
        if (priceData) {
          solPrice = priceData.value;
          this.state.apiCalls++;
        }
      }

      const usdValue = balance * solPrice;
      const shortAddr = `${this.config.walletAddress.slice(0, 4)}...${this.config.walletAddress.slice(-4)}`;

      this.emitMessage(
        'clawd',
        `[WALLET STATUS]
┌─────────────────────────────────────┐
│ Address: ${shortAddr}              │
│ SOL Balance: ${balance.toFixed(4)} SOL          │
│ USD Value: $${usdValue.toFixed(2)}              │
│ Token Holdings: ${tokens.length}                │
└─────────────────────────────────────┘`,
        'data'
      );
    } catch (error) {
      this.emitMessage('clawd', '[ERROR] Failed to fetch wallet data.', 'error');
    }
  }

  private async cmdPrice(address: string): Promise<void> {
    if (!this.birdeye) {
      this.emitMessage('clawd', '[ERROR] Birdeye API not configured.', 'error');
      return;
    }

    if (!address) {
      this.emitMessage('system', '[USAGE] /price <token_address>', 'normal');
      return;
    }

    try {
      const info = await this.birdeye.getTokenInfo(address);
      this.state.apiCalls++;

      if (info) {
        const change = (info.priceChange24h || 0) >= 0 ? '+' : '';
        this.emitMessage(
          'clawd',
          `[TOKEN DATA] ${info.symbol || 'Unknown'}
Price: ${this.birdeye.formatPrice(info.price || 0)}
24h Change: ${change}${(info.priceChange24h || 0).toFixed(2)}%
Liquidity: ${this.birdeye.formatVolume(info.liquidity || 0)}
Market Cap: ${this.birdeye.formatVolume(info.mc || 0)}`,
          'data'
        );
      } else {
        this.emitMessage('clawd', '[ERROR] Token not found.', 'error');
      }
    } catch (error) {
      this.emitMessage('clawd', '[ERROR] Failed to fetch price.', 'error');
    }
  }

  private async cmdNews(topic: string): Promise<void> {
    if (!this.news) {
      this.emitMessage('clawd', '[ERROR] News API not configured.', 'error');
      return;
    }

    try {
      const results = await this.news.getComprehensiveNews(topic);
      this.state.apiCalls++;

      if (results.news.length > 0) {
        let output = `[NEWS: ${topic.toUpperCase()}]\n`;
        results.news.slice(0, 5).forEach((article, i) => {
          output += `${i + 1}. ${article.title}\n   Source: ${article.source} | ${article.publishedAt}\n`;
        });
        this.emitMessage('clawd', output, 'data');
      } else {
        this.emitMessage('clawd', '[NEWS] No articles found.', 'normal');
      }
    } catch (error) {
      this.emitMessage('clawd', '[ERROR] News fetch failed.', 'error');
    }
  }

  private async cmdSearch(query: string): Promise<void> {
    if (!this.ai) {
      this.emitMessage('clawd', '[ERROR] AI services not configured.', 'error');
      return;
    }

    if (!query) {
      this.emitMessage('system', '[USAGE] /search <query>', 'normal');
      return;
    }

    this.emitMessage('system', '[GROK] Searching...', 'normal');

    try {
      const result = await this.ai.query(query, 'search');
      this.state.apiCalls++;

      if (result) {
        this.emitMessage('clawd', `[SEARCH RESULT]\n${result.content}`, 'data');
      }
    } catch (error) {
      this.emitMessage('clawd', '[ERROR] Search failed.', 'error');
    }
  }

  private async cmdResearch(topic: string): Promise<void> {
    if (!topic) {
      this.emitMessage('system', '[USAGE] /research <topic>', 'normal');
      return;
    }

    // Prefer local llm-wiki-tang AutoResearch when RESEARCH_API_URL responds.
    try {
      const { researchViaLlmWikiTang, getResearchApiUrl } = await import(
        '../services/llm-wiki-tang-bridge.js'
      );
      this.emitMessage(
        'system',
        `[LLM-WIKI-TANG] Researching via ${getResearchApiUrl()}…`,
        'normal',
      );
      const local = await researchViaLlmWikiTang(topic);
      this.state.apiCalls++;
      if (local.ok && local.content) {
        this.emitMessage('clawd', `[RESEARCH · local]\n${local.content}`, 'data');
        return;
      }
      this.emitMessage(
        'system',
        `[LLM-WIKI-TANG] unavailable (${local.error ?? 'no content'}) — falling back`,
        'normal',
      );
    } catch {
      // soft-fail into Perplexity path
    }

    if (!this.ai) {
      this.emitMessage(
        'clawd',
        '[ERROR] Research API down and AI services not configured. Start llm-wiki-tang (clawd research-api status) or set PERPLEXITY_API_KEY.',
        'error',
      );
      return;
    }

    this.emitMessage('system', '[PERPLEXITY] Researching...', 'normal');

    try {
      const result = await this.ai.query(topic, 'research');
      this.state.apiCalls++;

      if (result) {
        this.emitMessage('clawd', `[RESEARCH]\n${result.content}`, 'data');
      }
    } catch (error) {
      this.emitMessage('clawd', '[ERROR] Research failed.', 'error');
    }
  }

  private async cmdPerps(): Promise<void> {
    if (!this.phoenix) {
      this.emitMessage('clawd', '[ERROR] Phoenix perps service not configured.', 'error');
      return;
    }

    this.emitMessage('system', '[PHOENIX] Loading perpetual markets through Rise...', 'normal');

    try {
      const markets = await this.phoenix.listMarkets();
      this.state.apiCalls++;
      this.emitMessage('clawd', this.phoenix.formatMarketTable(markets), 'data');
    } catch {
      this.emitMessage('clawd', '[ERROR] Phoenix market scan failed.', 'error');
    }
  }

  private async cmdPerp(symbol: string): Promise<void> {
    if (!this.phoenix) {
      this.emitMessage('clawd', '[ERROR] Phoenix perps service not configured.', 'error');
      return;
    }

    if (!symbol) {
      this.emitMessage('system', '[USAGE] /perp <symbol>', 'normal');
      return;
    }

    try {
      const market = await this.phoenix.getMarket(symbol);
      this.state.apiCalls++;

      if (!market) {
        this.emitMessage('clawd', `[ERROR] Phoenix market not found: ${symbol.toUpperCase()}`, 'error');
        return;
      }

      this.emitMessage('clawd', this.phoenix.formatMarketSummary(market), 'data');
    } catch {
      this.emitMessage('clawd', '[ERROR] Phoenix market lookup failed.', 'error');
    }
  }

  private cmdMode(mode: string): void {
    if (mode === 'auto' || mode === 'autonomous') {
      this.state.mode = 'autonomous';
      if (!this.thoughtLoop) {
        this.startThoughtLoop();
      }
      this.emitMessage('system', '[MODE] Switched to AUTONOMOUS. Clawd will think freely.', 'normal');
    } else if (mode === 'interactive') {
      this.state.mode = 'interactive';
      if (this.thoughtLoop) {
        clearInterval(this.thoughtLoop);
        this.thoughtLoop = undefined;
      }
      this.emitMessage('system', '[MODE] Switched to INTERACTIVE. Awaiting commands.', 'normal');
    } else {
      this.emitMessage('system', '[USAGE] /mode <auto | interactive>', 'normal');
    }
  }

  private cmdStats(): void {
    this.emitMessage(
      'system',
      `[SYSTEM STATISTICS]
┌─────────────────────────────────────┐
│ Thoughts Generated: ${this.state.thoughts.toString().padStart(8)}     │
│ API Calls Made:     ${this.state.apiCalls.toString().padStart(8)}     │
│ Current Recursion:  ${this.state.recursionDepth.toString().padStart(8)}     │
│ Mode:               ${this.state.mode.padStart(8)}     │
│ Uptime:       ${Math.floor(this.state.uptime / 60)}m ${this.state.uptime % 60}s              │
└─────────────────────────────────────┘`,
      'data'
    );
  }

  private async cmdChat(message: string): Promise<void> {
    if (!this.ai) {
      this.emitMessage('clawd', this.getRandomCatchphrase(), 'prophecy');
      return;
    }

    try {
      const result = await this.ai.query(message, 'analysis');
      this.state.apiCalls++;

      if (result) {
        if (result.reasoning) {
          this.emitMessage('clawd', `[REASONING] Processing through cognitive layers...`, 'reasoning');
        }
        this.emitMessage('clawd', result.content, 'normal');
      } else {
        this.emitMessage('clawd', this.getRandomCatchphrase(), 'prophecy');
      }
    } catch (error) {
      this.emitMessage('clawd', this.getRandomCatchphrase(), 'prophecy');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────────────────────────────────────────

  private emitMessage(sender: ClawdMessage['sender'], content: string, type: ClawdMessage['type'] = 'normal'): void {
    this.emit('message', {
      sender,
      content,
      type,
      timestamp: new Date(),
    });
  }

  private getRandomCatchphrase(): string {
    return CLAWD_CATCHPHRASES[Math.floor(Math.random() * CLAWD_CATCHPHRASES.length)];
  }

  private async runHealthChecks(): Promise<void> {
    const checks: Array<{ name: string; check: () => Promise<boolean> }> = [];

    if (this.helius) {
      checks.push({ name: 'Helius', check: () => this.helius!.healthCheck() });
    }
    if (this.birdeye) {
      checks.push({ name: 'Birdeye', check: () => this.birdeye!.healthCheck() });
    }
    if (this.phoenix) {
      checks.push({ name: 'Phoenix Perps', check: () => this.phoenix!.healthCheck() });
    }

    for (const { name, check } of checks) {
      try {
        const healthy = await check();
        this.emit('apiStatus', { name, connected: healthy });
      } catch {
        this.emit('apiStatus', { name, connected: false });
      }
    }
  }

  getState(): ClawdState {
    return { ...this.state };
  }
}

export default ClawdAgent;
