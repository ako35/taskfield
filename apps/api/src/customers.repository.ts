import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';

export interface CustomerRecord {
  id: string;
  managerId: string;
  name: string;
  contactName: string;
  phone: string;
  email: string | null;
  district: string;
  address: string;
  notes: string | null;
  createdAt: string;
}

interface CustomerRow {
  id: string;
  manager_id: string;
  name: string;
  contact_name: string;
  phone: string;
  email: string | null;
  district: string;
  address: string;
  notes: string | null;
  created_at: Date | string;
}

@Injectable()
export class CustomersRepository implements OnModuleInit, OnModuleDestroy {
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
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY,
        manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(120) NOT NULL,
        contact_name VARCHAR(120) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        email VARCHAR(254),
        district VARCHAR(80) NOT NULL,
        address VARCHAR(300) NOT NULL,
        notes VARCHAR(500),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS customers_manager_name_idx
       ON customers (manager_id, LOWER(name))`,
    );
  }

  async create(customer: CustomerRecord): Promise<CustomerRecord> {
    const result = await this.pool.query<CustomerRow>(
      `INSERT INTO customers (
         id, manager_id, name, contact_name, phone, email, district, address,
         notes, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        customer.id,
        customer.managerId,
        customer.name,
        customer.contactName,
        customer.phone,
        customer.email,
        customer.district,
        customer.address,
        customer.notes,
        customer.createdAt,
      ],
    );
    return this.toRecord(result.rows[0]);
  }

  async findByManager(managerId: string): Promise<CustomerRecord[]> {
    const result = await this.pool.query<CustomerRow>(
      `SELECT * FROM customers
       WHERE manager_id = $1
       ORDER BY name ASC`,
      [managerId],
    );
    return result.rows.map((row) => this.toRecord(row));
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  private toRecord(row: CustomerRow): CustomerRecord {
    return {
      id: row.id,
      managerId: row.manager_id,
      name: row.name,
      contactName: row.contact_name,
      phone: row.phone,
      email: row.email,
      district: row.district,
      address: row.address,
      notes: row.notes,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : row.created_at,
    };
  }
}
