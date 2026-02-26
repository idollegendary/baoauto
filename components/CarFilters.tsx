import { useState, useEffect } from 'react'

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
}

export default function CarFilters({makes, years, fuels, gearboxes, drivetrains, bodyTypes, emissions, onChange}:{
  makes:string[], years:number[], fuels:string[], gearboxes:string[], drivetrains:string[], bodyTypes:string[], emissions:string[], onChange:(f:Filters)=>void
}){
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

  useEffect(()=>{
    onChange({make,fuel,gearbox,drivetrain,bodyType,emission,yearFrom,yearTo,priceMin,priceMax})
  },[make,fuel,gearbox,drivetrain,bodyType,emission,yearFrom,yearTo,priceMin,priceMax])

  return (
    <div className="premium-card p-4 rounded-xl mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div>
          <label className="muted text-xs">Марка</label>
          <select value={make} onChange={e=>setMake(e.target.value)} className="w-full mt-1 h-10 px-3 rounded-md bg-transparent border border-white/10 text-sm">
            <option value="">Усі</option>
            {makes.map(m=> <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label className="muted text-xs">Паливо</label>
          <select value={fuel} onChange={e=>setFuel(e.target.value)} className="w-full mt-1 h-10 px-3 rounded-md bg-transparent border border-white/10 text-sm">
            <option value="">Усі</option>
            {fuels.map(f=> <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div>
          <label className="muted text-xs">Коробка</label>
          <select value={gearbox} onChange={e=>setGearbox(e.target.value)} className="w-full mt-1 h-10 px-3 rounded-md bg-transparent border border-white/10 text-sm">
            <option value="">Усі</option>
            {gearboxes.map(g=> <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="muted text-xs">Рік від/до</label>
          <div className="flex gap-2 mt-1">
            <select value={yearFrom} onChange={e=>setYearFrom(e.target.value)} className="w-1/2 h-10 px-3 rounded-md bg-transparent border border-white/10 text-sm">
              <option value="">від</option>
              {years.map(y=> <option key={`from-${y}`} value={String(y)}>{y}</option>)}
            </select>
            <select value={yearTo} onChange={e=>setYearTo(e.target.value)} className="w-1/2 h-10 px-3 rounded-md bg-transparent border border-white/10 text-sm">
              <option value="">до</option>
              {years.map(y=> <option key={`to-${y}`} value={String(y)}>{y}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="muted text-xs">Ціна (PLN)</label>
          <div className="flex gap-2 mt-1">
            <input type="number" placeholder="від" value={priceMin as any} onChange={e=>setPriceMin(e.target.value ? Number(e.target.value) : '')} className="w-1/2 h-10 px-3 rounded-md bg-transparent border border-white/10 text-sm" />
            <input type="number" placeholder="до" value={priceMax as any} onChange={e=>setPriceMax(e.target.value ? Number(e.target.value) : '')} className="w-1/2 h-10 px-3 rounded-md bg-transparent border border-white/10 text-sm" />
          </div>
        </div>

        <div className="sm:col-span-5 mt-2">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="muted text-xs">Привід</label>
              <select value={drivetrain} onChange={e=>setDrivetrain(e.target.value)} className="w-full mt-1 h-10 px-3 rounded-md bg-transparent border border-white/10 text-sm">
                <option value="">Усі</option>
                {drivetrains.map(d=> <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="muted text-xs">Тип кузова</label>
              <select value={bodyType} onChange={e=>setBodyType(e.target.value)} className="w-full mt-1 h-10 px-3 rounded-md bg-transparent border border-white/10 text-sm">
                <option value="">Усі</option>
                {bodyTypes.map(b=> <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="muted text-xs">Екостандарт</label>
              <select value={emission} onChange={e=>setEmission(e.target.value)} className="w-full mt-1 h-10 px-3 rounded-md bg-transparent border border-white/10 text-sm">
                <option value="">Усі</option>
                {emissions.map(em=> <option key={em} value={em}>{em}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
