// backend/src/events/events.module.ts
import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { DatabaseModule } from '../../database/database.module';
import { EventRepository } from './event.repository';
import { forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '@backend/src/modules/notification/notification.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => UsersModule), NotificationModule],
  controllers: [EventController],
  providers: [EventService, EventRepository],
  exports: [EventService],
})
export class EventsModule {}