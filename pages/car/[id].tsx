import fs from 'fs'
import path from 'path'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'
import BaoInfo from '../../components/BaoInfo'
import Footer from '../../components/Footer'
import { sampleCars } from '../../data/sampleCars'
import { formatPLN } from '../../lib/formatPrice'

export async function getStaticPaths(){
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  let ids:string[] = sampleCars.map(c=>c.id)
  if(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY){
    try{
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const { data } = await supabase.from('cars').select('id')
      if(Array.isArray(data)) ids = Array.from(new Set([...ids, ...data.map((d:any)=>d.id)]))
    }catch(e){ console.warn('getStaticPaths supabase read failed', e) }
  }

  const paths = ids.map(id=>({ params: { id } }))
  return { paths, fallback: 'blocking' }
}

export async function getStaticProps({params}:{params:{id:string}}){
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  let car:any = sampleCars.find(c=>c.id===params.id)
  let images:string[] = []

  if(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY){
    try{
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const { data } = await supabase.from('cars').select('*').eq('id', params.id).single()
      if(data) car = data

      // normalize images: if stored as JSON string, parse it
      if(car.images && typeof car.images === 'string'){
        try{ car.images = JSON.parse(car.images) }catch(e){ car.images = car.images.split(',').map((s:string)=>s.trim()).filter(Boolean) }
      }

      // build images array
      if(Array.isArray(car.images) && car.images.length>0){
        images = await Promise.all(car.images.map(async (it:any)=>{
          if(!it) return it
          if(typeof it === 'string' && /^https?:\/\//.test(it)) return it
          // if it's a path starting with '/', use as-is (public folder)
          if(typeof it === 'string' && it.startsWith('/')) return it
          // otherwise try to generate public URL from storage bucket
          try{
            const pub = supabase.storage.from('car-photos').getPublicUrl(it)
            const publicURL = (pub as any)?.publicURL || (pub as any)?.data?.publicUrl || (pub as any)?.data?.publicURL
            if(publicURL) return publicURL
          }catch(e){/* ignore */}
          return it
        }))
      }

      // if no images yet, try to derive from primary image
      if(images.length===0 && car.image){
        if(typeof car.image === 'string' && /^https?:\/\//.test(car.image)) images = [car.image]
        else if(typeof car.image === 'string' && car.image.startsWith('/')){
          // try to read local public folder for matching images (for sample/local items)
          try{
            const rel = car.image.replace(/^\/+/, '')
            const parts = rel.split('/')
            const publicDir = path.join(process.cwd(),'public')
            if(parts.length>=3){
              const folderPath = path.join(publicDir, parts[0], parts[1], parts[2])
              const files = fs.readdirSync(folderPath).filter(f=>/\.(jpe?g|png|webp)$/i.test(f)).sort()
              images = files.map(f => `/${path.posix.join(parts[0],parts[1],parts[2], f)}`)
            }else{
              images = [car.image]
            }
          }catch(e){ images = [car.image] }
        }else if(typeof car.image === 'string'){
          // try supabase storage public URL
          try{
            const pub = supabase.storage.from('car-photos').getPublicUrl(car.image)
            const publicURL = (pub as any)?.publicURL || (pub as any)?.data?.publicUrl || (pub as any)?.data?.publicURL
            if(publicURL) images = [publicURL]
            else images = [car.image]
          }catch(e){ images = [car.image] }
        }
      }

    }catch(e:any){
      console.error('getStaticProps supabase error:', e)
    }
  }

  // final fallback if still no images
  if(!images || images.length===0){
    images = (car.images && Array.isArray(car.images) ? car.images : (car.image ? [car.image] : []))
  }

  // sanitize images: remove falsy entries, ensure strings, dedupe
  images = (images || []).map((it:any)=> it && String(it).trim()).filter(Boolean)
  images = Array.from(new Set(images))

  if(!car) return { notFound: true }
  return { props: { car, images } }
}

export default function CarPage({car, images}:{car:any, images:string[]}){
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(()=>{
    function onKey(e:KeyboardEvent){
      if(!open) return
      if(e.key === 'Escape') setOpen(false)
      if(e.key === 'ArrowRight') setIndex(i=>Math.min(i+1, images.length-1))
      if(e.key === 'ArrowLeft') setIndex(i=>Math.max(i-1, 0))
    }
    window.addEventListener('keydown', onKey)
    return ()=>window.removeEventListener('keydown', onKey)
  },[open, images.length])

  // Swipe gestures for modal (pointer events)
  const modalRef = useRef<HTMLDivElement | null>(null)

  // Swipe gestures for main image (tap to open modal or swipe to change)
  const mainRef = useRef<HTMLDivElement | null>(null)

  useEffect(()=>{
    const el = mainRef.current
    if(!el) return
    let startX = 0
    let startY = 0
    let tracking = false
    let moved = false

    function onPointerDown(e: PointerEvent){
      tracking = true
      moved = false
      startX = e.clientX
      startY = e.clientY
      const tgt = e.target as Element
      if (typeof (tgt as any).setPointerCapture === 'function') (tgt as any).setPointerCapture(e.pointerId)
    }

    function onPointerMove(e: PointerEvent){
      if(!tracking) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if(Math.abs(dx) > 10 || Math.abs(dy) > 10) moved = true
    }

    function onPointerUp(e: PointerEvent){
      if(!tracking) return
      tracking = false
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)){
        if(dx < 0) setIndex(i=>Math.min(i+1, images.length-1))
        else setIndex(i=>Math.max(i-1, 0))
      } else {
        // tap (no meaningful move) opens modal
        if(!moved) setOpen(true)
      }
    }

    function onPointerCancel(){ tracking = false }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerCancel)

    return ()=>{
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerCancel)
    }
  },[images.length])

  useEffect(()=>{
    if(!open || !modalRef.current) return
    const el = modalRef.current
    let startX = 0
    let startY = 0
    let tracking = false

    function onPointerDown(e: PointerEvent){
      tracking = true
      startX = e.clientX
      startY = e.clientY
      const tgt = e.target as Element
      if (typeof (tgt as any).setPointerCapture === 'function') (tgt as any).setPointerCapture(e.pointerId)
    }

    function onPointerMove(e: PointerEvent){
      if(!tracking) return
      // nothing needed here — movement read on up
    }

    function onPointerUp(e: PointerEvent){
      if(!tracking) return
      tracking = false
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)){
        if(dx < 0) setIndex(i=>Math.min(i+1, images.length-1))
        else setIndex(i=>Math.max(i-1, 0))
      }
    }

    function onPointerCancel(){ tracking = false }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerCancel)

    return ()=>{
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerCancel)
    }
  },[open, images.length])

  return (
    <>
      <Header />
      <main className="container-wide py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div ref={mainRef} className="rounded-xl overflow-hidden bg-black">
            <img src={images[index] || car.image} alt={car.title} className="w-full h-80 lg:h-[60vh] object-cover lg:object-contain" />
          </div>

          {images && images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((src,i)=> (
                <button key={i} onClick={()=>setIndex(i)} className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden ${i===index? 'ring-2 ring-accent': ''}`}>
                  <img src={src} alt={`${car.title} ${i+1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="w-full lg:w-96">
          <h1 className="text-2xl font-semibold">{car.title}</h1>
            {car.price && <div className="car-price text-2xl mt-2">{formatPLN(car.price)}</div>}

          <div className="mt-4 muted grid grid-cols-1 gap-2 text-sm">
              {car.make && <div><strong>Марка:</strong> {car.make}</div>}
              {car.model && <div><strong>Модель:</strong> {car.model}</div>}
              {car.generation && <div><strong>Покоління / рестайл:</strong> {car.generation}</div>}
              {car.year != null && <div><strong>Рік випуску:</strong> {car.year}</div>}
              {car.vin && <div><strong>VIN:</strong> <span className="muted">{car.vin}</span></div>}
              {car.fuel && <div><strong>Тип палива:</strong> {car.fuel}</div>}
              {car.engine_volume != null && <div><strong>Об’єм двигуна:</strong> {String(car.engine_volume).replace('.', ',')} л</div>}
              {car.power != null && <div><strong>Потужність:</strong> {car.power} к.с.</div>}
              {car.gearbox && <div><strong>Коробка передач:</strong> {car.gearbox}</div>}
              {car.drivetrain && <div><strong>Привід:</strong> {car.drivetrain === 'FWD' ? 'Передній' : car.drivetrain === 'RWD' ? 'Задній' : car.drivetrain === 'AWD' ? 'Повний (AWD)' : car.drivetrain}</div>}
              {car.emission_standard && <div><strong>Екостандарт:</strong> {car.emission_standard}</div>}
              {car.km != null && <div><strong>Пробіг (км):</strong> {car.km?.toLocaleString('en-US')}</div>}
              {car.body_type && <div><strong>Тип кузова:</strong> {car.body_type}</div>}
              {car.color && <div><strong>Колір:</strong> {car.color}</div>}
              {car.equipment && <div><strong>Комплектація:</strong> <span className="muted">{car.equipment}</span></div>}
              {car.description && <div className="mt-2">
                <div className="font-semibold">Опис</div>
                <div className="mt-1 text-sm">{car.description}</div>
              </div>}
          </div>

          <div className="mt-6 flex gap-3">
            <a href={`tel:+48662722070`} className="flex-1 text-center py-3 rounded-md bg-[var(--accent)] text-black font-semibold">Зателефонувати</a>
            <a href={`mailto:info@baoauto.example`} className="flex-1 text-center py-3 rounded-md border border-white/10 muted">Написати</a>
          </div>

          <div className="mt-6">
            <BaoInfo />
          </div>
        </aside>
      </div>

      <div className="mt-8">
        <Link href="/catalog" className="muted">← Повернутися до каталогу</Link>
      </div>

      {/* Lightbox modal */}
      {open && (
        <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <button aria-label="Close" onClick={()=>setOpen(false)} className="absolute right-6 top-6 z-60 p-2 rounded-full bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button onClick={()=>setIndex(i=>Math.max(i-1,0))} className="absolute left-6 text-white/90 p-3 rounded-full bg-black/30">‹</button>
          <img src={images[index]} alt={`${car.title} large`} className="max-h-[80vh] max-w-[90vw] object-contain" />
          <button onClick={()=>setIndex(i=>Math.min(i+1, images.length-1))} className="absolute right-6 text-white/90 p-3 rounded-full bg-black/30">›</button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((s,i)=>(
              <button key={i} onClick={()=>setIndex(i)} className={`w-12 h-8 overflow-hidden rounded ${i===index? 'ring-2 ring-accent': ''}`}>
                <img src={s} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
      </main>
      <Footer />
    </>
  )
}
