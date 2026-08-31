import { describe, expect, it } from 'vitest';
import { extractProductId, normalizeUrl, offerFingerprint } from './marketplace';

describe('marketplace helpers', () => {
  it('extrai ASIN de URL de produto Amazon', () => {
    expect(extractProductId('AMAZON', 'https://www.amazon.com.br/dp/B0ABC12345?tag=radar-20')).toBe(
      'B0ABC12345',
    );
  });

  it('extrai ID do Mercado Livre com ou sem hífen', () => {
    expect(
      extractProductId('MERCADO_LIVRE', 'https://produto.mercadolivre.com.br/MLB-123456789-item'),
    ).toBe('MLB123456789');
  });

  it('normaliza URL antes do fingerprint', () => {
    expect(normalizeUrl('https://amazon.com.br/dp/ABC/?b=2&a=1#x')).toBe(
      'https://amazon.com.br/dp/ABC?a=1&b=2',
    );
    expect(offerFingerprint('AMAZON', 'abc', 'https://amazon.com.br/ignored')).toBe(
      offerFingerprint('AMAZON', 'ABC', 'https://amazon.com.br/other'),
    );
  });
});
