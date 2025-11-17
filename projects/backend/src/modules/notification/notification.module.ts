import { Module } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { AuthModule } from '@backend/src/core/auth/auth.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    forwardRef(() => AuthModule),
  ],
  providers: [
    NotificationRepository,
    NotificationService,
    NotificationGateway,
  ],
  controllers: [],
  exports: [
    NotificationService,NotificationGateway,
  ],
})
export class NotificationModule {}
