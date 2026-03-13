import type { GetServerSideProps } from 'next'
import { sampleCars } from '../data/sampleCars'
import { SITE_URL } from '../lib/seo'

type UrlItem = {
  loc: string
  lastmod?: string
  changefreq?: 'daily' | 'weekly' | 'monthly'
  priority?: string
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildSitemap(urls: UrlItem[]) {
  const body = urls
    .map((u) => {
      const parts = [
        '<url>',
        `<loc>${xmlEscape(u.loc)}</loc>`,
        u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '',
        u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : '',
        u.priority ? `<priority>${u.priority}</priority>` : '',
        '</url>',
      ].filter(Boolean)
      return parts.join('')
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  let carRows: Array<{ id: string; updated_at?: string; created_at?: string }> = []

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const { data } = await supabase.from('cars').select('id, updated_at, created_at').limit(5000)
      if (Array.isArray(data)) {
        carRows = data.map((row: any) => ({
          id: String(row.id),
          updated_at: row.updated_at ? String(row.updated_at) : undefined,
          created_at: row.created_at ? String(row.created_at) : undefined,
        }))
      }
    } catch (error) {
      console.warn('sitemap supabase read failed', error)
    }
  }

  if (carRows.length === 0) {
    carRows = sampleCars.map((car) => ({ id: String(car.id) }))
  }

  const now = new Date().toISOString()
  const staticUrls: UrlItem[] = [
    { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0', lastmod: now },
    { loc: `${SITE_URL}/catalog`, changefreq: 'daily', priority: '0.9', lastmod: now },
    { loc: `${SITE_URL}/owners-cars`, changefreq: 'daily', priority: '0.8', lastmod: now },
    { loc: `${SITE_URL}/contacts`, changefreq: 'weekly', priority: '0.7', lastmod: now },
  ]

  const carUrls: UrlItem[] = carRows.map((row) => ({
    loc: `${SITE_URL}/car/${row.id}`,
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: row.updated_at || row.created_at || now,
  }))

  const xml = buildSitemap([...staticUrls, ...carUrls])
  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  res.write(xml)
  res.end()

  return { props: {} }
}

export default function SitemapXml() {
  return null
}
