export default function BaoInfo(){
  const phone = '+48-662-722-070'
  const address = 'Częstochowa ul. powstańców warszawy 32'
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

  return (
    <section className="premium-card rounded-2xl p-6 sm:p-8 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-serif">BAO AUTO</h3>
          <p className="mt-2 muted">✅ <a href={`tel:${phone}`} className="underline">{phone}</a></p>
          <p className="muted mt-1">📍 <a className="underline" href={maps} target="_blank" rel="noreferrer">{address} — Маршрут</a></p>
        </div>

        <div className="sm:text-right">
          <p className="font-semibold">Автовикуп автомобілів в Європі!</p>
          <p className="muted mt-2">Самі кращі ціни і умови.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ul className="muted list-disc pl-5">
          <li>авто на Польських номерах</li>
          <li>авто на Українських номерах</li>
          <li>обмін</li>
        </ul>
        <ul className="muted list-disc pl-5">
          <li>розстрочка</li>
          <li>кредит</li>
          <li>оренда евакуатора</li>
        </ul>
      </div>

      <p className="mt-4">Купляємо та продаємо — індивідуальний підхід, повний супровід угоди.</p>
    </section>
  )
}
