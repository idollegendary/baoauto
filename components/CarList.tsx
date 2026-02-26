import CarCardVariantB from './CarCardVariantB'

export default function CarList({cars}:{cars:any[]}){
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cars.map((c)=> (
        <CarCardVariantB key={c.id} car={c} />
      ))}
    </div>
  )
}
