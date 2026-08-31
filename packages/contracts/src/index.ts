import { z } from 'zod';

export const marketplaceSchema = z.enum(['AMAZON', 'MERCADO_LIVRE']);
export const offerStatusSchema = z.enum(['DRAFT', 'APPROVED', 'ARCHIVED']);
export const destinationChannelSchema = z.enum(['TELEGRAM', 'WHATSAPP']);
export const publicationStatusSchema = z.enum([
  'SCHEDULED',
  'SENDING',
  'SENT',
  'FAILED',
  'UNKNOWN',
  'CANCELLED',
]);

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));

const MARKETPLACE_HOSTS: Record<z.infer<typeof marketplaceSchema>, string[]> = {
  AMAZON: ['amazon.com.br', 'amzn.to'],
  MERCADO_LIVRE: ['mercadolivre.com.br', 'meli.la'],
};

export function isMarketplaceUrl(marketplace: z.infer<typeof marketplaceSchema>, value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return MARKETPLACE_HOSTS[marketplace].some(
      (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
    );
  } catch {
    return false;
  }
}

const offerFieldsSchema = z.object({
    marketplace: marketplaceSchema,
    productId: optionalText(80),
    title: z.string().trim().min(3).max(180),
    affiliateUrl: z.url().max(2048),
    imageUrl: z.url().max(2048).optional().or(z.literal('')),
    currentPriceCents: z.number().int().positive(),
    originalPriceCents: z.number().int().positive().optional(),
    coupon: optionalText(80),
    category: optionalText(80),
    headline: optionalText(140),
    description: optionalText(500),
  });

export const createOfferSchema = offerFieldsSchema
  .superRefine((value, context) => {
    if (!isMarketplaceUrl(value.marketplace, value.affiliateUrl)) {
      context.addIssue({
        code: 'custom',
        path: ['affiliateUrl'],
        message: 'O link precisa pertencer ao marketplace selecionado.',
      });
    }

    if (value.originalPriceCents && value.originalPriceCents < value.currentPriceCents) {
      context.addIssue({
        code: 'custom',
        path: ['originalPriceCents'],
        message: 'Preço original deve ser maior ou igual ao preço atual.',
      });
    }
  });

export const updateOfferSchema = offerFieldsSchema.partial().superRefine((value, context) => {
  if (
    value.marketplace &&
    value.affiliateUrl &&
    !isMarketplaceUrl(value.marketplace, value.affiliateUrl)
  ) {
    context.addIssue({
      code: 'custom',
      path: ['affiliateUrl'],
      message: 'O link precisa pertencer ao marketplace selecionado.',
    });
  }

  if (
    value.originalPriceCents &&
    value.currentPriceCents &&
    value.originalPriceCents < value.currentPriceCents
  ) {
    context.addIssue({
      code: 'custom',
      path: ['originalPriceCents'],
      message: 'Preço original deve ser maior ou igual ao preço atual.',
    });
  }
});

export const createDestinationSchema = z.object({
  channel: destinationChannelSchema,
  name: z.string().trim().min(2).max(80),
  externalId: z.string().trim().min(2).max(160),
  enabled: z.boolean().default(true),
});

export const updateDestinationSchema = createDestinationSchema.partial();

export const createPublicationSchema = z.object({
  offerId: z.uuid(),
  destinationIds: z.array(z.uuid()).min(1),
  scheduledAt: z.iso.datetime().optional(),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(200),
});

export const copyRequestSchema = z.object({
  mode: z.enum(['template', 'ai']).default('template'),
});

export type Marketplace = z.infer<typeof marketplaceSchema>;
export type OfferStatus = z.infer<typeof offerStatusSchema>;
export type DestinationChannel = z.infer<typeof destinationChannelSchema>;
export type PublicationStatus = z.infer<typeof publicationStatusSchema>;
export type CreateOfferInput = z.input<typeof createOfferSchema>;
export type UpdateOfferInput = z.input<typeof updateOfferSchema>;
export type CreateDestinationInput = z.input<typeof createDestinationSchema>;
export type UpdateDestinationInput = z.input<typeof updateDestinationSchema>;
export type CreatePublicationInput = z.input<typeof createPublicationSchema>;
export type LoginInput = z.input<typeof loginSchema>;

export interface OfferDto {
  id: string;
  marketplace: Marketplace;
  productId: string | null;
  title: string;
  affiliateUrl: string;
  imageUrl: string | null;
  currentPriceCents: number;
  originalPriceCents: number | null;
  coupon: string | null;
  category: string | null;
  headline: string;
  description: string;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DestinationDto {
  id: string;
  channel: DestinationChannel;
  name: string;
  externalId: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EvolutionConnectionStatus =
  | 'disabled'
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'unavailable';

export interface EvolutionStatusDto {
  status: EvolutionConnectionStatus;
  instance: string | null;
}

export interface EvolutionGroupDto {
  id: string;
  name: string;
}

export interface PublicationDto {
  id: string;
  offerId: string;
  destinationId: string;
  scheduledAt: string;
  status: PublicationStatus;
  attempts: number;
  externalMessageId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  offer?: OfferDto;
  destination?: DestinationDto;
}

export interface DashboardDto {
  draftOffers: number;
  approvedOffers: number;
  scheduledPublications: number;
  sentToday: number;
  failedPublications: number;
  recentPublications: PublicationDto[];
}

export interface SessionDto {
  email: string;
}

export interface GeneratedCopyDto {
  headline: string;
  description: string;
  source: 'template' | 'openai';
}
