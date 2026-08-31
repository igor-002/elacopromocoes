import { Injectable } from '@nestjs/common';
import type { DashboardDto } from '@radar/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicationDto } from '../publications/publication.mapper';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<DashboardDto> {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const [draftOffers, approvedOffers, scheduledPublications, sentToday, failedPublications, recent] =
      await this.prisma.$transaction([
        this.prisma.offer.count({ where: { status: 'DRAFT' } }),
        this.prisma.offer.count({ where: { status: 'APPROVED' } }),
        this.prisma.publication.count({ where: { status: 'SCHEDULED' } }),
        this.prisma.publication.count({ where: { status: 'SENT', sentAt: { gte: startOfToday } } }),
        this.prisma.publication.count({ where: { status: { in: ['FAILED', 'UNKNOWN'] } } }),
        this.prisma.publication.findMany({
          include: { offer: true, destination: true },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        }),
      ]);

    return {
      draftOffers,
      approvedOffers,
      scheduledPublications,
      sentToday,
      failedPublications,
      recentPublications: recent.map(toPublicationDto),
    };
  }
}
