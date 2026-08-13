import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedRequest } from './jwt-auth.guard';
import type { CreateVisitInput, VisitLocationInput } from './visits.service';
import { VisitsService } from './visits.service';

@Controller('visits')
@UseGuards(JwtAuthGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return request.user.role === 'regional_manager'
      ? this.visitsService.listForManager(request.user.id)
      : this.visitsService.listForFieldAgent(request.user.id);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateVisitInput,
  ) {
    if (request.user.role !== 'regional_manager') {
      throw new ForbiddenException(
        'Ziyaret atamasını yalnız bölge müdürü oluşturabilir.',
      );
    }
    return this.visitsService.create(request.user.id, input);
  }

  @Patch(':visitId/check-in')
  checkIn(
    @Req() request: AuthenticatedRequest,
    @Param('visitId') visitId: string,
    @Body() input: VisitLocationInput,
  ) {
    if (request.user.role !== 'field_agent') {
      throw new ForbiddenException(
        'Yalnız saha çalışanı ziyaret girişini işaretleyebilir.',
      );
    }
    return this.visitsService.checkIn(request.user.id, visitId, input);
  }

  @Patch(':visitId/check-out')
  checkOut(
    @Req() request: AuthenticatedRequest,
    @Param('visitId') visitId: string,
    @Body() input: VisitLocationInput,
  ) {
    if (request.user.role !== 'field_agent') {
      throw new ForbiddenException(
        'Yalnız saha çalışanı ziyaret çıkışını işaretleyebilir.',
      );
    }
    return this.visitsService.checkOut(request.user.id, visitId, input);
  }
}
