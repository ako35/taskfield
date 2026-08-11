import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CustomersRepository } from './customers.repository';

export interface CreateCustomerInput {
  name?: unknown;
  contactName?: unknown;
  phone?: unknown;
  email?: unknown;
  district?: unknown;
  address?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  notes?: unknown;
}

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async create(managerId: string, input: CreateCustomerInput) {
    const customer = {
      id: randomUUID(),
      managerId,
      ...this.validatedCustomer(input),
      createdAt: new Date().toISOString(),
    };

    try {
      return { customer: await this.customersRepository.create(customer) };
    } catch (error) {
      this.throwIfDuplicate(error);
      throw error;
    }
  }

  async update(
    managerId: string,
    customerId: string,
    input: CreateCustomerInput,
  ) {
    try {
      const customer = await this.customersRepository.update(
        customerId,
        managerId,
        this.validatedCustomer(input),
      );
      if (!customer) {
        throw new NotFoundException('Müşteri bölgenizde bulunamadı.');
      }
      return { customer };
    } catch (error) {
      this.throwIfDuplicate(error);
      throw error;
    }
  }

  private validatedCustomer(input: CreateCustomerInput) {
    return {
      name: this.text(input.name, 'Müşteri adı', 2, 120),
      contactName: this.text(input.contactName, 'Yetkili kişi', 2, 120),
      phone: this.phone(input.phone),
      email: this.email(input.email),
      district: this.text(input.district, 'İlçe', 2, 80),
      address: this.text(input.address, 'Açık adres', 5, 300),
      latitude: this.coordinate(input.latitude, 'Enlem', -90, 90),
      longitude: this.coordinate(input.longitude, 'Boylam', -180, 180),
      notes: this.optionalText(input.notes, 'Not', 500),
    };
  }

  async list(managerId: string) {
    return {
      customers: await this.customersRepository.findByManager(managerId),
    };
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

  private phone(value: unknown) {
    const phone = this.text(value, 'Telefon', 7, 30);
    if (!/^[+\d][\d\s()-]+$/.test(phone)) {
      throw new BadRequestException('Geçerli bir telefon numarası girin.');
    }
    return phone;
  }

  private email(value: unknown) {
    if (value === undefined || value === null || value === '') return null;
    const email = this.text(value, 'E-posta', 3, 254).toLocaleLowerCase(
      'tr-TR',
    );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Geçerli bir e-posta adresi girin.');
    }
    return email;
  }

  private coordinate(value: unknown, label: string, min: number, max: number) {
    const coordinate =
      typeof value === 'number'
        ? value
        : typeof value === 'string' && value.trim() !== ''
          ? Number(value)
          : Number.NaN;
    if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
      throw new BadRequestException(
        `${label} için haritada geçerli bir konum seçin.`,
      );
    }
    return coordinate;
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }

  private throwIfDuplicate(error: unknown) {
    if (this.isUniqueViolation(error)) {
      throw new ConflictException('Bu müşteri bölgenizde zaten tanımlı.');
    }
  }
}
