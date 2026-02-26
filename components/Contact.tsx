export default function Contact({phone,address}:{phone:string,address:string}){
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  return (
    <section className="premium-card rounded-xl p-6 mt-8">
      <h4 className="font-semibold">Контакти</h4>
      <p className="muted mt-2">Телефон: <a href={`tel:${phone}`}>{phone}</a></p>
      <p className="muted mt-1">Адреса: <a className="underline" href={maps} target="_blank" rel="noreferrer">{address} → Маршрут</a></p>
    </section>
  )
}
