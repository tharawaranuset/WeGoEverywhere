import "server-only";

import { OpenAPI } from "@/lib/api/core/OpenAPI";
import type { CreateEventDto, UpdateEventDto } from "@/lib/api";
import { apiFromUiStatus } from "@/utils/statusMapper";

/* ---------- Helpers: error mapping ---------- */
export function compactZodErrors(
  errors: Record<string, string[] | undefined>,
  max = 20
): string {
  const parts: string[] = [];
  for (const [field, arr] of Object.entries(errors)) {
    if (arr && arr.length) parts.push(`${field}: ${arr[0]}`);
    if (parts.length >= max) break;
  }
  return parts.join(" | ") || "Validation failed";
}

export function mapErrorsToFormKeys(
  fieldErrors: Record<string, string[] | undefined>
): Record<string, string[]> {
  const m: Record<string, string[]> = {};
  const set = (k: string, v?: string[]) => {
    if (v?.length) m[k] = v;
  };

  set("eventName", fieldErrors.name);
  set("eventDate", fieldErrors.date);
  set("eventLocation", fieldErrors.place);
  set("eventDetails", fieldErrors.detail);
  set("eventCapacity", fieldErrors.capacity);
  set("eventStatus", fieldErrors.status);
  set("eventTime", fieldErrors.time);
  set("eventCost", fieldErrors.cost);
  set("eventRating", fieldErrors.rating);
  set("eventPhoto", fieldErrors.file);
  set("eventCategories", fieldErrors.categories);
  set("userId", fieldErrors.userId);
  return m;
}

/* ---------- Helpers: form mapping ---------- */
export function formToDbShape(fd: FormData) {
  const s = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : "";
  };

  const categories: string[] = fd
    .getAll("categories")
    .flatMap((v) => (typeof v === "string" ? [v] : []));

  const file = fd.get("eventPhoto");
  console.log("formToDbShape file instanceof File", file instanceof File);
  console.log("dto.file", file);

  return {
    name: s("eventName"),
    date: s("eventDate"),
    time: s("eventTime") || "00:00",
    place: s("eventLocation"),
    capacity: fd.get("eventCapacity"),
    detail: s("eventDetails"),
    cost: fd.get("eventCost"),
    rating: fd.get("eventRating"),
    status: apiFromUiStatus(s("eventStatus")) ?? "active",
    file,
    categories,
  };
}

/* ---------- Helpers: DTO builders ---------- */
export function toCreateDto(parsed: any, userId: number): CreateEventDto {
  const num = (v: any) => (v === "" || v == null ? undefined : Number(v));
  const time = parsed.time?.match(/^\d{2}:\d{2}$/)
    ? `${parsed.time}:00`
    : parsed.time;

  return {
    name: parsed.name,
    date: parsed.date,
    time,
    place: parsed.place || "",
    capacity: num(parsed.capacity),
    detail: parsed.detail,
    cost: num(parsed.cost),
    rating: num(parsed.rating),
    userId,
    status: parsed.status as string | any,
    categories: parsed.categories,
    file: parsed.file,
  };
}
/* ---------- Helpers: DTO Update ---------- */
export function toUpdateDtoFromForm(fd: FormData): UpdateEventDto {
  const num = (v: any) => (v === "" || v == null ? undefined : Number(v));
  const s = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" && v ? v : undefined;
  };

  const categories = fd
    .getAll("categories")
    .flatMap((v) => (typeof v === "string" ? [v] : []));

  const rawFile = fd.get("eventPhotoFile");
  const file =
    typeof File !== "undefined" && rawFile instanceof File && rawFile.size > 0
      ? rawFile
      : undefined;

  const timeRaw = s("eventTime");
  const time =
    timeRaw && /^\d{2}:\d{2}$/.test(timeRaw) ? `${timeRaw}:00` : timeRaw;

  return {
    name: s("eventName"),
    date: s("eventDate"),
    time,
    place: s("eventLocation"),
    detail: s("eventDetails"),
    capacity: num(fd.get("eventCapacity")),
    cost: num(fd.get("eventCost")),
    rating: num(fd.get("eventRating")),
    status: apiFromUiStatus(s("eventStatus")),
    categories: categories.length ? (categories as any) : undefined,
    file,
  };
}
