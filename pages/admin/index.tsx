import { useState, useEffect, useRef } from 'react'
import { formatPLN, formatUSD, getCarPricePLN, getCarPriceUSD } from '../../lib/formatPrice'
import Head from 'next/head'
import Header from '../../components/Header'

export default function Admin(){
  const [form, setForm] = useState<any>({ title:'', make:'', model:'', generation:'', year:'', km:'', pricePLN:'', priceUSD:'', listingType:'dealer', images:'', image:'', description:'', vin:'', engineVolume:'', power:'', drivetrain:'', emissionStandard:'', bodyType:'', color:'', gearbox:'', fuel:'' })
  const [status, setStatus] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [publishedCars, setPublishedCars] = useState<any[]>([])
  const [loadingPublished, setLoadingPublished] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [publishedScope, setPublishedScope] = useState<'all' | 'dealer' | 'owner'>('all')
  const PAGE_SIZE = 10

  useEffect(()=>{
    loadPublished()
  }, [])

  const formRef = useRef<HTMLFormElement | null>(null)
  const emptyForm = { title:'', make:'', model:'', generation:'', year:'', km:'', pricePLN:'', priceUSD:'', listingType:'dealer', images:'', image:'', description:'', vin:'', engineVolume:'', power:'', drivetrain:'', emissionStandard:'', bodyType:'', color:'', gearbox:'', fuel:'' }

  const startEditing = (p:any) => {
    const pricePLN = getCarPricePLN(p)
    const priceUSD = getCarPriceUSD(p)
    setForm({ title: p.title||'', make:p.make||'', model:p.model||'', generation:p.generation||'', year:p.year||'', km:p.km||'', pricePLN: pricePLN ?? '', priceUSD: priceUSD ?? '', listingType: p.listing_type === 'owner' ? 'owner' : 'dealer', images:p.images||'', image:p.image||'', description:p.description||'', vin:p.vin||'', engineVolume:p.engine_volume||'', power:p.power||'', drivetrain:p.drivetrain||'', emissionStandard:p.emission_standard||'', bodyType:p.body_type||'', color:p.color||'', gearbox:p.gearbox||'', fuel:p.fuel||'' })
    setEditingId(p.id)
    // scroll form into view and focus first control
    setTimeout(()=>{
      try{ formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }catch(e){}
      try{ const el = formRef.current?.querySelector('input, textarea, select') as HTMLElement | null; el?.focus() }catch(e){}
    }, 50)
  }

  const originalRef = useRef<any>(null)
  // when starting edit, store the original published item for change-diffing
  const startEditingWithOriginal = (p:any) => { originalRef.current = p; startEditing(p) }

  const isChanged = (field:string) => {
    if(!editingId || !originalRef.current) return false
    if(field === 'pricePLN'){
      const origPrice = getCarPricePLN(originalRef.current)
      const curPrice = form.pricePLN === '' ? null : Number(String(form.pricePLN).replace(/[^0-9.,]/g, '').replace(',', '.'))
      return Number(origPrice ?? 0) !== Number(curPrice ?? 0)
    }
    if(field === 'priceUSD'){
      const origPrice = getCarPriceUSD(originalRef.current)
      const curPrice = form.priceUSD === '' ? null : Number(String(form.priceUSD).replace(/[^0-9.,]/g, '').replace(',', '.'))
      return Number(origPrice ?? 0) !== Number(curPrice ?? 0)
    }
    // try both camelCase and snake_case on the original object
    const snake = field.replace(/([A-Z])/g, '_$1').toLowerCase()
    const orig = originalRef.current[field] !== undefined ? originalRef.current[field] : originalRef.current[snake]
    const cur = (form as any)[field]
    // normalize arrays/strings for images
    if(field === 'images'){
      const a = Array.isArray(orig) ? orig : (orig ? String(orig).split(',').map((s:string)=>s.trim()).filter(Boolean) : [])
      const b = Array.isArray(cur) ? cur : (cur ? String(cur).split(',').map((s:string)=>s.trim()).filter(Boolean) : [])
      return JSON.stringify(a) !== JSON.stringify(b)
    }
    return String(orig ?? '') !== String(cur ?? '')
  }

  const inputClass = (field:string) => `p-3 bg-white/[0.04] rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/60 ${editingId && isChanged(field) ? 'ring-2 ring-green-400' : ''}`

  const [toast, setToast] = useState<{message:string, type?:string} | null>(null)
  const showToast = (msg:string, type?:string) => { setToast({message:msg,type}); setTimeout(()=>setToast(null), 3000) }

  async function loadPublished(){
    try{
      setLoadingPublished(true)
      const res = await fetch('/api/cars')
      const d = await res.json()
      if(res.ok && d && Array.isArray(d.cars)){
        setPublishedCars(d.cars)
      }
    }catch(e){ console.error('load published cars', e) }
    finally{ setLoadingPublished(false) }
  }

  const filteredPublished = publishedCars.filter(p=>{
    const listingType = String(p.listing_type || 'dealer') === 'owner' ? 'owner' : 'dealer'
    if(publishedScope !== 'all' && listingType !== publishedScope) return false
    if(!searchTerm) return true
    const s = String(searchTerm).toLowerCase()
    return [p.title, p.make, p.model, p.vin, p.id].some((v:any)=> v && String(v).toLowerCase().includes(s))
  })
  const totalPages = Math.max(1, Math.ceil(filteredPublished.length / PAGE_SIZE))
  const publishedPage = Math.max(1, Math.min(page, totalPages))
  const publishedSlice = filteredPublished.slice((publishedPage-1)*PAGE_SIZE, publishedPage*PAGE_SIZE)
  const [pendingFiles, setPendingFiles] = useState<Array<{file: File, url: string}>>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const getImagesArray = ()=>{
    if(!form.images) return []
    if(Array.isArray(form.images)) return form.images
    try{ return String(form.images).split(',').map((s:string)=>s.trim()).filter(Boolean) }catch{ return [] }
  }

  const setImagesOrder = (images:string[])=>{
    const cleaned = images.map((s)=>String(s || '').trim()).filter(Boolean)
    setForm((f:any)=>({...f, images: cleaned.join(', '), image: cleaned[0] || '' }))
  }

  const removeImage = (index:number)=>{
    const arr = getImagesArray()
    const target = arr[index]
    if(target && target.startsWith('blob:')){
      const pf = pendingFiles.find((p)=>p.url === target)
      if(pf){ try{ URL.revokeObjectURL(pf.url) }catch(_){} }
      setPendingFiles((prev)=>prev.filter((p)=>p.url !== target))
    }
    arr.splice(index,1)
    setImagesOrder(arr)
  }

  const moveImage = (from:number, to:number)=>{
    if(from === to) return
    const arr = getImagesArray()
    if(from < 0 || to < 0 || from >= arr.length || to >= arr.length) return
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    setImagesOrder(arr)
  }

  // main selection removed: first image will be considered main

  // queue file locally and show preview; actual upload happens on Publish
  function uploadFile(file: File){
    try{
      const url = URL.createObjectURL(file)
      setPendingFiles((p)=> [...p, {file, url}])
      setForm((f:any)=>{
        const current = Array.isArray(f.images)
          ? f.images
          : (f.images ? String(f.images).split(',').map((s:string)=>s.trim()).filter(Boolean) : [])
        const next = [...current, url]
        return {...f, images: next.join(', '), image: next[0] || ''}
      })
      setStatus('File queued (not uploaded)')
    }catch(e){
      console.error(e)
      setStatus('Queue error')
    }
  }

  const submit = async (e:any)=>{
    e.preventDefault()
    setStatus('Publishing...')
    const car: any = Object.assign({}, form)
    if(!String(car.title || '').trim()){
      setStatus('Вкажіть назву авто')
      showToast('Назва обовʼязкова', 'error')
      return
    }
    car.price_pln = form.pricePLN !== '' ? Number(String(form.pricePLN).replace(/[^0-9.,]/g, '').replace(',', '.')) : null
    car.price_usd = form.priceUSD !== '' ? Number(String(form.priceUSD).replace(/[^0-9.,]/g, '').replace(',', '.')) : null
    car.listing_type = form.listingType === 'owner' ? 'owner' : 'dealer'
    if(!Number.isFinite(car.price_pln)) car.price_pln = null
    if(!Number.isFinite(car.price_usd)) car.price_usd = null
    if(car.price_pln === null && car.price_usd === null){
      setStatus('Вкажіть ціну в PLN або USD')
      showToast('Додайте хоча б одну ціну', 'error')
      return
    }
    if(car.images && typeof car.images === 'string'){
      car.images = car.images.split(',').map((s:string)=>s.trim()).filter(Boolean)
    }
    // if there are pending files, upload them now and merge into images
    if(pendingFiles.length>0){
      const pendingByUrl = new Map(pendingFiles.map((pf)=>[pf.url, pf.file]))
      const ordered = car.images && Array.isArray(car.images) ? car.images.slice() : []
      const resolved:string[] = []

      for(const it of ordered){
        const img = typeof it === 'string' ? it.trim() : ''
        if(!img) continue
        if(img.startsWith('blob:')){
          const file = pendingByUrl.get(img)
          if(!file) continue
          try{
            setStatus('Uploading file...')
            const fd = new FormData()
            fd.append('file', file)
            const res = await fetch('/api/admin/upload', {method:'POST', body: fd})
            const data = await res.json()
            if(res.ok && data.url){
              resolved.push(data.url)
            }else{
              console.warn('upload failed for file', data)
            }
          }catch(err){
            console.error('upload error', err)
          }
        }else{
          resolved.push(img)
        }
      }

      car.images = Array.from(new Set(resolved.filter(Boolean)))
      car.image = car.images[0] || null

      pendingFiles.forEach((pf)=>{ try{ URL.revokeObjectURL(pf.url) }catch(_){} })
      setPendingFiles([])
    }

    if(car.images && Array.isArray(car.images)){
      car.images = car.images.filter((u:any)=>u && typeof u === 'string' && !u.startsWith('blob:'))
      if(car.images.length === 0) car.images = null
    }
    if(!car.image && car.images && Array.isArray(car.images) && car.images.length > 0){
      car.image = car.images[0]
    }
    // if editing an existing car, call update endpoint
    let data:any = null
      if(editingId){
      car.id = editingId
      const res = await fetch('/api/admin/updateCar', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ car, secret: car.secret })})
      data = await res.json()
      if(res.ok){
        setStatus('Updated')
        if(data && data.car){
          setPublishedCars(prev => prev.map(item => item.id === data.car.id ? data.car : item))
        }
        setEditingId(null)
        originalRef.current = null
        setForm(emptyForm)
        showToast('Saved')
      }else{
        setStatus(data.error || 'Error')
      }
    }else{
      const res = await fetch('/api/admin/createCar', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ car, secret: car.secret })})
      data = await res.json()
      if(res.ok){
        setStatus('Published')
        if(data && data.car){
          setPublishedCars(prev => [data.car, ...prev])
        }
        setForm(emptyForm)
        showToast('Created')
      }else{
        setStatus(data.error || 'Error')
      }
    }
  }

  // local queue removed — publish happens directly from the form
  

  return (
    <div>
      <Head>
        <title>Admin — Add Car</title>
      </Head>
      <main className="container-wide py-6 sm:py-8 relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(180,136,107,0.18),transparent_65%)]" />
        <Header />

        <section className="relative z-10 premium-card rounded-2xl p-4 sm:p-6 border border-white/10 mt-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/55">Admin Panel</div>
              <h1 className="text-2xl sm:text-3xl font-semibold mt-1">Керування автопарком</h1>
              <p className="muted mt-1 text-sm">Додавай, редагуй і публікуй авто в єдиному преміум-інтерфейсі.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="text-white/55 text-xs">Записів</div>
                <div className="font-semibold">{publishedCars.length}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="text-white/55 text-xs">Статус</div>
                <div className="font-semibold truncate max-w-[140px]">{status || 'Готово'}</div>
              </div>
            </div>
          </div>
        </section>

        <form ref={formRef} onSubmit={submit} className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6 items-start">
          <div className="xl:col-span-8 grid gap-3 premium-card rounded-2xl p-4 sm:p-5 border border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{editingId ? 'Редагування авто' : 'Додати машину'}</h2>
              {editingId && <div className="text-sm text-white/60">Редагування: {editingId}</div>}
            </div>
            <label className="text-sm muted">Назва</label>
            <input value={form.title} onChange={e=>setForm((f:any)=>({...f,title:e.target.value}))} placeholder="Audi A4 B8" className={`w-full ${inputClass('title')}`} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm muted">Марка</label>
                <input value={form.make} onChange={e=>setForm((f:any)=>({...f,make:e.target.value}))} placeholder="Make" className={`w-full ${inputClass('make')}`} />
              </div>
              <div>
                <label className="text-sm muted">Модель</label>
                <input value={form.model} onChange={e=>setForm((f:any)=>({...f,model:e.target.value}))} placeholder="Model" className={`w-full ${inputClass('model')}`} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input value={form.generation} onChange={e=>setForm((f:any)=>({...f,generation:e.target.value}))} placeholder="Покоління" className={`${inputClass('generation')}`} />
              <select value={form.year} onChange={e=>setForm((f:any)=>({...f,year:e.target.value}))} className={`${inputClass('year')}`}>
                <option value="">Рік</option>
                {Array.from({length: 37}).map((_,i)=>{
                  const y = 2026 - i
                  return <option key={y} value={String(y)}>{y}</option>
                })}
              </select>
              <input value={form.km} onChange={e=>setForm((f:any)=>({...f,km:e.target.value}))} placeholder="Пробіг (км)" className={`${inputClass('km')}`} />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <input value={form.vin} onChange={e=>setForm((f:any)=>({...f,vin:e.target.value}))} placeholder="VIN" className={`${inputClass('vin')}`} />
              <select value={form.emissionStandard} onChange={e=>setForm((f:any)=>({...f,emissionStandard:e.target.value}))} className={`${inputClass('emissionStandard')}`}>
                <option value="">Екостандарт</option>
                <option value="Euro 5">Euro 5</option>
                <option value="Euro 6">Euro 6</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-2">
              <input value={form.engineVolume} onChange={e=>setForm((f:any)=>({...f,engineVolume:e.target.value}))} placeholder="Об'єм, напр. 1.8" className={`${inputClass('engineVolume')}`} />
              <input value={form.power} onChange={e=>setForm((f:any)=>({...f,power:e.target.value}))} placeholder="Потужність (к.с.)" className={`${inputClass('power')}`} />
              <select value={form.drivetrain} onChange={e=>setForm((f:any)=>({...f,drivetrain:e.target.value}))} className={`${inputClass('drivetrain')}`}>
                <option value="">Привід</option>
                <option value="FWD">Передній</option>
                <option value="RWD">Задній</option>
                <option value="AWD">Повний (AWD)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <select value={form.bodyType} onChange={e=>setForm((f:any)=>({...f,bodyType:e.target.value}))} className={`${inputClass('bodyType')}`}>
                <option value="">Тип кузова</option>
                <option value="sedan">Седан</option>
                <option value="wagon">Універсал</option>
                <option value="hatchback">Хетчбек</option>
                <option value="suv">SUV</option>
                <option value="coupe">Купе</option>
              </select>
              <input value={form.color} onChange={e=>setForm((f:any)=>({...f,color:e.target.value}))} placeholder="Колір" className={`${inputClass('color')}`} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select value={form.gearbox} onChange={e=>setForm((f:any)=>({...f,gearbox:e.target.value}))} className={`${inputClass('gearbox')}`}>
                <option value="">КПП</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
                <option value="CVT">CVT</option>
                <option value="Robot">Robot</option>
              </select>
              <select value={form.fuel} onChange={e=>setForm((f:any)=>({...f,fuel:e.target.value}))} className={`${inputClass('fuel')}`}>
                <option value="">Паливо</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
                <option value="LPG">LPG</option>
              </select>
              <input value={form.pricePLN} onChange={e=>setForm((f:any)=>({...f,pricePLN:e.target.value}))} placeholder="39990" className={`${inputClass('pricePLN')}`} />
              <input value={form.priceUSD} onChange={e=>setForm((f:any)=>({...f,priceUSD:e.target.value}))} placeholder="9990" className={`${inputClass('priceUSD')}`} />
            </div>
            <div>
              <label className="text-sm muted">Куди публікувати</label>
              <select value={form.listingType} onChange={e=>setForm((f:any)=>({...f,listingType:e.target.value}))} className={`w-full mt-1 ${inputClass('listingType')}`}>
                <option value="dealer">Основний каталог BAO AUTO</option>
                <option value="owner">Авто від власників</option>
              </select>
            </div>
            <div className="text-xs muted -mt-1">Два окремі поля: ціна в PLN і ціна в USD. Ніякої автоматичної конвертації.</div>
            

            <label className="text-sm muted">Опис</label>
            <textarea value={form.description} onChange={e=>setForm((f:any)=>({...f,description:e.target.value}))} placeholder="Короткий опис" className={`w-full min-h-[120px] ${inputClass('description')}`} />

            {/* removed admin secret and Publish all per request */}
          </div>

          <div className="xl:col-span-4 premium-card rounded-2xl p-4 sm:p-5 border border-white/10">
            <div className="mb-4">
              <div className="text-sm muted mb-2">Прев'ю</div>
              <div className="w-full h-52 bg-black/25 rounded-xl overflow-hidden flex items-center justify-center border border-white/10">
                { (form.images && String(form.images).split(',')[0]?.trim()) || form.image ? (
                  <img src={(form.images && String(form.images).split(',')[0]?.trim()) || form.image} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h3l2-2h4l2 2h3a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 13l2.5-3 2 2.5L15 9l4 5H5l3-1z" />
                    </svg>
                    <div className="text-sm text-white/60">No image yet</div>
                  </div>
                )}
              </div>
            </div>
              <div className="mb-3">
                  <label className="text-sm muted">Завантажити фото (drag & drop або вибрати)</label>
                  <div
                    onDrop={async (e:any)=>{ e.preventDefault(); setIsDragging(false); const files = Array.from(e.dataTransfer.files || []) as File[]; for(const f of files){ await uploadFile(f) } }}
                    onDragOver={(e)=>{ e.preventDefault(); setIsDragging(true) }}
                    onDragEnter={(e)=>{ e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={(e)=>{ e.preventDefault(); setIsDragging(false) }}
                    className={`w-full p-4 border-2 border-dashed rounded-xl text-center bg-black/20 ${isDragging ? 'border-accent bg-[color:var(--accent)]/10 animate-pulse' : 'border-white/10'}`}>
                    <div className="muted">{isDragging ? 'Відпустіть, щоб завантажити' : 'Перекиньте файли сюди або натисніть "Вибрати"'}</div>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <input id="file-input" type="file" multiple className="hidden" onChange={async (e)=>{ const files = Array.from(e.target.files||[]); for(const f of files) await uploadFile(f) }} />
                      <label htmlFor="file-input" className="px-4 py-2 bg-[var(--accent)] text-black rounded-lg cursor-pointer font-semibold">Вибрати</label>
                    </div>
                    <div className="mt-3 text-xs muted">{isDragging ? 'Файли готові до завантаження' : "Завантажені фото з'являться у прев'ю зверху."}</div>
                  </div>
                
                  {/* Gallery thumbnails: pending and existing */}
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {getImagesArray().map((url: string, i: number)=> (
                      <div
                        key={`img-${i}`}
                        draggable
                        onDragStart={()=>setDragIndex(i)}
                        onDragOver={(e)=>{ e.preventDefault(); setDragOverIndex(i) }}
                        onDrop={(e)=>{ e.preventDefault(); if(dragIndex !== null) moveImage(dragIndex, i); setDragIndex(null); setDragOverIndex(null) }}
                        onDragEnd={()=>{ setDragIndex(null); setDragOverIndex(null) }}
                        className={`relative w-full h-20 rounded overflow-hidden bg-black/10 border ${dragOverIndex === i ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-white/10'}`}>
                        <img src={url} className="w-full h-full object-cover" />
                        <div className="absolute left-1 top-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white/90">{i === 0 ? 'Головне' : i+1}</div>
                        {url.startsWith('blob:') && <div className="absolute left-1 bottom-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)] text-black font-semibold">new</div>}
                        <div className="absolute right-1 top-1 flex gap-1">
                          <button type="button" onClick={()=>removeImage(i)} title="Remove" className="bg-white/80 text-black px-2 py-1 rounded text-xs">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

            <div className="flex gap-2 mt-4">
              <button type="submit" className="px-4 py-3 bg-[var(--accent)] text-black rounded-xl flex-1 font-semibold">{editingId ? 'Save changes' : 'Publish'}</button>
              {editingId ? (
                <button type="button" onClick={()=>{ pendingFiles.forEach(p=>{ try{ URL.revokeObjectURL(p.url) }catch(_){} }); setPendingFiles([]); setEditingId(null); originalRef.current = null; setForm(emptyForm); setStatus('Edit cancelled'); showToast('Edit cancelled') }} className="px-4 py-3 rounded-xl border border-white/20 flex-1">Cancel</button>
              ) : (
                <button type="button" onClick={()=>{ pendingFiles.forEach(p=>{ try{ URL.revokeObjectURL(p.url) }catch(_){} }); setPendingFiles([]); setForm(emptyForm); setStatus('Cleared') }} className="px-4 py-3 rounded-xl border border-white/20 flex-1">Clear</button>
              )}
            </div>
            <div className="mt-3 muted text-sm">{status}</div>
          </div>
        </form>

        {/* local queue removed — publishing happens directly from the form */}

        <section className="relative z-10 mt-8 premium-card rounded-2xl p-4 sm:p-5 border border-white/10">
          <h2 className="font-serif text-2xl mb-4">Опубліковані авто</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={()=>{ setPublishedScope('all'); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg border text-sm ${publishedScope === 'all' ? 'bg-white text-[var(--accent)] border-white/30' : 'border-white/10 text-white/80 hover:bg-white/10'}`}>
              Усі
            </button>
            <button
              type="button"
              onClick={()=>{ setPublishedScope('dealer'); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg border text-sm ${publishedScope === 'dealer' ? 'bg-white text-[var(--accent)] border-white/30' : 'border-white/10 text-white/80 hover:bg-white/10'}`}>
              Каталог BAO AUTO
            </button>
            <button
              type="button"
              onClick={()=>{ setPublishedScope('owner'); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg border text-sm ${publishedScope === 'owner' ? 'bg-white text-[var(--accent)] border-white/30' : 'border-white/10 text-white/80 hover:bg-white/10'}`}>
              Авто від власників
            </button>
          </div>
          <div className="flex gap-2 items-center mb-4">
            <input value={searchTerm} onChange={e=>{ setSearchTerm(e.target.value); setPage(1) }} placeholder="Пошук по назві, марці, моделі, VIN" className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] flex-1" />
            <div className="text-sm muted">{filteredPublished.length} записів</div>
          </div>
          {loadingPublished && <div className="muted">Завантаження...</div>}
          {!loadingPublished && publishedCars.length===0 && <div className="muted">Поки що немає опублікованих авто.</div>}
          <div className="grid gap-4 mt-4 max-w-4xl">
            {publishedSlice.map((p,i)=> (
              <div key={p.id || i} className={"p-4 bg-gradient-to-br from-white/[0.05] to-black/20 rounded-2xl shadow-sm flex items-start gap-4 border border-white/10" + (editingId === p.id ? ' ring-2 ring-[color:var(--accent)]' : '')}>
                <div className="w-36 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-black/10">
                    <img src={(p.images && p.images[0]) || p.image || '/images/placeholder.png'} alt={p.title || 'preview'} className="w-full h-full object-cover" />
                  </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-lg flex items-center gap-2">
                        <span>{p.title || p.make}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${String(p.listing_type || 'dealer') === 'owner' ? 'border-emerald-400/40 text-emerald-300' : 'border-white/20 text-white/70'}`}>
                          {String(p.listing_type || 'dealer') === 'owner' ? 'Від власника' : 'Каталог BAO AUTO'}
                        </span>
                      </div>
                      <div className="muted text-sm">{p.year} · {p.km ? p.km.toLocaleString('en-US') : '—'} km · {p.gearbox}</div>
                    </div>
                    <div className="text-right">
                      <div className="bg-white text-[var(--accent)] font-semibold px-3 py-1 rounded-full shadow-sm">{getCarPricePLN(p) != null ? formatPLN(getCarPricePLN(p)) : ''}</div>
                      <div className="mt-1 text-xs muted">{getCarPriceUSD(p) != null ? formatUSD(getCarPriceUSD(p)) : ''}</div>
                    </div>
                  </div>
                    <div className="mt-3 flex gap-2">
                    <button onClick={()=>startEditingWithOriginal(p)} className="px-4 py-2 rounded border">Редагувати</button>
                    {editingId === p.id && (
                      <div className="flex items-center gap-2">
                        <div className="grid grid-cols-3 gap-2 mr-2">
                          {getImagesArray().map((u: string, i: number)=> (
                            <img key={i} src={u} className="w-12 h-8 object-cover rounded" />
                          ))}
                          {pendingFiles.map((pf,i)=> (
                            <img key={`pnew-${i}`} src={pf.url} className="w-12 h-8 object-cover rounded opacity-90 border-2 border-dashed border-white/20" />
                          ))}
                        </div>
                      </div>
                    )}
                    <button onClick={async ()=>{
                      if(!p.id) return
                      if(!confirm('Підтвердити видалення цього авто?')) return
                      try{
                        setStatus('Deleting...')
                        const res = await fetch('/api/admin/deleteCar', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: p.id, secret: form.secret })})
                        const d = await res.json()
                        if(res.ok){
                          setPublishedCars(old=> old.filter(x=> x.id !== p.id))
                          setStatus('Deleted')
                          showToast('Deleted', 'error')
                        }else{
                          setStatus(d.error || 'Delete error')
                        }
                      }catch(e){ console.error(e); setStatus('Delete error') }
                    }} className="px-4 py-2 bg-red-600 text-white rounded">Видалити</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button disabled={publishedPage<=1} onClick={()=>setPage(publishedPage-1)} className="px-3 py-1 rounded border">Назад</button>
            <div className="muted text-sm">Сторінка {publishedPage} з {totalPages}</div>
            <button disabled={publishedPage>=totalPages} onClick={()=>setPage(publishedPage+1)} className="px-3 py-1 rounded border">Далі</button>
          </div>
        </section>
        {toast && (
          <div className="fixed right-4 bottom-6 z-50">
            <div className={`px-4 py-2 rounded shadow-md ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-white text-black'}`}>
              {toast.message}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
