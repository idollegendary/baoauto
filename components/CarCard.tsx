import { formatPLN } from '../lib/formatPrice'

export default function CarCard({car}:{car:any}){
  return (
    <article className="premium-card p-4 rounded-2xl flex gap-4 items-center group">
      <div className="car-image-frame relative">
        <img src={car.image} alt={car.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="car-title text-lg">{car.title}</h3>
            <p className="muted text-sm">{car.year} · {car.km ? car.km.toLocaleString('en-US') : '—'} km · {car.gearbox}</p>
          </div>
          <div className="text-right">
            <div className="car-price">{car.price ? formatPLN(car.price) : ''}</div>
          </div>
        </div>

        <div className="mt-4">
          <a href="#" className="inline-block px-4 py-2 border border-white/10 rounded-md muted">Деталі</a>
        </div>
      </div>
    </article>
  )
}
