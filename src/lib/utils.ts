import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, differenceInHours, differenceInMinutes } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy')
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy HH:mm')
}

export function formatTimeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function calculateDuration(clockIn: string, clockOut: string | null) {
  if (!clockOut) return null
  
  const start = new Date(clockIn)
  const end = new Date(clockOut)
  const hours = differenceInHours(end, start)
  const minutes = differenceInMinutes(end, start) % 60
  
  return {
    hours,
    minutes,
    total: hours + minutes / 60,
    formatted: `${hours}h ${minutes}m`
  }
}