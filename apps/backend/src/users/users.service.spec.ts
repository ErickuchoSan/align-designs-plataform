import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheManagerService } from '../cache/services/cache-manager.service';
import { EmailService } from '../email/email.service';
import { INJECTION_TOKENS } from '../common/constants/injection-tokens';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CreateClientDto } from './dto/create-client.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: any;
  let prismaService: any; // Using any to allow easier mocking of deep properties
  let cacheManager: any;
  let emailService: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: Role.CLIENT,
    isActive: true,
    deletedAt: null,
    phone: '1234567890',
    passwordHash: null, // No password set
  };

  const mockAdmin = {
    ...mockUser,
    id: 'admin-123',
    role: Role.ADMIN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: INJECTION_TOKENS.USER_REPOSITORY,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            createWithRole: jest.fn(),
            hardDelete: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: CacheManagerService,
          useValue: {
            invalidateUserCaches: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendWelcomeEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(INJECTION_TOKENS.USER_REPOSITORY);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheManager = module.get<CacheManagerService>(CacheManagerService);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createClient', () => {
    const createDto: CreateClientDto = {
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'Client',
      phone: '9876543210',
    };

    it('should create a client successfully', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      prismaService.user.findFirst.mockResolvedValueOnce(null); // No existing phone
      userRepo.create.mockResolvedValue(mockUser);
      prismaService.user.findFirst.mockResolvedValueOnce(mockUser); // Return created user

      const result = await service.createClient(createDto, 'http://origin.com');

      expect(userRepo.findByEmail).toHaveBeenCalledWith(createDto.email);
      expect(userRepo.create).toHaveBeenCalledWith(createDto);
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email exists', async () => {
      userRepo.findByEmail.mockResolvedValue(mockUser);

      await expect(service.createClient(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if phone exists', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      prismaService.user.findFirst.mockResolvedValueOnce(mockUser); // Phone exists

      await expect(service.createClient(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('createUser', () => {
    const createDto: CreateClientDto & { role: 'CLIENT' | 'EMPLOYEE' } = {
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      role: 'EMPLOYEE',
      phone: '9876543210',
    };

    it('should create a user successfully', async () => {
      userRepo.findByEmail.mockResolvedValue(null);
      prismaService.user.findFirst.mockResolvedValueOnce(null); // No existing phone
      userRepo.createWithRole.mockResolvedValue(mockUser);
      prismaService.user.findFirst.mockResolvedValueOnce(mockUser); // Return created user

      const result = await service.createUser(createDto, 'http://origin.com');

      expect(userRepo.createWithRole).toHaveBeenCalledWith(createDto);
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    const paginationDto: PaginationDto = { page: 1, limit: 10 };

    it('should return paginated users', async () => {
      prismaService.user.findMany.mockResolvedValue([mockUser]);
      prismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll(paginationDto);

      // Service adds hasPassword field and removes passwordHash for security
      const { passwordHash, ...userWithoutPassword } = mockUser;
      expect(result.data).toEqual([{ ...userWithoutPassword, hasPassword: false }]);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by role', async () => {
      prismaService.user.findMany.mockResolvedValue([mockUser]);
      prismaService.user.count.mockResolvedValue(1);

      await service.findAll(paginationDto, Role.CLIENT);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: Role.CLIENT }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return user if allowed', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findOne(
        mockUser.id,
        mockUser.id,
        Role.CLIENT,
      );

      // Service adds hasPassword field and removes passwordHash for security
      const { passwordHash, ...userWithoutPassword } = mockUser;
      expect(result).toEqual({ ...userWithoutPassword, hasPassword: false });
    });

    it('should throw ForbiddenException if client tries to view another user', async () => {
      await expect(
        service.findOne('other-id', mockUser.id, Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockUser.id, mockAdmin.id, Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { firstName: 'Updated' };

    it('should update user successfully', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      const result = await service.update(
        mockUser.id,
        updateDto,
        mockUser.id,
        Role.CLIENT,
      );

      expect(prismaService.user.update).toHaveBeenCalled();
      expect(result.firstName).toBe('Updated');
    });

    it('should throw ForbiddenException if client tries to update another user', async () => {
      await expect(
        service.update('other-id', updateDto, mockUser.id, Role.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('toggleStatus', () => {
    it('should toggle user status', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await service.toggleStatus(mockUser.id, false);

      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: { isActive: false },
        }),
      );
      expect(result.message).toContain('deactivated');
    });

    it('should prevent deactivating admin', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockAdmin);

      await expect(service.toggleStatus(mockAdmin.id, false)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete user', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      await service.remove(mockUser.id, 'admin-id');

      expect(userRepo.softDelete).toHaveBeenCalledWith(mockUser.id);
    });

    it('should hard delete user if requested', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      await service.remove(mockUser.id, 'admin-id', true);

      expect(userRepo.hardDelete).toHaveBeenCalledWith(mockUser.id, false);
    });

    it('should prevent deleting admin', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockAdmin);

      await expect(service.remove(mockAdmin.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAvailableEmployees', () => {
    const paginationDto: PaginationDto = { page: 1, limit: 10 };

    it('should return available employees', async () => {
      const employee = { ...mockUser, role: Role.EMPLOYEE };
      prismaService.user.findMany.mockResolvedValue([employee]);
      prismaService.user.count.mockResolvedValue(1);

      const result = await service.findAvailableEmployees(paginationDto);

      expect(result.data).toEqual([employee]);
      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: Role.EMPLOYEE,
            assignedProjects: expect.any(Object),
          }),
        }),
      );
    });
  });
});
