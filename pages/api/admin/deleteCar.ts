import type { NextApiRequest, NextApiResponse } from 'next'

export const config = { api: { bodyParser: true } }

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'})
  const ADMIN_SECRET = process.env.ADMIN_SECRET
  const body = req.body || {}
  const secret = body.secret
  if(ADMIN_SECRET && secret !== ADMIN_SECRET && process.env.NODE_ENV !== 'development'){
    return res.status(403).json({error:'invalid secret'})
  }

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({error:'Supabase not configured'})

  try{
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const id = body.id
    if(!id) return res.status(400).json({error:'missing id'})

    // fetch the car first to obtain image keys to remove from storage
    const { data: existing, error: fetchError } = await supabase.from('cars').select('id, images, image').eq('id', id).single()
    if(fetchError) return res.status(500).json({error: fetchError.message})

    // helper: derive storage path (key) from a public URL or a stored path
    const urlToStoragePath = (u:any) => {
      if(!u) return null
      try{
        const s = String(u)
        // try to parse as URL
        const parsed = new URL(s)
        const parts = parsed.pathname.split('/')
        const idx = parts.indexOf('car-photos')
        if(idx >= 0){
          return parts.slice(idx+1).join('/')
        }
      }catch(e){
        // not a full URL, try regex
        const m = String(u).match(/car-photos\/(.+)$/)
        if(m) return decodeURIComponent(m[1])
      }
      return null
    }

    const keysToRemove:string[] = []
    try{
      if(existing.image) {
        const k = urlToStoragePath(existing.image)
        if(k) keysToRemove.push(k)
      }
      if(existing.images){
        let imgs:any = existing.images
        if(typeof imgs === 'string'){
          try{ imgs = JSON.parse(imgs) }catch(e){ imgs = String(imgs).split(',').map((s:string)=>s.trim()).filter(Boolean) }
        }
        if(Array.isArray(imgs)){
          for(const u of imgs){ const k = urlToStoragePath(u); if(k) keysToRemove.push(k) }
        }
      }
    }catch(e){ console.warn('error parsing existing images', e) }

    // attempt to remove files from storage (if any)
    if(keysToRemove.length>0){
      try{
        const { error: delErr } = await supabase.storage.from('car-photos').remove(keysToRemove)
        if(delErr) console.warn('storage remove error', delErr.message)
      }catch(e){ console.warn('storage remove exception', e) }
    }

    const { data, error } = await supabase.from('cars').delete().eq('id', id).select().single()
    if(error) return res.status(500).json({error: error.message})
    return res.status(200).json({ok:true, car: data})
  }catch(err:any){
    console.error(err)
    return res.status(500).json({error: err.message || 'failed'})
  }
}
