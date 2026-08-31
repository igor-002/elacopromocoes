import { createHash } from 'node:crypto';
import type { Marketplace } from '@radar/contracts';

export function extractProductId(marketplace: Marketplace, rawUrl: string): string | null {
  const url = new URL(rawUrl);
  if (marketplace === 'AMAZON') {
    const pathMatch = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i);
    const value = pathMatch?.[1] ?? url.searchParams.get('asin');
    return value?.toUpperCase() ?? null;
  }

  const match = `${url.pathname}${url.search}`.match(/MLB-?(\d{6,})/i);
  return match ? `MLB${match[1]}` : null;
}

export function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.hash = '';
  url.hostname = url.hostname.toLowerCase();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
  url.searchParams.sort();
  return url.toString();
}

export function offerFingerprint(
  marketplace: Marketplace,
  productId: string | null,
  affiliateUrl: string,
): string {
  const identity = productId ? productId.toUpperCase() : normalizeUrl(affiliateUrl);
  return createHash('sha256').update(`${marketplace}:${identity}`).digest('hex');
}
