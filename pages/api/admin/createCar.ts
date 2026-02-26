import type { NextApiRequest, NextApiResponse } from 'next'

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
    // normalize fields
    if(car.images && typeof car.images === 'string'){
      try{ car.images = JSON.parse(car.images) }catch(e){ car.images = car.images.split(',').map((s:string)=>s.trim()).filter(Boolean) }
    }
    // ensure images is an array of non-empty strings
    if(car.images && Array.isArray(car.images)){
      car.images = car.images.map((it:any)=> typeof it === 'string' ? it.trim() : it).filter(Boolean)
      if(car.images.length === 0) car.images = null
    }
    // normalize numeric-like fields
    if(car.km && typeof car.km === 'string') car.km = Number(car.km)
    // engine volume: allow decimal like 1.8
    if(car.engineVolume && typeof car.engineVolume === 'string') car.engine_volume = parseFloat(car.engineVolume.replace(',', '.'))
    if(car.engine_volume && typeof car.engine_volume === 'number' && Number.isNaN(car.engine_volume)) car.engine_volume = null
    // power: integer (hp)
    if(car.power && typeof car.power === 'string') car.power = parseInt(car.power.replace(/[^0-9]/g, ''), 10)
    if(car.power && typeof car.power === 'number' && Number.isNaN(car.power)) car.power = null

    const payload:any = {
      id: car.id || (Date.now()).toString(),
      make: car.make || null,
      title: car.title || null,
      model: car.model || null,
      generation: car.generation || null,
      year: car.year ? Number(car.year) : null,
      km: car.km || null,
      gearbox: car.gearbox || null,
      fuel: car.fuel || null,
      // single price field (display). we do not require separate numeric price.
      price: car.price || null,
      price_num: null,
      // additional fields
      vin: car.vin || null,
      engine_volume: car.engine_volume || car.engineVolume || null,
      power: car.power || null,
      drivetrain: car.drivetrain || null,
      emission_standard: car.emission_standard || car.emissionStandard || null,
      body_type: car.body_type || car.bodyType || null,
      color: car.color || null,
      image: car.image || (Array.isArray(car.images) && car.images.length>0 ? car.images[0] : null),
      images: car.images || null,
      vin: car.vin || null,
      equipment: car.equipment || null,
      description: car.description || null,
    }

    const { data, error } = await supabase.from('cars').insert([payload]).select().single()
    if(error) return res.status(500).json({error: error.message})
    return res.status(201).json({ok:true, car: data})
  }catch(err:any){
    console.error(err)
    return res.status(500).json({error: err.message || 'failed'})
  }
}
