"use client";
import * as React from "react";
import { Image as ImageIcon } from "lucide-react";

export type EventPhotoPickerProps = {
  /** base name: จะได้ photoExisting, photoFile */
  name?: string;
  value?: string | null; // URL เดิม
  onChange?: (file: File | null, previewUrl: string | null) => void;
  size?: number; // สูง
  width?: number; // กว้าง
  rounded?: "full" | "3xl" | "2xl" | "xl" | "lg" | "md" | "sm" | "none";
  accept?: string;
  /** ข้อความลิงก์ใต้รูป */
  linkText?: string;
  /** คลาสพื้นหลังกรอบรูป (ตอนยังไม่มีรูป) */
  bgClassName?: string;
  className?: string;
  disabled?: boolean;
};

const roundedToClass = (r: EventPhotoPickerProps["rounded"]) =>
  r === "full"
    ? "rounded-full"
    : r === "3xl"
    ? "rounded-3xl"
    : r === "2xl"
    ? "rounded-2xl"
    : r === "xl"
    ? "rounded-xl"
    : r === "lg"
    ? "rounded-lg"
    : r === "md"
    ? "rounded-md"
    : r === "sm"
    ? "rounded-sm"
    : "rounded-none";

export default function EventPhotoPicker({
  name = "photo",
  value = null,
  onChange,
  size = 160,
  width = 280,
  rounded = "2xl",
  accept = "image/*",
  linkText = "",
  bgClassName = "bg-[var(--color-brand-background)]",
  className = "",
  disabled = false,
}: EventPhotoPickerProps) {
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [localUrl, setLocalUrl] = React.useState<string | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  // ใช้บังคับ remount <input type="file">
  const [inputKey, setInputKey] = React.useState(0);

  const displayUrl = localUrl || value || null;
  const roundedClass = roundedToClass(rounded);

  const openFile = () => !disabled && fileRef.current?.click();

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] ?? null;

    // 1) ไม่ได้เลือกไฟล์ หรือกด cancel
    if (!file) {
      setLocalUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setFileError(null);
      onChange?.(null, null);

      // รีเซ็ต input โดยการ remount
      setInputKey((k) => k + 1);
      return;
    }

    // 2) เช็คขนาด (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setFileError("Image size must be less than 10MB.");

      setLocalUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      onChange?.(null, null);

      // remount input ใหม่ เมื่อไฟล์ไม่ผ่าน
      setInputKey((k) => k + 1);
      return;
    }

    // 3) ผ่านเงื่อนไข → ใช้รูปนี้
    setFileError(null);

    const url = URL.createObjectURL(file);
    setLocalUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    onChange?.(file, url);

    // ⭐ เพิ่มบรรทัดนี้: reset input หลังเลือกไฟล์สำเร็จ
    setInputKey((k) => k + 1);
  };

  React.useEffect(() => {
    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [localUrl]);

  // form field names
  const nameExisting = `${name}Existing`; // URL เดิม
  const nameFile = `${name}File`; // ไฟล์ใหม่

  return (
    <div className={`w-fit mx-auto ${className}`}>
      {/* กรอบรูป */}
      <div
        className={[
          "relative overflow-hidden border border-black/30 shadow-sm",
          roundedClass,
          bgClassName,
        ].join(" ")}
        style={{ width, height: size }}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Event photo preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <button
            type="button"
            onClick={openFile}
            disabled={disabled}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-black/70"
            aria-label="Upload event photo"
          >
            <ImageIcon className="w-5 h-5" />
            <span>Upload image</span>
          </button>
        )}
      </div>

      {/* ลิงก์ใต้รูป */}
      <div className="mt-2 text-center">
        <button
          type="button"
          onClick={openFile}
          disabled={disabled}
          className="text-[13px] text-neutral-400 underline hover:text-neutral-800 disabled:opacity-50"
        >
          {linkText}
        </button>
        {fileError && (
          <div className="mt-2 text-red-500 text-xs font-medium">
            {fileError}
          </div>
        )}
      </div>

      {/* ฟิลด์ที่ส่งไปกับฟอร์ม */}
      <input type="hidden" name={nameExisting} value={value ?? ""} />

      <input
        key={inputKey} // ⭐ บังคับ remount เวลาเราบอกให้ reset
        ref={fileRef}
        name={nameFile}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={onFileChange}
        disabled={disabled}
      />
    </div>
  );
}
