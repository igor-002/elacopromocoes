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
import { createDestinationSchema, updateDestinationSchema } from '@radar/contracts';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { parseWith } from '../common/zod';
import { DestinationsService } from './destinations.service';

@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinations: DestinationsService) {}

  @Get()
  list() {
    return this.destinations.list();
  }

  @Get(':id')
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.destinations.get(id);
  }

  @Post()
  create(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.destinations.create(parseWith(createDestinationSchema, body), request.admin.id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.destinations.update(id, parseWith(updateDestinationSchema, body), request.admin.id);
  }

  @Post(':id/test')
  test(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.destinations.test(id, request.admin.id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.destinations.remove(id, request.admin.id);
  }
}
