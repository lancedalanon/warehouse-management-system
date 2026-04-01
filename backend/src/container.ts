import { container } from 'tsyringe';
import { AppDataSource } from './data-source';
import { User } from '@/entities/User';
import { RefreshToken } from '@/entities/RefreshToken';
import { InvitationRequest } from '@/entities/InvitationRequest';
import { PasswordRequest } from '@/entities/PasswordRequest';
import { InventoryMovement } from '@/entities/InventoryMovement';
import { Order } from '@/entities/Order';
import { OrderItem } from '@/entities/OrderItem';
import { AuditLog } from '@/entities/AuditLog';
import { Product } from '@/entities/Product';
import { Location } from '@/entities/Location';
import { Role } from '@/entities/Role';
import { Inventory } from '@/entities/Inventory';

container.register('UserRepository', {
  useFactory: () => AppDataSource.getRepository(User),
});

container.register('RefreshTokenRepository', {
  useFactory: () => AppDataSource.getRepository(RefreshToken),
});

container.register('InvitationRequestRepository', {
  useFactory: () => AppDataSource.getRepository(InvitationRequest),
});

container.register('PasswordRequestRepository', {
  useFactory: () => AppDataSource.getRepository(PasswordRequest),
});

container.register('InventoryRepository', {
  useFactory: () => AppDataSource.getRepository(Inventory),
});

container.register('InventoryMovementRepository', {
  useFactory: () => AppDataSource.getRepository(InventoryMovement),
});

container.register('OrderRepository', {
  useFactory: () => AppDataSource.getRepository(Order),
});

container.register('OrderItemRepository', {
  useFactory: () => AppDataSource.getRepository(OrderItem),
});

container.register('AuditLogRepository', {
  useFactory: () => AppDataSource.getRepository(AuditLog),
});

container.register('ProductRepository', {
  useFactory: () => AppDataSource.getRepository(Product),
});

container.register('LocationRepository', {
  useFactory: () => AppDataSource.getRepository(Location),
});

container.register('RoleRepository', {
  useFactory: () => AppDataSource.getRepository(Role),
});
