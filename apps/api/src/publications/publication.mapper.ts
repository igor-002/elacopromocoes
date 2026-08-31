import type { Destination, Offer, Publication } from '@prisma/client';
import type { PublicationDto } from '@radar/contracts';
import { toDestinationDto } from '../destinations/destination.mapper';
import { toOfferDto } from '../offers/offer.mapper';

type PublicationRelations = Publication & {
  offer?: Offer;
  destination?: Destination;
};

export function toPublicationDto(publication: PublicationRelations): PublicationDto {
  return {
    id: publication.id,
    offerId: publication.offerId,
    destinationId: publication.destinationId,
    scheduledAt: publication.scheduledAt.toISOString(),
    status: publication.status,
    attempts: publication.attempts,
    externalMessageId: publication.externalMessageId,
    error: publication.error,
    createdAt: publication.createdAt.toISOString(),
    updatedAt: publication.updatedAt.toISOString(),
    ...(publication.offer && { offer: toOfferDto(publication.offer) }),
    ...(publication.destination && { destination: toDestinationDto(publication.destination) }),
  };
}
