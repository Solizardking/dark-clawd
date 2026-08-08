#!/usr/bin/env bun
// ═══════════════════════════════════════════════════════════════════════════════
// DARK CLAWD TUI - CLI Entry Point
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { config as dotenvConfig } from 'dotenv';
import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import ora from 'ora';
import { App } from './App.js';
import { loadConfigFromEnv } from './config/schema.js';
import { SolanaWalletManager } from './skills/solana-wallet.js';
import {
  buildAutomationKitManifest,
  enrichSolanaQuote,
  formatTradePlan,
  globalAutomationRegistry,
  planTrade,
  type TradeChain,
  type TradeSide,
} from './services/trade-automation.js';
import { startSandboxServer } from './services/sandbox-server.js';
import {
  formatAutomatonStatusReport,
  getAutomatonIntegrationStatus,
  isAutomatonPresent,
  loadAutomatonConstitution,
  planAutomatonProxy,
  tryRunAutomatonEntrypoint,
} from './services/automaton-bridge.js';
import {
  formatLlmWikiTangStatusReport,
  getLlmWikiTangIntegrationStatus,
  getLlmWikiTangPaths,
  probeResearchApiHealth,
} from './services/llm-wiki-tang-bridge.js';
import {
  formatWelcomeBanner,
  PACKAGE_VERSION,
  PRODUCT_GITHUB_URL,
  PRODUCT_HUB_URL,
  PRODUCT_NAME,
  productInfoRecord,
} from './product.js';
import {
  getSolGptShippedToolCatalog,
  runSolGptTool,
  searchTools,
  SOL_GPT_CORE_COUNT,
  SOL_GPT_TOOL_COUNT,
  toolsByGroup,
  type ToolGroupId,
} from './tools/index.js';
import {
  formatAgentBanner,
  OpenRouterAgentHarness,
  type AgentEvent,
} from './agent/openrouter-harness.js';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// Load environment variables
dotenvConfig();

// ─────────────────────────────────────────────────────────────────────────────
// CLI Setup
// ─────────────────────────────────────────────────────────────────────────────

const program = new Command();

program
  .name('dark-clawd')
  .description(
    `${PRODUCT_NAME} — recursive Solana intelligence TUI (hub: ${PRODUCT_HUB_URL})`,
  )
  .version(PACKAGE_VERSION)
  .addHelpText(
    'after',
    `\nProduct hub: ${PRODUCT_HUB_URL}\nGitHub:      ${PRODUCT_GITHUB_URL}\n`,
  );

// ─────────────────────────────────────────────────────────────────────────────
// Main Run Command
// ─────────────────────────────────────────────────────────────────────────────

program
  .command('run')
  .description('Start Dark Clawd TUI')
  .option('-a, --auto', 'Enable autonomous mode (default)', true)
  .option('-i, --interactive', 'Start in interactive mode')
  .option('-w, --wallet <address>', 'Wallet address to monitor')
  .option('--headless', 'Run without TUI (daemon mode)')
  .action(async (options) => {
    const config = loadConfigFromEnv();

    // Show banner
    if (!options.headless) {
      // CLAWD ASCII Art with Lobster
      const lobsterArt = `
${chalk.red(`
       \\          /
        \\   🦞   /
         \\  ||  /
    (\\__/)  ||  (\\__/)
    (o   o) || (o   o)
     \\   /  ||  \\   /
      \`-'  /  \\  \`-'
          /    \\
`)}
${chalk.green(`
   ____ _        ___        ______  
  / ___| |      / \\ \\      / /  _ \\ 
 | |   | |     / _ \\ \\ /\\ / /| | | |
 | |___| |___ / ___ \\ V  V / | |_| |
  \\____|_____/_/   \\_\\_/\\_/  |____/ 
`)}`;
      console.log(lobsterArt);
      console.log(chalk.gray('  🦞 Recursive Autonomous Solana Intelligence\n'));
    }

    // Validate required keys
    const spinner = ora('Initializing CLAWD...').start();

    const missingKeys: string[] = [];
    if (!config.apiKeys?.HELIUS_API_KEY) missingKeys.push('HELIUS_API_KEY');

    if (missingKeys.length > 0 && !options.headless) {
      spinner.warn('Some API keys are missing');
      console.log(chalk.yellow(`\n⚠️  Missing keys: ${missingKeys.join(', ')}`));
      console.log(chalk.gray('  Run `dark-clawd setup` to configure\n'));
    } else {
      spinner.succeed('Configuration loaded');
    }

    // Start the TUI
    if (!options.headless) {
      const { waitUntilExit } = render(
        <App
          config={{
            heliusKey: config.apiKeys?.HELIUS_API_KEY,
            heliusRpc: config.apiKeys?.HELIUS_RPC_URL,
            birdeyeKey: config.apiKeys?.BIRDEYE_API_KEY,
            grokKey: config.apiKeys?.XAI_API_KEY,
            perplexityKey: config.apiKeys?.PERPLEXITY_API_KEY,
            openRouterKey: config.apiKeys?.OPENROUTER_API_KEY,
            openRouterModel: config.apiKeys?.OPENROUTER_MODEL,
            newsApiKey: config.apiKeys?.NEWS_API_KEY,
            serpApiKey: config.apiKeys?.SERP_API_KEY,
            financialDatasetKey: config.apiKeys?.FINANCIAL_DATASET_API_KEY,
            walletAddress: options.wallet || config.solana?.privateKey,
            autoMode: !options.interactive,
            openclawd: config.openclawd,
            phoenix: config.phoenix,
            automaton: config.automaton,
          }}
        />
      );

      await waitUntilExit();
    } else {
      // Headless mode - just log
      console.log(chalk.green('Dark Clawd running in headless mode...'));
      console.log(chalk.gray('Press Ctrl+C to stop'));

      // Keep process alive
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\nDark Clawd shutting down...'));
        process.exit(0);
      });
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// Setup Command
// ─────────────────────────────────────────────────────────────────────────────

program
  .command('setup')
  .description('Interactive setup wizard')
  .action(async () => {
    console.log(
      boxen(chalk.greenBright('Dark Clawd Setup Wizard'), {
        padding: 1,
        borderColor: 'green',
        borderStyle: 'double',
      })
    );

    console.log(chalk.cyan('\nProvider Settings:'));
    console.log(chalk.gray('─'.repeat(50)));

    const keys = [
      { name: 'HELIUS_API_KEY', url: 'https://helius.xyz/', desc: 'Solana RPC & DAS' },
      { name: 'BIRDEYE_API_KEY', url: 'https://birdeye.so/', desc: 'Token data & analytics' },
      { name: 'XAI_API_KEY', url: 'https://x.ai/api', desc: 'Grok AI for search' },
      { name: 'PERPLEXITY_API_KEY', url: 'https://perplexity.ai/', desc: 'AI research' },
      { name: 'OPENROUTER_API_KEY', url: 'https://openrouter.ai/', desc: 'OpenClawd reasoning model router' },
      { name: 'OPENCLAWD_BACKEND_URL', url: 'https://solanaclawd.com', desc: 'OpenClawd backend and holder routes' },
      { name: 'PHOENIX_API_URL', url: 'https://docs.phoenix.trade/sdk/rise', desc: 'Phoenix perps API endpoint', defaulted: true },
      { name: 'PHOENIX_RPC_URL', url: 'https://docs.phoenix.trade/sdk/ws-api-best-practices', desc: 'Solana RPC for Phoenix Rise SDK', defaulted: true },
      { name: 'NEWS_API_KEY', url: 'https://newsapi.org/', desc: 'Crypto news' },
      { name: 'SERP_API_KEY', url: 'https://serpapi.com/', desc: 'Search results' },
      { name: 'FINANCIAL_DATASET_API_KEY', url: 'https://financialdatasets.ai/', desc: 'Market data' },
    ];

    keys.forEach((key) => {
      const hasKey = !!process.env[key.name];
      const status = hasKey ? chalk.green('✓') : key.defaulted ? chalk.cyan('•') : chalk.red('✗');
      console.log(`${status} ${chalk.white(key.name.padEnd(25))} ${chalk.gray(key.desc)}`);
      if (!hasKey && !key.defaulted) {
        console.log(chalk.gray(`    Get your key at: ${key.url}`));
      } else if (!hasKey && key.defaulted) {
        console.log(chalk.gray(`    Optional override; default documented at: ${key.url}`));
      }
    });

    console.log(chalk.gray('\n─'.repeat(50)));
    console.log(chalk.yellow('\n📝 Create a .env file with your API keys:'));
    console.log(chalk.gray('   cp .env.example .env'));
    console.log(chalk.gray('   # Edit .env with your keys'));
    console.log(chalk.gray('   # Optional: set OPENCLAWD_BACKEND_URL for a self-hosted backend'));
    console.log(chalk.yellow('\n🚀 Then run:'));
    console.log(chalk.white('   dark-clawd run'));
  });

// ─────────────────────────────────────────────────────────────────────────────
// Wallet Commands
// ─────────────────────────────────────────────────────────────────────────────

program
  .command('wallet')
  .description('Wallet management commands')
  .option('-c, --create', 'Create new wallet')
  .option('-b, --balance', 'Show wallet balance')
  .option('-a, --address', 'Show wallet address')
  .action(async (options) => {
    const config = loadConfigFromEnv();
    const rpcUrl = config.apiKeys?.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';

    const wallet = new SolanaWalletManager(rpcUrl);

    if (options.create) {
      const spinner = ora('Creating wallet...').start();
      const result = await wallet.createWallet();

      if (result.created) {
        spinner.succeed('New wallet created!');
        console.log(chalk.green(`\n📍 Address: ${result.publicKey}`));
        console.log(chalk.yellow('\n⚠️  Your wallet is saved at ~/.darkclawd/wallet.json'));
        console.log(chalk.yellow('   Keep this file safe and never share it!'));
      } else {
        spinner.info('Wallet already exists');
        console.log(chalk.cyan(`\n📍 Address: ${result.publicKey}`));
      }
      return;
    }

    // Load existing wallet
    if (!wallet.loadWallet()) {
      console.log(chalk.red('No wallet found. Run `dark-clawd wallet --create` first.'));
      return;
    }

    if (options.address) {
      console.log(chalk.green(`Address: ${wallet.getPublicKey()}`));
      return;
    }

    if (options.balance) {
      const spinner = ora('Fetching balance...').start();
      try {
        const info = await wallet.getWalletInfo();
        spinner.succeed('Balance fetched');

        console.log(
          boxen(
            `${chalk.cyan('Address:')} ${info.publicKey}\n` +
            `${chalk.green('SOL Balance:')} ${info.solBalance.toFixed(4)} SOL\n` +
            `${chalk.yellow('Tokens:')} ${info.tokens.length} holdings`,
            {
              padding: 1,
              borderColor: 'green',
              title: 'Wallet Info',
            }
          )
        );
      } catch (error: any) {
        spinner.fail('Failed to fetch balance');
        console.log(chalk.red(error.message));
      }
      return;
    }

    // Default: show address
    console.log(chalk.green(`Address: ${wallet.getPublicKey()}`));
  });

// ─────────────────────────────────────────────────────────────────────────────
// Status Command
// ─────────────────────────────────────────────────────────────────────────────

program
  .command('status')
  .description('Check API connection status')
  .action(async () => {
    const config = loadConfigFromEnv();

    console.log(chalk.greenBright('\n🔌 API Status Check\n'));
    console.log(chalk.gray('─'.repeat(50)));

    const checks = [
      { name: 'Helius', key: config.apiKeys?.HELIUS_API_KEY },
      { name: 'Birdeye', key: config.apiKeys?.BIRDEYE_API_KEY },
      { name: 'xAI Grok', key: config.apiKeys?.XAI_API_KEY },
      { name: 'Perplexity', key: config.apiKeys?.PERPLEXITY_API_KEY },
      { name: 'News API', key: config.apiKeys?.NEWS_API_KEY },
      { name: 'SERP API', key: config.apiKeys?.SERP_API_KEY },
      { name: 'Financial Datasets', key: config.apiKeys?.FINANCIAL_DATASET_API_KEY },
      { name: 'OpenRouter', key: config.apiKeys?.OPENROUTER_API_KEY },
      { name: 'OpenClawd Backend', key: config.openclawd?.backendUrl },
      { name: 'OpenClawd Vault', key: config.openclawd?.vaultUrl },
      { name: 'Phoenix API', key: config.phoenix?.apiUrl },
      { name: 'Phoenix RPC', key: config.phoenix?.rpcUrl },
    ];

    for (const check of checks) {
      const status = check.key ? chalk.green('✓ CONFIGURED') : chalk.red('✗ NOT SET');
      console.log(`${check.name.padEnd(20)} ${status}`);
    }

    const autoEnabled = config.automaton?.enabled !== false;
    const autoPresent = isAutomatonPresent();
    const autoLabel = !autoEnabled
      ? chalk.yellow('○ DISABLED')
      : autoPresent
        ? chalk.green('✓ VENDORED')
        : chalk.red('✗ MISSING');
    console.log(`${'Automaton'.padEnd(20)} ${autoLabel}`);
    if (autoPresent) {
      const auto = getAutomatonIntegrationStatus();
      console.log(
        chalk.gray(
          `  ${auto.packageName}@${auto.version} · laws: ${auto.constitutionLaws.join(', ') || '—'}`,
        ),
      );
    }

    console.log(chalk.gray('─'.repeat(50)));

    const configured = checks.filter((c) => c.key).length;
    console.log(chalk.cyan(`\n${configured}/${checks.length} APIs configured`));
    if (autoEnabled && autoPresent) {
      console.log(chalk.magenta('Automaton bridge ready · clawd automaton status'));
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// Info Command
// ─────────────────────────────────────────────────────────────────────────────

program
  .command('info')
  .description('Display system and product information')
  .action(() => {
    const cfg = loadConfigFromEnv();
    const info = {
      ...productInfoRecord(),
      site: cfg.openclawd?.siteUrl || 'https://solanaclawd.com',
      vault: cfg.openclawd?.vaultUrl || 'https://solanaclawd.com/vault',
    };

    console.log(
      boxen(
        Object.entries(info)
          .map(([k, v]) => `${chalk.cyan(k.padEnd(12))} ${chalk.white(v)}`)
          .join('\n'),
        {
          padding: 1,
          borderColor: 'green',
          title: `${PRODUCT_NAME} Info`,
          titleAlignment: 'center',
        }
      )
    );
  });

program
  .command('welcome')
  .description('Friendly first-run guide (hub, GitHub, install, next steps)')
  .action(() => {
    console.log(
      boxen(formatWelcomeBanner(), {
        padding: 1,
        borderColor: 'magenta',
        borderStyle: 'round',
        title: `${PRODUCT_NAME} · first release`,
        titleAlignment: 'center',
      }),
    );
  });

// ─────────────────────────────────────────────────────────────────────────────
// Automaton bridge (sibling ../automaton)
// ─────────────────────────────────────────────────────────────────────────────

const automatonCmd = program
  .command('automaton')
  .description('Dark Clawd ↔ Automaton integration (sovereign agent runtime)');

automatonCmd
  .command('status')
  .description('Show vendored Automaton package status and paths')
  .action(() => {
    console.log(chalk.greenBright(formatAutomatonStatusReport(getAutomatonIntegrationStatus())));
  });

automatonCmd
  .command('constitution')
  .description('Print Clawd Automaton constitution (laws)')
  .action(() => {
    const status = getAutomatonIntegrationStatus();
    const text = loadAutomatonConstitution(status.root);
    if (!text) {
      console.log(chalk.red('constitution.md not found under automaton/'));
      process.exitCode = 1;
      return;
    }
    console.log(
      boxen(chalk.cyan('Clawd Automaton Constitution'), {
        padding: 1,
        borderColor: 'cyan',
        borderStyle: 'round',
      }),
    );
    console.log(text);
    if (status.constitutionLaws.length) {
      console.log(chalk.gray(`\nDetected laws: ${status.constitutionLaws.join(' · ')}`));
    }
  });

automatonCmd
  .command('help')
  .description('Show Automaton runtime help (proxied when runnable)')
  .action(() => {
    const result = tryRunAutomatonEntrypoint('--help');
    if (result.ok && result.stdout.trim()) {
      console.log(result.stdout);
      return;
    }
    const plan = planAutomatonProxy('help');
    console.log(chalk.yellow('Automaton runtime not executable yet (install deps + build).'));
    if (result.stderr) console.log(chalk.gray(result.stderr.slice(0, 400)));
    console.log(chalk.cyan('\nSuggested:'));
    for (const line of plan.suggested) console.log(chalk.white(`  ${line}`));
  });

automatonCmd
  .command('paths')
  .description('List Automaton tree entrypoints used by Dark Clawd TUI')
  .action(() => {
    const s = getAutomatonIntegrationStatus();
    console.log(
      boxen(
        [
          `${chalk.cyan('root'.padEnd(14))} ${s.root}`,
          `${chalk.cyan('runtime'.padEnd(14))} ${s.entrypoints.runtime ?? '—'}`,
          `${chalk.cyan('cli'.padEnd(14))} ${s.entrypoints.cliPackage ?? '—'}`,
          `${chalk.cyan('scripts'.padEnd(14))} ${s.entrypoints.scripts.join(', ') || '—'}`,
          `${chalk.cyan('package'.padEnd(14))} ${s.packageName ?? '—'}@${s.version ?? '?'}`,
        ].join('\n'),
        { padding: 1, borderColor: 'magenta', title: 'Automaton Paths' },
      ),
    );
  });

automatonCmd.action(() => {
  console.log(formatAutomatonStatusReport(getAutomatonIntegrationStatus()));
});

// ─────────────────────────────────────────────────────────────────────────────
// llm-wiki-tang bridge (sibling ../llm-wiki-tang — AutoResearch / memory API)
// ─────────────────────────────────────────────────────────────────────────────

const researchApiCmd = program
  .command('research-api')
  .description('Dark Clawd TUI ↔ llm-wiki-tang (local AutoResearch + OpenClawd memory)');

researchApiCmd
  .command('status')
  .description('Show vendored llm-wiki-tang package status and RESEARCH_API_URL')
  .action(() => {
    console.log(chalk.greenBright(formatLlmWikiTangStatusReport(getLlmWikiTangIntegrationStatus())));
  });

researchApiCmd
  .command('paths')
  .description('List llm-wiki-tang tree entrypoints used by Dark Clawd TUI')
  .action(() => {
    const s = getLlmWikiTangIntegrationStatus();
    const paths = getLlmWikiTangPaths(s.root);
    console.log(
      boxen(
        [
          `${chalk.cyan('root'.padEnd(16))} ${s.root}`,
          `${chalk.cyan('pyproject'.padEnd(16))} ${paths.pyproject}`,
          `${chalk.cyan('api/main.py'.padEnd(16))} ${paths.apiMain}`,
          `${chalk.cyan('src'.padEnd(16))} ${paths.srcDir}`,
          `${chalk.cyan('tests'.padEnd(16))} ${paths.testsDir}`,
          `${chalk.cyan('memory'.padEnd(16))} ${paths.openclawdMemoryDir}`,
          `${chalk.cyan('RESEARCH_API'.padEnd(16))} ${s.researchApiUrl}`,
          `${chalk.cyan('package'.padEnd(16))} ${s.packageName ?? '—'}@${s.version ?? '?'}`,
        ].join('\n'),
        { padding: 1, borderColor: 'cyan', title: 'llm-wiki-tang Paths' },
      ),
    );
  });

researchApiCmd
  .command('health')
  .description('Probe RESEARCH_API_URL /health (soft-fail if uvicorn is down)')
  .action(async () => {
    const s = getLlmWikiTangIntegrationStatus();
    console.log(chalk.gray(`Probing ${s.researchApiUrl}/health …`));
    const probe = await probeResearchApiHealth(s.researchApiUrl);
    if (probe.ok) {
      console.log(chalk.green(`OK ${probe.status} ${probe.url}`));
      if (probe.body) console.log(probe.body);
    } else {
      console.log(chalk.yellow(`DOWN ${probe.url}`));
      if (probe.error) console.log(chalk.gray(probe.error));
      console.log(chalk.cyan('\nStart the API:'));
      console.log(chalk.white(`  cd ${s.root} && ${s.uvicornCmd}`));
      console.log(chalk.white(`  export RESEARCH_API_URL=${s.researchApiUrl}`));
      process.exitCode = 1;
    }
  });

researchApiCmd.action(() => {
  console.log(formatLlmWikiTangStatusReport(getLlmWikiTangIntegrationStatus()));
});

// ─────────────────────────────────────────────────────────────────────────────
// Trade / Automate / Sandbox (automation kit)
// ─────────────────────────────────────────────────────────────────────────────

program
  .command('trade')
  .description('Plan a Solana or Robinhood token trade via Dark Clawd (paper by default)')
  .requiredOption('--chain <chain>', 'solana | robinhood')
  .requiredOption('--token <address>', 'Mint (Solana) or 0x address (Robinhood Chain)')
  .requiredOption('--side <side>', 'buy | sell')
  .requiredOption('--amount <n>', 'Amount in quote (buy) or base (sell)', parseFloat)
  .option('--symbol <sym>', 'Display symbol')
  .option('--slippage <bps>', 'Slippage bps', (v) => parseInt(v, 10), 50)
  .option('--live', 'Request live mode (still blocked without keys/confirm)', false)
  .option('--quote', 'Enrich Solana plan with Jupiter quote', false)
  .action(async (options) => {
    const chain = String(options.chain).toLowerCase() as TradeChain;
    if (chain !== 'solana' && chain !== 'robinhood') {
      console.error(chalk.red('chain must be solana or robinhood'));
      process.exitCode = 1;
      return;
    }
    const side = String(options.side).toLowerCase() as TradeSide;
    if (side !== 'buy' && side !== 'sell') {
      console.error(chalk.red('side must be buy or sell'));
      process.exitCode = 1;
      return;
    }
    try {
      let plan = planTrade({
        chain,
        token: options.token,
        side,
        amount: options.amount,
        symbol: options.symbol,
        slippageBps: options.slippage,
        mode: options.live ? 'live' : 'paper',
      });
      if (options.quote && chain === 'solana') {
        const spinner = ora('Fetching Jupiter quote...').start();
        plan = await enrichSolanaQuote(plan);
        spinner.succeed('Quote enrichment complete');
      }
      console.log(chalk.green(formatTradePlan(plan)));
      console.log(chalk.gray('\nJSON:\n') + JSON.stringify(plan, null, 2));
    } catch (err) {
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exitCode = 1;
    }
  });

const automate = program.command('automate').description('Manage Dark Clawd trade automations');

automate
  .command('create')
  .description('Create a paper automation job')
  .requiredOption('--name <name>', 'Job name')
  .requiredOption('--chain <chain>', 'solana | robinhood')
  .requiredOption('--token <address>', 'Token address')
  .option('--side <side>', 'buy | sell', 'buy')
  .requiredOption('--amount <n>', 'Amount', parseFloat)
  .option('--cadence <c>', 'once | interval | trigger', 'once')
  .option('--interval-ms <n>', 'Interval ms for cadence=interval', (v) => parseInt(v, 10))
  .action((options) => {
    try {
      const job = globalAutomationRegistry.create({
        name: options.name,
        chain: String(options.chain).toLowerCase() as TradeChain,
        token: options.token,
        side: String(options.side).toLowerCase() as TradeSide,
        amount: options.amount,
        cadence: options.cadence,
        intervalMs: options.intervalMs,
      });
      console.log(chalk.green('Automation created:'));
      console.log(JSON.stringify(job, null, 2));
    } catch (err) {
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exitCode = 1;
    }
  });

automate
  .command('list')
  .description('List automation jobs')
  .action(() => {
    console.log(JSON.stringify(globalAutomationRegistry.list(), null, 2));
  });

automate
  .command('run')
  .description('Run one automation cycle (paper plan)')
  .requiredOption('--id <id>', 'Automation id')
  .action((options) => {
    try {
      const plan = globalAutomationRegistry.run(options.id);
      console.log(chalk.green(formatTradePlan(plan)));
    } catch (err) {
      console.error(chalk.red(err instanceof Error ? err.message : String(err)));
      process.exitCode = 1;
    }
  });

program
  .command('sandbox')
  .description('Start Dark Clawd sandbox HTTP API (Fly / local machine)')
  .option('-p, --port <n>', 'Port', (v) => parseInt(v, 10), Number(process.env.PORT || 18790))
  .option('--host <host>', 'Bind host', process.env.HOST || '0.0.0.0')
  .action((options) => {
    const { port, host } = startSandboxServer({ port: options.port, host: options.host });
    console.log(chalk.greenBright(`\n🦞 Dark Clawd sandbox listening on http://${host}:${port}`));
    console.log(chalk.gray(`  health       GET  /health`));
    console.log(chalk.gray(`  status       GET  /api/status`));
    console.log(chalk.gray(`  kit          GET  /api/kit`));
    console.log(chalk.gray(`  automations  GET  /api/automations`));
    console.log(chalk.gray(`  trade plan   POST /api/trade/plan`));
    console.log(chalk.cyan(`\n  Product hub: ${PRODUCT_HUB_URL}`));
    console.log(chalk.gray(`  GitHub:      ${PRODUCT_GITHUB_URL}\n`));
    console.log(JSON.stringify(buildAutomationKitManifest({ sandboxBase: `http://${host}:${port}` }), null, 2));
  });

program
  .command('kit')
  .description('Print automation kit manifest (install + sandbox endpoints)')
  .action(() => {
    console.log(JSON.stringify(buildAutomationKitManifest(), null, 2));
  });

// ─────────────────────────────────────────────────────────────────────────────
// SOL GPT tool catalog (171 tools)
// ─────────────────────────────────────────────────────────────────────────────

const toolsCmd = program
  .command('tools')
  .description(`SOL GPT tool catalog (${SOL_GPT_TOOL_COUNT} tools: research + user-signed prepare)`);

toolsCmd
  .command('list')
  .description('List all shipped tools (optionally by group)')
  .option('-g, --group <id>', 'Filter by group id (phoenix, imperial, market, …)')
  .option('--core', 'Only core tools (always-on for Kimi)')
  .option('--json', 'JSON output')
  .action((options) => {
    const catalog = getSolGptShippedToolCatalog();
    let tools = catalog.tools;
    if (options.group) {
      tools = toolsByGroup(options.group as ToolGroupId);
    }
    if (options.core) tools = tools.filter((t) => t.core);
    if (options.json) {
      console.log(JSON.stringify({ total: tools.length, tools }, null, 2));
      return;
    }
    console.log(
      chalk.greenBright(
        `\n🦞 Dark Clawd SOL GPT tools — ${tools.length} shown · ${SOL_GPT_TOOL_COUNT} shipped · ${SOL_GPT_CORE_COUNT} core\n`,
      ),
    );
    for (const g of catalog.groups) {
      const rows = tools.filter((t) => t.group === g.id);
      if (!rows.length) continue;
      console.log(chalk.cyan(`▸ ${g.title} (${rows.length})`) + chalk.gray(` — ${g.blurb}`));
      for (const t of rows) {
        const badge = t.core ? chalk.magenta('core') : chalk.gray('spec');
        const custody = t.custody === 'user-signed' ? chalk.yellow('user-signed') : chalk.gray('read-only');
        console.log(`  ${badge} ${custody} ${chalk.white(t.name)}`);
      }
      console.log('');
    }
  });

toolsCmd
  .command('catalog')
  .description('Print catalog totals and groups (JSON)')
  .action(() => {
    const catalog = getSolGptShippedToolCatalog();
    console.log(
      JSON.stringify(
        {
          product: catalog.product,
          catalog: catalog.catalog,
          total: catalog.total,
          core: catalog.core,
          specialty: catalog.specialty,
          groups: catalog.groups.map(({ id, title, blurb, count }) => ({ id, title, blurb, count })),
        },
        null,
        2,
      ),
    );
  });

toolsCmd
  .command('search')
  .description('Search tools by keyword')
  .argument('<query>', 'Keyword (e.g. phoenix, wallet, st_get)')
  .option('-n, --limit <n>', 'Max results', (v) => parseInt(v, 10), 25)
  .option('--json', 'JSON output')
  .action((query, options) => {
    const hits = searchTools(query, options.limit);
    if (options.json) {
      console.log(JSON.stringify({ query, count: hits.length, tools: hits }, null, 2));
      return;
    }
    console.log(chalk.greenBright(`\nSearch “${query}” → ${hits.length} hits\n`));
    for (const t of hits) {
      console.log(
        `  ${chalk.white(t.name)} ${chalk.gray(`[${t.group}]`)} ${t.core ? chalk.magenta('core') : ''} ${t.custody === 'user-signed' ? chalk.yellow('user-signed') : ''}`,
      );
      console.log(chalk.gray(`    ${t.description.slice(0, 120)}${t.description.length > 120 ? '…' : ''}`));
    }
  });

toolsCmd
  .command('run')
  .description('Run a tool by name (non-custodial; prepare_* never signs)')
  .argument('<name>', 'Tool name (e.g. get_price, list_phoenix_markets, search_tools)')
  .option('--arg <key=value...>', 'Tool args (repeatable)', (v, acc: string[]) => {
    acc.push(v);
    return acc;
  }, [] as string[])
  .option('--json-args <json>', 'Tool args as JSON object')
  .option('--wallet <address>', 'Wallet context for portfolio/perps tools')
  .action(async (name, options) => {
    const args: Record<string, unknown> = {};
    if (options.jsonArgs) {
      try {
        Object.assign(args, JSON.parse(options.jsonArgs));
      } catch {
        console.error(chalk.red('Invalid --json-args JSON'));
        process.exitCode = 1;
        return;
      }
    }
    for (const pair of options.arg || []) {
      const i = String(pair).indexOf('=');
      if (i <= 0) continue;
      const k = String(pair).slice(0, i);
      const v = String(pair).slice(i + 1);
      args[k] = v;
    }
    const spinner = ora(`Running ${name}…`).start();
    const result = await runSolGptTool({
      tool: name,
      args,
      wallet: options.wallet || process.env.SOLANA_WALLET,
    });
    if (result.ok) spinner.succeed(`${name} ok`);
    else spinner.fail(`${name} failed`);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
  });

// default tools → catalog summary
toolsCmd.action(() => {
  const catalog = getSolGptShippedToolCatalog();
  console.log(
    boxen(
      [
        `${PRODUCT_NAME} · SOL GPT tool catalog`,
        `Shipped: ${catalog.total}  ·  Core: ${catalog.core}  ·  Specialty: ${catalog.specialty}`,
        '',
        ...catalog.groups.map((g) => `  ${String(g.count).padStart(3)}  ${g.id.padEnd(14)} ${g.title}`),
        '',
        'Commands:',
        '  dark-clawd tools list',
        '  dark-clawd tools list --group phoenix',
        '  dark-clawd tools search wallet',
        '  dark-clawd tools catalog',
        '  dark-clawd tools run get_price --arg mint=<MINT>',
        '  dark-clawd tools run search_tools --arg query=phoenix',
        '  dark-clawd agent              # OpenRouter tool loop',
      ].join('\n'),
      { padding: 1, borderColor: 'magenta', title: '171 tools', titleAlignment: 'center' },
    ),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// OpenRouter agent harness (tool loop over SOL GPT catalog)
// ─────────────────────────────────────────────────────────────────────────────

program
  .command('agent')
  .description('OpenRouter agent harness — multi-turn tool loop over the 171 SOL GPT tools')
  .option('-m, --model <id>', 'OpenRouter model id', process.env.OPENROUTER_DEFAULT_MODEL || process.env.OPENROUTER_MODEL || 'poolside/laguna-s-2.1:free')
  .option('--max-steps <n>', 'Max model↔tool steps per turn', (v) => parseInt(v, 10), 8)
  .option('--wallet <address>', 'Default wallet for portfolio/perps tools')
  .option('-p, --prompt <text>', 'One-shot prompt (non-interactive)')
  .option('-q, --quiet', 'Less tool display noise')
  .action(async (options) => {
    const model = options.model as string;
    const apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!apiKey) {
      console.error(chalk.red('OPENROUTER_API_KEY is required for dark-clawd agent'));
      console.error(chalk.gray('  export OPENROUTER_API_KEY=sk-or-…'));
      console.error(chalk.gray('  Get a key: https://openrouter.ai/settings/keys'));
      process.exitCode = 1;
      return;
    }

    const onEvent = (ev: AgentEvent) => {
      if (options.quiet && (ev.type === 'step' || ev.type === 'usage')) return;
      if (ev.type === 'step') {
        console.log(chalk.gray(`── step ${ev.step}/${ev.maxSteps} ──`));
      } else if (ev.type === 'tool_start') {
        console.log(chalk.cyan(`  ⚙ ${ev.name}`) + chalk.gray(` ${JSON.stringify(ev.args).slice(0, 120)}`));
      } else if (ev.type === 'tool_end') {
        const mark = ev.ok ? chalk.green('✓') : chalk.red('✗');
        console.log(`  ${mark} ${ev.name} ${chalk.gray(ev.summary.slice(0, 160))}`);
      } else if (ev.type === 'usage') {
        console.log(
          chalk.gray(
            `  tokens in=${ev.promptTokens ?? '?'} out=${ev.completionTokens ?? '?'} model=${ev.model || model}`,
          ),
        );
      } else if (ev.type === 'error') {
        console.error(chalk.red(`  error: ${ev.error}`));
      } else if (ev.type === 'text' && !options.prompt) {
        // printed after run in REPL
      }
    };

    const harness = new OpenRouterAgentHarness({
      apiKey,
      model,
      maxSteps: options.maxSteps,
      wallet: options.wallet || process.env.SOLANA_WALLET,
      onEvent,
    });

    console.log(
      boxen(formatAgentBanner(model), {
        padding: 1,
        borderColor: 'green',
        borderStyle: 'round',
        title: 'agent harness',
        titleAlignment: 'center',
      }),
    );

    if (options.prompt) {
      try {
        const text = await harness.run(String(options.prompt));
        console.log('\n' + chalk.white(text) + '\n');
      } catch (e) {
        console.error(chalk.red(e instanceof Error ? e.message : String(e)));
        process.exitCode = 1;
      }
      return;
    }

    const rl = readline.createInterface({ input, output, terminal: true });
    console.log(chalk.gray('Type a message (or /exit). Example: What is SOL doing? Use tools.\n'));
    try {
      for (;;) {
        const line = (await rl.question(chalk.magenta('clawd › '))).trim();
        if (!line) continue;
        if (line === '/exit' || line === '/quit' || line === 'exit') break;
        if (line === '/help') {
          console.log(
            chalk.gray(
              '  /tools — catalog summary\n  /exit — quit\n  otherwise: chat with tools via OpenRouter\n',
            ),
          );
          continue;
        }
        if (line === '/tools' || line.startsWith('/tools ')) {
          const catalog = getSolGptShippedToolCatalog();
          console.log(
            chalk.green(
              `  ${catalog.total} tools · ${catalog.core} core · groups: ${catalog.groups.map((g) => g.id).join(', ')}`,
            ),
          );
          continue;
        }
        try {
          const text = await harness.run(line);
          console.log('\n' + chalk.whiteBright(text) + '\n');
        } catch (e) {
          console.error(chalk.red(e instanceof Error ? e.message : String(e)));
        }
      }
    } finally {
      rl.close();
    }
  });

// ─────────────────────────────────────────────────────────────────────────────
// Default Command (run)
// ─────────────────────────────────────────────────────────────────────────────

program.action(() => {
  const runCmd = program.commands.find((c) => c.name() === 'run');
  if (runCmd) runCmd.parseAsync(['run', '--auto'], { from: 'user' });
});

// Parse arguments
program.parse();
