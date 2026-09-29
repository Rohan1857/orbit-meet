import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMeetingCode(code: string): string {
  const digits = code.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return code;
}

export function normalizeMeetingCode(input: string): string {
  // If URL passed: http://localhost:3000/join?meeting=8231946621
  if (input.includes("meeting=")) {
    const match = input.match(/meeting=([0-9\s]+)/);
    if (match) {
      return match[1].replace(/\D/g, "");
    }
  }
  // If path passed: /meeting/8231946621
  if (input.includes("/meeting/")) {
    const match = input.match(/\/meeting\/([0-9\s]+)/);
    if (match) {
      return match[1].replace(/\D/g, "");
    }
  }
  return input.replace(/\D/g, "");
}

export function formatScheduleDisplay(isoString?: string | null): string {
  if (!isoString) return "No date";
  try {
    const date = parseISO(isoString);
    const timeStr = format(date, "h:mm a");
    if (isToday(date)) {
      return `Today at ${timeStr}`;
    }
    if (isTomorrow(date)) {
      return `Tomorrow at ${timeStr}`;
    }
    return format(date, "EEE, MMM d • h:mm a");
  } catch {
    return isoString;
  }
}
