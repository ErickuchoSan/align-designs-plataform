import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PermissionUtils } from './permission.utils';

describe('PermissionUtils', () => {
  describe('verifyProjectAccess', () => {
    it('should allow admin to access any project', () => {
      expect(() => {
        PermissionUtils.verifyProjectAccess(
          Role.ADMIN,
          'admin-user-id',
          'different-client-id',
        );
      }).not.toThrow();
    });

    it('should allow client to access their own project', () => {
      const clientId = 'client-123';
      expect(() => {
        PermissionUtils.verifyProjectAccess(
          Role.CLIENT,
          clientId,
          clientId,
        );
      }).not.toThrow();
    });

    it('should deny client access to another clients project', () => {
      expect(() => {
        PermissionUtils.verifyProjectAccess(
          Role.CLIENT,
          'client-123',
          'client-456',
        );
      }).toThrow(ForbiddenException);
    });

    it('should throw custom error message when provided', () => {
      const customMessage = 'Custom access denied message';
      expect(() => {
        PermissionUtils.verifyProjectAccess(
          Role.CLIENT,
          'client-123',
          'client-456',
          customMessage,
        );
      }).toThrow(customMessage);
    });
  });

  describe('verifyAdminRole', () => {
    it('should allow admin role', () => {
      expect(() => {
        PermissionUtils.verifyAdminRole(Role.ADMIN);
      }).not.toThrow();
    });

    it('should deny client role', () => {
      expect(() => {
        PermissionUtils.verifyAdminRole(Role.CLIENT);
      }).toThrow(ForbiddenException);
    });

    it('should throw custom error message when provided', () => {
      const customMessage = 'Admin access required';
      expect(() => {
        PermissionUtils.verifyAdminRole(Role.CLIENT, customMessage);
      }).toThrow(customMessage);
    });
  });

  describe('verifyUserAccess', () => {
    it('should allow admin to access any user', () => {
      expect(() => {
        PermissionUtils.verifyUserAccess(
          Role.ADMIN,
          'admin-id',
          'any-user-id',
        );
      }).not.toThrow();
    });

    it('should allow client to access their own data', () => {
      const userId = 'user-123';
      expect(() => {
        PermissionUtils.verifyUserAccess(
          Role.CLIENT,
          userId,
          userId,
        );
      }).not.toThrow();
    });

    it('should deny client access to another user', () => {
      expect(() => {
        PermissionUtils.verifyUserAccess(
          Role.CLIENT,
          'user-123',
          'user-456',
        );
      }).toThrow(ForbiddenException);
    });

    it('should throw custom error message when provided', () => {
      const customMessage = 'Cannot access other users';
      expect(() => {
        PermissionUtils.verifyUserAccess(
          Role.CLIENT,
          'user-123',
          'user-456',
          customMessage,
        );
      }).toThrow(customMessage);
    });
  });
});
