import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CreateOfferInput } from '@radar/contracts';

interface AmazonConfig {
  clientId: string;
  clientSecret: string;
  partnerTag: string;
  marketplace: string;
  tokenUrl: string;
  apiUrl: string;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

interface AmazonSearchResponse {
  searchResult?: { items?: AmazonItem[] };
}

interface AmazonItem {
  asin?: string;
  detailPageURL?: string;
  images?: {
    primary?: {
      large?: { url?: string };
      medium?: { url?: string };
      small?: { url?: string };
    };
  };
  itemInfo?: { title?: { displayValue?: string } };
  offersV2?: {
    listings?: Array<{
      price?: {
        money?: { amount?: number };
        savingBasis?: { money?: { amount?: number } };
      };
    }>;
  };
}

@Injectable()
export class AmazonCreatorsService {
  private token: CachedToken | null = null;
  private tokenRequest: Promise<CachedToken> | null = null;

  constructor(private readonly config: ConfigService) {}

  async search(keyword: string, itemCount: number): Promise<CreateOfferInput[]> {
    const settings = this.settings();
    try {
      let response = await this.searchRequest(settings, keyword, itemCount);
      if (response.status === 401) {
        this.token = null;
        response = await this.searchRequest(settings, keyword, itemCount);
      }
      if (!response.ok) {
        throw new ServiceUnavailableException(
          `Amazon Creators API indisponível (HTTP ${response.status}).`,
        );
      }
      const payload = (await response.json()) as AmazonSearchResponse;
      return (payload.searchResult?.items ?? [])
        .map((item) => mapItem(item, settings))
        .filter((item): item is CreateOfferInput => item !== null)
        .slice(0, itemCount);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('Falha ao consultar a Amazon Creators API.');
    }
  }

  private async searchRequest(settings: AmazonConfig, keyword: string, itemCount: number) {
    const token = await this.accessToken(settings);
    return fetch(`${settings.apiUrl}/catalog/v1/searchItems`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'x-marketplace': settings.marketplace,
      },
      body: JSON.stringify({
        keywords: keyword,
        itemCount,
        marketplace: settings.marketplace,
        partnerTag: settings.partnerTag,
        searchIndex: 'All',
        resources: ['images.primary.large', 'itemInfo.title', 'offersV2.listings.price'],
      }),
      signal: AbortSignal.timeout(15_000),
    });
  }

  private async accessToken(settings: AmazonConfig): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;
    if (!this.tokenRequest) {
      this.tokenRequest = this.fetchToken(settings).finally(() => {
        this.tokenRequest = null;
      });
    }
    this.token = await this.tokenRequest;
    return this.token.value;
  }

  private async fetchToken(settings: AmazonConfig): Promise<CachedToken> {
    const response = await fetch(settings.tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: settings.clientId,
        client_secret: settings.clientSecret,
        scope: 'creatorsapi::default',
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Autenticação da Amazon Creators API falhou (HTTP ${response.status}).`,
      );
    }
    const payload = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!payload.access_token) {
      throw new ServiceUnavailableException('Amazon não retornou token de acesso válido.');
    }
    const expiresIn = Math.max(60, payload.expires_in ?? 3600);
    return { value: payload.access_token, expiresAt: Date.now() + expiresIn * 1000 };
  }

  private settings(): AmazonConfig {
    const clientId = this.config.get<string>('AMAZON_CLIENT_ID')?.trim();
    const clientSecret = this.config.get<string>('AMAZON_CLIENT_SECRET')?.trim();
    const partnerTag = this.config.get<string>('AMAZON_PARTNER_TAG')?.trim();
    if (!clientId || !clientSecret || !partnerTag) {
      throw new ServiceUnavailableException(
        'Amazon Creators API não configurada. Informe AMAZON_CLIENT_ID, AMAZON_CLIENT_SECRET e AMAZON_PARTNER_TAG.',
      );
    }
    return {
      clientId,
      clientSecret,
      partnerTag,
      marketplace: this.config.get<string>('AMAZON_MARKETPLACE')?.trim() || 'www.amazon.com.br',
      tokenUrl:
        this.config.get<string>('AMAZON_TOKEN_URL')?.trim() ||
        'https://api.amazon.com/auth/o2/token',
      apiUrl:
        this.config.get<string>('AMAZON_API_URL')?.trim().replace(/\/+$/, '') ||
        'https://creatorsapi.amazon',
    };
  }
}

function mapItem(item: AmazonItem, settings: AmazonConfig): CreateOfferInput | null {
  const asin = item.asin?.trim().toUpperCase();
  const title = item.itemInfo?.title?.displayValue?.trim();
  const listing = item.offersV2?.listings?.[0];
  const currentPriceCents = moneyToCents(listing?.price?.money?.amount);
  if (!asin || !title || !currentPriceCents) return null;

  const originalPriceCents = moneyToCents(listing?.price?.savingBasis?.money?.amount);
  const detailUrl = item.detailPageURL || `https://${settings.marketplace}/dp/${asin}`;
  const affiliateUrl = withPartnerTag(detailUrl, settings.partnerTag);
  return {
    marketplace: 'AMAZON',
    productId: asin,
    title: title.slice(0, 180),
    affiliateUrl,
    imageUrl:
      item.images?.primary?.large?.url ??
      item.images?.primary?.medium?.url ??
      item.images?.primary?.small?.url ??
      '',
    currentPriceCents,
    ...(originalPriceCents && originalPriceCents >= currentPriceCents
      ? { originalPriceCents }
      : {}),
    category: 'Amazon',
  };
}

function moneyToCents(amount: number | undefined): number | null {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

function withPartnerTag(rawUrl: string, partnerTag: string): string {
  const url = new URL(rawUrl);
  url.searchParams.set('tag', partnerTag);
  return url.toString();
}
