import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  PermissionContext,
  AdminPermissionStrategy,
  ClientPermissionStrategy,
} from './permission.strategy';

describe('Permission Strategy Pattern', () => {
  describe('AdminPermissionStrategy', () => {
    let strategy: AdminPermissionStrategy;

    beforeEach(() => {
      strategy = new AdminPermissionStrategy();
    });

    it('should allow admin to access any project', () => {
      expect(() => {
        strategy.verifyProjectAccess('user-1', 'user-2');
      }).not.toThrow();
    });

    it('should allow admin to access any user', () => {
      expect(() => {
        strategy.verifyUserAccess('user-1', 'user-2');
      }).not.toThrow();
    });

    it('should return true for isAdmin()', () => {
      expect(strategy.isAdmin()).toBe(true);
    });
  });

  describe('ClientPermissionStrategy', () => {
    let strategy: ClientPermissionStrategy;

    beforeEach(() => {
      strategy = new ClientPermissionStrategy();
    });

    describe('verifyProjectAccess', () => {
      it('should allow client to access their own project', () => {
        expect(() => {
          strategy.verifyProjectAccess('user-1', 'user-1');
        }).not.toThrow();
      });

      it('should throw ForbiddenException when client tries to access another project', () => {
        expect(() => {
          strategy.verifyProjectAccess('user-1', 'user-2');
        }).toThrow(ForbiddenException);
      });

      it('should use custom error message when provided', () => {
        expect(() => {
          strategy.verifyProjectAccess('user-1', 'user-2', 'Custom error');
        }).toThrow('Custom error');
      });
    });

    describe('verifyUserAccess', () => {
      it('should allow client to access their own user data', () => {
        expect(() => {
          strategy.verifyUserAccess('user-1', 'user-1');
        }).not.toThrow();
      });

      it('should throw ForbiddenException when client tries to access another user', () => {
        expect(() => {
          strategy.verifyUserAccess('user-1', 'user-2');
        }).toThrow(ForbiddenException);
      });

      it('should use custom error message when provided', () => {
        expect(() => {
          strategy.verifyUserAccess('user-1', 'user-2', 'Custom error');
        }).toThrow('Custom error');
      });
    });

    it('should return false for isAdmin()', () => {
      expect(strategy.isAdmin()).toBe(false);
    });
  });

  describe('PermissionContext', () => {
    describe('with ADMIN role', () => {
      let context: PermissionContext;

      beforeEach(() => {
        context = new PermissionContext(Role.ADMIN);
      });

      it('should allow admin to access any project', () => {
        expect(() => {
          context.verifyProjectAccess('user-1', 'user-2');
        }).not.toThrow();
      });

      it('should allow admin to access any user', () => {
        expect(() => {
          context.verifyUserAccess('user-1', 'user-2');
        }).not.toThrow();
      });

      it('should return true for isAdmin()', () => {
        expect(context.isAdmin()).toBe(true);
      });

      it('should not throw when verifying admin role', () => {
        expect(() => {
          context.verifyAdminRole();
        }).not.toThrow();
      });
    });

    describe('with CLIENT role', () => {
      let context: PermissionContext;

      beforeEach(() => {
        context = new PermissionContext(Role.CLIENT);
      });

      it('should allow client to access their own project', () => {
        expect(() => {
          context.verifyProjectAccess('user-1', 'user-1');
        }).not.toThrow();
      });

      it('should throw ForbiddenException when client tries to access another project', () => {
        expect(() => {
          context.verifyProjectAccess('user-1', 'user-2');
        }).toThrow(ForbiddenException);
      });

      it('should allow client to access their own user data', () => {
        expect(() => {
          context.verifyUserAccess('user-1', 'user-1');
        }).not.toThrow();
      });

      it('should throw ForbiddenException when client tries to access another user', () => {
        expect(() => {
          context.verifyUserAccess('user-1', 'user-2');
        }).toThrow(ForbiddenException);
      });

      it('should return false for isAdmin()', () => {
        expect(context.isAdmin()).toBe(false);
      });

      it('should throw ForbiddenException when verifying admin role', () => {
        expect(() => {
          context.verifyAdminRole();
        }).toThrow(ForbiddenException);
      });

      it('should use custom error message when verifying admin role', () => {
        expect(() => {
          context.verifyAdminRole('Custom admin error');
        }).toThrow('Custom admin error');
      });
    });
  });
});
