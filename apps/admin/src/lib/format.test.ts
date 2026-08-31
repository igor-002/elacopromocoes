import { describe, expect, it } from 'vitest';
import { discountPercentage, formatMoney, fromCents, toCents } from './format';

describe('formatadores do painel', () => {
  it('converte valores digitados em centavos', () => {
    expect(toCents('1.299,90')).toBe(129_990);
    expect(toCents('49,99')).toBe(4_999);
    expect(fromCents(4_999)).toBe('49,99');
  });

  it('formata valores em reais', () => {
    expect(formatMoney(12_990)).toContain('129,90');
  });

  it('calcula desconto apenas quando o preço anterior é maior', () => {
    expect(discountPercentage(8_000, 10_000)).toBe(20);
    expect(discountPercentage(10_000, 10_000)).toBeNull();
    expect(discountPercentage(8_000, null)).toBeNull();
  });
});
