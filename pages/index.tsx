import Head from 'next/head'
import Header from '../components/Header'
// Hero removed per design — BAO AUTO section replaces it
import BaoInfo from '../components/BaoInfo'
import CarList from '../components/CarList'
import Footer from '../components/Footer'
import CarFilters from '../components/CarFilters'
import { useState, useMemo, useEffect } from 'react'


export default function Home(){
  const [filters, setFilters] = useState({make:'', fuel:'', gearbox:'', drivetrain:'', bodyType:'', emission:'', yearFrom:'', yearTo:'', priceMin:'', priceMax:''})

  const [cars, setCars] = useState<any[]>([])
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
      // try price_num / priceNum
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

  return (
    <div>
      <Head>
        <title>Autopliadka — Преміальний каталог авто</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="container-wide py-8">
        <Header />
        <BaoInfo />
        <CarFilters
          makes={makes}
          years={years}
          fuels={fuels}
          gearboxes={gearboxes}
          drivetrains={drivetrains}
          bodyTypes={bodyTypes}
          emissions={emissions}
          onChange={(f)=>setFilters({
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
          })}
        />

        <section className="mt-8">
          <h2 className="font-serif text-2xl mb-4">Останні надходження</h2>
          <CarList cars={filtered.slice(0,2)} />
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl">Добірка з каталогу</h2>
            <a href="/catalog" className="px-4 py-2 bg-white text-[var(--accent)] rounded-md">Побачити весь каталог</a>
          </div>
          <CarList cars={filtered.slice(0,6)} />
        </section>

        

        <Footer />
      </main>
    </div>
  )
}
