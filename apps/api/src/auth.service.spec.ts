import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import type { UserRecord, UsersRepository } from './users.repository';

describe('AuthService', () => {
  let usersRepository: UsersRepository;
  let authService: AuthService;
  let users: Map<string, UserRecord>;

  beforeEach(() => {
    users = new Map<string, UserRecord>();
    usersRepository = {
      findByEmail: (email: string) =>
        Promise.resolve(users.get(email.toLowerCase()) ?? null),
      create: (user: UserRecord) => {
        users.set(user.email.toLowerCase(), user);
        return Promise.resolve(user);
      },
      findById: (id: string) =>
        Promise.resolve(
          [...users.values()].find((user) => user.id === id) ?? null,
        ),
      findFieldAgentsByManager: (managerId: string) =>
        Promise.resolve(
          [...users.values()].filter((user) => user.managerId === managerId),
        ),
      updatePasswordHash: (id: string, passwordHash: string) => {
        const user = [...users.values()].find(
          (candidate) => candidate.id === id,
        );
        if (user) user.passwordHash = passwordHash;
        return Promise.resolve();
      },
      updateFieldAgentPasswordHash: (
        managerId: string,
        agentId: string,
        passwordHash: string,
      ) => {
        const user = [...users.values()].find(
          (candidate) =>
            candidate.id === agentId &&
            candidate.managerId === managerId &&
            candidate.role === 'field_agent',
        );
        if (user) user.passwordHash = passwordHash;
        return Promise.resolve(Boolean(user));
      },
    } as UsersRepository;
    authService = new AuthService(
      usersRepository,
      new JwtService({ secret: 'unit-test-secret' }),
    );
  });

  const registration = {
    firstName: 'Ayşe',
    lastName: 'Demir',
    company: 'Taskfield Demo',
    email: 'ayse@taskfield.com',
    password: 'guvenli123',
  };

  it('persists a regional manager without exposing or storing the plain password', async () => {
    const result = await authService.register(registration);
    const storedUser = await usersRepository.findByEmail(registration.email);

    expect(result.user).toMatchObject({
      firstName: 'Ayşe',
      email: 'ayse@taskfield.com',
      role: 'regional_manager',
    });
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.token).toEqual(expect.any(String));
    expect(storedUser?.passwordHash).toMatch(/^scrypt\$/);
    expect(storedUser?.passwordHash).not.toContain(registration.password);
  });

  it('rejects an email address that is already registered', async () => {
    await authService.register(registration);

    await expect(authService.register(registration)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('only logs the user in with the registered password', async () => {
    await authService.register(registration);

    await expect(
      authService.login({
        email: registration.email,
        password: registration.password,
      }),
    ).resolves.toMatchObject({ user: { email: registration.email } });
    await expect(
      authService.login({ email: registration.email, password: 'yanlis123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates a manager-owned field agent who can log in', async () => {
    const manager = await authService.register(registration);
    const account = {
      firstName: 'Ece',
      lastName: 'Yılmaz',
      email: 'ece@taskfield.com',
      password: 'Saha2026!',
    };

    const created = await authService.createFieldAgent(
      manager.user.id,
      account,
    );
    const team = await authService.listFieldAgents(manager.user.id);
    const login = await authService.login({
      email: account.email,
      password: account.password,
    });

    expect(created.user).toMatchObject({
      email: account.email,
      role: 'field_agent',
      managerId: manager.user.id,
    });
    expect(team.users).toHaveLength(1);
    expect(login).toMatchObject({
      user: { email: account.email, role: 'field_agent' },
    });
    expect(typeof login.token).toBe('string');
  });

  it('lets a user replace their password after verifying the current one', async () => {
    const registered = await authService.register(registration);
    const newPassword = 'YeniGuvenli2026!';

    await expect(
      authService.changePassword(registered.user.id, {
        currentPassword: registration.password,
        newPassword,
      }),
    ).resolves.toEqual({ message: 'Parolanız başarıyla değiştirildi.' });

    await expect(
      authService.login({
        email: registration.email,
        password: registration.password,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      authService.login({ email: registration.email, password: newPassword }),
    ).resolves.toMatchObject({ user: { email: registration.email } });
  });

  it('rejects a password change when the current password is wrong', async () => {
    const registered = await authService.register(registration);

    await expect(
      authService.changePassword(registered.user.id, {
        currentPassword: 'yanlis-parola',
        newPassword: 'YeniGuvenli2026!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lets a manager reset only their own field agent password', async () => {
    const manager = await authService.register(registration);
    const otherManager = await authService.register({
      ...registration,
      email: 'diger@taskfield.com',
    });
    const account = {
      firstName: 'Ece',
      lastName: 'Yılmaz',
      email: 'ece@taskfield.com',
      password: 'Saha2026!',
    };
    const created = await authService.createFieldAgent(
      manager.user.id,
      account,
    );
    const newPassword = 'YeniSaha2026!';

    await expect(
      authService.resetFieldAgentPassword(manager.user.id, created.user.id, {
        password: newPassword,
      }),
    ).resolves.toEqual({
      message: 'Çalışanın parolası başarıyla güncellendi.',
    });
    await expect(
      authService.login({ email: account.email, password: newPassword }),
    ).resolves.toMatchObject({ user: { id: created.user.id } });
    await expect(
      authService.resetFieldAgentPassword(
        otherManager.user.id,
        created.user.id,
        { password: 'BaskaParola2026!' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
