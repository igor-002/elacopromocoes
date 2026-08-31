import { describe, expect, it } from 'vitest';

import { createOfferSchema, updateOfferSchema } from './index';

describe('createOfferSchema', () => {
  const offer = {
    marketplace: 'AMAZON' as const,
    title: 'Fone Bluetooth',
    affiliateUrl: 'https://www.amazon.com.br/dp/B012345678',
    currentPriceCents: 9990,
  };

  it('accepts a valid offer', () => {
    expect(createOfferSchema.parse(offer)).toMatchObject(offer);
  });

  it('rejects an original price lower than current price', () => {
    expect(() => createOfferSchema.parse({ ...offer, originalPriceCents: 5000 })).toThrow(
      'Preço original',
    );
  });

  it('rejects a link from another marketplace', () => {
    expect(() =>
      createOfferSchema.parse({
        ...offer,
        affiliateUrl: 'https://www.mercadolivre.com.br/produto',
      }),
    ).toThrow('marketplace');
  });

  it('accepts a truly partial update', () => {
    expect(updateOfferSchema.parse({ title: 'Novo título' })).toEqual({ title: 'Novo título' });
  });
});
