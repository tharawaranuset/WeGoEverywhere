// src/core/event/event.repository.ts
import type { DbType } from '@backend/src/database/connection';
import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, and , gt, or } from 'drizzle-orm';
import { CreateEventDto, UpdateEventDto } from './event.dto';
import { schema } from '@backend/src/database/schema';


@Injectable()
export class EventRepository {
  constructor(@Inject('DatabaseConnection') private readonly db: DbType) {}
  async unjoinEvent(eventId: number, userId: number) {
    // Remove the join record if it exists
    const deleted = await this.db
      .delete(schema.joined)
      .where(
        and(
          eq(schema.joined.eventId, eventId),
          eq(schema.joined.userId, userId)
        )
      );
    return { message: 'Unjoined successfully' };
  }
  async joinEvent(eventId: number, userId: number) {
    // Check if already joined
    const existing = await this.db
      .select()
      .from(schema.joined)
      .where(
        and(
          eq(schema.joined.eventId, eventId),
          eq(schema.joined.userId, userId)
        )
      );
    if (existing.length > 0) {
      return { message: 'Already joined' };
    }
    // Insert join record
    await this.db.insert(schema.joined).values({ eventId, userId });
    return { message: 'Joined successfully' };
  }

  async findById(id: number) {
    // Get the event
    const rows = await this.db
      .select()
      .from(schema.event)
      .where(eq(schema.event.eventId, id))
      .limit(1);

    const found = rows[0];
    if (!found) {
      throw new NotFoundException(`Event ${id} not found`);
    }

    // Count participants for this event from joined table
    const joinedRows = await this.db
      .select({ eventId: schema.joined.eventId })
      .from(schema.joined)
      .where(eq(schema.joined.eventId, id));
    const currentParticipants = joinedRows.length;

    return {
      ...found,
      currentParticipants,
    };
  }

  async findAll() {
    // Get all events
    const events = await this.db
      .select()
      .from(schema.event);

    // For each event, count participants from joined table
    const eventIds = events.map(e => e.eventId);
    let joinedCounts: Record<number, number> = {};
    if (eventIds.length > 0) {
      const { inArray } = require('drizzle-orm');
      const joinedRows = await this.db
        .select({ eventId: schema.joined.eventId })
        .from(schema.joined)
        .where(inArray(schema.joined.eventId, eventIds));
      // Count participants for each event
      joinedCounts = joinedRows.reduce((acc, row) => {
        acc[row.eventId] = (acc[row.eventId] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
    }

    // Attach currentParticipants to each event
    return events.map(event => ({
      ...event,
      currentParticipants: joinedCounts[event.eventId] || 0,
    }));
  }

  async create(dto: CreateEventDto) {
    const [created] = await this.db
      .insert(schema.event)
      .values(dto)
      .returning();
    if (!created)
      throw new NotFoundException('The event is not created successfully.');
    return created;
  }

  async update(id: number, dto: UpdateEventDto) {
    const [updated] = await this.db
      .update(schema.event)
      .set(dto)
      .where(eq(schema.event.eventId, id))
      .returning();
    if (!updated) throw new NotFoundException(`Event with ID ${id} not found.`);
    return updated;
  }

  async bulkUpdateStatusByUserId(
    userId: number,
    newStatus: string,
    afterDate: Date,
    allowedStatuses: string[]
  ) {
    const dateString = afterDate.toISOString().slice(0, 10);
    const result = await this.db
      .update(schema.event)
      .set({ status: newStatus })
      .where(
        and(
          eq(schema.event.userId, userId),
          gt(schema.event.date, dateString),
          or(...allowedStatuses.map(status => eq(schema.event.status, status)))
        )
      )
      .returning();

    return result;
  }
  async findUserJoinedEvents(userId: number) {
    // First get the event IDs that the user joined
    const userJoinedEventIds = await this.db
      .select({ eventId: schema.joined.eventId })
      .from(schema.joined)
      .where(eq(schema.joined.userId, userId));

    if (userJoinedEventIds.length === 0) {
      return [];
    }

    const eventIds = userJoinedEventIds.map(j => j.eventId);

    // Then get full event details for those events
    const { inArray } = require('drizzle-orm');
    const joinedEvents = await this.db
      .select()
      .from(schema.event)
      .where(inArray(schema.event.eventId, eventIds));

    // Count participants for each joined event
    let joinedCounts: Record<number, number> = {};
    if (eventIds.length > 0) {
      const joinedRows = await this.db
        .select({ eventId: schema.joined.eventId })
        .from(schema.joined)
        .where(inArray(schema.joined.eventId, eventIds));
      joinedCounts = joinedRows.reduce((acc, row) => {
        acc[row.eventId] = (acc[row.eventId] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
    }

    // Attach currentParticipants to each joined event
    return joinedEvents.map(event => ({
      ...event,
      currentParticipants: joinedCounts[event.eventId] || 0,
    }));
  }
  async getParticipation(eventid : number):Promise<number[]>{
    const joinedRows = await this.db
      .select()
      .from(schema.joined)
      .where(eq(schema.joined.eventId, eventid));
    return joinedRows.map((row) => row.userId);
  }
}
