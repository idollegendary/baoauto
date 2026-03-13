import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { absoluteUrl } from '../lib/seo'

const CONTACTS = {
  phones: ['+48 600 123 456', '+380 67 123 45 67'],
  email: 'baoauto.sales@gmail.com',
  address: 'Warszawa, Polska, Aleje Jerozolimskie 54',
  hours: [
    'Пн - Пт: 09:00 - 19:00',
    'Сб: 10:00 - 16:00',
    'Нд: за попереднім записом'
  ],
  socials: [
    {label: 'Instagram', href: 'https://instagram.com/baoauto'},
    {label: 'Telegram', href: 'https://t.me/baoauto'},
    {label: 'Facebook', href: 'https://facebook.com/baoauto'}
  ]
}

export default function ContactsPage(){
  const canonical = absoluteUrl('/contacts')
  const title = 'Контакти - BAO AUTO'
  const description = 'Контакти BAO AUTO: телефони, адреса у Варшаві, соцмережі, графік роботи та швидкий зв\'язок для підбору авто.'
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACTS.address)}`

  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={absoluteUrl('/logo_baoauto.png')} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={absoluteUrl('/logo_baoauto.png')} />
      </Head>

      <main className="container-wide py-6 sm:py-8 relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(180,136,107,0.2),transparent_65%)]" />
        <Header />

        <section className="relative z-10 premium-card rounded-3xl p-5 sm:p-8 mt-6 border border-white/10 overflow-hidden">
          <div className="absolute -left-20 -top-20 w-72 h-72 rounded-full bg-[var(--accent)]/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="text-xs uppercase tracking-[0.18em] text-white/55">BAO AUTO</div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">Контакти та співпраця</h1>
            <p className="mt-4 text-white/75 leading-relaxed">
              Ми підбираємо авто з Європи під ваш бюджет, проводимо технічну та юридичну перевірку,
              допомагаємо з логістикою та оформленням документів. Якщо хочете консультацію або підбір
              конкретної моделі, напишіть нам у зручному каналі.
            </p>
          </div>
        </section>

        <section className="relative z-10 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <article className="premium-card rounded-2xl p-5 border border-white/10 lg:col-span-2">
            <h2 className="text-xl font-semibold">Наші контакти</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm text-white/55">Телефони</div>
                <div className="mt-2 flex flex-col gap-1">
                  {CONTACTS.phones.map((phone)=> (
                    <a key={phone} href={`tel:${phone.replace(/\s+/g,'')}`} className="text-white/90 hover:text-white">
                      {phone}
                    </a>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm text-white/55">Email</div>
                <a href={`mailto:${CONTACTS.email}`} className="mt-2 block text-white/90 hover:text-white break-all">
                  {CONTACTS.email}
                </a>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:col-span-2">
                <div className="text-sm text-white/55">Адреса</div>
                <p className="mt-2 text-white/90">{CONTACTS.address}</p>
                <a href={mapsLink} target="_blank" rel="noreferrer" className="inline-block mt-3 px-3 py-2 rounded-lg border border-white/15 hover:bg-white/10 text-sm">
                  Відкрити на мапі
                </a>
              </div>
            </div>
          </article>

          <aside className="premium-card rounded-2xl p-5 border border-white/10">
            <h2 className="text-xl font-semibold">Графік</h2>
            <ul className="mt-4 space-y-2 text-white/80 text-sm">
              {CONTACTS.hours.map((line)=> <li key={line}>{line}</li>)}
            </ul>
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-sm text-white/55">Швидка заявка</div>
              <p className="mt-2 text-sm text-white/80">Надішліть VIN або посилання на авто, і ми повернемось з оцінкою та умовами.</p>
            </div>
          </aside>
        </section>

        <section className="relative z-10 mt-6 premium-card rounded-2xl p-5 border border-white/10">
          <h2 className="text-xl font-semibold">Ми в соцмережах</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CONTACTS.socials.map((item)=> (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full border border-white/15 bg-white/[0.03] hover:bg-white/10 text-sm"
              >
                {item.label}
              </a>
            ))}
          </div>
        </section>

        <Footer />
      </main>
    </div>
  )
}
