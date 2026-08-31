import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateOfferInput,
  GeneratedCopyDto,
  OfferDto,
  UpdateOfferInput,
} from '@radar/contracts';
import { createOfferSchema } from '@radar/contracts';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { optionalString, parseWith } from '../common/zod';
import { CopyService } from './copy.service';
import { AmazonCreatorsService } from './amazon-creators.service';
import { extractProductId, offerFingerprint } from './marketplace';
import { toOfferDto } from './offer.mapper';

type CopyMode = 'template' | 'ai';

@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly copy: CopyService,
    private readonly amazon: AmazonCreatorsService,
  ) {}

  async list(): Promise<OfferDto[]> {
    const offers = await this.prisma.offer.findMany({ orderBy: { createdAt: 'desc' } });
    return offers.map(toOfferDto);
  }

  async get(id: string): Promise<OfferDto> {
    return toOfferDto(await this.find(id));
  }

  async importAmazon(
    keyword: string,
    itemCount: number,
    adminId: string,
  ): Promise<{ created: OfferDto[]; skipped: number }> {
    const candidates = await this.amazon.search(keyword, itemCount);
    const created: OfferDto[] = [];
    let skipped = 0;
    for (const candidate of candidates) {
      try {
        created.push(await this.create(candidate, adminId));
      } catch (error) {
        if (error instanceof ConflictException) {
          skipped += 1;
          continue;
        }
        throw error;
      }
    }
    return { created, skipped };
  }

  async create(input: CreateOfferInput, adminId: string): Promise<OfferDto> {
    const productId = optionalString(input.productId) ?? extractProductId(input.marketplace, input.affiliateUrl);
    const seed = {
      title: input.title,
      currentPriceCents: input.currentPriceCents,
      originalPriceCents: input.originalPriceCents ?? null,
      coupon: optionalString(input.coupon),
      category: optionalString(input.category),
    };
    const generated = this.copy.template(seed);
    const data: Prisma.OfferCreateInput = {
      marketplace: input.marketplace,
      productId,
      fingerprint: offerFingerprint(input.marketplace, productId, input.affiliateUrl),
      title: input.title.trim(),
      affiliateUrl: input.affiliateUrl,
      imageUrl: optionalString(input.imageUrl),
      currentPriceCents: input.currentPriceCents,
      originalPriceCents: input.originalPriceCents ?? null,
      coupon: seed.coupon,
      category: seed.category,
      headline: optionalString(input.headline) ?? generated.headline,
      description: optionalString(input.description) ?? generated.description,
    };

    try {
      const offer = await this.prisma.offer.create({ data });
      await this.audit(adminId, 'CREATE', offer.id);
      return toOfferDto(offer);
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async update(id: string, input: UpdateOfferInput, adminId: string): Promise<OfferDto> {
    const current = await this.find(id);
    const marketplace = input.marketplace ?? current.marketplace;
    const affiliateUrl = input.affiliateUrl ?? current.affiliateUrl;
    const identityChanged = input.marketplace !== undefined || input.affiliateUrl !== undefined;
    const productId =
      input.productId !== undefined
        ? optionalString(input.productId) ?? extractProductId(marketplace, affiliateUrl)
        : identityChanged
          ? extractProductId(marketplace, affiliateUrl)
          : current.productId;

    parseWith(createOfferSchema, {
      marketplace,
      productId: productId ?? undefined,
      title: input.title ?? current.title,
      affiliateUrl,
      imageUrl: input.imageUrl ?? current.imageUrl ?? undefined,
      currentPriceCents: input.currentPriceCents ?? current.currentPriceCents,
      originalPriceCents: input.originalPriceCents ?? current.originalPriceCents ?? undefined,
      coupon: input.coupon ?? current.coupon ?? undefined,
      category: input.category ?? current.category ?? undefined,
      headline: input.headline ?? current.headline,
      description: input.description ?? current.description,
    });

    const data: Prisma.OfferUpdateInput = {
      status: 'DRAFT',
      ...(input.marketplace !== undefined && { marketplace }),
      ...((input.productId !== undefined || identityChanged) && { productId }),
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.affiliateUrl !== undefined && { affiliateUrl }),
      ...(input.imageUrl !== undefined && { imageUrl: optionalString(input.imageUrl) }),
      ...(input.currentPriceCents !== undefined && { currentPriceCents: input.currentPriceCents }),
      ...(input.originalPriceCents !== undefined && { originalPriceCents: input.originalPriceCents }),
      ...(input.coupon !== undefined && { coupon: optionalString(input.coupon) }),
      ...(input.category !== undefined && { category: optionalString(input.category) }),
      ...(input.headline !== undefined && { headline: optionalString(input.headline) ?? '' }),
      ...(input.description !== undefined && { description: optionalString(input.description) ?? '' }),
    };
    if (input.marketplace !== undefined || input.productId !== undefined || input.affiliateUrl !== undefined) {
      data.fingerprint = offerFingerprint(marketplace, productId, affiliateUrl);
    }

    try {
      const offer = await this.prisma.offer.update({ where: { id }, data });
      await this.audit(adminId, 'UPDATE', offer.id);
      return toOfferDto(offer);
    } catch (error) {
      this.rethrowUnique(error);
      throw error;
    }
  }

  async approve(id: string, adminId: string): Promise<OfferDto> {
    const current = await this.find(id);
    if (!current.headline.trim() || !current.description.trim()) {
      throw new ConflictException('Gere ou informe headline e descrição antes de aprovar.');
    }
    const offer = await this.prisma.offer.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
    await this.audit(adminId, 'APPROVE', id);
    return toOfferDto(offer);
  }

  async generateCopy(id: string, mode: CopyMode, adminId: string): Promise<GeneratedCopyDto> {
    const offer = await this.find(id);
    const generated = await this.copy.generate(offer, mode);
    await this.prisma.offer.update({
      where: { id },
      data: { headline: generated.headline, description: generated.description, status: 'DRAFT' },
    });
    await this.audit(adminId, 'GENERATE_COPY', id, { source: generated.source });
    return generated;
  }

  async archive(id: string, adminId: string): Promise<void> {
    await this.find(id);
    await this.prisma.offer.update({ where: { id }, data: { status: 'ARCHIVED' } });
    await this.audit(adminId, 'ARCHIVE', id);
  }

  private async find(id: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) throw new NotFoundException('Oferta não encontrada.');
    return offer;
  }

  private audit(
    adminId: string,
    action: string,
    entityId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.prisma.auditLog.create({
      data: { adminId, action, entity: 'Offer', entityId, ...(metadata !== undefined && { metadata }) },
    });
  }

  private rethrowUnique(error: unknown): void {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      throw new ConflictException('Esta oferta já foi cadastrada.');
    }
  }
}
