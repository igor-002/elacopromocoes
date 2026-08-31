import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  copyRequestSchema,
  createOfferSchema,
  updateOfferSchema,
} from '@radar/contracts';
import { z } from 'zod';
import { parseWith } from '../common/zod';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { OffersService } from './offers.service';

@Controller('offers')
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Get()
  list() {
    return this.offers.list();
  }

  @Get(':id')
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.offers.get(id);
  }

  @Post()
  create(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.offers.create(parseWith(createOfferSchema, body), request.admin.id);
  }

  @Post('import/amazon')
  importAmazon(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const input = parseWith(
      z.object({
        keyword: z.string().trim().min(2).max(120),
        itemCount: z.number().int().min(1).max(10).default(5),
      }),
      body,
    );
    return this.offers.importAmazon(input.keyword, input.itemCount, request.admin.id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.offers.update(id, parseWith(updateOfferSchema, body), request.admin.id);
  }

  @Post(':id/copy')
  copy(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ) {
    const input = parseWith(copyRequestSchema, body);
    return this.offers.generateCopy(id, input.mode, request.admin.id);
  }

  @Post(':id/approve')
  approve(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.offers.approve(id, request.admin.id);
  }

  @Post(':id/archive')
  async archiveAction(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.offers.archive(id, request.admin.id);
    return this.offers.get(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async archive(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.offers.archive(id, request.admin.id);
  }
}
