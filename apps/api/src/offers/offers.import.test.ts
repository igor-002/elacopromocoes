import { ConflictException } from '@nestjs/common';
import type { CreateOfferInput, OfferDto } from '@radar/contracts';
import { describe, expect, it, vi } from 'vitest';
import { OffersService } from './offers.service';

const candidates: CreateOfferInput[] = [
  {
    marketplace: 'AMAZON',
    productId: 'B0ABC12345',
    title: 'Produto novo',
    affiliateUrl: 'https://amazon.com.br/dp/B0ABC12345?tag=radar-20',
    currentPriceCents: 7990,
  },
  {
    marketplace: 'AMAZON',
    productId: 'B0DUP12345',
    title: 'Produto repetido',
    affiliateUrl: 'https://amazon.com.br/dp/B0DUP12345?tag=radar-20',
    currentPriceCents: 5990,
  },
];

const created: OfferDto = {
  id: 'ee2685dd-f246-4a55-a050-2af68091c62a',
  marketplace: 'AMAZON',
  productId: 'B0ABC12345',
  title: 'Produto novo',
  affiliateUrl: candidates[0]!.affiliateUrl,
  imageUrl: null,
  currentPriceCents: 7990,
  originalPriceCents: null,
  coupon: null,
  category: null,
  headline: 'Produto novo em oferta',
  description: 'Preço promocional por tempo limitado.',
  status: 'DRAFT',
  createdAt: '2026-08-30T12:00:00.000Z',
  updatedAt: '2026-08-30T12:00:00.000Z',
};

describe('OffersService.importAmazon', () => {
  it('ignora conflito de fingerprint e mantém novas ofertas como resultado', async () => {
    const amazon = { search: vi.fn().mockResolvedValue(candidates) };
    const offers = new OffersService({} as never, {} as never, amazon as never);
    vi.spyOn(offers, 'create')
      .mockResolvedValueOnce(created)
      .mockRejectedValueOnce(new ConflictException('Esta oferta já foi cadastrada.'));

    await expect(offers.importAmazon('produto', 2, 'admin-id')).resolves.toEqual({
      created: [created],
      skipped: 1,
    });
  });
});
