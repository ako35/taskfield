import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedRequest } from './jwt-auth.guard';
import type { CreateVisitInput } from './visits.service';
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
}
