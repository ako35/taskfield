import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CacheService } from '../../common/cache.service';
import { optionalText, requireText } from '../../common/validation';
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
  private static readonly CACHE_TTL_SECONDS = 30;

  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly cacheService: CacheService,
  ) {}

  async create(managerId: string, input: CreateCustomerInput) {
    const customer = {
      id: randomUUID(),
      managerId,
      ...this.validatedCustomer(input),
      createdAt: new Date().toISOString(),
    };

    try {
      const created = await this.customersRepository.create(customer);
      await this.cacheService.invalidate(this.cacheKey(managerId));
      return { customer: created };
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
      await this.cacheService.invalidate(this.cacheKey(managerId));
      return { customer };
    } catch (error) {
      this.throwIfDuplicate(error);
      throw error;
    }
  }

  private validatedCustomer(input: CreateCustomerInput) {
    return {
      name: requireText(input.name, 'Müşteri adı', 2, 120),
      contactName: requireText(input.contactName, 'Yetkili kişi', 2, 120),
      phone: this.phone(input.phone),
      email: this.email(input.email),
      district: requireText(input.district, 'İlçe', 2, 80),
      address: requireText(input.address, 'Açık adres', 5, 300),
      latitude: this.coordinate(input.latitude, 'Enlem', -90, 90),
      longitude: this.coordinate(input.longitude, 'Boylam', -180, 180),
      notes: optionalText(input.notes, 'Not', 500),
    };
  }

  async list(managerId: string) {
    const cacheKey = this.cacheKey(managerId);
    const cached = await this.cacheService.get<
      Awaited<ReturnType<CustomersRepository['findByManager']>>
    >(cacheKey);
    if (cached) {
      return { customers: cached };
    }

    const customers = await this.customersRepository.findByManager(managerId);
    await this.cacheService.set(
      cacheKey,
      customers,
      CustomersService.CACHE_TTL_SECONDS,
    );
    return { customers };
  }

  private cacheKey(managerId: string) {
    return `customers:${managerId}`;
  }

  private phone(value: unknown) {
    const phone = requireText(value, 'Telefon', 7, 30);
    if (!/^[+\d][\d\s()-]+$/.test(phone)) {
      throw new BadRequestException('Geçerli bir telefon numarası girin.');
    }
    return phone;
  }

  private email(value: unknown) {
    if (value === undefined || value === null || value === '') return null;
    const email = requireText(value, 'E-posta', 3, 254).toLocaleLowerCase(
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
