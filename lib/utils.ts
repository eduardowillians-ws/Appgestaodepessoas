import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeData<T>(data: T): T {
  const seen = new WeakSet();

  function sanitize(value: any): any {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (seen.has(value)) {
      console.warn("Circular reference detected and removed:", value);
      return undefined;
    }

    // Explicitly check for DOM nodes and Event objects
    if (
      (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) ||
      (typeof Event !== 'undefined' && value instanceof Event)
    ) {
      return undefined;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    seen.add(value);

    if (Array.isArray(value)) {
      return value.map(item => sanitize(item)).filter(v => v !== undefined);
    }

    const sanitized: any = {};
    for (const key of Object.keys(value)) {
      const val = value[key];
      if (
        typeof val !== 'function' && 
        val !== undefined &&
        !(typeof HTMLElement !== 'undefined' && val instanceof HTMLElement) &&
        !(typeof Event !== 'undefined' && val instanceof Event)
      ) {
        sanitized[key] = sanitize(val);
      }
    }
    return sanitized;
  }

  return sanitize(data);
}
