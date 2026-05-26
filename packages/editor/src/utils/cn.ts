import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes while resolving conflicts.
 * Uses clsx for conditional class composition and tailwind-merge to avoid duplicates.
 *
 * @example
 * cn("px-2", "px-4") // returns "px-4"
 * cn("flex", { "justify-center": true }) // returns "flex justify-center"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
