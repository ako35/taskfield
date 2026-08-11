import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { CreateCustomerInput } from './customers.service';
import { CustomersService } from './customers.service';
import type { AuthenticatedRequest } from './jwt-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    this.assertManager(request);
    return this.customersService.list(request.user.id);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() input: CreateCustomerInput,
  ) {
    this.assertManager(request);
    return this.customersService.create(request.user.id, input);
  }

  private assertManager(request: AuthenticatedRequest) {
    if (request.user.role !== 'regional_manager') {
      throw new ForbiddenException(
        'Müşteri yönetimi yalnız bölge müdürlerine açıktır.',
      );
    }
  }
}
