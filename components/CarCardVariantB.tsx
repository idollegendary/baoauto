import Link from 'next/link'
import { formatPLN } from '../lib/formatPrice'

export default function CarCardVariantB({car}:{car:any}){
  return (
    <article className="relative rounded-2xl overflow-hidden premium-card car-animate h-48 sm:h-56 md:h-64">
      <img src={car.image} alt={car.title} className="absolute inset-0 w-full h-full object-cover filter brightness-75" />
      <div className="relative p-4 sm:p-6 h-full flex flex-col justify-end pb-12" />

      <div className="absolute left-3 bottom-3 text-white max-w-[65%]">
        <h3 className="text-base sm:text-lg font-semibold leading-tight"><Link href={`/car/${car.id}`}>{car.title}</Link></h3>
        <div className="mt-1 muted text-xs sm:text-sm">{car.year} · {car.km ? car.km.toLocaleString('en-US') : '—'} km · {car.gearbox}</div>
      </div>

      <div className="absolute right-3 bottom-3">
        <Link href={`/car/${car.id}`} className="inline-block px-3 py-1 rounded-md border border-white text-white bg-black/20 hover:bg-white/10 text-sm">Деталі</Link>
      </div>
      <div className="absolute right-3 top-3 bg-white text-[var(--accent)] font-semibold px-3 py-1 rounded-full shadow-sm">{car.price ? formatPLN(car.price) : ''}</div>
    </article>
  )
}
