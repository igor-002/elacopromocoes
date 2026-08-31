import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AmazonCreatorsService } from './amazon-creators.service';

const settings: Record<string, string> = {
  AMAZON_CLIENT_ID: 'client-id',
  AMAZON_CLIENT_SECRET: 'client-secret',
  AMAZON_PARTNER_TAG: 'radar-20',
};

function service(overrides: Record<string, string> = {}) {
  const values = { ...settings, ...overrides };
  const config = { get: (key: string) => values[key] } as ConfigService;
  return new AmazonCreatorsService(config);
}

afterEach(() => vi.unstubAllGlobals());

describe('AmazonCreatorsService', () => {
  it('obtém e reutiliza token, busca produtos e mapeia oferta afiliada', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'token-1', expires_in: 3600 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockImplementation(() =>
        Promise.resolve(new Response(
          JSON.stringify({
            searchResult: {
              items: [
                {
                  asin: 'b0abc12345',
                  detailPageURL: 'https://www.amazon.com.br/dp/B0ABC12345?linkCode=ogi',
                  images: { primary: { large: { url: 'https://m.media-amazon.com/item.jpg' } } },
                  itemInfo: { title: { displayValue: 'Fone Bluetooth' } },
                  offersV2: {
                    listings: [
                      {
                        price: {
                          money: { amount: 79.9 },
                          savingBasis: { money: { amount: 99.9 } },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )),
      );
    vi.stubGlobal('fetch', fetchMock);

    const amazon = service();
    const first = await amazon.search('fone', 2);
    await amazon.search('livro', 1);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      grant_type: 'client_credentials',
      client_id: 'client-id',
      client_secret: 'client-secret',
      scope: 'creatorsapi::default',
    });
    expect(first).toEqual([
      expect.objectContaining({
        marketplace: 'AMAZON',
        productId: 'B0ABC12345',
        title: 'Fone Bluetooth',
        currentPriceCents: 7990,
        originalPriceCents: 9990,
        imageUrl: 'https://m.media-amazon.com/item.jpg',
        affiliateUrl: expect.stringContaining('tag=radar-20'),
      }),
    ]);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://creatorsapi.amazon/catalog/v1/searchItems',
    );
  });

  it('falha com 503 claro sem credenciais', async () => {
    const config = { get: () => undefined } as unknown as ConfigService;
    await expect(new AmazonCreatorsService(config).search('fone', 1)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
