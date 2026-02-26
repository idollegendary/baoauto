import Link from 'next/link'
import { formatPLN } from '../lib/formatPrice'

export default function CarCardVariantC({car}:{car:any}){
  return (
    <article className="relative rounded-2xl overflow-hidden premium-card car-animate p-4">
      <h3 className="font-semibold mb-2">{car.title}</h3>

      <div className="flex items-center gap-4">
        <div className="w-24 h-16 overflow-hidden rounded-lg">
          <img src={car.image} alt={car.title} className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="muted text-sm">{car.year} · {car.km ? car.km.toLocaleString('en-US') : '—'} km</div>
          <div className="muted text-sm">{car.gearbox}</div>
        </div>
      </div>

      <div className="absolute right-3 bottom-3">
        <Link href={`/car/${car.id}`} className="inline-block px-4 py-2 border border-white text-white rounded-md">Деталі</Link>
      </div>

      <div className="absolute right-3 top-3 bg-white text-[var(--accent)] font-semibold px-3 py-1 rounded-full shadow-sm">{car.price ? formatPLN(car.price) : ''}</div>
    </article>
  )
}
