import { describe, expect, it } from 'vitest';
import { CopyService, discountPercent } from './copy.service';

const config = { get: () => undefined } as never;

describe('CopyService', () => {
  it('gera texto determinístico com desconto e cupom', () => {
    const result = new CopyService(config).template({
      title: 'Fone Bluetooth',
      currentPriceCents: 8000,
      originalPriceCents: 10000,
      coupon: 'RADAR10',
      category: 'Eletrônicos',
    });
    expect(result.headline).toContain('20% de desconto');
    expect(result.description).toContain('RADAR10');
    expect(result.source).toBe('template');
  });

  it('não anuncia desconto inválido', () => {
    expect(discountPercent(10000, 9000)).toBeNull();
  });
});
