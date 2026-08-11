import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type {
  CustomerRecord,
  CustomersRepository,
} from './customers.repository';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  const repository = {
    create: jest.fn(),
    findByManager: jest.fn(),
    update: jest.fn(),
  };
  const service = new CustomersService(
    repository as unknown as CustomersRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('creates a normalized customer for the manager', async () => {
    repository.create.mockImplementation((customer: CustomerRecord) =>
      Promise.resolve(customer),
    );

    const result = await service.create('manager-id', {
      name: '  Pati Dünyası  ',
      contactName: ' Ece Yılmaz ',
      phone: '+90 532 111 22 33',
      email: 'ECE@EXAMPLE.COM',
      district: ' Kadıköy ',
      address: ' Moda Caddesi No: 10 ',
      latitude: 40.9876,
      longitude: 29.0254,
      notes: '',
    });

    expect(result.customer).toMatchObject({
      managerId: 'manager-id',
      name: 'Pati Dünyası',
      contactName: 'Ece Yılmaz',
      email: 'ece@example.com',
      district: 'Kadıköy',
      latitude: 40.9876,
      longitude: 29.0254,
      notes: null,
    });
  });

  it('rejects invalid phone numbers', async () => {
    await expect(
      service.create('manager-id', {
        name: 'Pati Dünyası',
        contactName: 'Ece Yılmaz',
        phone: 'telefon',
        district: 'Kadıköy',
        address: 'Moda Caddesi No: 10',
        latitude: 40.9876,
        longitude: 29.0254,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires a valid map location', async () => {
    await expect(
      service.create('manager-id', {
        name: 'Pati Dünyası',
        contactName: 'Ece Yılmaz',
        phone: '0532 111 22 33',
        district: 'Kadıköy',
        address: 'Moda Caddesi No: 10',
        latitude: 120,
        longitude: 29.0254,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates a manager-owned customer', async () => {
    repository.update.mockImplementation(
      (
        customerId: string,
        managerId: string,
        customer: Omit<CustomerRecord, 'id' | 'managerId' | 'createdAt'>,
      ) =>
        Promise.resolve({
          ...customer,
          id: customerId,
          managerId,
          createdAt: '2026-08-11T00:00:00.000Z',
        }),
    );

    const result = await service.update('manager-id', 'customer-id', {
      name: 'Pati Dünyası Güncel',
      contactName: 'Ece Yılmaz',
      phone: '0532 111 22 33',
      district: 'Kadıköy',
      address: 'Moda Caddesi No: 20',
      latitude: 40.99,
      longitude: 29.03,
    });

    expect(result.customer).toMatchObject({
      id: 'customer-id',
      managerId: 'manager-id',
      name: 'Pati Dünyası Güncel',
      address: 'Moda Caddesi No: 20',
    });
  });

  it('rejects updates outside the manager scope', async () => {
    repository.update.mockResolvedValue(null);

    await expect(
      service.update('other-manager', 'customer-id', {
        name: 'Pati Dünyası',
        contactName: 'Ece Yılmaz',
        phone: '0532 111 22 33',
        district: 'Kadıköy',
        address: 'Moda Caddesi No: 20',
        latitude: 40.99,
        longitude: 29.03,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reports duplicate customer names', async () => {
    repository.create.mockRejectedValue({ code: '23505' });

    await expect(
      service.create('manager-id', {
        name: 'Pati Dünyası',
        contactName: 'Ece Yılmaz',
        phone: '0532 111 22 33',
        district: 'Kadıköy',
        address: 'Moda Caddesi No: 10',
        latitude: 40.9876,
        longitude: 29.0254,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
