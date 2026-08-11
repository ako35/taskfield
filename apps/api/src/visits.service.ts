import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { VisitsRepository } from './visits.repository';

export interface CreateVisitInput {
  fieldAgentId?: unknown;
  customerName?: unknown;
  district?: unknown;
  address?: unknown;
  scheduledAt?: unknown;
  notes?: unknown;
}

@Injectable()
export class VisitsService {
  constructor(private readonly visitsRepository: VisitsRepository) {}

  async create(managerId: string, input: CreateVisitInput) {
    const fieldAgentId = this.uuid(input.fieldAgentId);
    const customerName = this.text(input.customerName, 'Müşteri adı', 2, 120);
    const district = this.text(input.district, 'İlçe', 2, 80);
    const address = this.text(input.address, 'Açık adres', 5, 300);
    const scheduledAt = this.date(input.scheduledAt);
    const notes = this.optionalText(input.notes, 'Not', 500);
    const createdAt = new Date().toISOString();

    const visit = await this.visitsRepository.create({
      id: randomUUID(),
      managerId,
      fieldAgentId,
      customerName,
      district,
      address,
      scheduledAt,
      notes,
      status: 'planned',
      createdAt,
    });
    if (!visit) {
      throw new BadRequestException(
        'Seçilen saha çalışanı ekibinizde bulunamadı.',
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

  private uuid(value: unknown) {
    if (
      typeof value !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      )
    ) {
      throw new BadRequestException('Geçerli bir saha çalışanı seçin.');
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
