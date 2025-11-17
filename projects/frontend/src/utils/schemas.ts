import { z } from "zod";

const toNumberOr = (fallback: number) => (v: unknown) => {
  if (v === "" || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const CATEGORY_OPTIONS = [
  "Entertainment",
  "Education",
  "Health",
  "Lifestyle",
  "Technology",
  "Environment",
] as const;
export type CategoryOption = (typeof CATEGORY_OPTIONS)[number];

// Base schema ที่ใช้ร่วมกัน (ไม่มี file field)
const eventBaseSchema = z.object({
  name: z.string().min(1, "Event name is required").max(100),
  date: z.string().trim().min(1, "Date is required"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24h time HH:mm"),
  place: z.string().trim().min(1, "Location is required"),
  detail: z.string().min(1, "Detail is required"),
  capacity: z.preprocess(
    (v) => (v === "" || v == null ? 0 : Number(v)),
    z.number().int().min(1, "Capacity cannot be 0")
  ),
  cost: z
    .preprocess(toNumberOr(0), z.number().min(0, "Cost must be at least 0"))
    .transform((n) => Number(n.toFixed(2))),
  status: z.string().default("active"),
  rating: z.preprocess(toNumberOr(0), z.number().min(0)).default(0),
  categories: z.preprocess((v) => {
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
  }, z.array(z.enum(CATEGORY_OPTIONS)).min(1, "Pick at least 1 category")),
  userId: z.number().optional(),
});

// File validation แยกออกมา
const requiredFileSchema = z
  .any()
  .refine((v) => v instanceof File && v.size > 0, "Event photo is required")
  .refine((v) => {
    if (!(v instanceof File)) return false;
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    return validTypes.includes(v.type);
  }, "Only JPEG, PNG, or WebP images are allowed")
  .refine((v) => {
    if (!(v instanceof File)) return false;
    return v.size <= 10 * 1024 * 1024;
  }, "Image must be smaller than 10MB");

const optionalFileSchema = z
  .any()
  .optional()
  .refine((v) => {
    // ถ้าไม่มีไฟล์ = ใช้รูปเดิม → ผ่าน
    if (!v || !(v instanceof File) || v.size === 0) return true;
    // ถ้ามีไฟล์ = ต้องเช็ค type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    return validTypes.includes(v.type);
  }, "Only JPEG, PNG, or WebP images are allowed")
  .refine((v) => {
    if (!v || !(v instanceof File) || v.size === 0) return true;
    return v.size <= 10 * 1024 * 1024;
  }, "Image must be smaller than 10MB");

// Date/time refinements แยกออกมา
const addDateTimeRefinements = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .refine(
      (data: any) => {
        const today = new Date();
        const eventDate = new Date(`${data.date}T00:00`);
        if (eventDate < new Date(today.toDateString())) {
          return false;
        }
        return true;
      },
      {
        message: "Date cannot be in the past",
        path: ["date"],
      }
    )
    .refine(
      (data: any) => {
        const now = new Date();
        const today = now.toISOString().split("T")[0];
        if (data.date === today) {
          const [hh, mm] = data.time.split(":").map(Number);
          const eventTime = hh * 60 + mm;
          const currentTime = now.getHours() * 60 + now.getMinutes();
          return eventTime > currentTime;
        }
        return true;
      },
      {
        message: "Time must be later than now",
        path: ["time"],
      }
    );

// Schema สำหรับ CREATE (รูปบังคับ)
export const eventCreateSchema = addDateTimeRefinements(
  eventBaseSchema.extend({
    file: requiredFileSchema,
  })
);

// Schema สำหรับ EDIT (รูป optional)
export const eventUpdateSchema = addDateTimeRefinements(
  eventBaseSchema.extend({
    file: optionalFileSchema,
  })
);

// Export schema เดิมเพื่อ backward compatibility (ใช้ create schema)
export const eventFormSchema = eventCreateSchema;

export { CATEGORY_OPTIONS };
