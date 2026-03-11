import Link from 'next/link'
import { Gauge, Calendar, Settings2, Fuel } from 'lucide-react'
import { formatPLN } from '../lib/formatPrice'

export default function CarCardPremium({ car }: { car: any }) {
  const imageSrc = car.image || '/images/placeholder-car.jpg'
  const mileage = car.km ? `${Number(car.km).toLocaleString('en-US')} km` : '---'
  const year = car.year ? String(car.year) : '---'
  const gearbox = car.gearbox || '---'
  const fuel = car.fuel || '---'

  return (
    <article className="group relative rounded-3xl overflow-hidden premium-card car-animate border border-white/10 h-[290px] sm:h-[320px]">
      <img src={imageSrc} alt={car.title} className="absolute inset-0 w-full h-full object-cover" />

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

      <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-[var(--accent)] text-black font-semibold text-xs px-3 py-1.5 shadow-lg">
        {car.price ? formatPLN(car.price) : 'Ціну уточнюйте'}
      </div>

      <div className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur-sm">
        Premium Pick
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <h3 className="text-white text-lg sm:text-xl font-semibold leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
          <Link href={`/car/${car.id}`} className="hover:text-[var(--accent)] transition-colors duration-200">
            {car.title}
          </Link>
        </h3>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-white/15 bg-black/35 px-2.5 py-2 text-white/90 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-white/70">
              <Calendar className="h-3.5 w-3.5" />
              <span>Рік</span>
            </div>
            <div className="mt-1 font-medium">{year}</div>
          </div>

          <div className="rounded-lg border border-white/15 bg-black/35 px-2.5 py-2 text-white/90 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-white/70">
              <Gauge className="h-3.5 w-3.5" />
              <span>Пробіг</span>
            </div>
            <div className="mt-1 font-medium">{mileage}</div>
          </div>

          <div className="rounded-lg border border-white/15 bg-black/35 px-2.5 py-2 text-white/90 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-white/70">
              <Settings2 className="h-3.5 w-3.5" />
              <span>КПП</span>
            </div>
            <div className="mt-1 font-medium">{gearbox}</div>
          </div>

          <div className="rounded-lg border border-white/15 bg-black/35 px-2.5 py-2 text-white/90 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-white/70">
              <Fuel className="h-3.5 w-3.5" />
              <span>Паливо</span>
            </div>
            <div className="mt-1 font-medium">{fuel}</div>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Link href={`/car/${car.id}`} className="inline-flex items-center rounded-lg border border-white/25 bg-black/45 px-3 py-1.5 text-sm text-white hover:bg-black/60 transition-colors duration-200">
            Деталі
          </Link>
        </div>
      </div>
    </article>
  )
}
