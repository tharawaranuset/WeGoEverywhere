"use server";

import { eventCreateSchema, eventUpdateSchema } from "@/utils/schemas";
import {
  EventService,
  UserService,
  type CreateEventDto,
  type UpdateEventDto,
} from "@/lib/api";
import {
  formToDbShape,
  mapErrorsToFormKeys,
  compactZodErrors,
  toCreateDto,
  toUpdateDtoFromForm,
} from "./helpers.action";
import { setOpenApiCookieHeader } from "@/lib/auth/CookieHeader";

export type EventActionState = {
  ok: boolean;
  errors?: Record<string, string[]>;
  message?: string;
  next?: string;
};

export async function fetchMe() {
  try {
    await setOpenApiCookieHeader();
    const me = await UserService.userControllerGetUser();
    return { ok: true, data: me };
  } catch (err: any) {
    console.error("Error fetching user info:", err);
    return { ok: false, message: err?.message || "Failed to fetch user info" };
  }
}

export const createEventWithZod = async (
  formData: FormData
): Promise<EventActionState> => {
  try {
    await setOpenApiCookieHeader();

    const candidate = formToDbShape(formData);
    const parsed = eventCreateSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors = mapErrorsToFormKeys(
        parsed.error.flatten().fieldErrors
      );
      return {
        ok: false,
        errors: fieldErrors,
        message: compactZodErrors(fieldErrors),
      };
    }

    const meRes = await fetchMe();

    const raw = meRes.data as any;
    const userId: number | undefined = Number(
      raw?.userId ?? raw?.id ?? raw?.user?.id
    );
    if (!userId || Number.isNaN(userId)) {
      return { ok: false, message: "Cannot determine user id" };
    }

    const dto: any = toCreateDto(parsed.data, userId);

    const v = formData.get("eventPhoto");
    let picked: File | null = null;
    if (v instanceof File && v.size > 0) {
      const safeName = v.name && v.name !== "undefined" ? v.name : "upload.bin";
      picked = new File([v], safeName, {
        type: v.type || "application/octet-stream",
      });
    }
    dto.file = picked ?? null;

    console.log("createEventWithZod dto:", dto);

    await EventService.eventControllerCreateWithImage(dto);
    return { ok: true, message: "Event created successfully!" };
  } catch (error: any) {
    console.error("createEventWithZod error:", error);
    return {
      ok: false,
      message:
        error?.body?.message || error?.message || "Failed to create event.",
    };
  }
};

export const updateEventWithZod = async (
  id: string,
  formData: FormData
): Promise<EventActionState> => {
  try {
    await setOpenApiCookieHeader();

    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return { ok: false, message: "Invalid event id" };
    }

    const candidate = formToDbShape(formData);
    const parsed = eventUpdateSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors = mapErrorsToFormKeys(
        parsed.error.flatten().fieldErrors
      );
      return {
        ok: false,
        errors: fieldErrors,
        message: compactZodErrors(fieldErrors),
      };
    }

    const dto: any = toUpdateDtoFromForm(formData);

    const v = formData.get("eventPhoto");
    if (v instanceof File && v.size > 0) {
      const safeName = v.name && v.name !== "undefined" ? v.name : "upload.bin";
      const picked = new File([v], safeName, {
        type: v.type || "application/octet-stream",
      });
      dto.file = picked;
    } else {
      delete dto.file;
    }

    console.log("update dto =", dto);

    await EventService.eventControllerUpdateEventWithImage(numericId, dto);

    const nextVal = formData.get("next");
    const next = typeof nextVal === "string" && nextVal ? nextVal : undefined;

    return { ok: true, message: "Event updated!", next };
  } catch (error: any) {
    return {
      ok: false,
      message:
        error?.body?.message || error?.message || "Failed to update event.",
    };
  }
};

export const deleteEventById = async (
  id: string
): Promise<EventActionState> => {
  try {
    await setOpenApiCookieHeader();

    const numericId = Number(id);
    if (Number.isNaN(numericId))
      return { ok: false, message: "Invalid event id" };
    await EventService.eventControllerSoftDelete(numericId);
    return { ok: true, message: "Event deleted!" };
  } catch (error: any) {
    const status = error?.status ?? error?.statusCode;
    return {
      ok: false,
      message:
        error?.body?.message || error?.message || "Failed to Delete event.",
    };
  }
};

export async function getAllEvents() {
  await setOpenApiCookieHeader();
  return EventService.eventControllerGetAll();
}

export async function getEventById(id: number) {
  await setOpenApiCookieHeader();
  return EventService.eventControllerGetById(id);
}

export async function logUserRegisteredEvent(
  userId: number | string,
  eventId: number | string
) {
  console.log(`UserID:${userId} has registered to eventID:${eventId}`);
}

export async function logUserReportEvent(
  userId: number | string,
  eventId: number | string
) {
  console.log(`UserID:${userId} has reported eventID:${eventId}`);
}
