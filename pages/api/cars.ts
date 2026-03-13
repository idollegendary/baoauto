import { NextApiRequest, NextApiResponse } from 'next'
import { sampleCars } from '../../data/sampleCars'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600')

  const rawListing = String(req.query.listing || 'all').toLowerCase()
  const listingFilter = rawListing === 'owner' || rawListing === 'owners' ? 'owner' : rawListing === 'dealer' ? 'dealer' : 'all'

  const applyListingFilter = (items:any[])=>{
    const normalized = (items || []).map((c:any)=>{
      const listingType = String(c?.listing_type || c?.listingType || '').toLowerCase() === 'owner' ? 'owner' : 'dealer'
      return { ...c, listing_type: listingType }
    })
    if(listingFilter === 'all') return normalized
    return normalized.filter((c:any)=>c.listing_type === listingFilter)
  }

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY){
    try{
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const { data, error } = await supabase.from('cars').select('*').order('created_at', { ascending: false })
      if(error) throw error
      // normalize image paths to public URLs when necessary
      try{
        const bucket = 'car-photos'
        const normalized = await Promise.all((data || []).map(async (c:any)=>{
          const clone = Object.assign({}, c)
          const toNumber = (v:any) =>{
            if(v === null || v === undefined) return null
            if(typeof v === 'number') return v
            if(typeof v === 'string'){
              const cleaned = v.replace(/[^0-9\.]/g, '')
              const n = Number(cleaned)
              return Number.isFinite(n) ? n : null
            }
            return null
          }

          // normalize canonical price_pln
          try{
            if(clone.price_pln !== undefined && clone.price_pln !== null){
              clone.price_pln = Number(clone.price_pln)
            }else if(clone.pricePln !== undefined && clone.pricePln !== null){
              clone.price_pln = Number(clone.pricePln)
            }else if(clone.price_num !== undefined && clone.price_num !== null){
              clone.price_pln = Number(clone.price_num)
            }else if(clone.priceNum !== undefined && clone.priceNum !== null){
              clone.price_pln = Number(clone.priceNum)
            }else if(clone.price !== undefined && clone.price !== null){
              const n = toNumber(clone.price)
              if(n !== null) clone.price_pln = n
            }
            if(clone.price_pln !== undefined && !Number.isFinite(Number(clone.price_pln))) delete clone.price_pln

            if(clone.price_usd !== undefined && clone.price_usd !== null){
              clone.price_usd = Number(clone.price_usd)
            }else if(clone.priceUsd !== undefined && clone.priceUsd !== null){
              clone.price_usd = Number(clone.priceUsd)
            }
            if(clone.price_usd !== undefined && !Number.isFinite(Number(clone.price_usd))) delete clone.price_usd
          }catch(_){ }
          const toPublic = async (val:any)=>{
            if(!val) return val
            if(typeof val === 'string' && /^https?:\/\//.test(val)) return val
            if(typeof val === 'string'){
              try{
                const pub = supabase.storage.from(bucket).getPublicUrl(val)
                const publicURL = (pub as any)?.publicURL || (pub as any)?.data?.publicUrl || (pub as any)?.data?.publicURL
                if(publicURL) return publicURL
              }catch(_){}
            }
            return val
          }

          clone.image = await toPublic(clone.image)
          if(clone.images && Array.isArray(clone.images)){
            clone.images = await Promise.all(clone.images.map((it:any)=> toPublic(it)))
            // filter falsy and dedupe
            clone.images = (clone.images || []).map((it:any)=> it && String(it).trim()).filter(Boolean)
            clone.images = Array.from(new Set(clone.images))
          }
          return clone
        }))
        return res.status(200).json({cars: applyListingFilter(normalized)})
      }catch(e:any){
        console.warn('image normalization failed:', e)
        return res.status(200).json({cars: applyListingFilter(data || [])})
      }
    }catch(err:any){
      console.error('supabase read error:', err.message || err)
      // fallback to sampleCars
    }
  }

  // fallback to local sample data
  res.status(200).json({cars: applyListingFilter(sampleCars)})
}
