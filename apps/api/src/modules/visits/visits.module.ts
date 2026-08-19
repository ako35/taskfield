import { Module } from '@nestjs/common';
import { VisitEventsService } from './visit-events.service';
import { VisitsController } from './visits.controller';
import { VisitsRepository } from './visits.repository';
import { VisitsService } from './visits.service';

@Module({
  controllers: [VisitsController],
  providers: [VisitsService, VisitsRepository, VisitEventsService],
})
export class VisitsModule {}
