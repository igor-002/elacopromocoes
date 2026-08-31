import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req } from '@nestjs/common';
import { createPublicationSchema } from '@radar/contracts';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { parseWith } from '../common/zod';
import { PublicationsService } from './publications.service';

@Controller('publications')
export class PublicationsController {
  constructor(private readonly publications: PublicationsService) {}

  @Get()
  list() {
    return this.publications.list();
  }

  @Get(':id')
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.publications.get(id);
  }

  @Post()
  create(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.publications.create(parseWith(createPublicationSchema, body), request.admin.id);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.publications.cancel(id, request.admin.id);
  }

  @Post(':id/retry')
  retry(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.publications.retry(id, request.admin.id);
  }
}
