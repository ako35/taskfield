import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../common/database.provider';

export interface CustomerRecord {
  id: string;
  managerId: string;
  name: string;
  contactName: string;
  phone: string;
  email: string | null;
  district: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
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
  latitude: string | number | null;
  longitude: string | number | null;
  notes: string | null;
  created_at: Date | string;
}

@Injectable()
export class CustomersRepository implements OnModuleInit {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

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
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        notes VARCHAR(500),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.pool.query(`
      ALTER TABLE customers
        ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION
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
         latitude, longitude, notes, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        customer.latitude,
        customer.longitude,
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

  async update(
    customerId: string,
    managerId: string,
    customer: Omit<CustomerRecord, 'id' | 'managerId' | 'createdAt'>,
  ): Promise<CustomerRecord | null> {
    const result = await this.pool.query<CustomerRow>(
      `UPDATE customers
       SET name = $3, contact_name = $4, phone = $5, email = $6,
           district = $7, address = $8, latitude = $9, longitude = $10,
           notes = $11
       WHERE id = $1 AND manager_id = $2
       RETURNING *`,
      [
        customerId,
        managerId,
        customer.name,
        customer.contactName,
        customer.phone,
        customer.email,
        customer.district,
        customer.address,
        customer.latitude,
        customer.longitude,
        customer.notes,
      ],
    );
    const row = result.rows[0];
    return row ? this.toRecord(row) : null;
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
      latitude: this.toNumber(row.latitude),
      longitude: this.toNumber(row.longitude),
      notes: row.notes,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : row.created_at,
    };
  }

  private toNumber(value: string | number | null) {
    return value === null ? null : Number(value);
  }
}
