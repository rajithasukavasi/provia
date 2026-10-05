import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function splitList(value: string): string[] {
  return value
    .split(/[,\n;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function normalizeTerm(value: string) {
  return value
    .toLowerCase()
    .replace(/\.js\b/g, 'js')
    .replace(/[^a-z0-9+#]/g, '')
}

export function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateRange(start: string, end: string) {
  const s = formatMonth(start)
  const e = end ? formatMonth(end) : start ? 'Present' : ''
  if (!s && !e) return ''
  if (!s) return e
  return `${s} – ${e}`
}

export function formatMonth(value: string) {
  if (!value) return ''
  const match = /^(\d{4})-(\d{2})/.exec(value)
  if (!match) return value
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function stripUrl(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
}

export function descriptionToBullets(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-•*·]\s*/, '').trim())
    .filter(Boolean)
}
