import { SetMetadata } from '@nestjs/common';
import { Role } from '@godream/database';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
export const Public = () => SetMetadata('isPublic', true);
