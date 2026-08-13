import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CustomersController } from './customers.controller';
import { CustomersRepository } from './customers.repository';
import { CustomersService } from './customers.service';
import { UsersRepository } from './users.repository';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TeamController } from './team.controller';
import { VisitsController } from './visits.controller';
import { VisitsRepository } from './visits.repository';
import { VisitEventsService } from './visit-events.service';
import { VisitsService } from './visits.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [
    AppController,
    AuthController,
    CustomersController,
    TeamController,
    VisitsController,
  ],
  providers: [
    AppService,
    AuthService,
    CustomersRepository,
    CustomersService,
    UsersRepository,
    VisitsRepository,
    VisitEventsService,
    VisitsService,
    JwtAuthGuard,
  ],
})
export class AppModule {}
