import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from './auth.service';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() input: RegisterInput) {
    return this.authService.register(input);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() input: LoginInput) {
    return this.authService.login(input);
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() input: ChangePasswordInput,
  ) {
    return this.authService.changePassword(request.user.id, input);
  }
}
