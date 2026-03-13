import Head from 'next/head'
import Header from '../components/Header'
import BaoInfo from '../components/BaoInfo'
import CarList from '../components/CarList'
import Footer from '../components/Footer'
import CarFilters from '../components/CarFilters'
import { useState, useMemo, useEffect } from 'react'
import { getCarPricePLN } from '../lib/formatPrice'
import { absoluteUrl } from '../lib/seo'


export default function Home(){
  const canonical = absoluteUrl('/')
  const title = 'BAO AUTO - Автовикуп і підбір авто з Європи'
  const description = 'BAO AUTO: підбір, перевірка та продаж авто з Європи. Прозора історія, гнучкі фільтри, актуальний каталог та консультація.'

  const [filters, setFilters] = useState({make:'', fuel:'', gearbox:'', drivetrain:'', bodyType:'', emission:'', yearFrom:'', yearTo:'', priceMin:'', priceMax:'', sortBy:'yearDesc'})

  const [cars, setCars] = useState<any[]>([])
  useEffect(()=>{
    fetch('/api/cars?listing=dealer').then(r=>r.json()).then(d=>setCars(d.cars || []))
  },[])

  const makes = Array.from(new Set(cars.map(s=>s.make))).filter(Boolean)
  const years = Array.from(new Set(cars.map(s=>s.year))).filter(Boolean).sort((a,b)=>Number(b)-Number(a))

  const fuels = Array.from(new Set(cars.map(s=>s.fuel))).filter(Boolean)
  const gearboxes = Array.from(new Set(cars.map(s=>s.gearbox))).filter(Boolean)
  const drivetrains = Array.from(new Set(cars.map(s=>s.drivetrain || s.drive_train))).filter(Boolean)
  const bodyTypes = Array.from(new Set(cars.map(s=>s.body_type || s.bodyType))).filter(Boolean)
  const emissions = Array.from(new Set(cars.map(s=>s.emission_standard || s.emissionStandard || s.emission))).filter(Boolean)

  const matchesFilters = (c:any)=>{
    const carPrice = getCarPricePLN(c)
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
    if(filters.priceMin !== '' && filters.priceMin !== undefined){
      const min = Number(filters.priceMin)
      if(Number.isFinite(min) && (carPrice === null || carPrice < min)) return false
    }
    if(filters.priceMax !== '' && filters.priceMax !== undefined){
      const max = Number(filters.priceMax)
      if(Number.isFinite(max) && (carPrice === null || carPrice > max)) return false
    }
    return true
  }

  const newestTimestamp = (c:any)=>{
    const created = Date.parse(String(c?.created_at || ''))
    if(Number.isFinite(created)) return created
    const updated = Date.parse(String(c?.updated_at || ''))
    if(Number.isFinite(updated)) return updated
    const idNum = Number(c?.id)
    return Number.isFinite(idNum) ? idNum : 0
  }

  const filtered = useMemo(()=>{
    const carPrice = (c:any)=> getCarPricePLN(c)

    const result = cars.filter(matchesFilters)

    const sorted = [...result]
    const kmValue = (c:any)=> Number(c.km || 0)
    if(filters.sortBy === 'priceAsc') sorted.sort((a,b)=> (carPrice(a) ?? Number.MAX_SAFE_INTEGER) - (carPrice(b) ?? Number.MAX_SAFE_INTEGER))
    else if(filters.sortBy === 'priceDesc') sorted.sort((a,b)=> (carPrice(b) ?? 0) - (carPrice(a) ?? 0))
    else if(filters.sortBy === 'kmAsc') sorted.sort((a,b)=> kmValue(a) - kmValue(b))
    else if(filters.sortBy === 'kmDesc') sorted.sort((a,b)=> kmValue(b) - kmValue(a))
    else sorted.sort((a,b)=> Number(b.year || 0) - Number(a.year || 0))

    return sorted
  },[filters, cars])

  const latestArrivals = useMemo(()=>{
    return cars
      .filter(matchesFilters)
      .slice()
      .sort((a,b)=> newestTimestamp(b) - newestTimestamp(a))
      .slice(0,3)
  },[cars, filters])

  const catalogSelection = useMemo(()=>{
    const latestSet = new Set(latestArrivals)
    const withoutLatest = filtered.filter((c)=>!latestSet.has(c))
    if(withoutLatest.length >= 6) return withoutLatest.slice(0,6)
    return filtered.slice(0,6)
  },[filtered, latestArrivals])

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
      <main className="container-wide py-6 sm:py-8 relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(180,136,107,0.20),transparent_65%)]" />
        <Header />

        <section className="relative z-10 premium-card rounded-3xl p-5 sm:p-8 mt-6 border border-white/10 overflow-hidden">
          <div className="absolute -right-14 -top-16 w-64 h-64 rounded-full bg-[var(--accent)]/10 blur-3xl" />
          <div className="relative grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/55">BAO AUTO</div>
              <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl leading-tight font-semibold max-w-2xl">
                Преміальний підбір авто з Європи без зайвого ризику
              </h1>
              <p className="mt-4 text-white/75 max-w-2xl leading-relaxed">
                Актуальні пропозиції, чесна історія, прозорий супровід. Обирай авто через гнучкі фільтри та сортування прямо на головній.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs sm:text-sm text-white/85">Перевірені авто</span>
                <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs sm:text-sm text-white/85">Допомога з документами</span>
                <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs sm:text-sm text-white/85">Підбір під бюджет</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs text-white/55 uppercase tracking-[0.12em]">Всього авто</div>
                <div className="mt-1 text-2xl font-semibold">{cars.length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs text-white/55 uppercase tracking-[0.12em]">Після фільтрації</div>
                <div className="mt-1 text-2xl font-semibold text-[var(--accent)]">{filtered.length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 col-span-2">
                <div className="text-xs text-white/55 uppercase tracking-[0.12em]">Фокус</div>
                <div className="mt-1 text-sm text-white/85">Компактні фільтри, швидке сортування, преміальна видача карток.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 mt-6">
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
            priceMax:String(f.priceMax),
            sortBy:f.sortBy
          })}
        />
        </section>

        <section id="latest" className="relative z-10 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl">Останні надходження</h2>
            <div className="text-sm text-white/70">Показано: <span className="text-white font-semibold">{latestArrivals.length}</span></div>
          </div>
          <CarList cars={latestArrivals} />
        </section>

        <section className="relative z-10 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl">Добірка з каталогу</h2>
            <a href="/catalog" className="px-4 py-2 rounded-lg bg-[var(--accent)] text-black font-semibold">Побачити весь каталог</a>
          </div>
          <CarList cars={catalogSelection} />
        </section>

        <section className="relative z-10 mt-8">
          <BaoInfo />
        </section>

        <Footer />
      </main>
    </div>
  )
}
