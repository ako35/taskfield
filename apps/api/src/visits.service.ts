import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { VisitsRepository } from './visits.repository';

export interface CreateVisitInput {
  fieldAgentId?: unknown;
  customerId?: unknown;
  scheduledAt?: unknown;
  notes?: unknown;
}

@Injectable()
export class VisitsService {
  constructor(private readonly visitsRepository: VisitsRepository) {}

  async create(managerId: string, input: CreateVisitInput) {
    const fieldAgentId = this.uuid(input.fieldAgentId, 'saha çalışanı');
    const customerId = this.uuid(input.customerId, 'müşteri');
    const scheduledAt = this.date(input.scheduledAt);
    const notes = this.optionalText(input.notes, 'Not', 500);
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

  private uuid(value: unknown, label: string) {
    if (
      typeof value !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      )
    ) {
      throw new BadRequestException(`Geçerli bir ${label} seçin.`);
    }
    return value;
  }

  private text(value: unknown, label: string, min: number, max: number) {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${label} zorunludur.`);
    }
    const text = value.trim();
    if (text.length < min || text.length > max) {
      throw new BadRequestException(
        `${label} ${min}-${max} karakter olmalıdır.`,
      );
    }
    return text;
  }

  private optionalText(value: unknown, label: string, max: number) {
    if (value === undefined || value === null || value === '') return null;
    return this.text(value, label, 1, max);
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
}
