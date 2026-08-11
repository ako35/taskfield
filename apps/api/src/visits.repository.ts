import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';

export type VisitStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface VisitRecord {
  id: string;
  managerId: string;
  fieldAgentId: string;
  agentFirstName: string;
  agentLastName: string;
  customerName: string;
  district: string;
  address: string;
  scheduledAt: string;
  notes: string | null;
  status: VisitStatus;
  createdAt: string;
}

interface VisitRow {
  id: string;
  manager_id: string;
  field_agent_id: string;
  agent_first_name: string;
  agent_last_name: string;
  customer_name: string;
  district: string;
  address: string;
  scheduled_at: Date | string;
  notes: string | null;
  status: VisitStatus;
  created_at: Date | string;
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
        customer_name VARCHAR(120) NOT NULL,
        district VARCHAR(80) NOT NULL,
        address VARCHAR(300) NOT NULL,
        scheduled_at TIMESTAMPTZ NOT NULL,
        notes VARCHAR(500),
        status VARCHAR(30) NOT NULL DEFAULT 'planned'
          CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.pool.query(
      `CREATE INDEX IF NOT EXISTS visit_assignments_agent_schedule_idx
       ON visit_assignments (field_agent_id, scheduled_at)`,
    );
    await this.pool.query(
      `CREATE INDEX IF NOT EXISTS visit_assignments_manager_schedule_idx
       ON visit_assignments (manager_id, scheduled_at)`,
    );
  }

  async create(
    visit: Omit<VisitRecord, 'agentFirstName' | 'agentLastName'>,
  ): Promise<VisitRecord | null> {
    const result = await this.pool.query<VisitRow>(
      `WITH inserted AS (
         INSERT INTO visit_assignments (
           id, manager_id, field_agent_id, customer_name, district, address,
           scheduled_at, notes, status, created_at
         )
         SELECT $1, $2, user_account.id, $4, $5, $6, $7, $8, $9, $10
         FROM users user_account
         WHERE user_account.id = $3
           AND user_account.manager_id = $2
           AND user_account.role = 'field_agent'
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
        visit.customerName,
        visit.district,
        visit.address,
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
      agentFirstName: row.agent_first_name,
      agentLastName: row.agent_last_name,
      customerName: row.customer_name,
      district: row.district,
      address: row.address,
      scheduledAt: this.toIsoString(row.scheduled_at),
      notes: row.notes,
      status: row.status,
      createdAt: this.toIsoString(row.created_at),
    };
  }

  private toIsoString(value: Date | string) {
    return value instanceof Date ? value.toISOString() : value;
  }
}
