import { describe, expect, it } from 'vitest';
import { formatPublicationMessage } from './message-template';

describe('formatPublicationMessage', () => {
  it('mantém link direto e identificação publicitária', () => {
    const message = formatPublicationMessage({
      headline: 'Oferta boa',
      description: 'Produto em promoção.',
      currentPriceCents: 7990,
      originalPriceCents: 9990,
      coupon: 'GANHE10',
      affiliateUrl: 'https://amazon.com.br/dp/B0ABC12345?tag=radar-20',
    });
    expect(message).toContain('99,90');
    expect(message).toContain('79,90');
    expect(message).toContain('Cupom: GANHE10');
    expect(message).toContain('https://amazon.com.br/dp/B0ABC12345?tag=radar-20');
    expect(message).toContain('#pub');
  });
});
