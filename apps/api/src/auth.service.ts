import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { UserRecord, UserRole, UsersRepository } from './users.repository';

const scryptAsync = promisify(scrypt);

export interface RegisterInput {
  firstName?: unknown;
  lastName?: unknown;
  company?: unknown;
  email?: unknown;
  password?: unknown;
}

export interface LoginInput {
  email?: unknown;
  password?: unknown;
}

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  role: UserRole;
  managerId: string | null;
  createdAt: string;
}

export interface CreateFieldAgentInput {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  password?: unknown;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const firstName = this.requiredText(input.firstName, 'Ad', 2, 60);
    const lastName = this.requiredText(input.lastName, 'Soyad', 2, 60);
    const company = this.requiredText(input.company, 'Şirket adı', 2, 120);
    const email = this.validEmail(input.email);
    const password = this.validPassword(input.password);

    if (await this.usersRepository.findByEmail(email)) {
      throw new ConflictException('Bu e-posta adresi zaten kayıtlı.');
    }

    const user: UserRecord = {
      id: randomUUID(),
      firstName,
      lastName,
      company,
      email,
      passwordHash: await this.hashPassword(password),
      role: 'regional_manager',
      managerId: null,
      createdAt: new Date().toISOString(),
    };

    try {
      const createdUser = await this.usersRepository.create(user);
      return this.createAuthResult(createdUser);
    } catch (error) {
      const databaseError = error as Error & { code?: string };
      if (databaseError.code === '23505') {
        throw new ConflictException('Bu e-posta adresi zaten kayıtlı.');
      }
      throw error;
    }
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const email = this.validEmail(input.email);
    const password = this.validPassword(input.password);
    const user = await this.usersRepository.findByEmail(email);

    if (!user || !(await this.verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('E-posta veya parola hatalı.');
    }

    return this.createAuthResult(user);
  }

  async createFieldAgent(managerId: string, input: CreateFieldAgentInput) {
    const manager = await this.usersRepository.findById(managerId);
    if (!manager || manager.role !== 'regional_manager') {
      throw new UnauthorizedException('Bölge müdürü hesabı bulunamadı.');
    }

    const firstName = this.requiredText(input.firstName, 'Ad', 2, 60);
    const lastName = this.requiredText(input.lastName, 'Soyad', 2, 60);
    const email = this.validEmail(input.email);
    const password = this.validPassword(input.password);
    if (await this.usersRepository.findByEmail(email)) {
      throw new ConflictException('Bu e-posta adresi zaten kayıtlı.');
    }

    const user: UserRecord = {
      id: randomUUID(),
      firstName,
      lastName,
      company: manager.company,
      email,
      passwordHash: await this.hashPassword(password),
      role: 'field_agent',
      managerId,
      createdAt: new Date().toISOString(),
    };
    try {
      return {
        user: this.toPublicUser(await this.usersRepository.create(user)),
      };
    } catch (error) {
      const databaseError = error as Error & { code?: string };
      if (databaseError.code === '23505') {
        throw new ConflictException('Bu e-posta adresi zaten kayıtlı.');
      }
      throw error;
    }
  }

  async listFieldAgents(managerId: string) {
    const users =
      await this.usersRepository.findFieldAgentsByManager(managerId);
    return { users: users.map((user) => this.toPublicUser(user)) };
  }

  private requiredText(
    value: unknown,
    label: string,
    min: number,
    max: number,
  ) {
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

  private validEmail(value: unknown) {
    const email = this.requiredText(value, 'E-posta', 5, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Geçerli bir e-posta adresi girin.');
    }
    return email;
  }

  private validPassword(value: unknown) {
    if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
      throw new BadRequestException('Parola 8-128 karakter olmalıdır.');
    }
    return value;
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16);
    const hash = (await scryptAsync(password, salt, 64)) as Buffer;
    return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
  }

  private async verifyPassword(password: string, storedHash: string) {
    const [algorithm, saltValue, hashValue] = storedHash.split('$');
    if (algorithm !== 'scrypt' || !saltValue || !hashValue) {
      return false;
    }
    const expectedHash = Buffer.from(hashValue, 'base64');
    const actualHash = (await scryptAsync(
      password,
      Buffer.from(saltValue, 'base64'),
      expectedHash.length,
    )) as Buffer;
    return timingSafeEqual(expectedHash, actualHash);
  }

  private toPublicUser(user: UserRecord): PublicUser {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      email: user.email,
      role: user.role,
      managerId: user.managerId,
      createdAt: user.createdAt,
    };
  }

  private async createAuthResult(user: UserRecord): Promise<AuthResult> {
    return {
      user: this.toPublicUser(user),
      token: await this.jwtService.signAsync({ sub: user.id, role: user.role }),
    };
  }
}
