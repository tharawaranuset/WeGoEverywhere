import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { UpdateEventDto, CreateEventDto } from './event.dto';
import { EventRepository } from './event.repository';
import { join } from 'path';
import { promises as fs } from 'fs';
import { UserService } from '../users/users.service';
import { NotificationGateway } from '@backend/src/modules/notification/notification.gateway'

function sanitizeFilename(name: string) {
  return name.replace(/[^\\w.\\-]+/g, '_');
}

@Injectable()
export class EventService {
  constructor(
    private readonly eventRepo: EventRepository,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async unjoinEvent(eventId: number, userId: number) {
    return this.eventRepo.unjoinEvent(eventId, userId);
  }

  async joinEvent(eventId: number, userId: number) {
    const event = await this.eventRepo.findById(eventId);
    const user = await this.userService.findById(userId);
    const eventOwnerId = event.userId;
    try{
      const joined = await this.eventRepo.joinEvent(eventId, userId);
      await this.notificationGateway.broadcastNotification(
          [eventOwnerId!]
        ,{
          title : "User have join your event",
          fromService: 'event',
          message : `${user?.firstName} ${user?.lastName} joined your event "${event.name}".`,

        });
      return joined;
    }catch(error){
      throw error;
    }
  }

  private assertCategories(categories: unknown) {
    if (!Array.isArray(categories) || categories.length < 1) {
      throw new BadRequestException('categories must have at least 1 item');
    }
    for (const c of categories) {
      if (typeof c !== 'string') {
        throw new BadRequestException('categories must be string[]');
      }
    }
  }

  async createEventWithImage(dto: CreateEventDto, file?: Express.Multer.File) {
    this.assertCategories(dto.categories);

    if (!file?.buffer || !file.originalname) {
      throw new BadRequestException('file (image) is required');
    }
    if (/^\\d{2}:\\d{2}$/.test(dto.time)) dto.time = `${dto.time}:00`;

    const uploadRoot = join(process.cwd(), 'uploads', 'events');
    const filename = `${Date.now()}-${sanitizeFilename(file.originalname)}`;
    const fsPath = join(uploadRoot, filename);
    const publicPath = `/uploads/events/${filename}`;

    await fs.mkdir(uploadRoot, { recursive: true });

    try {
      await fs.writeFile(fsPath, file.buffer);
    } catch {
      throw new BadRequestException('Failed to save image file');
    }

    try {
      const created = await this.eventRepo.create({
        ...dto,
        imagePath: publicPath,
      });
      // Auto-join the creator as a participant
      if (created && created.eventId && dto.userId) {
        await this.eventRepo.joinEvent(created.eventId, dto.userId);
      }
      return created;
    } catch (e) {
      await fs.rm(fsPath, { force: true });
      throw e;
    }
  }

  async updateEventWithImage(
    id: number,
    dto: UpdateEventDto,
    file?: Express.Multer.File,
  ) {
    const existing = await this.eventRepo.findById(id);
    if (!existing) throw new NotFoundException(`Event ${id} not found`);

    if (dto.time && /^\\d{2}:\\d{2}$/.test(dto.time)) {
      dto.time = `${dto.time}:00`;
    }

    let newPublicPath: string | undefined;
    let newFsPath: string | undefined;
    let oldFsPathToDelete: string | undefined;

    if (file) {
      if (!file.buffer?.length || !file.originalname) {
        throw new BadRequestException('Invalid image file');
      }

      const uploadRoot = join(process.cwd(), 'uploads', 'events');
      await fs.mkdir(uploadRoot, { recursive: true });

      const filename = `${Date.now()}-${sanitizeFilename(file.originalname)}`;
      newFsPath = join(uploadRoot, filename);
      newPublicPath = `/uploads/events/${filename}`;

      try {
        await fs.writeFile(newFsPath, file.buffer);
      } catch {
        throw new BadRequestException('Failed to save image file');
      }

      if (existing.imagePath) {
        const rel = existing.imagePath.replace(/^\//, '');
        oldFsPathToDelete = join(process.cwd(), rel);
      }
    }

    try {
      const updated = await this.eventRepo.update(id, {
        ...dto,
        ...(newPublicPath ? { imagePath: newPublicPath } : {}),
      });

      if (oldFsPathToDelete) {
        try {
          await fs.rm(oldFsPathToDelete, { force: true });
        } catch {}
      }

    const eventName = (await this.eventRepo.findById(id)).name;
    const participants = await this.eventRepo.getParticipation(id);
    
    if(dto.status == "deleted"){
      await this.notificationGateway.broadcastNotification(
          participants
        ,{
          title : `${eventName} is cancelled`,
          fromService: 'event',
          message : `${eventName} have cancelled.`,
        });
    }
    else{
      await this.notificationGateway.broadcastNotification(
          participants
        ,{
          title : `${eventName} updated`,
          fromService: 'event',
          message : `${eventName} has new info.`,
        });
    }

      return updated;
    } catch (e) {
      if (newFsPath) {
        try {
          await fs.rm(newFsPath, { force: true });
        } catch {}
      }
      throw e;
    }
  }

  async getAllEvents() {
    return this.eventRepo.findAll();
  }

  async createEvent(createEventDto: CreateEventDto) {
    const created = await this.eventRepo.create(createEventDto);
    // Auto-join the creator as a participant
    if (created && created.eventId && createEventDto.userId) {
      await this.eventRepo.joinEvent(created.eventId, createEventDto.userId);
    }
    return created;
  }

  async updateEvent(id: number, updateEventDto: UpdateEventDto) {
    try{
      const updated = await this.eventRepo.update(id, updateEventDto);
      const eventName = (await this.eventRepo.findById(id)).name;
      const participants = await this.eventRepo.getParticipation(id);
      if(updateEventDto.status == "deleted"){
        await this.notificationGateway.broadcastNotification(
            participants
          ,{
            title : `${eventName} is cancelled`,
            fromService: 'event',
            message : `${eventName} have cancelled.`,

          });
      }
      else{
        await this.notificationGateway.broadcastNotification(
          participants
        ,{
          title : `${eventName} updated`,
          fromService: 'event',
          message : `${eventName} has new info.`,

        });
      }
      return updated;
    }catch(error){
      throw error;
    }
  }

  async getEventById(id: number) {
    return this.eventRepo.findById(id);
  }

  async markUserFutureEventsAsDeleted(userId: number) {
    const now = new Date();
    return this.eventRepo.bulkUpdateStatusByUserId(userId, 'deleted', now, [
      'active',
    ]);
  }

  async getUserJoinedEvents(userId: number) {
    return this.eventRepo.findUserJoinedEvents(userId);
  }

  async getEventOrganizer(eventId: number) {
    const event = await this.eventRepo.findById(eventId);
    if (!event.userId) throw new NotFoundException('Event has no organizer');
    return this.userService.getPublicProfileById(event.userId);
  }
}
