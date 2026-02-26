import { useState, useEffect, useRef } from 'react'
import { formatPLN } from '../../lib/formatPrice'
import Head from 'next/head'
import Header from '../../components/Header'

export default function Admin(){
  const [form, setForm] = useState({ title:'', make:'', model:'', generation:'', year:'', km:'', price:'', images:'', image:'', description:'', vin:'', engineVolume:'', power:'', drivetrain:'', emissionStandard:'', bodyType:'', color:'' })
  const [status, setStatus] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [publishedCars, setPublishedCars] = useState<any[]>([])
  const [loadingPublished, setLoadingPublished] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(()=>{
    loadPublished()
  }, [])

  const formRef = useRef<HTMLFormElement | null>(null)

  const startEditing = (p:any) => {
    setForm({ title: p.title||'', make:p.make||'', model:p.model||'', generation:p.generation||'', year:p.year||'', km:p.km||'', price:p.price||'', images:p.images||'', image:p.image||'', description:p.description||'', vin:p.vin||'', engineVolume:p.engine_volume||'', power:p.power||'', drivetrain:p.drivetrain||'', emissionStandard:p.emission_standard||'', bodyType:p.body_type||'', color:p.color||'' })
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

  const inputClass = (field:string) => `p-3 bg-black/5 rounded border border-white/10 ${editingId && isChanged(field) ? 'ring-2 ring-green-400' : ''}`

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
    if(!searchTerm) return true
    const s = String(searchTerm).toLowerCase()
    return [p.title, p.make, p.model, p.vin, p.id].some((v:any)=> v && String(v).toLowerCase().includes(s))
  })
  const totalPages = Math.max(1, Math.ceil(filteredPublished.length / PAGE_SIZE))
  const publishedPage = Math.max(1, Math.min(page, totalPages))
  const publishedSlice = filteredPublished.slice((publishedPage-1)*PAGE_SIZE, publishedPage*PAGE_SIZE)
  const [pendingFiles, setPendingFiles] = useState<Array<{file: File, url: string}>>([])
  const [isDragging, setIsDragging] = useState(false)

  const removePending = (index:number)=>{
    const pf = pendingFiles[index]
    if(pf){ try{ URL.revokeObjectURL(pf.url) }catch(_){} }
    const newPending = pendingFiles.filter((_,i)=>i!==index)
    setPendingFiles(newPending)
    // if removed was main, pick new main from remaining pending or existing images
    setForm(f=>{
      const existing = getImagesArray()
      const newMain = (newPending[0] && newPending[0].url) || existing[0] || ''
      return {...f, image: newMain}
    })
  }

  const getImagesArray = ()=>{
    if(!form.images) return []
    if(Array.isArray(form.images)) return form.images
    try{ return String(form.images).split(',').map((s:string)=>s.trim()).filter(Boolean) }catch{ return [] }
  }

  const removeImage = (index:number)=>{
    const arr = getImagesArray()
    arr.splice(index,1)
    const cleaned = arr.filter(Boolean)
    setForm(f=>({...f, images: cleaned.join(', '), image: cleaned[0] || '' }))
  }

  // main selection removed: first image will be considered main

  // queue file locally and show preview; actual upload happens on Publish
  function uploadFile(file: File){
    try{
      const url = URL.createObjectURL(file)
      setPendingFiles(p=>{
        const next = [...p, {file, url}]
        // if no main image yet, set preview main to first pending
        if(!form.image && next[0]){
          setForm(f=>({...f, image: next[0].url}))
        }
        return next
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
    const car = Object.assign({}, form)
    if(car.images && typeof car.images === 'string'){
      car.images = car.images.split(',').map((s:string)=>s.trim()).filter(Boolean)
    }
    // if there are pending files, upload them now and merge into images
    if(pendingFiles.length>0){
      const uploadedUrls:string[] = []
      for(const pf of pendingFiles){
        try{
          setStatus('Uploading file...')
          const fd = new FormData()
          fd.append('file', pf.file)
          const res = await fetch('/api/admin/upload', {method:'POST', body: fd})
          const data = await res.json()
          if(res.ok && data.url){
            uploadedUrls.push(data.url)
          }else{
            console.warn('upload failed for file', data)
          }
        }catch(err){
          console.error('upload error', err)
        }finally{
          // revoke preview URL
          try{ URL.revokeObjectURL(pf.url) }catch(_){}
        }
      }
      // prepend uploaded urls to existing images and clean
      const current = car.images && Array.isArray(car.images) ? car.images.slice() : []
      // remove any temporary object URLs (blob:...) from current
      const cleanedCurrent = current.filter((u:any)=> u && typeof u === 'string' && !u.startsWith('blob:'))
      const merged = [...uploadedUrls, ...cleanedCurrent].filter(Boolean)
      // dedupe while preserving order
      car.images = Array.from(new Set(merged))
      // ensure the main image is the first uploaded public URL (not a blob: preview)
      if(uploadedUrls.length>0){
        car.image = uploadedUrls[0]
      }else if(!car.image && car.images.length>0){
        car.image = car.images[0]
      }
      // clear pending files
      setPendingFiles([])
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
        setForm({ title:'', make:'', model:'', generation:'', year:'', km:'', price:'', images:'', image:'', description:'', vin:'', engineVolume:'', power:'', drivetrain:'', emissionStandard:'', bodyType:'', color:'' })
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
        setForm({ title:'', make:'', model:'', generation:'', year:'', km:'', price:'', images:'', image:'', description:'', vin:'', engineVolume:'', power:'', drivetrain:'', emissionStandard:'', bodyType:'', color:'' })
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
      <main className="container-wide py-8">
        <Header />
        <h1 className="text-2xl font-serif mb-4">Admin — Додати машину</h1>
        <form ref={formRef} onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl items-start">
          <div className="md:col-span-2 grid gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">{editingId ? 'Редагування авто' : 'Додати машину'}</h2>
              {editingId && <div className="text-sm text-white/60">Редагування: {editingId}</div>}
            </div>
            <label className="text-sm muted">Назва</label>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Audi A4 B8" className={`w-full ${inputClass('title')}`} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm muted">Марка</label>
                <input value={form.make} onChange={e=>setForm(f=>({...f,make:e.target.value}))} placeholder="Make" className={`w-full ${inputClass('make')}`} />
              </div>
              <div>
                <label className="text-sm muted">Модель</label>
                <input value={form.model} onChange={e=>setForm(f=>({...f,model:e.target.value}))} placeholder="Model" className={`w-full ${inputClass('model')}`} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input value={form.generation} onChange={e=>setForm(f=>({...f,generation:e.target.value}))} placeholder="Покоління" className={`${inputClass('generation')}`} />
              <select value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))} className={`${inputClass('year')}`}>
                <option value="">Рік</option>
                {Array.from({length: 37}).map((_,i)=>{
                  const y = 2026 - i
                  return <option key={y} value={String(y)}>{y}</option>
                })}
              </select>
              <input value={form.km} onChange={e=>setForm(f=>({...f,km:e.target.value}))} placeholder="Пробіг (км)" className={`${inputClass('km')}`} />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <input value={form.vin} onChange={e=>setForm(f=>({...f,vin:e.target.value}))} placeholder="VIN" className={`${inputClass('vin')}`} />
              <select value={form.emissionStandard} onChange={e=>setForm(f=>({...f,emissionStandard:e.target.value}))} className={`${inputClass('emissionStandard')}`}>
                <option value="">Екостандарт</option>
                <option value="Euro 5">Euro 5</option>
                <option value="Euro 6">Euro 6</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-2">
              <input value={form.engineVolume} onChange={e=>setForm(f=>({...f,engineVolume:e.target.value}))} placeholder="Об'єм, напр. 1.8" className={`${inputClass('engineVolume')}`} />
              <input value={form.power} onChange={e=>setForm(f=>({...f,power:e.target.value}))} placeholder="Потужність (к.с.)" className={`${inputClass('power')}`} />
              <select value={form.drivetrain} onChange={e=>setForm(f=>({...f,drivetrain:e.target.value}))} className={`${inputClass('drivetrain')}`}>
                <option value="">Привід</option>
                <option value="FWD">Передній</option>
                <option value="RWD">Задній</option>
                <option value="AWD">Повний (AWD)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <select value={form.bodyType} onChange={e=>setForm(f=>({...f,bodyType:e.target.value}))} className={`${inputClass('bodyType')}`}>
                <option value="">Тип кузова</option>
                <option value="sedan">Седан</option>
                <option value="wagon">Універсал</option>
                <option value="hatchback">Хетчбек</option>
                <option value="suv">SUV</option>
                <option value="coupe">Купе</option>
              </select>
              <input value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} placeholder="Колір" className={`${inputClass('color')}`} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <select value={form.gearbox} onChange={e=>setForm(f=>({...f,gearbox:e.target.value}))} className={`${inputClass('gearbox')}`}>
                <option value="">КПП</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
                <option value="CVT">CVT</option>
                <option value="Robot">Robot</option>
              </select>
              <select value={form.fuel} onChange={e=>setForm(f=>({...f,fuel:e.target.value}))} className={`${inputClass('fuel')}`}>
                <option value="">Паливо</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
                <option value="LPG">LPG</option>
              </select>
              <input value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="€7,500" className={`${inputClass('price')}`} />
            </div>
            

            <label className="text-sm muted">Опис</label>
            <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Короткий опис" className={`w-full min-h-[120px] ${inputClass('description')}`} />

            {/* removed admin secret and Publish all per request */}
          </div>

          <div className="md:col-span-1">
            <div className="mb-4">
              <div className="text-sm muted mb-2">Прев'ю</div>
              <div className="w-full h-48 bg-black/5 rounded overflow-hidden flex items-center justify-center">
                { (pendingFiles[0] && pendingFiles[0].url) || (form.images && String(form.images).split(',')[0]?.trim()) || form.image ? (
                  <img src={(pendingFiles[0] && pendingFiles[0].url) || (form.images && String(form.images).split(',')[0]?.trim()) || form.image} alt="preview" className="w-full h-full object-cover" />
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
                    onDrop={async (e:any)=>{ e.preventDefault(); setIsDragging(false); const files = Array.from(e.dataTransfer.files || []); for(const f of files){ await uploadFile(f) } }}
                    onDragOver={(e)=>{ e.preventDefault(); setIsDragging(true) }}
                    onDragEnter={(e)=>{ e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={(e)=>{ e.preventDefault(); setIsDragging(false) }}
                    className={`w-full p-4 border-2 border-dashed rounded text-center bg-black/3 ${isDragging ? 'border-accent bg-[color:var(--accent)]/10 animate-pulse' : 'border-white/10'}`}>
                    <div className="muted">{isDragging ? 'Відпустіть, щоб завантажити' : 'Перекиньте файли сюди або натисніть "Вибрати"'}</div>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <input id="file-input" type="file" multiple className="hidden" onChange={async (e)=>{ const files = Array.from(e.target.files||[]); for(const f of files) await uploadFile(f) }} />
                      <label htmlFor="file-input" className="px-4 py-2 bg-white text-[var(--accent)] rounded cursor-pointer">Вибрати</label>
                    </div>
                    <div className="mt-3 text-xs muted">{isDragging ? 'Файли готові до завантаження' : "Завантажені фото з'являться у прев'ю зверху."}</div>
                  </div>
                
                  {/* Gallery thumbnails: pending and existing */}
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {pendingFiles.map((p, i)=> (
                      <div key={`pending-${i}`} className="relative w-full h-20 rounded overflow-hidden bg-black/10">
                        <img src={p.url} className="w-full h-full object-cover" />
                        <div className="absolute right-1 top-1 flex gap-1">
                          <button type="button" onClick={()=>removePending(i)} title="Remove" className="bg-white/80 text-black px-2 py-1 rounded text-xs">✕</button>
                        </div>
                      </div>
                    ))}

                    {getImagesArray().map((url, i)=> (
                      <div key={`img-${i}`} className="relative w-full h-20 rounded overflow-hidden bg-black/10">
                        <img src={url} className="w-full h-full object-cover" />
                        <div className="absolute right-1 top-1 flex gap-1">
                          <button type="button" onClick={()=>removeImage(i)} title="Remove" className="bg-white/80 text-black px-2 py-1 rounded text-xs">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

            <div className="flex gap-2">
              <button type="submit" className="px-4 py-3 bg-white text-[var(--accent)] rounded flex-1">{editingId ? 'Save changes' : 'Publish'}</button>
              {editingId ? (
                <button type="button" onClick={()=>{ pendingFiles.forEach(p=>{ try{ URL.revokeObjectURL(p.url) }catch(_){} }); setPendingFiles([]); setEditingId(null); originalRef.current = null; setForm({title:'', make:'', model:'', generation:'', year:'', km:'', price:'', images:'', image:'', description:'', vin:'', engineVolume:'', power:'', drivetrain:'', emissionStandard:'', bodyType:'', color:''}); setStatus('Edit cancelled'); showToast('Edit cancelled') }} className="px-4 py-3 rounded border flex-1">Cancel</button>
              ) : (
                <button type="button" onClick={()=>{ pendingFiles.forEach(p=>{ try{ URL.revokeObjectURL(p.url) }catch(_){} }); setPendingFiles([]); setForm({title:'', make:'', model:'', generation:'', year:'', km:'', price:'', images:'', image:'', description:'', vin:'', engineVolume:'', power:'', drivetrain:'', emissionStandard:'', bodyType:'', color:''}); setStatus('Cleared') }} className="px-4 py-3 rounded border flex-1">Clear</button>
              )}
            </div>
            <div className="mt-3 muted text-sm">{status}</div>
          </div>
        </form>

        {/* local queue removed — publishing happens directly from the form */}

        <section className="mt-8">
          <h2 className="font-serif text-2xl mb-4">Опубліковані авто</h2>
          <div className="flex gap-2 items-center mb-4">
            <input value={searchTerm} onChange={e=>{ setSearchTerm(e.target.value); setPage(1) }} placeholder="Пошук по назві, марці, моделі, VIN" className="p-2 rounded border bg-black/5 flex-1" />
            <div className="text-sm muted">{filteredPublished.length} записів</div>
          </div>
          {loadingPublished && <div className="muted">Завантаження...</div>}
          {!loadingPublished && publishedCars.length===0 && <div className="muted">Поки що немає опублікованих авто.</div>}
          <div className="grid gap-4 mt-4 max-w-4xl">
            {publishedSlice.map((p,i)=> (
              <div key={p.id || i} className={"p-4 bg-gradient-to-br from-black/5 to-black/2 rounded-2xl shadow-sm flex items-start gap-4" + (editingId === p.id ? ' ring-2 ring-[color:var(--accent)]' : '')}>
                <div className="w-36 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-black/10">
                    <img src={(p.images && p.images[0]) || p.image || '/images/placeholder.png'} alt={p.title || 'preview'} className="w-full h-full object-cover" />
                  </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-lg">{p.title || p.make}</div>
                      <div className="muted text-sm">{p.year} · {p.km ? p.km.toLocaleString('en-US') : '—'} km · {p.gearbox}</div>
                    </div>
                    <div className="text-right">
                      <div className="bg-white text-[var(--accent)] font-semibold px-3 py-1 rounded-full shadow-sm">{p.price ? formatPLN(p.price) : ''}</div>
                    </div>
                  </div>
                    <div className="mt-3 flex gap-2">
                    <button onClick={()=>startEditingWithOriginal(p)} className="px-4 py-2 rounded border">Редагувати</button>
                    {editingId === p.id && (
                      <div className="flex items-center gap-2">
                        <div className="grid grid-cols-3 gap-2 mr-2">
                          {getImagesArray().map((u,i)=> (
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
