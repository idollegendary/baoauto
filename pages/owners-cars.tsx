import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
import CarList from '../components/CarList'
import CarFilters from '../components/CarFilters'
import { useState, useMemo, useEffect } from 'react'
import { getCarPricePLN } from '../lib/formatPrice'
import { absoluteUrl } from '../lib/seo'

export default function OwnersCars(){
  const canonical = absoluteUrl('/owners-cars')
  const title = 'Авто від власників - BAO AUTO'
  const description = 'Оголошення авто від власників: приватні пропозиції з підтримкою BAO AUTO та доступом до нашої клієнтської бази.'

  const pageSize = 18
  const [page, setPage] = useState(1)
  const [cars, setCars] = useState<any[]>([])
  const [filters, setFilters] = useState({make:'', fuel:'', gearbox:'', drivetrain:'', bodyType:'', emission:'', yearFrom:'', yearTo:'', priceMin:'', priceMax:'', sortBy:'yearDesc'})
  const [filtersVersion, setFiltersVersion] = useState(0)

  useEffect(()=>{
    fetch('/api/cars?listing=owner').then(r=>r.json()).then(d=>setCars(d.cars || []))
  },[])

  const makes = Array.from(new Set(cars.map(s=>s.make))).filter(Boolean)
  const years = Array.from(new Set(cars.map(s=>s.year))).filter(Boolean).sort((a,b)=>Number(b)-Number(a))
  const fuels = Array.from(new Set(cars.map(s=>s.fuel))).filter(Boolean)
  const gearboxes = Array.from(new Set(cars.map(s=>s.gearbox))).filter(Boolean)
  const drivetrains = Array.from(new Set(cars.map(s=>s.drivetrain || s.drive_train))).filter(Boolean)
  const bodyTypes = Array.from(new Set(cars.map(s=>s.body_type || s.bodyType))).filter(Boolean)
  const emissions = Array.from(new Set(cars.map(s=>s.emission_standard || s.emissionStandard || s.emission))).filter(Boolean)

  const filtered = useMemo(()=>{
    const carPrice = (c:any)=> getCarPricePLN(c)

    const result = cars.filter(c=>{
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

    const sorted = [...result]
    const kmValue = (c:any)=> Number(c.km || 0)
    if(filters.sortBy === 'priceAsc') sorted.sort((a,b)=> (carPrice(a) ?? Number.MAX_SAFE_INTEGER) - (carPrice(b) ?? Number.MAX_SAFE_INTEGER))
    else if(filters.sortBy === 'priceDesc') sorted.sort((a,b)=> (carPrice(b) ?? 0) - (carPrice(a) ?? 0))
    else if(filters.sortBy === 'kmAsc') sorted.sort((a,b)=> kmValue(a) - kmValue(b))
    else if(filters.sortBy === 'kmDesc') sorted.sort((a,b)=> kmValue(b) - kmValue(a))
    else sorted.sort((a,b)=> Number(b.year || 0) - Number(a.year || 0))

    return sorted
  },[filters, cars])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const sortLabel = (()=>{
    if(filters.sortBy === 'priceAsc') return 'Сортування: ціна зростає'
    if(filters.sortBy === 'priceDesc') return 'Сортування: ціна спадає'
    if(filters.sortBy === 'kmAsc') return 'Сортування: пробіг зростає'
    if(filters.sortBy === 'kmDesc') return 'Сортування: пробіг спадає'
    return 'Сортування: спочатку новіші'
  })()

  const resetAllFilters = ()=>{
    setFilters({make:'', fuel:'', gearbox:'', drivetrain:'', bodyType:'', emission:'', yearFrom:'', yearTo:'', priceMin:'', priceMax:'', sortBy:'yearDesc'})
    setPage(1)
    setFiltersVersion((v)=>v+1)
  }

  const paginationItems = useMemo(()=>{
    if(totalPages <= 7) return Array.from({length: totalPages}, (_,i)=>i+1)
    const pages = new Set<number>([1, totalPages, page-1, page, page+1])
    const normalized = Array.from(pages).filter((p)=>p>=1 && p<=totalPages).sort((a,b)=>a-b)
    const compact: Array<number | '...'> = []
    for(let i=0;i<normalized.length;i++){
      const p = normalized[i]
      const prev = normalized[i-1]
      if(i>0 && prev !== undefined && p - prev > 1){
        compact.push('...')
      }
      compact.push(p)
    }
    return compact
  },[page, totalPages])

  const pageItems = useMemo(()=>{
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  },[page, filtered])

  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={absoluteUrl('/logo_baoauto.png')} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={absoluteUrl('/logo_baoauto.png')} />
      </Head>

      <main className="container-wide py-8">
        <Header />
        <h1 className="font-serif text-3xl mb-2">Авто від власників</h1>
        <p className="text-white/70 mb-6">Приватні оголошення, які просуваються через базу клієнтів BAO AUTO.</p>

        <section className="mb-6 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-4">
          <p className="text-sm sm:text-base text-amber-100 leading-relaxed">
            ❗ Автомобіль продається напряму від власника. BAO AUTO лише публікує оголошення та не несе відповідальності за стан автомобіля і документи.
          </p>
          <p className="text-sm sm:text-base text-amber-100 leading-relaxed mt-3">
            ❗ Не рекомендуємо робити жодних передоплат або переказів без особистого огляду автомобіля.
          </p>
        </section>

        <CarFilters
          key={filtersVersion}
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
            priceMax:String(f.priceMax),
            sortBy:f.sortBy
          }); setPage(1) }}
        />

        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="text-sm text-white/70">Знайдено: <span className="text-white font-semibold">{total}</span></div>
          <div className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs text-white/85">{sortLabel}</div>
        </div>

        {total === 0 ? (
          <div className="premium-card rounded-2xl border border-white/10 p-8 text-center">
            <h3 className="text-xl font-semibold">0 результатів</h3>
            <p className="text-white/70 mt-2">Поки що немає оголошень від власників за цими параметрами.</p>
            <button onClick={resetAllFilters} className="mt-5 px-4 py-2 rounded-lg bg-[var(--accent)] text-black font-semibold">Скинути фільтри</button>
          </div>
        ) : (
          <CarList cars={pageItems} />
        )}

        <div className="mt-8 flex items-center justify-center gap-2 flex-wrap">
          <button onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-2 rounded-md border border-white/10" disabled={page===1}>Prev</button>
          {paginationItems.map((item, i)=> item === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-white/55">...</span>
          ) : (
            <button key={item} onClick={()=>setPage(item)} className={`px-3 py-2 rounded-md min-w-10 ${page===item? 'bg-white text-[var(--accent)]': 'border border-white/10'}`}>{item}</button>
          ))}
          <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="px-3 py-2 rounded-md border border-white/10" disabled={page===totalPages}>Next</button>
        </div>

        <Footer />
      </main>
    </div>
  )
}
