import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  CreateFieldAgentInput,
  ResetFieldAgentPasswordInput,
} from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthenticatedRequest } from './jwt-auth.guard';

@Controller('team')
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    this.assertManager(request);
    return this.authService.listFieldAgents(request.user.id);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateFieldAgentInput,
  ) {
    this.assertManager(request);
    return this.authService.createFieldAgent(request.user.id, input);
  }

  @Patch(':agentId/password')
  resetPassword(
    @Req() request: AuthenticatedRequest,
    @Param('agentId', new ParseUUIDPipe()) agentId: string,
    @Body() input: ResetFieldAgentPasswordInput,
  ) {
    this.assertManager(request);
    return this.authService.resetFieldAgentPassword(
      request.user.id,
      agentId,
      input,
    );
  }

  private assertManager(request: AuthenticatedRequest) {
    if (request.user.role !== 'regional_manager') {
      throw new ForbiddenException(
        'Bu işlem yalnız bölge müdürlerine açıktır.',
      );
    }
  }
}
