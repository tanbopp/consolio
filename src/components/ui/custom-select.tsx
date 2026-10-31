"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChevronDownIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export interface CustomSelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  options: CustomSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  id?: string;
  name?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Pilih salah satu...",
  disabled = false,
  className,
  triggerClassName,
  id,
  name,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string, optDisabled?: boolean) => {
    if (optDisabled) return;
    onChange?.(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full text-sm", className)}
    >
      {/* Hidden input for form integrations if needed */}
      {name && <input type="hidden" name={name} value={value || ""} />}

      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 shadow-xs",
          isOpen && "border-emerald-600 ring-2 ring-emerald-500/20",
          triggerClassName
        )}
      >
        <span
          className={cn(
            "truncate block",
            !selectedOption && "text-slate-400 font-normal"
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
          className="ml-2 shrink-0 text-slate-400 flex items-center"
        >
          <HugeiconsIcon icon={ChevronDownIcon} size={16} strokeWidth={1.8} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 min-w-full w-max max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-lg max-h-60 overflow-y-auto"
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 text-center">
                Tidak ada pilihan tersedia
              </div>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value, option.disabled)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs sm:text-sm transition-colors",
                      isSelected
                        ? "bg-emerald-50/80 font-medium text-emerald-900"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                      option.disabled &&
                        "cursor-not-allowed opacity-50 hover:bg-transparent"
                    )}
                  >
                    <div className="flex flex-col pr-3 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{option.label}</span>
                        {option.badge && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-normal">
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {option.description && (
                        <span className="text-[11px] text-slate-400 font-normal mt-0.5 truncate">
                          {option.description}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <span className="shrink-0 text-emerald-600 ml-auto">
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          size={16}
                          strokeWidth={2}
                        />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

