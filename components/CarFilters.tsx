import { useState, useEffect } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'

type Filters = {
  make: string
  fuel: string
  gearbox: string
  drivetrain: string
  bodyType: string
  emission: string
  yearFrom: string
  yearTo: string
  priceMin: number | ''
  priceMax: number | ''
  sortBy: string
}

export default function CarFilters({makes, years, fuels, gearboxes, drivetrains, bodyTypes, emissions, onChange}:{
  makes:string[], years:number[], fuels:string[], gearboxes:string[], drivetrains:string[], bodyTypes:string[], emissions:string[], onChange:(f:Filters)=>void
}){
  const [expanded, setExpanded] = useState(false)
  const [make, setMake] = useState('')
  const [fuel, setFuel] = useState('')
  const [gearbox, setGearbox] = useState('')
  const [drivetrain, setDrivetrain] = useState('')
  const [bodyType, setBodyType] = useState('')
  const [emission, setEmission] = useState('')
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const [priceMin, setPriceMin] = useState<number | ''>('')
  const [priceMax, setPriceMax] = useState<number | ''>('')
  const [sortBy, setSortBy] = useState('yearDesc')

  useEffect(()=>{
    onChange({make,fuel,gearbox,drivetrain,bodyType,emission,yearFrom,yearTo,priceMin,priceMax,sortBy})
  },[make,fuel,gearbox,drivetrain,bodyType,emission,yearFrom,yearTo,priceMin,priceMax,sortBy])

  const hasActiveFilters = Boolean(
    make || fuel || gearbox || drivetrain || bodyType || emission || yearFrom || yearTo || priceMin !== '' || priceMax !== ''
  )

  const activeCount = [
    make,
    fuel,
    gearbox,
    drivetrain,
    bodyType,
    emission,
    yearFrom,
    yearTo,
    priceMin !== '' ? String(priceMin) : '',
    priceMax !== '' ? String(priceMax) : ''
  ].filter(Boolean).length

  function resetAll(){
    setMake('')
    setFuel('')
    setGearbox('')
    setDrivetrain('')
    setBodyType('')
    setEmission('')
    setYearFrom('')
    setYearTo('')
    setPriceMin('')
    setPriceMax('')
    setSortBy('yearDesc')
  }

  return (
    <div className="premium-card p-3 sm:p-4 rounded-2xl mb-6 border border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.16em] text-white/55">Розумний підбір</div>
          <div className="text-sm text-white/75 mt-0.5">{hasActiveFilters ? `Активно фільтрів: ${activeCount}` : 'Налаштуй підбір під свій бюджет'}</div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {hasActiveFilters && (
            <button type="button" onClick={resetAll} className="px-3 py-2 rounded-lg border border-white/15 text-xs sm:text-sm text-white/80 hover:bg-white/10">
              Скинути
            </button>
          )}
          <button type="button" onClick={()=>setExpanded(v=>!v)} className="px-3 py-2 rounded-lg border border-white/15 text-xs sm:text-sm text-white/90 hover:bg-white/10 inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span>{expanded ? 'Сховати фільтр' : 'Відкрити фільтр'}</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      <div className={`grid transition-all duration-300 ease-out ${expanded ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
        <div className={`overflow-hidden ${expanded ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!expanded}>
          <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <div>
            <label className="muted text-xs">Марка</label>
            <select value={make} onChange={e=>setMake(e.target.value)} className="w-full mt-1 h-10 px-3 rounded-lg bg-transparent border border-white/10 text-sm">
              <option value="">Усі</option>
              {makes.map(m=> <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="muted text-xs">Паливо</label>
            <select value={fuel} onChange={e=>setFuel(e.target.value)} className="w-full mt-1 h-10 px-3 rounded-lg bg-transparent border border-white/10 text-sm">
              <option value="">Усі</option>
              {fuels.map(f=> <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label className="muted text-xs">КПП</label>
            <select value={gearbox} onChange={e=>setGearbox(e.target.value)} className="w-full mt-1 h-10 px-3 rounded-lg bg-transparent border border-white/10 text-sm">
              <option value="">Усі</option>
              {gearboxes.map(g=> <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="muted text-xs">Рік</label>
            <div className="flex gap-2 mt-1">
              <select value={yearFrom} onChange={e=>setYearFrom(e.target.value)} className="w-1/2 h-10 px-3 rounded-lg bg-transparent border border-white/10 text-sm">
                <option value="">від</option>
                {years.map(y=> <option key={`from-${y}`} value={String(y)}>{y}</option>)}
              </select>
              <select value={yearTo} onChange={e=>setYearTo(e.target.value)} className="w-1/2 h-10 px-3 rounded-lg bg-transparent border border-white/10 text-sm">
                <option value="">до</option>
                {years.map(y=> <option key={`to-${y}`} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="muted text-xs">Сортування</label>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="w-full mt-1 h-10 px-3 rounded-lg bg-transparent border border-white/10 text-sm">
              <option value="yearDesc">Спочатку новіші</option>
              <option value="priceAsc">Ціна: дешевші</option>
              <option value="priceDesc">Ціна: дорожчі</option>
              <option value="kmAsc">Пробіг: менший</option>
              <option value="kmDesc">Пробіг: більший</option>
            </select>
          </div>

          <div>
            <label className="muted text-xs">Ціна (PLN)</label>
            <div className="flex gap-2 mt-1">
              <input type="number" placeholder="від" value={priceMin as any} onChange={e=>setPriceMin(e.target.value ? Number(e.target.value) : '')} className="w-1/2 h-10 px-3 rounded-lg bg-transparent border border-white/10 text-sm" />
              <input type="number" placeholder="до" value={priceMax as any} onChange={e=>setPriceMax(e.target.value ? Number(e.target.value) : '')} className="w-1/2 h-10 px-3 rounded-lg bg-transparent border border-white/10 text-sm" />
            </div>
          </div>

          <div>
            <label className="muted text-xs">Привід</label>
            <select value={drivetrain} onChange={e=>setDrivetrain(e.target.value)} className="w-full mt-1 h-10 px-3 rounded-lg bg-transparent border border-white/10 text-sm">
              <option value="">Усі</option>
              {drivetrains.map(d=> <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="muted text-xs">Тип кузова</label>
            <select value={bodyType} onChange={e=>setBodyType(e.target.value)} className="w-full mt-1 h-10 px-3 rounded-lg bg-transparent border border-white/10 text-sm">
              <option value="">Усі</option>
              {bodyTypes.map(b=> <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label className="muted text-xs">Екостандарт</label>
            <select value={emission} onChange={e=>setEmission(e.target.value)} className="w-full mt-1 h-10 px-3 rounded-lg bg-transparent border border-white/10 text-sm">
              <option value="">Усі</option>
              {emissions.map(em=> <option key={em} value={em}>{em}</option>)}
            </select>
          </div>

          <div className="flex gap-2 mt-1">
            <div className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 flex items-center">
              Активних фільтрів: {activeCount}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
