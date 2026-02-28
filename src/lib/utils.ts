import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  if (!inputs) return "";
  return twMerge(clsx(inputs));
}
