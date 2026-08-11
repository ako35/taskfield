import { BadRequestException, ConflictException } from '@nestjs/common';
import type {
  CustomerRecord,
  CustomersRepository,
} from './customers.repository';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  const repository = {
    create: jest.fn(),
    findByManager: jest.fn(),
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
      notes: '',
    });

    expect(result.customer).toMatchObject({
      managerId: 'manager-id',
      name: 'Pati Dünyası',
      contactName: 'Ece Yılmaz',
      email: 'ece@example.com',
      district: 'Kadıköy',
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
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
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
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
