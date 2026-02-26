import Link from 'next/link'
import { formatPLN } from '../lib/formatPrice'

export default function CarCardVariantA({car}:{car:any}){
  return (
    <article className="relative premium-card p-4 rounded-2xl flex gap-4 items-center car-animate">
      <div className="car-image-frame overflow-hidden rounded-lg" style={{width:140,height:90}}>
        <img src={car.image} alt={car.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-base truncate">{car.title}</h4>
        </div>
        <p className="muted text-sm mt-2">{car.year} · {car.km ? car.km.toLocaleString('en-US') : '—'} km · {car.gearbox}</p>
      </div>
      <div className="ml-auto flex items-center">
        <Link href={`/car/${car.id}`} className="ml-4 inline-block px-3 py-2 rounded-md border border-white text-white hover:bg-white/5">Деталі</Link>
      </div>

      <div className="absolute right-3 top-3 bg-white text-[var(--accent)] font-semibold px-3 py-1 rounded-full shadow-sm">{car.price ? formatPLN(car.price) : ''}</div>
    </article>
  )
}
