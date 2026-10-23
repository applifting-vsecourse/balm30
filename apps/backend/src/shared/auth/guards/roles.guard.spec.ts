import { Roles } from '@/shared/auth/decorators/roles.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

class AdminOnly {
  @Roles('admin')
  handler(): void {}

  open(): void {}
}

const contextFor = (handler: () => void, role: string): ExecutionContext =>
  ({
    getHandler: () => handler,
    getClass: () => AdminOnly,
    switchToHttp: () => ({
      getRequest: () => ({ session: { user: { role } as Identity } }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('lets an admin through to an admin-only handler', () => {
    expect(
      guard.canActivate(contextFor(AdminOnly.prototype.handler, 'admin')),
    ).toBe(true);
  });

  it('forbids a regular user on an admin-only handler', () => {
    expect(() =>
      guard.canActivate(contextFor(AdminOnly.prototype.handler, 'user')),
    ).toThrow(ForbiddenException);
  });

  it('lets anyone through to a handler without roles', () => {
    expect(
      guard.canActivate(contextFor(AdminOnly.prototype.open, 'user')),
    ).toBe(true);
  });
});
