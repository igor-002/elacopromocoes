import type { Offer } from '@prisma/client';
import type { OfferDto } from '@radar/contracts';

export function toOfferDto(offer: Offer): OfferDto {
  return {
    id: offer.id,
    marketplace: offer.marketplace,
    productId: offer.productId,
    title: offer.title,
    affiliateUrl: offer.affiliateUrl,
    imageUrl: offer.imageUrl,
    currentPriceCents: offer.currentPriceCents,
    originalPriceCents: offer.originalPriceCents,
    coupon: offer.coupon,
    category: offer.category,
    headline: offer.headline,
    description: offer.description,
    status: offer.status,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
  };
}
