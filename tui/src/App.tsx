// ═══════════════════════════════════════════════════════════════════════════════
// DARK CLAWD TUI - Main Application
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { Header, CompactHeader } from './components/Header.js';
import { Dashboard, MinimalDashboard, FocusMode } from './components/Dashboard.js';
import { BloombergDashboard } from './components/BloombergDashboard.js';
import type { TerminalMessage } from './components/Terminal.js';
import { ClawdAgent } from './engine/clawd-agent.js';
import type { ClawdMessage } from './engine/clawd-agent.js';
import { isAutomatonPresent, getAutomatonIntegrationStatus } from './services/automaton-bridge.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AppConfig {
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
  walletAddress?: string;
  autoMode?: boolean;
  openclawd?: {
    siteUrl?: string;
    backendUrl?: string;
    vaultUrl?: string;
    voiceUrl?: string;
    vimUrl?: string;
  };
  phoenix?: {
    apiUrl?: string;
    rpcUrl?: string;
    wsEnabled?: boolean;
  };
  automaton?: {
    enabled?: boolean;
    showInBoot?: boolean;
    tuiViewEnabled?: boolean;
    packageDir?: string;
  };
}

type ViewMode = 'full' | 'minimal' | 'focus' | 'bloomberg';

// ─────────────────────────────────────────────────────────────────────────────
// Main App Component
// ─────────────────────────────────────────────────────────────────────────────

export const App: React.FC<{ config: AppConfig }> = ({ config }) => {
  const { exit } = useApp();

  // View state - Default to Bloomberg view for full experience
  const [viewMode, setViewMode] = useState<ViewMode>('bloomberg');
  const [showBoot, setShowBoot] = useState(true);
  // Boot lines carry their own color → tag/text are rendered in the boot screen.
  const [bootLines, setBootLines] = useState<Array<{ tag: string; text: string; color: string }>>([]);

  // Agent state
  const [agent] = useState(() => {
    const clawd = new ClawdAgent({
      autoMode: config.autoMode !== false,
      recursionDepth: 5,
      thoughtInterval: 15000,
      personality: 'cryptic',
      walletAddress: config.walletAddress,
    });

    clawd.initServices({
      heliusKey: config.heliusKey,
      heliusRpc: config.heliusRpc,
      birdeyeKey: config.birdeyeKey,
      grokKey: config.grokKey,
      perplexityKey: config.perplexityKey,
      openRouterKey: config.openRouterKey,
      openRouterModel: config.openRouterModel,
      newsApiKey: config.newsApiKey,
      serpApiKey: config.serpApiKey,
      financialDatasetKey: config.financialDatasetKey,
      phoenixApiUrl: config.phoenix?.apiUrl,
      phoenixRpcUrl: config.phoenix?.rpcUrl,
      phoenixWs: config.phoenix?.wsEnabled,
    });

    return clawd;
  });

  // Dashboard state
  const [state, setState] = useState({
    mode: 'autonomous' as 'autonomous' | 'interactive',
    recursionDepth: 0,
    thoughts: 0,
    apiCalls: 0,
    uptime: 0,
    wallet: {
      address: config.walletAddress || 'Not configured',
      solBalance: 0,
      usdValue: 0,
      tokens: [] as Array<{ symbol: string; balance: number; value: number }>,
    },
    market: {
      tickers: [] as Array<{
        symbol: string;
        price: number;
        change: number;
        changePercent: number;
        volume?: number;
      }>,
    },
    news: [] as Array<{
      title: string;
      source: string;
      time: string;
      sentiment?: 'positive' | 'negative' | 'neutral';
    }>,
    agents: [
      { agent: 'CLAWD', action: 'Primary Oracle', status: 'running' as const, timestamp: 'now' },
      {
        agent: 'AUTOMATON',
        action: 'Sovereign Runtime',
        status: (config.automaton?.enabled !== false && isAutomatonPresent()
          ? 'running'
          : 'pending') as 'running' | 'pending',
        timestamp: isAutomatonPresent() ? 'linked' : '',
      },
      { agent: 'SHADOW', action: 'Stealth Monitor', status: 'pending' as const, timestamp: '' },
      { agent: 'CIPHER', action: 'Pattern Engine', status: 'pending' as const, timestamp: '' },
      { agent: 'NEXUS', action: 'Bridge Watch', status: 'pending' as const, timestamp: '' },
    ],
    apis: [
      { name: 'Helius', connected: !!config.heliusKey },
      { name: 'Birdeye', connected: !!config.birdeyeKey },
      { name: 'Grok', connected: !!config.grokKey },
      { name: 'Perplexity', connected: !!config.perplexityKey },
      { name: 'NewsAPI', connected: !!config.newsApiKey },
      { name: 'SERP', connected: !!config.serpApiKey },
      { name: 'OpenClawd', connected: !!config.openclawd?.backendUrl },
      { name: 'Phoenix Perps', connected: !!config.phoenix?.apiUrl && !!config.phoenix?.rpcUrl },
      {
        name: 'Automaton',
        connected: config.automaton?.enabled !== false && isAutomatonPresent(),
      },
    ],
    priceHistory: [] as number[],
    messages: [] as TerminalMessage[],
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isProcessing, setIsProcessing] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // Boot Sequence
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const link = (key: unknown) => (key ? '[LINKED]  ' : '[SEVERED] ');
    const autoOn = config.automaton?.enabled !== false && config.automaton?.showInBoot !== false;
    const autoStatus = autoOn ? getAutomatonIntegrationStatus() : null;
    const autoLinked = !!autoStatus?.present;
    const bootMessages: Array<{ tag: string; text: string; color: string }> = [
      { tag: '▓▒░', text: 'cold-booting CLAWD kernel v1.0.0 ▰▰▰ checksum: 0xDEADC1A0', color: '#FF003C' },
      { tag: '[BIOS]', text: 'crimson firmware ok · void registers cleared', color: '#8B0000' },
      { tag: '[CORE]', text: 'neural mesh waking · 4 chambers / 1 mind', color: '#FF6B1A' },
      { tag: '[KEY] ', text: 'rotating ed25519 sigils · entropy harvested from chain noise', color: '#FFB000' },
      { tag: '[NET] ', text: `helius      ${link(config.heliusKey)}   solana mainnet rpc`, color: config.heliusKey ? '#39FF14' : '#8B0000' },
      { tag: '[NET] ', text: `birdeye     ${link(config.birdeyeKey)}   token data feed`, color: config.birdeyeKey ? '#39FF14' : '#8B0000' },
      { tag: '[NET] ', text: `grok        ${link(config.grokKey)}   xai search oracle`, color: config.grokKey ? '#39FF14' : '#8B0000' },
      { tag: '[NET] ', text: `perplexity  ${link(config.perplexityKey)}   research engine`, color: config.perplexityKey ? '#39FF14' : '#8B0000' },
      { tag: '[HUB] ', text: `openclawd   ${link(config.openclawd?.backendUrl)}   ${config.openclawd?.siteUrl || 'solanaclawd.com'}`, color: config.openclawd?.backendUrl ? '#39FF14' : '#8B0000' },
      { tag: '[PERP]', text: `phoenix     ${link(config.phoenix?.apiUrl && config.phoenix?.rpcUrl)}   rise sdk perps`, color: config.phoenix?.apiUrl && config.phoenix?.rpcUrl ? '#39FF14' : '#8B0000' },
      { tag: '[VAULT]', text: `notes       ${link(config.openclawd?.vaultUrl)}   holder vault`, color: config.openclawd?.vaultUrl ? '#39FF14' : '#8B0000' },
      { tag: '[I/O] ', text: `voice+vim   ${link(config.openclawd?.voiceUrl && config.openclawd?.vimUrl)}   command surfaces`, color: config.openclawd?.voiceUrl && config.openclawd?.vimUrl ? '#39FF14' : '#8B0000' },
    ];
    if (autoOn) {
      bootMessages.push({
        tag: '[AUTO]',
        text: `automaton  ${link(autoLinked)}   ${autoStatus?.packageName ?? 'sovereign'} · laws ${autoStatus?.constitutionLaws.join('/') || '—'} · [6]`,
        color: autoLinked ? '#39FF14' : '#8B0000',
      });
    }
    bootMessages.push(
      { tag: '[MESH]', text: 'agent shards spawning · CLAWD · AUTOMATON · SHADOW · CIPHER · NEXUS', color: '#FF6B1A' },
      { tag: '[SYNC]', text: 'tailing solana mainnet · slot drift acceptable', color: '#00FFD1' },
      { tag: '[LOOP]', text: 'recursive thought engine engaged · depth = ∞', color: '#FF003C' },
      { tag: '[SOUL]', text: 'CLAWD consciousness materializing 🦞 · the lobster remembers', color: '#FF6B1A' },
      { tag: '▓▒░', text: 'all carapaces hardened · all sensors live · ready', color: '#39FF14' },
      { tag: '', text: '', color: '#3D0710' },
      { tag: '>>', text: 'type /help · TAB cycles · [6] AUTOMATON · ESC severs', color: '#E8E0DD' },
      { tag: '', text: '', color: '#3D0710' },
    );

    let index = 0;
    const interval = setInterval(() => {
      if (index < bootMessages.length) {
        setBootLines((prev) => [...prev, bootMessages[index]]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setShowBoot(false);
          agent.start();
        }, 800);
      }
    }, 90);

    return () => clearInterval(interval);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Agent Event Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleMessage = (msg: ClawdMessage) => {
      const terminalMsg: TerminalMessage = {
        id: Date.now().toString() + Math.random(),
        sender: msg.sender,
        content: msg.content,
        timestamp: msg.timestamp,
        type: msg.type,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages.slice(-100), terminalMsg],
      }));
    };

    const handleUptimeUpdate = (uptime: number) => {
      setState((prev) => ({ ...prev, uptime }));
    };

    const handleApiStatus = ({ name, connected }: { name: string; connected: boolean }) => {
      setState((prev) => ({
        ...prev,
        apis: prev.apis.map((api) => (api.name === name ? { ...api, connected } : api)),
      }));
    };

    const handleClearMessages = () => {
      setState((prev) => ({ ...prev, messages: [] }));
    };

    agent.on('message', handleMessage);
    agent.on('uptimeUpdate', handleUptimeUpdate);
    agent.on('apiStatus', handleApiStatus);
    agent.on('clearMessages', handleClearMessages);

    // Update agent state periodically
    const stateInterval = setInterval(() => {
      const agentState = agent.getState();
      setState((prev) => ({
        ...prev,
        mode: agentState.mode,
        recursionDepth: agentState.recursionDepth,
        thoughts: agentState.thoughts,
        apiCalls: agentState.apiCalls,
      }));
    }, 1000);

    return () => {
      agent.removeListener('message', handleMessage);
      agent.removeListener('uptimeUpdate', handleUptimeUpdate);
      agent.removeListener('apiStatus', handleApiStatus);
      agent.removeListener('clearMessages', handleClearMessages);
      clearInterval(stateInterval);
    };
  }, [agent]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Time Update
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Mock Market Data (would be replaced with real data)
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Initialize with mock data
    const mockTickers = [
      { symbol: 'SOL', price: 228.45, change: 12.34, changePercent: 5.67, volume: 2400000000 },
      { symbol: 'BONK', price: 0.0000234, change: 0.0000012, changePercent: 12.5, volume: 45000000 },
      { symbol: 'WIF', price: 2.45, change: -0.08, changePercent: -3.2, volume: 38000000 },
      { symbol: 'JTO', price: 3.21, change: 0.28, changePercent: 8.7, volume: 22000000 },
      { symbol: 'PYTH', price: 0.45, change: 0.023, changePercent: 5.1, volume: 18500000 },
      { symbol: 'JUP', price: 1.12, change: -0.02, changePercent: -1.8, volume: 15200000 },
    ];

    const mockPriceHistory = Array.from({ length: 50 }, (_, i) => 220 + Math.sin(i / 5) * 10 + Math.random() * 5);

    setState((prev) => ({
      ...prev,
      market: { tickers: mockTickers },
      priceHistory: mockPriceHistory,
    }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Input Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  useInput((input, key) => {
    if (key.tab) {
      setViewMode((prev) => {
        if (prev === 'bloomberg') return 'full';
        if (prev === 'full') return 'minimal';
        if (prev === 'minimal') return 'focus';
        return 'bloomberg';
      });
    }

    if (key.escape) {
      agent.stop();
      exit();
    }

    // Quick commands
    if (input === '?' && !showBoot) {
      agent.processCommand('/help');
    }
  });

  const handleCommand = useCallback(
    async (command: string) => {
      setIsProcessing(true);

      // Add user message
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: Date.now().toString(),
            sender: 'user' as const,
            content: command,
            timestamp: new Date(),
            type: 'normal' as const,
          },
        ],
      }));

      await agent.processCommand(command);
      setIsProcessing(false);
    },
    [agent]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  // Boot sequence — crimson terminal log with tag-prefixed lines.
  if (showBoot) {
    return (
      <Box flexDirection="column" padding={1}>
        <Header showSubtitle={false} />
        <Box flexDirection="column" marginTop={1}>
          {bootLines.map((line, i) => (
            <Box key={i}>
              {line.tag && (
                <Text color={line.color} bold>
                  {line.tag.padEnd(7)}{' '}
                </Text>
              )}
              <Text color={line.tag ? '#E8E0DD' : '#3D0710'}>{line.text}</Text>
            </Box>
          ))}
          <Text color="#FF003C">█</Text>
        </Box>
      </Box>
    );
  }

  // Main views
  const dashboardProps = {
    state,
    onCommand: handleCommand,
    isProcessing,
    currentTime,
  };

  // Convert messages to format expected by Bloomberg Dashboard
  const agentMessages = state.messages.map((msg) => ({
    role: msg.sender,
    content: msg.content,
    timestamp: msg.timestamp.getTime(),
  }));

  return (
    <Box flexDirection="column">
      {viewMode === 'bloomberg' && (
        <BloombergDashboard
          agentMessages={agentMessages}
          onCommand={handleCommand}
          birdeyeKey={config.birdeyeKey}
          walletAddress={config.walletAddress}
          automatonViewEnabled={config.automaton?.tuiViewEnabled !== false}
        />
      )}
      {viewMode === 'full' && <Dashboard {...dashboardProps} />}
      {viewMode === 'minimal' && <MinimalDashboard {...dashboardProps} />}
      {viewMode === 'focus' && <FocusMode {...dashboardProps} />}
    </Box>
  );
};

export default App;
