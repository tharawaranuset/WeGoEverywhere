// /components/form/CreateEventFormClient.tsx
"use client";
import * as React from "react";
import { useActionState, useRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createEventWithZod, type EventActionState } from "@/actions/actions";
import EventPhotoPicker from "@/components/form/EventPhotoPicker";
import { Calendar28 } from "@/components/form/input/DatePicker";
import { TextAreaInput } from "@/components/form/input/TextAreaInout";
import { SubmitButton } from "@/components/form/Buttons";
import { toFields, type EventStateWithFields } from "@/lib/forms";
import { FieldError } from "../form/FieldError";
import { LocationInput } from "../form/input/LocationInput";
import { FormInput } from "../form/input/FormInput";
import { StatusSelect } from "../form/input/StatusSelect";
import { useActionToasts } from "../form/useActionToasts";
import { TimePicker } from "../form/input/TimePicker";
import CategoryMultiSelect from "../form/input/CategoryMultiSelect";

export default function CreateEventFormClient() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const didSubmitRef = useRef(false);
  const lastToastSigRef = useRef<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const createWrapper = async (
    _prev: EventStateWithFields<EventActionState>,
    formData: FormData
  ): Promise<EventStateWithFields<EventActionState>> => {
    didSubmitRef.current = true;
    lastToastSigRef.current = null;

    // แนบไฟล์จาก state (ถ้ามี)
    if (photoFile) {
      formData.set("eventPhoto", photoFile);
    }

    try {
      const res = await createEventWithZod(formData);
      const nextState: EventStateWithFields<EventActionState> = {
        ...(res ?? { ok: false }),
        message: undefined,
        fields: toFields(formData),
      };

      // ✅ ถ้าสำเร็จ → ล้างรูป
      if (nextState.ok) {
        setPhotoFile(null);
      }
      // ❌ ถ้าไม่สำเร็จ → เก็บรูปไว้ (ไม่ทำอะไร)

      return nextState;
    } catch (err) {
      console.error(err);
      // ❌ เคส error จริง → เก็บรูปไว้ (ไม่ทำอะไร)
      return {
        ok: false,
        errors: {},
        fields: toFields(formData),
        message: undefined,
      };
    }
  };

  const [state, formAction] = useActionState<
    EventStateWithFields<EventActionState>,
    FormData
  >(createWrapper, { ok: false, fields: {} });

  const f = state.fields ?? {};
  const toastState = useMemo(() => {
    if (!didSubmitRef.current || !state) return undefined;
    const effective = { ...state, message: undefined };
    const sig = effective.ok ? "S" : "E";
    if (lastToastSigRef.current === sig) return undefined;
    lastToastSigRef.current = sig;
    return effective;
  }, [state]);

  useActionToasts(toastState, {
    successText: "Event created successfully!",
    errorText: "Failed to create event.",
    onSuccess: () => {
      formRef.current?.reset();
      router.push("/event");
    },
  });

  return (
    <form
      ref={formRef}
      action={formAction}
      className="px-4 pb-6 pt-10 text-sm"
      noValidate
    >
      {/* Photo */}
      <div className="mb-4">
        <EventPhotoPicker
          name="eventPhoto"
          size={208}
          rounded="2xl"
          bgClassName="bg-gray-300"
          linkText="Change your photo"
          onChange={(file) => setPhotoFile(file)}
        />
        <FieldError errors={state?.errors?.eventPhoto} />
      </div>

      <FormInput
        name="eventName"
        type="text"
        label="Event name"
        className="!bg-[var(--color-brand-background)] rounded-full border-black/30"
        defaultValue={f.eventName}
      />
      <FieldError errors={state?.errors?.eventName} />

      {/* Event date + Time */}
      <div className="mb-3 grid grid-cols-5 gap-3">
        <div className="col-span-5 sm:col-span-3">
          <Calendar28
            name="eventDate"
            label="Event date"
            placeholder="Month DD,YYYY"
            required
            className="!bg-[var(--color-brand-background)] rounded-full border-black/30 h-10"
            disableTyping
            defaultValue={f.eventDate}
          />
          <FieldError errors={state?.errors?.eventDate} />
        </div>

        <div className="col-span-5 sm:col-span-2">
          <TimePicker
            name="eventTime"
            label="Time"
            defaultValue="08:00"
            className="!bg-[var(--color-brand-background)] rounded-full border-black/30 h-10"
          />
          <FieldError errors={state?.errors?.eventTime} />
        </div>
      </div>
      <LocationInput
        name="eventLocation"
        label="Location"
        defaultValue={f.eventLocation}
      />
      <FieldError errors={state?.errors?.eventLocation} />
      <div className="mt-3">
        <CategoryMultiSelect name="categories" />
      </div>
      <FieldError errors={state?.errors?.eventCategories} />

      <TextAreaInput
        name="eventDetails"
        label="Details"
        className="block w-full h-22 overflow-y-auto rounded-[20px] border border-black/30 !bg-[var(--color-brand-background)] resize-none focus:border-black"
        defaultValue={f.eventDetails}
      />
      <FieldError errors={state?.errors?.eventDetails} />

      {/* Capacity / Status */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div>
          <FormInput
            name="eventCapacity"
            type="number"
            label="Capacity"
            className="!bg-[var(--color-brand-background)] rounded-full border-black/30"
            defaultValue={f.eventCapacity}
          />
          <FieldError errors={state?.errors?.eventCapacity} />
        </div>

        <div>
          <StatusSelect
            name="eventStatus"
            label="Status"
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            defaultValue={(f.eventStatus as string) ?? "unpublish"}
          />
          <FieldError errors={state?.errors?.eventStatus} />
        </div>
      </div>

      <SubmitButton
        text="Save !"
        size="lg"
        className="w-full rounded-full border border-black/40 bg-[var(--color-brand-greenbutton)] px-6 py-3 font-medium shadow-[0_2px_0_#00000020]"
      />
    </form>
  );
}
