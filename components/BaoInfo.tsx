export default function BaoInfo(){
  const phone = '+48-662-722-070'
  const address = 'Częstochowa ul. powstańców warszawy 32'
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold tracking-wide">BAO AUTO</h3>
          <p className="mt-1 text-white/75 text-sm leading-relaxed">Автовикуп і продаж авто в Європі</p>
        </div>
        <span className="inline-flex items-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-2.5 py-1 text-[11px] text-[var(--accent)] whitespace-nowrap">
          Premium Service
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:text-sm">
        <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-white/85 text-center">Польські номера</span>
        <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-white/85 text-center">Українські номера</span>
        <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-white/85 text-center">Обмін</span>
        <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-white/85 text-center">Розстрочка</span>
        <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-white/85 text-center">Кредит</span>
        <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-white/85 text-center">Евакуатор</span>
      </div>

      <div className="mt-3 space-y-1.5 text-sm">
        <p className="text-white/90">
          📞 <a href={`tel:${phone}`} className="underline underline-offset-2">{phone}</a>
        </p>
        <p className="text-white/80 leading-relaxed">
          📍 <a className="underline underline-offset-2" href={maps} target="_blank" rel="noreferrer">{address}</a>
        </p>
      </div>

      <p className="mt-3 text-sm text-white/70 leading-relaxed">Індивідуальний підхід, перевірені авто, повний супровід угоди.</p>
    </section>
  )
}
