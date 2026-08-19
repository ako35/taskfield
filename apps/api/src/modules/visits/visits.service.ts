import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { optionalText, requireUuid } from '../../common/validation';
import { VisitEventsService } from './visit-events.service';
import { VisitsRepository } from './visits.repository';

export interface CreateVisitInput {
  fieldAgentId?: unknown;
  customerId?: unknown;
  scheduledAt?: unknown;
  notes?: unknown;
}

export interface VisitLocationInput {
  latitude?: unknown;
  longitude?: unknown;
}

@Injectable()
export class VisitsService {
  constructor(
    private readonly visitsRepository: VisitsRepository,
    private readonly visitEventsService?: VisitEventsService,
  ) {}

  async create(managerId: string, input: CreateVisitInput) {
    const fieldAgentId = requireUuid(input.fieldAgentId, 'saha çalışanı');
    const customerId = requireUuid(input.customerId, 'müşteri');
    const scheduledAt = this.date(input.scheduledAt);
    const notes = optionalText(input.notes, 'Not', 500);
    const createdAt = new Date().toISOString();

    const visit = await this.visitsRepository.create({
      id: randomUUID(),
      managerId,
      fieldAgentId,
      customerId,
      scheduledAt,
      notes,
      status: 'planned',
      createdAt,
      checkInAt: null,
      checkInLatitude: null,
      checkInLongitude: null,
      checkOutAt: null,
      checkOutLatitude: null,
      checkOutLongitude: null,
    });
    if (!visit) {
      throw new BadRequestException(
        'Seçilen saha çalışanı veya müşteri bölgenizde bulunamadı.',
      );
    }
    return { visit };
  }

  async listForManager(managerId: string) {
    return { visits: await this.visitsRepository.findByManager(managerId) };
  }

  async listForFieldAgent(fieldAgentId: string) {
    return {
      visits: await this.visitsRepository.findByFieldAgent(fieldAgentId),
    };
  }

  async checkIn(
    fieldAgentId: string,
    visitId: string,
    input: VisitLocationInput,
  ) {
    const visit = await this.visitsRepository.findByIdForFieldAgent(
      fieldAgentId,
      visitId,
    );
    if (!visit) {
      throw new NotFoundException('Atanan ziyaret bulunamadı.');
    }
    if (visit.status === 'completed' || visit.status === 'cancelled') {
      throw new BadRequestException('Tamamlanan veya iptal edilen ziyaretin girişini yapamazsınız.');
    }

    const latitude = this.coordinate(input.latitude, 'Enlem');
    const longitude = this.coordinate(input.longitude, 'Boylam');
    this.ensureWithinCustomerRange(visit, latitude, longitude);

    const updated = await this.visitsRepository.checkIn(fieldAgentId, visitId, {
      latitude,
      longitude,
      checkInAt: new Date().toISOString(),
    });
    if (!updated) {
      throw new NotFoundException('Giriş kaydı oluşturulamadı.');
    }
    this.visitEventsService?.emitVisitUpdated(updated.id);
    return { visit: updated };
  }

  async checkOut(
    fieldAgentId: string,
    visitId: string,
    input: VisitLocationInput,
  ) {
    const visit = await this.visitsRepository.findByIdForFieldAgent(
      fieldAgentId,
      visitId,
    );
    if (!visit) {
      throw new NotFoundException('Atanan ziyaret bulunamadı.');
    }
    if (visit.status !== 'in_progress') {
      throw new BadRequestException('Önce ziyaret girişini tamamlamalısınız.');
    }

    const latitude = this.coordinate(input.latitude, 'Enlem');
    const longitude = this.coordinate(input.longitude, 'Boylam');
    this.ensureWithinCustomerRange(visit, latitude, longitude);

    const updated = await this.visitsRepository.checkOut(fieldAgentId, visitId, {
      latitude,
      longitude,
      checkOutAt: new Date().toISOString(),
    });
    if (!updated) {
      throw new NotFoundException('Çıkış kaydı oluşturulamadı.');
    }
    this.visitEventsService?.emitVisitUpdated(updated.id);
    return { visit: updated };
  }

  private date(value: unknown) {
    if (typeof value !== 'string') {
      throw new BadRequestException('Ziyaret tarihi ve saati zorunludur.');
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Geçerli bir ziyaret tarihi seçin.');
    }
    return date.toISOString();
  }

  private coordinate(value: unknown, label: string) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < -90 || numeric > 90) {
      throw new BadRequestException(`${label} geçerli bir koordinat olmalıdır.`);
    }
    return numeric;
  }

  private ensureWithinCustomerRange(
    visit: { latitude: number | null; longitude: number | null },
    latitude: number,
    longitude: number,
  ) {
    if (visit.latitude === null || visit.longitude === null) return;

    const distanceKm = this.distanceKm(
      latitude,
      longitude,
      visit.latitude,
      visit.longitude,
    );
    if (distanceKm > 0.5) {
      throw new BadRequestException(
        'Müşteri lokasyonuna en az 500 metre yakın olmalısınız.',
      );
    }
  }

  private distanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }
}
