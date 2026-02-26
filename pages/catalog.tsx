import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
import CarList from '../components/CarList'
import CarFilters from '../components/CarFilters'
import { useState, useMemo, useEffect } from 'react'

export default function Catalog(){
  const pageSize = 18
  const [page, setPage] = useState(1)
  const [cars, setCars] = useState<any[]>([])
  const [filters, setFilters] = useState({make:'', fuel:'', gearbox:'', drivetrain:'', bodyType:'', emission:'', yearFrom:'', yearTo:'', priceMin:'', priceMax:''})
  useEffect(()=>{
    fetch('/api/cars').then(r=>r.json()).then(d=>setCars(d.cars || []))
  },[])

  const makes = Array.from(new Set(cars.map(s=>s.make))).filter(Boolean)
  const years = Array.from(new Set(cars.map(s=>s.year))).filter(Boolean).sort((a,b)=>Number(b)-Number(a))
  const fuels = Array.from(new Set(cars.map(s=>s.fuel))).filter(Boolean)
  const gearboxes = Array.from(new Set(cars.map(s=>s.gearbox))).filter(Boolean)
  const drivetrains = Array.from(new Set(cars.map(s=>s.drivetrain || s.drive_train))).filter(Boolean)
  const bodyTypes = Array.from(new Set(cars.map(s=>s.body_type || s.bodyType))).filter(Boolean)
  const emissions = Array.from(new Set(cars.map(s=>s.emission_standard || s.emissionStandard || s.emission))).filter(Boolean)

  const filtered = useMemo(()=>{
    const toNumber = (v:any)=>{
      if(v === null || v === undefined) return null
      if(typeof v === 'number') return v
      if(typeof v === 'string'){
        const cleaned = v.replace(/[^0-9\.]/g, '')
        const n = Number(cleaned)
        return Number.isFinite(n) ? n : null
      }
      return null
    }

    const carPrice = (c:any)=>{
      if(c.price_num !== undefined && c.price_num !== null) return Number(c.price_num)
      if(c.priceNum !== undefined && c.priceNum !== null) return Number(c.priceNum)
      if(c.price !== undefined && c.price !== null) return toNumber(c.price)
      return null
    }

    return cars.filter(c=>{
      if(filters.make && c.make !== filters.make) return false
      if(filters.fuel && c.fuel !== filters.fuel) return false
      if(filters.gearbox && c.gearbox !== filters.gearbox) return false
      if(filters.drivetrain){
        const cd = c.drivetrain || c.drive_train
        if(cd !== filters.drivetrain) return false
      }
      if(filters.bodyType){
        const cb = c.body_type || c.bodyType
        if(cb !== filters.bodyType) return false
      }
      if(filters.emission){
        const ce = c.emission_standard || c.emissionStandard || c.emission
        if(ce !== filters.emission) return false
      }
      if(filters.yearFrom){
        const yf = Number(filters.yearFrom)
        if(Number.isFinite(yf) && (c.year === undefined || Number(c.year) < yf)) return false
      }
      if(filters.yearTo){
        const yt = Number(filters.yearTo)
        if(Number.isFinite(yt) && (c.year === undefined || Number(c.year) > yt)) return false
      }
      const p = carPrice(c)
      if(filters.priceMin !== '' && filters.priceMin !== undefined){
        const min = Number(filters.priceMin)
        if(Number.isFinite(min) && (p === null || p < min)) return false
      }
      if(filters.priceMax !== '' && filters.priceMax !== undefined){
        const max = Number(filters.priceMax)
        if(Number.isFinite(max) && (p === null || p > max)) return false
      }
      return true
    })
  },[filters, cars])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const pageItems = useMemo(()=>{
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  },[page, filtered])

  return (
    <div>
      <Head>
        <title>Каталог — Autopliadka</title>
      </Head>
      <main className="container-wide py-8">
        <Header />
        <h1 className="font-serif text-3xl mb-6">Каталог автомобілів</h1>
        <CarFilters
          makes={makes}
          years={years}
          fuels={fuels}
          gearboxes={gearboxes}
          drivetrains={drivetrains}
          bodyTypes={bodyTypes}
          emissions={emissions}
          onChange={(f)=>{ setFilters({
            make:f.make,
            fuel:f.fuel,
            gearbox:f.gearbox,
            drivetrain:f.drivetrain,
            bodyType:f.bodyType,
            emission:f.emission,
            yearFrom:f.yearFrom,
            yearTo:f.yearTo,
            priceMin:String(f.priceMin),
            priceMax:String(f.priceMax)
          }); setPage(1) }}
        />

        <CarList cars={pageItems} />

        <div className="mt-8 flex items-center justify-center gap-3">
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-2 rounded-md border border-white/10" disabled={page===1}>Prev</button>
          {Array.from({length: totalPages}).map((_,i)=> (
            <button key={i} onClick={()=>setPage(i+1)} className={`px-3 py-2 rounded-md ${page===i+1? 'bg-white text-[var(--accent)]': 'border border-white/10'}`}>{i+1}</button>
          ))}
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="px-3 py-2 rounded-md border border-white/10" disabled={page===totalPages}>Next</button>
        </div>

        <Footer />
      </main>
    </div>
  )
}
