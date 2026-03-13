import Link from 'next/link'
import Image from 'next/image'
import { Gauge, Calendar, Settings2, Fuel } from 'lucide-react'
import { formatCarPricePLN, formatCarPriceUSD } from '../lib/formatPrice'

export default function CarCardPremium({ car }: { car: any }) {
  const imageSrc = car.image || '/images/placeholder-car.jpg'
  const mileage = car.km ? `${Number(car.km).toLocaleString('en-US')} km` : '---'
  const year = car.year ? String(car.year) : '---'
  const gearbox = car.gearbox || '---'
  const fuel = car.fuel || '---'
  const pricePLN = formatCarPricePLN(car)
  const priceUSD = formatCarPriceUSD(car)

  return (
    <article className="group relative rounded-3xl overflow-hidden premium-card car-animate border border-white/10 h-[270px] sm:h-[300px] md:h-[320px]">
      <Image src={imageSrc} alt={car.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="absolute inset-0 w-full h-full object-cover" />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />

      <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-[var(--accent)] text-black font-semibold text-xs px-3 py-1.5 shadow-lg">
        {pricePLN || 'Ціну уточнюйте'}
      </div>

      <div className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[11px] text-white/90 backdrop-blur-sm">
        Premium Pick
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <h3 className="text-white text-base sm:text-lg font-semibold leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] pr-2">
          <Link href={`/car/${car.id}`} className="hover:text-[var(--accent)] transition-colors duration-200">
            {car.title}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-white/90">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2 py-1 backdrop-blur-sm">
            <Calendar className="h-3 w-3" />
            <span>{year}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2 py-1 backdrop-blur-sm">
            <Gauge className="h-3 w-3" />
            <span>{mileage}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2 py-1 backdrop-blur-sm">
            <Settings2 className="h-3 w-3" />
            <span className="hidden sm:inline">{gearbox}</span>
            <span className="sm:hidden">КПП</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/35 px-2 py-1 backdrop-blur-sm">
            <Fuel className="h-3 w-3" />
            <span>{fuel}</span>
          </span>
        </div>

        <div className="mt-2.5 flex justify-end">
          {priceUSD && <span className="mr-2 self-center text-[11px] text-white/70">USD: {priceUSD}</span>}
          <Link href={`/car/${car.id}`} className="inline-flex items-center rounded-lg border border-white/25 bg-black/45 px-3 py-1.5 text-xs sm:text-sm text-white hover:bg-black/60 transition-colors duration-200">
            Деталі
          </Link>
        </div>
      </div>
    </article>
  )
}
