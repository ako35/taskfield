import { BadRequestException } from '@nestjs/common';
import type { VisitRecord, VisitsRepository } from './visits.repository';
import { VisitsService } from './visits.service';

describe('VisitsService', () => {
  const managerId = '30b985f8-5d08-4d5e-aa2f-0a1337f8ea21';
  const agentId = 'b26d0f3c-f223-42a5-9898-fb678dbdde88';
  const customerId = 'e4f2aa78-44e8-487f-93b2-935eb032ec7d';
  let visits: VisitRecord[];
  let service: VisitsService;
  let eventService: { emitVisitUpdated: jest.Mock };

  beforeEach(() => {
    visits = [];
    eventService = { emitVisitUpdated: jest.fn() };
    const repository = {
      create: (
        visit: Omit<
          VisitRecord,
          | 'agentFirstName'
          | 'agentLastName'
          | 'customerName'
          | 'district'
          | 'address'
        > & { customerId: string },
      ) => {
        if (
          visit.managerId !== managerId ||
          visit.fieldAgentId !== agentId ||
          visit.customerId !== customerId
        ) {
          return Promise.resolve(null);
        }
        const created = {
          ...visit,
          agentFirstName: 'Ece',
          agentLastName: 'Yılmaz',
          customerName: 'Pati Dünyası',
          district: 'Kadıköy',
          address: 'Bağdat Caddesi No: 120 Kadıköy, İstanbul',
          latitude: 40.9876,
          longitude: 29.0254,
        };
        visits.push(created);
        return Promise.resolve(created);
      },
      findByManager: (id: string) =>
        Promise.resolve(visits.filter((visit) => visit.managerId === id)),
      findByFieldAgent: (id: string) =>
        Promise.resolve(visits.filter((visit) => visit.fieldAgentId === id)),
      findByIdForFieldAgent: (fieldAgentId: string, visitId: string) =>
        Promise.resolve(
          visits.find(
            (visit) =>
              visit.fieldAgentId === fieldAgentId && visit.id === visitId,
          ) ?? null,
        ),
      checkIn: async (
        fieldAgentId: string,
        visitId: string,
        input: { latitude: number; longitude: number; checkInAt: string },
      ) => {
        const visit = visits.find(
          (candidate) =>
            candidate.fieldAgentId === fieldAgentId && candidate.id === visitId,
        );
        if (!visit) return null;
        visit.status = 'in_progress';
        visit.checkInAt = input.checkInAt;
        visit.checkInLatitude = input.latitude;
        visit.checkInLongitude = input.longitude;
        return visit;
      },
      checkOut: async (
        fieldAgentId: string,
        visitId: string,
        input: { latitude: number; longitude: number; checkOutAt: string },
      ) => {
        const visit = visits.find(
          (candidate) =>
            candidate.fieldAgentId === fieldAgentId && candidate.id === visitId,
        );
        if (!visit) return null;
        visit.status = 'completed';
        visit.checkOutAt = input.checkOutAt;
        visit.checkOutLatitude = input.latitude;
        visit.checkOutLongitude = input.longitude;
        return visit;
      },
    } as unknown as VisitsRepository;
    service = new VisitsService(repository, eventService as any);
  });

  const assignment = {
    fieldAgentId: agentId,
    customerId,
    scheduledAt: '2026-08-12T09:30:00.000Z',
    notes: 'Yeni ürün kataloğunu göster.',
  };

  it('creates an assignment for a manager-owned field agent', async () => {
    const result = await service.create(managerId, assignment);

    expect(result.visit).toMatchObject({
      managerId,
      fieldAgentId: agentId,
      customerId,
      customerName: 'Pati Dünyası',
      status: 'planned',
    });
    await expect(service.listForFieldAgent(agentId)).resolves.toMatchObject({
      visits: [{ id: result.visit.id }],
    });
  });

  it('rejects an agent who does not belong to the manager', async () => {
    await expect(
      service.create('bc2cc8fb-b3ce-4dfc-825e-d4d374a2ec38', assignment),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('validates customer and schedule fields', async () => {
    await expect(
      service.create(managerId, { ...assignment, customerId: '' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create(managerId, { ...assignment, scheduledAt: 'not-a-date' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lets a field agent check in and out with location tracking', async () => {
    const created = await service.create(managerId, assignment);

    await expect(
      service.checkIn(agentId, created.visit.id, {
        latitude: 40.9876,
        longitude: 29.0254,
      }),
    ).resolves.toMatchObject({
      visit: {
        status: 'in_progress',
        checkInLatitude: 40.9876,
        checkInLongitude: 29.0254,
      },
    });

    expect(eventService.emitVisitUpdated).toHaveBeenCalledWith(created.visit.id);

    await expect(
      service.checkOut(agentId, created.visit.id, {
        latitude: 40.988,
        longitude: 29.026,
      }),
    ).resolves.toMatchObject({
      visit: {
        status: 'completed',
        checkOutLatitude: 40.988,
        checkOutLongitude: 29.026,
      },
    });

    expect(eventService.emitVisitUpdated).toHaveBeenLastCalledWith(
      created.visit.id,
    );
  });
});
