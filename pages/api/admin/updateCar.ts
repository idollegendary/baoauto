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

    const car = Object.assign({}, body.car || {})
    if(!car.id) return res.status(400).json({error:'missing id'})

    // normalize images
    if(car.images && typeof car.images === 'string'){
      try{ car.images = JSON.parse(car.images) }catch(e){ car.images = car.images.split(',').map((s:string)=>s.trim()).filter(Boolean) }
    }
    if(car.images && Array.isArray(car.images)){
      car.images = car.images.map((it:any)=> typeof it === 'string' ? it.trim() : it).filter(Boolean)
      if(car.images.length === 0) car.images = null
    }

    // map camelCase incoming fields to DB column names if present
    if((car as any).engineVolume && !(car as any).engine_volume) car.engine_volume = (car as any).engineVolume
    if((car as any).bodyType && !(car as any).body_type) car.body_type = (car as any).bodyType
    if((car as any).emissionStandard && !(car as any).emission_standard) car.emission_standard = (car as any).emissionStandard
    if((car as any).drivetrain && !(car as any).drive_train) car.drive_train = (car as any).drivetrain
    if((car as any).powerHp && !(car as any).power) car.power = (car as any).powerHp

    // helper to coerce numeric-like values to number or null
    const toNumberOrNull = (v:any, isFloat = false) => {
      if(v === undefined) return undefined
      if(v === null) return null
      if(typeof v === 'number') return Number.isNaN(v) ? null : (isFloat ? v : Math.trunc(v))
      if(typeof v === 'string'){
        const s = v.trim()
        if(s === '') return null
        const cleaned = isFloat ? s.replace(',', '.') : s.replace(/[^0-9-]/g, '')
        const n = isFloat ? parseFloat(cleaned) : parseInt(cleaned, 10)
        return Number.isNaN(n) ? null : n
      }
      return null
    }

    const payload:any = {}

    const toPricePLN = (v:any) => {
      if(v === undefined) return undefined
      if(v === null) return null
      if(typeof v === 'number') return Number.isFinite(v) ? v : null
      if(typeof v === 'string'){
        const s = v.trim()
        if(s === '') return null
        const cleaned = s.replace(/[^0-9\,\.]/g, '').replace(',', '.')
        const n = parseFloat(cleaned)
        return Number.isFinite(n) ? n : null
      }
      return null
    }
    // only set known fields to avoid overwriting unintentionally
    const keys = ['make','title','model','generation','year','km','gearbox','fuel','price_pln','price_usd','listing_type','image','images','vin','engine_volume','power','drivetrain','emission_standard','body_type','color','equipment','description']
    for(const k of keys){
      if(!(k in car)) continue
      // coerce numeric fields to numbers or null to avoid passing empty strings to Postgres
      if(k === 'year'){
        const v = toNumberOrNull((car as any)[k], false)
        if(v !== undefined) payload[k] = v
        continue
      }
      if(k === 'km'){
        const v = toNumberOrNull((car as any)[k], false)
        if(v !== undefined) payload[k] = v
        continue
      }
      if(k === 'engine_volume'){
        const v = toNumberOrNull((car as any)[k], true)
        if(v !== undefined) payload[k] = v
        continue
      }
      if(k === 'power'){
        const v = toNumberOrNull((car as any)[k], false)
        if(v !== undefined) payload[k] = v
        continue
      }
      if(k === 'price_pln'){
        const v = toPricePLN((car as any)[k])
        if(v !== undefined) payload[k] = v
        continue
      }
      if(k === 'price_usd'){
        const v = toPricePLN((car as any)[k])
        if(v !== undefined) payload[k] = v
        continue
      }
      // sanitize images field: ensure array or null or comma-joined string
      if(k === 'images'){
        let val = (car as any)[k]
        if(val && typeof val === 'string'){
          try{ val = JSON.parse(val) }catch(e){ val = String(val).split(',').map((s:string)=>s.trim()).filter(Boolean) }
        }
        if(Array.isArray(val)){
          val = val.map((it:any)=> typeof it === 'string' ? it.trim() : it).filter(Boolean)
          if(val.length === 0) val = null
        }
        payload[k] = val
        continue
      }

      payload[k] = (car as any)[k]
    }

    // Accept common admin field aliases
    if(payload.price_pln === undefined){
      const aliasPrice = toPricePLN((car as any).pricePLN ?? (car as any).price)
      if(aliasPrice !== undefined) payload.price_pln = aliasPrice
    }
    if(payload.price_usd === undefined){
      const aliasUsd = toPricePLN((car as any).priceUSD)
      if(aliasUsd !== undefined) payload.price_usd = aliasUsd
    }
    if(payload.listing_type === undefined){
      const lt = String((car as any).listing_type ?? (car as any).listingType ?? '').toLowerCase()
      if(lt) payload.listing_type = lt === 'owner' ? 'owner' : 'dealer'
    }

    // if images were provided, attempt to remove any images that existed before but were removed in this update
    const urlToStoragePath = (u:any) => {
      if(!u) return null
      try{
        const s = String(u)
        const parsed = new URL(s)
        const parts = parsed.pathname.split('/')
        const idx = parts.indexOf('car-photos')
        if(idx >= 0) return parts.slice(idx+1).join('/')
      }catch(e){
        const m = String(u).match(/car-photos\/(.+)$/)
        if(m) return decodeURIComponent(m[1])
      }
      return null
    }

    if('images' in payload){
      try{
        const { data: existing, error: fetchErr } = await supabase.from('cars').select('images, image').eq('id', car.id).single()
        if(!fetchErr && existing){
          let prevImgs:any = existing.images
          if(prevImgs && typeof prevImgs === 'string'){
            try{ prevImgs = JSON.parse(prevImgs) }catch(e){ prevImgs = String(prevImgs).split(',').map((s:string)=>s.trim()).filter(Boolean) }
          }
          if(Array.isArray(prevImgs)){
            const incoming = Array.isArray(payload.images) ? payload.images : []
            const removed = prevImgs.filter((u:any)=> !incoming.includes(u))
            const keysToRemove:string[] = []
            if(existing.image && !incoming.includes(existing.image)){
              const k = urlToStoragePath(existing.image)
              if(k) keysToRemove.push(k)
            }
            for(const u of removed){ const k = urlToStoragePath(u); if(k) keysToRemove.push(k) }
            if(keysToRemove.length>0){
              try{
                const { error: delErr } = await supabase.storage.from('car-photos').remove(keysToRemove)
                if(delErr) console.warn('storage remove error', delErr.message)
              }catch(e){ console.warn('storage remove exception', e) }
            }
          }
        }
      }catch(e){ console.warn('updateCar: error checking previous images', e) }
    }

    let { data, error } = await supabase.from('cars').update(payload).eq('id', car.id).select().single()
    if(error && /listing_type/i.test(String(error.message || ''))){
      const fallback = { ...payload }
      delete fallback.listing_type
      const retry = await supabase.from('cars').update(fallback).eq('id', car.id).select().single()
      data = retry.data as any
      error = retry.error as any
    }
    if(error) return res.status(500).json({error: error.message})
    return res.status(200).json({ok:true, car: data})
  }catch(err:any){
    console.error(err)
    return res.status(500).json({error: err.message || 'failed'})
  }
}
