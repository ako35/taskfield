import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';

export type UserRole = 'regional_manager' | 'field_agent';

export interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  managerId: string | null;
  createdAt: string;
}

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
  password_hash: string;
  role: UserRole;
  manager_id: string | null;
  created_at: Date | string;
}

@Injectable()
export class UsersRepository implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL tanımlı değil. Kök .env dosyasına PostgreSQL bağlantısını ekleyin.',
      );
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
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        first_name VARCHAR(60) NOT NULL,
        last_name VARCHAR(60) NOT NULL,
        company VARCHAR(120) NOT NULL,
        email VARCHAR(254) NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(40) NOT NULL CHECK (role IN ('regional_manager', 'field_agent')),
        manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await this.pool.query(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID',
    );
    await this.pool.query(
      'ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check',
    );
    await this.pool.query(
      "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('regional_manager', 'field_agent'))",
    );
    await this.pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_manager_id_fkey'
        ) THEN
          ALTER TABLE users
            ADD CONSTRAINT users_manager_id_fkey
            FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END $$
    `);
    await this.pool.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (LOWER(email))',
    );
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email],
    );
    const row = result.rows[0];
    return row ? this.toRecord(row) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const result = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id],
    );
    const row = result.rows[0];
    return row ? this.toRecord(row) : null;
  }

  async findFieldAgentsByManager(managerId: string): Promise<UserRecord[]> {
    const result = await this.pool.query<UserRow>(
      `SELECT * FROM users
       WHERE manager_id = $1 AND role = 'field_agent'
       ORDER BY created_at DESC`,
      [managerId],
    );
    return result.rows.map((row) => this.toRecord(row));
  }

  async create(user: UserRecord): Promise<UserRecord> {
    await this.pool.query(
      `
        INSERT INTO users (
          id, first_name, last_name, company, email, password_hash, role, manager_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        user.id,
        user.firstName,
        user.lastName,
        user.company,
        user.email,
        user.passwordHash,
        user.role,
        user.managerId,
        user.createdAt,
      ],
    );
    return user;
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      passwordHash,
      id,
    ]);
  }

  async updateFieldAgentPasswordHash(
    managerId: string,
    agentId: string,
    passwordHash: string,
  ): Promise<boolean> {
    const result = await this.pool.query(
      `UPDATE users SET password_hash = $1
       WHERE id = $2 AND manager_id = $3 AND role = 'field_agent'`,
      [passwordHash, agentId, managerId],
    );
    return result.rowCount === 1;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  private toRecord(row: UserRow): UserRecord {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      company: row.company,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      managerId: row.manager_id,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : row.created_at,
    };
  }
}
