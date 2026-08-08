#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const manifestPath = process.env.AGENT_REGISTRY_MANIFEST ||
  resolve(repoRoot, 'agent-registry/endpoints.json');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const listOnly = args.includes('--list');
const createOnly = args.includes('--create-only');
const verifyOnly = args.includes('--verify');

function readFlag(name, fallback) {
  const equals = args.find((arg) => arg.startsWith(`${name}=`));
  if (equals) return equals.slice(name.length + 1);
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

function loadManifest() {
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

const manifest = loadManifest();
const project = readFlag(
  '--project',
  process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || manifest.project,
);
const location = readFlag(
  '--location',
  process.env.AGENT_REGISTRY_LOCATION || manifest.location || 'global',
);

if (!project) {
  throw new Error('Missing project. Set GOOGLE_CLOUD_PROJECT or pass --project.');
}

const protocols = new Set(['HTTP_JSON', 'GRPC', 'JSONRPC']);
const sensitiveQueryNames = /(api[-_]?key|access[-_]?token|auth|bearer|code|jwt|key|secret|sig|signature|token)/i;

function validateEndpoint(endpoint) {
  if (!endpoint.name || !/^[a-z][a-z0-9-]{1,61}[a-z0-9]$/.test(endpoint.name)) {
    throw new Error(`Invalid service name: ${endpoint.name}`);
  }
  if (!endpoint.displayName || endpoint.displayName.length > 63) {
    throw new Error(`Invalid displayName for ${endpoint.name}: must be 1-63 chars`);
  }
  if (!protocols.has(endpoint.protocolBinding)) {
    throw new Error(`Invalid protocolBinding for ${endpoint.name}: ${endpoint.protocolBinding}`);
  }
  const url = new URL(endpoint.url);
  if (url.username || url.password) {
    throw new Error(`Refusing to register URL with credentials for ${endpoint.name}`);
  }
  for (const [name, value] of url.searchParams.entries()) {
    if (sensitiveQueryNames.test(name) || sensitiveQueryNames.test(value)) {
      throw new Error(`Refusing to register sensitive query param in ${endpoint.name}`);
    }
  }
  if (/(api[-_]?key|private[-_]?key|secret|token)=/i.test(endpoint.url)) {
    throw new Error(`Refusing to register sensitive URL for ${endpoint.name}`);
  }
}

function gcloud(argsToRun, opts = {}) {
  const fullArgs = ['alpha', 'agent-registry', 'services', ...argsToRun];
  if (dryRun && !opts.capture) {
    console.log(`DRY RUN: gcloud ${fullArgs.join(' ')}`);
    return { status: 0, stdout: '', stderr: '' };
  }

  const result = spawnSync('gcloud', fullArgs, {
    encoding: 'utf8',
    stdio: opts.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });

  if (opts.allowFailure) {
    return result;
  }

  if (result.status !== 0) {
    const stderr = result.stderr ? `\n${result.stderr.trim()}` : '';
    throw new Error(`gcloud ${fullArgs.join(' ')} failed with status ${result.status}${stderr}`);
  }

  return result;
}

function describeService(name) {
  if (dryRun) return null;
  const result = gcloud([
    'describe',
    name,
    '--project',
    project,
    '--location',
    location,
    '--format=json',
  ], { capture: true, allowFailure: true });

  if (result.status === 0) {
    return JSON.parse(result.stdout || '{}');
  }

  const text = `${result.stderr || ''}\n${result.stdout || ''}`;
  if (/NOT_FOUND|not found|does not exist/i.test(text)) {
    return null;
  }
  throw new Error(`Unable to describe ${name}: ${text.trim()}`);
}

function endpointArgs(endpoint) {
  return [
    '--project',
    project,
    '--location',
    location,
    '--display-name',
    endpoint.displayName,
    '--description',
    endpoint.description || endpoint.displayName,
    '--endpoint-spec-type',
    'no-spec',
    '--interfaces',
    `protocolBinding=${endpoint.protocolBinding},url=${endpoint.url}`,
    '--quiet',
  ];
}

function upsertEndpoint(endpoint) {
  validateEndpoint(endpoint);

  if (dryRun) {
    gcloud(['update', endpoint.name, ...endpointArgs(endpoint)]);
    return 'dry-run';
  }

  const existing = describeService(endpoint.name);
  if (existing) {
    if (createOnly) {
      console.log(`exists ${endpoint.name}`);
      return 'exists';
    }
    gcloud(['update', endpoint.name, ...endpointArgs(endpoint)]);
    console.log(`updated ${endpoint.name}`);
    return 'updated';
  }

  gcloud(['create', endpoint.name, ...endpointArgs(endpoint)]);
  console.log(`created ${endpoint.name}`);
  return 'created';
}

function verifyEndpoint(endpoint) {
  validateEndpoint(endpoint);
  const existing = describeService(endpoint.name);
  if (!existing) {
    return [`missing service ${endpoint.name}`];
  }

  const errors = [];
  const firstInterface = existing.interfaces?.[0] || {};
  if (existing.displayName !== endpoint.displayName) {
    errors.push(`${endpoint.name} displayName expected ${endpoint.displayName} got ${existing.displayName}`);
  }
  if (firstInterface.url !== endpoint.url) {
    errors.push(`${endpoint.name} url expected ${endpoint.url} got ${firstInterface.url}`);
  }
  if (firstInterface.protocolBinding !== endpoint.protocolBinding) {
    errors.push(`${endpoint.name} protocol expected ${endpoint.protocolBinding} got ${firstInterface.protocolBinding}`);
  }
  return errors;
}

if (listOnly) {
  gcloud([
    'list',
    '--project',
    project,
    '--location',
    location,
    '--format=table(name.basename(),displayName,interfaces[0].protocolBinding,interfaces[0].url)',
  ]);
  process.exit(0);
}

if (verifyOnly) {
  const errors = manifest.endpoints.flatMap(verifyEndpoint);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }
  console.log(`Verified ${manifest.endpoints.length} Agent Registry endpoint services in ${project}/${location}.`);
  process.exit(0);
}

let created = 0;
let updated = 0;
let exists = 0;
let dry = 0;

for (const endpoint of manifest.endpoints) {
  const result = upsertEndpoint(endpoint);
  if (result === 'created') created++;
  if (result === 'updated') updated++;
  if (result === 'exists') exists++;
  if (result === 'dry-run') dry++;
}

console.log(`Agent Registry sync complete: ${created} created, ${updated} updated, ${exists} unchanged, ${dry} dry-run.`);
