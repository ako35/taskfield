import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedRequest } from './jwt-auth.guard';
import { VisitEventsService } from './visit-events.service';
import type { CreateVisitInput, VisitLocationInput } from './visits.service';
import { VisitsService } from './visits.service';

@Controller('visits')
export class VisitsController {
  constructor(
    private readonly visitsService: VisitsService,
    private readonly visitEventsService: VisitEventsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('events')
  async events(
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const token = typeof request.query.token === 'string' ? request.query.token : '';
    if (!token) {
      response.status(401).json({ message: 'Oturum anahtarı gerekli.' });
      return;
    }

    try {
      await this.jwtService.verifyAsync(token);
    } catch {
      response.status(401).json({ message: 'Oturum geçersiz veya süresi dolmuş.' });
      return;
    }

    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders?.();

    this.visitEventsService.addSubscriber(response);
    return response;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@Req() request: AuthenticatedRequest) {
    return request.user.role === 'regional_manager'
      ? this.visitsService.listForManager(request.user.id)
      : this.visitsService.listForFieldAgent(request.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
