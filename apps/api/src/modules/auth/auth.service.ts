import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { CacheService } from '../../common/cache.service';
import { requireText } from '../../common/validation';
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

export interface ChangePasswordInput {
  currentPassword?: unknown;
  newPassword?: unknown;
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

export interface ResetFieldAgentPasswordInput {
  password?: unknown;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

@Injectable()
export class AuthService {
  private static readonly TEAM_CACHE_TTL_SECONDS = 30;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly cacheService: CacheService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const firstName = requireText(input.firstName, 'Ad', 2, 60);
    const lastName = requireText(input.lastName, 'Soyad', 2, 60);
    const company = requireText(input.company, 'Şirket adı', 2, 120);
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

  async changePassword(userId: string, input: ChangePasswordInput) {
    const currentPassword = this.validPassword(input.currentPassword);
    const newPassword = this.validPassword(input.newPassword);
    const user = await this.usersRepository.findById(userId);

    if (
      !user ||
      !(await this.verifyPassword(currentPassword, user.passwordHash))
    ) {
      throw new UnauthorizedException('Mevcut parola hatalı.');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'Yeni parola mevcut paroladan farklı olmalıdır.',
      );
    }

    await this.usersRepository.updatePasswordHash(
      user.id,
      await this.hashPassword(newPassword),
    );
    return { message: 'Parolanız başarıyla değiştirildi.' };
  }

  async createFieldAgent(managerId: string, input: CreateFieldAgentInput) {
    const manager = await this.usersRepository.findById(managerId);
    if (!manager || manager.role !== 'regional_manager') {
      throw new UnauthorizedException('Bölge müdürü hesabı bulunamadı.');
    }

    const firstName = requireText(input.firstName, 'Ad', 2, 60);
    const lastName = requireText(input.lastName, 'Soyad', 2, 60);
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
      const created = this.toPublicUser(
        await this.usersRepository.create(user),
      );
      await this.cacheService.invalidate(this.teamCacheKey(managerId));
      return { user: created };
    } catch (error) {
      const databaseError = error as Error & { code?: string };
      if (databaseError.code === '23505') {
        throw new ConflictException('Bu e-posta adresi zaten kayıtlı.');
      }
      throw error;
    }
  }

  async listFieldAgents(managerId: string) {
    const cacheKey = this.teamCacheKey(managerId);
    const cached = await this.cacheService.get<PublicUser[]>(cacheKey);
    if (cached) {
      return { users: cached };
    }

    const agents =
      await this.usersRepository.findFieldAgentsByManager(managerId);
    const users = agents.map((user) => this.toPublicUser(user));
    await this.cacheService.set(
      cacheKey,
      users,
      AuthService.TEAM_CACHE_TTL_SECONDS,
    );
    return { users };
  }

  private teamCacheKey(managerId: string) {
    return `team:${managerId}`;
  }

  async resetFieldAgentPassword(
    managerId: string,
    agentId: string,
    input: ResetFieldAgentPasswordInput,
  ) {
    const password = this.validPassword(input.password);
    const updated = await this.usersRepository.updateFieldAgentPasswordHash(
      managerId,
      agentId,
      await this.hashPassword(password),
    );
    if (!updated) {
      throw new NotFoundException('Saha çalışanı hesabı bulunamadı.');
    }
    return { message: 'Çalışanın parolası başarıyla güncellendi.' };
  }

  private validEmail(value: unknown) {
    const email = requireText(value, 'E-posta', 5, 254).toLowerCase();
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
