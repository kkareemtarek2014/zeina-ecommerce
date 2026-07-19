#!/usr/bin/env node
/**
 * Assert basePrice / password hashes never leak via storefront API or client UI.
 * Admin may use basePrice in contracts/features/admin APIs (Phase 9).
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function rg(pattern, globs) {
  const globArgs = globs.map((g) => {
    if (g.startsWith('!')) return `':(exclude)${g.slice(1)}'`;
    return `'${g}'`;
  }).join(' ');
  try {
    return execSync(`git grep -n -E '${pattern}' -- ${globArgs}`, {
      cwd: root,
      encoding: 'utf8',
    }).trim();
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err && err.status === 1) {
      return '';
    }
    throw err;
  }
}

let failed = false;

function fail(msg, hits) {
  failed = true;
  console.error(`FAIL: ${msg}`);
  if (hits) console.error(hits);
}

// Storefront API only (exclude /api/admin)
const apiBase = rg('basePrice', ['src/app/api/**', '!src/app/api/admin/**']);
if (apiBase) fail('basePrice under storefront src/app/api', apiBase);

const apiPass = rg('passwordHash|password_hash', ['src/app/api/**']);
if (apiPass) fail('password hash under src/app/api', apiPass);

const clientBase = rg('basePrice', [
  'src/features/**/*.{ts,tsx}',
  '!src/features/admin/**',
  'src/shared/components/**/*.{ts,tsx}',
  'src/shared/contracts/**/*.ts',
  '!src/shared/contracts/admin-*.ts',
  'src/shared/lib/**/*.ts',
]);
if (clientBase) fail('basePrice in storefront client/contracts', clientBase);

const contractPass = rg('passwordHash|password_hash', [
  'src/shared/contracts/**/*.ts',
]);
if (contractPass) fail('password hash in shared contracts', contractPass);

const productService = fs.readFileSync(
  path.join(root, 'src/server/services/product.service.ts'),
  'utf8',
);
if (
  !/computeSellPrice\(pricingInputFromRow\(row\),\s*pricing\)/.test(
    productService,
  )
) {
  fail(
    'product mapper should derive price via computeSellPrice(pricingInputFromRow(row), pricing)',
  );
}
{
  const withoutComments = productService
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  if (/[{,]\s*basePrice\s*:/.test(withoutComments)) {
    fail('storefront product service serializes basePrice as an object key');
  }
  if (/[{,]\s*basePriceUsd\s*:/.test(withoutComments)) {
    fail('storefront product service serializes basePriceUsd');
  }
  if (/[{,]\s*landedCost\s*:/.test(withoutComments)) {
    fail('storefront product service serializes landedCost');
  }
}

const clientCost = rg('basePriceUsd|landedCost|landed_cost|base_price_usd', [
  'src/features/**/*.{ts,tsx}',
  '!src/features/admin/**',
  'src/shared/components/**/*.{ts,tsx}',
  'src/shared/contracts/**/*.ts',
  '!src/shared/contracts/admin-*.ts',
  'src/shared/lib/**/*.ts',
]);
if (clientCost) fail('cost inputs in storefront client/contracts', clientCost);

const requireAuth = fs.readFileSync(
  path.join(root, 'src/server/auth/require-auth.ts'),
  'utf8',
);
if (!/export function toUserDTO/.test(requireAuth)) {
  fail('toUserDTO missing');
}
if (/passwordHash/.test(requireAuth)) {
  fail('toUserDTO / require-auth must not reference passwordHash');
}

if (failed) {
  console.error('\nassert:no-secrets failed');
  process.exit(1);
}
console.log('assert:no-secrets OK (admin basePrice allowed)');
