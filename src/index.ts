// ═══════════════════════════════════════════════════════════════════════════════
// DARK CLAWD TUI - Main Exports
// ═══════════════════════════════════════════════════════════════════════════════

// Configuration
export * from './openclawd.js';
export * from './config/schema.js';
export * from './config/themes.js';

// Services
export * from './services/helius.js';
export * from './services/birdeye.js';
export * from './services/ai-providers.js';
export * from './services/news-search.js';
export * from './services/automaton-bridge.js';

// Core Components
export * from './components/Header.js';
export * from './components/StatusBar.js';
export * from './components/Panel.js';
export * from './components/Terminal.js';
export * from './components/Dashboard.js';
export * from './components/CommandInput.js';
export * from './components/AutomatonPanel.js';

// Bloomberg-Style Components
export * from './components/OrderBook.js';
export * from './components/DepthChart.js';
export * from './components/PriceChart.js';
export * from './components/TradingPanel.js';
export * from './components/Portfolio.js';
export * from './components/Alerts.js';
export * from './components/Heatmap.js';
export * from './components/ActivityFeed.js';
export * from './components/Watchlist.js';
export * from './components/BloombergDashboard.js';

// Engine
export {
  ClawdAgent,
  type ClawdState,
  type ClawdMessage,
  type ClawdConfig as ClawdAgentConfig,
} from './engine/clawd-agent.js';

// Skills
export {
  SolanaWalletManager,
  formatSol,
  shortenAddress,
  isValidSolanaAddress,
  type WalletInfo,
  type TransactionResult,
  type TokenBalance as WalletTokenBalance,
} from './skills/solana-wallet.js';

export {
  captureAutomatonSnapshot,
  describeAutomatonSkill,
} from './skills/automaton-skill.js';

// App
export { App } from './App.js';
