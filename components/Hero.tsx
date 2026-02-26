import Image from 'next/image'

export default function Hero({title, subtitle}:{title:string, subtitle:string}){
  return (
    <section className="relative premium-card rounded-2xl p-6 sm:p-12 mb-8">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="flex-1">
          <h1 className="font-serif text-3xl sm:text-5xl leading-tight">{title}</h1>
          <p className="muted mt-4 max-w-xl">{subtitle}</p>
          <div className="mt-6 flex gap-3">
            <a className="px-4 py-2 border border-white/10 rounded-md">Оглянути новинки</a>
            <a className="px-4 py-2 bg-[var(--accent)] text-black rounded-md">Зв'язатися</a>
          </div>
        </div>
        <div className="w-full sm:w-80 h-48 sm:h-56 relative overflow-hidden rounded-xl">
          <Image src="https://images.unsplash.com/photo-1549921296-3b2ec5f73b1f?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=3b8" fill alt="car" className="object-cover" />
        </div>
      </div>
    </section>
  )
}
