import type { Destination } from '@prisma/client';
import type { DestinationDto } from '@radar/contracts';

export function toDestinationDto(destination: Destination): DestinationDto {
  return {
    id: destination.id,
    channel: destination.channel,
    name: destination.name,
    externalId: destination.externalId,
    enabled: destination.enabled,
    createdAt: destination.createdAt.toISOString(),
    updatedAt: destination.updatedAt.toISOString(),
  };
}
