import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';

export type VisitStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface VisitRecord {
  id: string;
  managerId: string;
  fieldAgentId: string;
  customerId: string | null;
  agentFirstName: string;
  agentLastName: string;
  customerName: string;
  district: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  scheduledAt: string;
  notes: string | null;
  status: VisitStatus;
  createdAt: string;
  checkInAt: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkOutAt: string | null;
  checkOutLatitude: number | null;
  checkOutLongitude: number | null;
}

interface VisitRow {
  id: string;
  manager_id: string;
  field_agent_id: string;
  customer_id: string | null;
  agent_first_name: string;
  agent_last_name: string;
  customer_name: string;
  district: string;
  address: string;
  latitude: string | number | null;
  longitude: string | number | null;
  scheduled_at: Date | string;
  notes: string | null;
  status: VisitStatus;
  created_at: Date | string;
  check_in_at: Date | string | null;
  check_in_latitude: string | number | null;
  check_in_longitude: string | number | null;
  check_out_at: Date | string | null;
  check_out_latitude: string | number | null;
  check_out_longitude: string | number | null;
}

@Injectable()
export class VisitsRepository implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL tanımlı değil.');
    }
    this.pool = new Pool({
      connectionString,
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: true }
          : false,
    });
  }

  async onModuleInit() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS visit_assignments (
        id UUID PRIMARY KEY,
        manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        field_agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        customer_id UUID,
        customer_name VARCHAR(120) NOT NULL,
        district VARCHAR(80) NOT NULL,
        address VARCHAR(300) NOT NULL,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        scheduled_at TIMESTAMPTZ NOT NULL,
        notes VARCHAR(500),
        status VARCHAR(30) NOT NULL DEFAULT 'planned'
          CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.pool.query(
      `ALTER TABLE visit_assignments
       ADD COLUMN IF NOT EXISTS customer_id UUID,
       ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
       ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
       ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMPTZ,
       ADD COLUMN IF NOT EXISTS check_in_latitude DOUBLE PRECISION,
       ADD COLUMN IF NOT EXISTS check_in_longitude DOUBLE PRECISION,
       ADD COLUMN IF NOT EXISTS check_out_at TIMESTAMPTZ,
       ADD COLUMN IF NOT EXISTS check_out_latitude DOUBLE PRECISION,
       ADD COLUMN IF NOT EXISTS check_out_longitude DOUBLE PRECISION`,
    );
    await this.pool.query(
      `CREATE INDEX IF NOT EXISTS visit_assignments_agent_schedule_idx
       ON visit_assignments (field_agent_id, scheduled_at)`,
    );
    await this.pool.query(
      `CREATE INDEX IF NOT EXISTS visit_assignments_manager_schedule_idx
       ON visit_assignments (manager_id, scheduled_at)`,
    );
    await this.pool.query(
      `CREATE INDEX IF NOT EXISTS visit_assignments_customer_idx
       ON visit_assignments (customer_id)`,
    );
  }

  async create(
    visit: Omit<
      VisitRecord,
      | 'agentFirstName'
      | 'agentLastName'
      | 'customerName'
      | 'district'
      | 'address'
      | 'latitude'
      | 'longitude'
    > & { customerId: string },
  ): Promise<VisitRecord | null> {
    const result = await this.pool.query<VisitRow>(
      `WITH inserted AS (
         INSERT INTO visit_assignments (
           id, manager_id, field_agent_id, customer_id, customer_name,
           district, address, latitude, longitude, scheduled_at, notes,
           status, created_at
         )
         SELECT $1, $2, user_account.id, customer.id, customer.name,
             customer.district, customer.address, customer.latitude,
             customer.longitude, $5, $6, $7, $8
         FROM users user_account
         CROSS JOIN customers customer
         WHERE user_account.id = $3
           AND user_account.manager_id = $2
           AND user_account.role = 'field_agent'
           AND customer.id = $4
           AND customer.manager_id = $2
         RETURNING *
       )
       SELECT inserted.*, user_account.first_name AS agent_first_name,
              user_account.last_name AS agent_last_name
       FROM inserted
       JOIN users user_account ON user_account.id = inserted.field_agent_id`,
      [
        visit.id,
        visit.managerId,
        visit.fieldAgentId,
        visit.customerId,
        visit.scheduledAt,
        visit.notes,
        visit.status,
        visit.createdAt,
      ],
    );
    const row = result.rows[0];
    return row ? this.toRecord(row) : null;
  }

  async findByManager(managerId: string): Promise<VisitRecord[]> {
    return this.findWithAgent('visit.manager_id = $1', managerId);
  }

  async findByFieldAgent(fieldAgentId: string): Promise<VisitRecord[]> {
    return this.findWithAgent('visit.field_agent_id = $1', fieldAgentId);
  }

  async findByIdForFieldAgent(
    fieldAgentId: string,
    visitId: string,
  ): Promise<VisitRecord | null> {
    const result = await this.pool.query<VisitRow>(
      `SELECT visit.*, user_account.first_name AS agent_first_name,
              user_account.last_name AS agent_last_name
       FROM visit_assignments visit
       JOIN users user_account ON user_account.id = visit.field_agent_id
       WHERE visit.id = $1 AND visit.field_agent_id = $2
       LIMIT 1`,
      [visitId, fieldAgentId],
    );
    const row = result.rows[0];
    return row ? this.toRecord(row) : null;
  }

  async checkIn(
    fieldAgentId: string,
    visitId: string,
    input: {
      latitude: number;
      longitude: number;
      checkInAt: string;
    },
  ): Promise<VisitRecord | null> {
    const result = await this.pool.query<VisitRow>(
      `WITH updated AS (
         UPDATE visit_assignments
         SET status = 'in_progress',
             check_in_at = $3,
             check_in_latitude = $4,
             check_in_longitude = $5
         WHERE id = $1 AND field_agent_id = $2
         RETURNING *
       )
       SELECT updated.*, user_account.first_name AS agent_first_name,
              user_account.last_name AS agent_last_name
       FROM updated
       JOIN users user_account ON user_account.id = updated.field_agent_id`,
      [visitId, fieldAgentId, input.checkInAt, input.latitude, input.longitude],
    );
    const row = result.rows[0];
    return row ? this.toRecord(row) : null;
  }

  async checkOut(
    fieldAgentId: string,
    visitId: string,
    input: {
      latitude: number;
      longitude: number;
      checkOutAt: string;
    },
  ): Promise<VisitRecord | null> {
    const result = await this.pool.query<VisitRow>(
      `WITH updated AS (
         UPDATE visit_assignments
         SET status = 'completed',
             check_out_at = $3,
             check_out_latitude = $4,
             check_out_longitude = $5
         WHERE id = $1 AND field_agent_id = $2
         RETURNING *
       )
       SELECT updated.*, user_account.first_name AS agent_first_name,
              user_account.last_name AS agent_last_name
       FROM updated
       JOIN users user_account ON user_account.id = updated.field_agent_id`,
      [visitId, fieldAgentId, input.checkOutAt, input.latitude, input.longitude],
    );
    const row = result.rows[0];
    return row ? this.toRecord(row) : null;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  private async findWithAgent(whereClause: string, id: string) {
    const result = await this.pool.query<VisitRow>(
      `SELECT visit.*, user_account.first_name AS agent_first_name,
              user_account.last_name AS agent_last_name
       FROM visit_assignments visit
       JOIN users user_account ON user_account.id = visit.field_agent_id
       WHERE ${whereClause}
       ORDER BY visit.scheduled_at ASC`,
      [id],
    );
    return result.rows.map((row) => this.toRecord(row));
  }

  private toRecord(row: VisitRow): VisitRecord {
    return {
      id: row.id,
      managerId: row.manager_id,
      fieldAgentId: row.field_agent_id,
      customerId: row.customer_id,
      agentFirstName: row.agent_first_name,
      agentLastName: row.agent_last_name,
      customerName: row.customer_name,
      district: row.district,
      address: row.address,
      latitude: this.toNumber(row.latitude),
      longitude: this.toNumber(row.longitude),
      scheduledAt: this.toIsoString(row.scheduled_at),
      notes: row.notes,
      status: row.status,
      createdAt: this.toIsoString(row.created_at),
      checkInAt: this.toIsoString(row.check_in_at),
      checkInLatitude: this.toNumber(row.check_in_latitude),
      checkInLongitude: this.toNumber(row.check_in_longitude),
      checkOutAt: this.toIsoString(row.check_out_at),
      checkOutLatitude: this.toNumber(row.check_out_latitude),
      checkOutLongitude: this.toNumber(row.check_out_longitude),
    };
  }

  private toIsoString(value: Date | string | null) {
    if (value === null) return null;
    return value instanceof Date ? value.toISOString() : value;
  }

  private toNumber(value: string | number | null) {
    return value === null ? null : Number(value);
  }
}
