// src/components/form/FormSelect.tsx
"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Option = { label: string; value: string; disabled?: boolean };

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  containerClassName?: string;
  options: Option[];
};

const FormSelect = React.forwardRef<HTMLSelectElement, Props>(
  ({ id, name, label, className = "", containerClassName = "", options, defaultValue, ...props }, ref) => {
    const reactId = React.useId();
    const selectId = id ?? (name ? String(name) : `select-${reactId}`);

    return (
      <div className={cn(containerClassName)}>
        {label && (
          <Label htmlFor={selectId} className="text-sm font-semibold block mb-1">
            {label}
          </Label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            name={name}
            defaultValue={defaultValue}
            className={cn(
              "w-full rounded-3xl border border-black",
              "py-0 px-4.5 text-[15px] bg-white",
              "h-[36px]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange",
              "appearance-none [-moz-appearance:none] [-webkit-appearance:none]",
              className
            )}
            {...props}
          >
            {options.map(o => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
          </select>

          {/* ไอคอนลูกศรของเรา */}
          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-700"
          />
        </div>
      </div>
    );
  }
);
FormSelect.displayName = "FormSelect";

export default FormSelect;
