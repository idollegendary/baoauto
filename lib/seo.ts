export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://baoauto.vercel.app').replace(/\/$/, '')

export function absoluteUrl(pathname: string) {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${SITE_URL}${path}`
}

export function buildSeoDescription(text?: string, fallback = 'BAO AUTO - підбір і продаж авто з Європи. Перевірені авто, прозора історія, консультація та супровід.') {
  const value = String(text || '').trim()
  if (!value) return fallback
  return value.length > 160 ? `${value.slice(0, 157)}...` : value
}
