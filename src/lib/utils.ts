import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
  }
  return `${seconds.toFixed(2)}s`;
}

export function formatDistance(cm: number): string {
  const meters = cm / 100;
  return `${meters.toFixed(2)}m`;
}

export function formatStopwatch(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor((elapsedMs % 1000) / 10);
  const ss = String(seconds).padStart(2, '0');
  const msStr = String(ms).padStart(2, '0');
  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${hh}:${mm}:${ss}.${msStr}`;
  }
  if (minutes > 0) {
    const mm = String(minutes).padStart(2, '0');
    return `${mm}:${ss}.${msStr}`;
  }
  return `${ss}.${msStr}`;
}

export function formatCount(n: number): string {
  return n.toLocaleString();
}

export function formatValue(value: number, unit: 'ms' | 's' | 'cm' | 'm' | 'count'): string {
  if (unit === 'ms') return formatTime(value);
  if (unit === 's') {
    const rounded = Math.round(value * 100) / 100;
    return `${rounded.toFixed(2)}s`;
  }
  if (unit === 'cm') return formatDistance(value);
  if (unit === 'm') {
    const rounded = Math.round(value * 100) / 100;
    return `${rounded.toFixed(2)}m`;
  }
  return formatCount(value);
}

export function getAgeGroup(yearOfBirth: number, referenceYear?: number): string {
  const year = referenceYear ?? new Date().getFullYear();
  const age = year - yearOfBirth;
  if (age <= 7) return 'U8';
  if (age <= 9) return 'U10';
  if (age <= 11) return 'U12';
  if (age <= 13) return 'U14';
  if (age <= 15) return 'U16';
  if (age <= 17) return 'U18';
  return 'Senior';
}

/** Escapes a value for safe inclusion in a CSV cell. */
export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
