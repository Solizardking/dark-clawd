import { pathToFileURL } from 'node:url';

const rootUrl = new URL('../', import.meta.url);

function packageUrl(path) {
  return pathToFileURL(new URL(path, rootUrl).pathname).href;
}

function assertExport(moduleName, module, exportName, expectedType = 'function') {
  if (typeof module[exportName] !== expectedType) {
    throw new Error(`${moduleName} expected ${exportName} to be a ${expectedType}`);
  }
}

const agentwallet = await import(packageUrl('lib/dist/index.js'));
assertExport('@vibebot/agentwallet', agentwallet, 'Vault');
assertExport('@vibebot/agentwallet', agentwallet, 'createEphemeralAgentWalletManifest');
assertExport('@vibebot/agentwallet', agentwallet, 'generateSolanaKeypair');

const core = await import(packageUrl('packages/core/dist/index.js'));
assertExport('@vibebot/core', core, 'VibeBot');
assertExport('@vibebot/core', core, 'getVibeBot');
assertExport('@vibebot/core', core, 'getWalletAddressFromPrivateKey');

const cli = await import(packageUrl('packages/cli/dist/index.js'));
assertExport('@vibebot/cli', cli, 'createProgram');
assertExport('@vibebot/cli', cli, 'runCli');

const telegram = await import(packageUrl('packages/telegram/dist/index.js'));
assertExport('@vibebot/telegram', telegram, 'createTelegramBot');
assertExport('@vibebot/telegram', telegram, 'getTelegramBot');
assertExport('@vibebot/telegram', telegram, 'start');

const web = await import(packageUrl('packages/web/dist/server.js'));
assertExport('@vibebot/web', web, 'app', 'function');
assertExport('@vibebot/web', web, 'startServer');

console.log('Package smoke imports passed');
