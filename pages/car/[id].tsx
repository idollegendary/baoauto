import fs from 'fs'
import path from 'path'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode, Keyboard, Navigation, Thumbs } from 'swiper'
import type { Swiper as SwiperInstance } from 'swiper'
import { BatteryCharging, Calendar, Car, CircleDot, Cog, Droplets, Fuel, Gauge, Leaf, Palette, ShieldCheck, Sparkles, Tags, TimerReset, Wrench } from 'lucide-react'
import Header from '../../components/Header'
import BaoInfo from '../../components/BaoInfo'
import Footer from '../../components/Footer'
import { sampleCars } from '../../data/sampleCars'
import { formatPLN } from '../../lib/formatPrice'

type AnyCar = Record<string, any>

type CarPageProps = {
  car: AnyCar
  images: string[]
}

type SpecItem = {
  icon: ReactNode
  label: string
  value: string
}

function resolveDrivetrainLabel(value: string) {
  if (value === 'FWD') return 'Передній'
  if (value === 'RWD') return 'Задній'
  if (value === 'AWD') return 'Повний (AWD)'
  return value
}

function normalizeToImages(input: unknown) {
  if (Array.isArray(input)) {
    return input
      .map((item) => String(item || '').trim())
      .filter(Boolean)
  }

  if (typeof input === 'string') {
    const value = input.trim()
    if (!value) return []

    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item || '').trim())
          .filter(Boolean)
      }
    } catch {
      // Ignore parse error, continue with CSV fallback.
    }

    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

async function toPublicImageUrl(supabase: any, rawPath: string) {
  if (!rawPath) return ''
  if (/^https?:\/\//i.test(rawPath)) return rawPath
  if (rawPath.startsWith('/')) return rawPath

  try {
    const pub = supabase.storage.from('car-photos').getPublicUrl(rawPath)
    const url =
      (pub as any)?.publicURL ||
      (pub as any)?.data?.publicUrl ||
      (pub as any)?.data?.publicURL
    return url || rawPath
  } catch {
    return rawPath
  }
}

function getLocalFolderImages(imagePath: string) {
  if (!imagePath.startsWith('/')) return []

  try {
    const relPath = imagePath.replace(/^\/+/, '')
    const parts = relPath.split('/')
    if (parts.length < 3) return [imagePath]

    const publicDir = path.join(process.cwd(), 'public')
    const folderPath = path.join(publicDir, parts[0], parts[1], parts[2])
    const files = fs
      .readdirSync(folderPath)
      .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
      .sort()

    return files.map((file) => `/${path.posix.join(parts[0], parts[1], parts[2], file)}`)
  } catch {
    return [imagePath]
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  let ids: string[] = sampleCars.map((car) => car.id)

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const { data } = await supabase.from('cars').select('id')

      if (Array.isArray(data)) {
        ids = Array.from(new Set([...ids, ...data.map((item: any) => String(item.id))]))
      }
    } catch (error) {
      console.warn('getStaticPaths supabase read failed', error)
    }
  }

  return {
    paths: ids.map((id) => ({ params: { id } })),
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps<CarPageProps> = async ({ params }) => {
  const id = String(params?.id || '')
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  let car: AnyCar | undefined = sampleCars.find((item) => item.id === id)
  let images: string[] = []

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      const { data } = await supabase.from('cars').select('*').eq('id', id).single()
      if (data) car = data

      if (car) {
        const normalizedImages = normalizeToImages(car.images)
        if (normalizedImages.length > 0) {
          images = await Promise.all(normalizedImages.map((item) => toPublicImageUrl(supabase, item)))
        }

        if (images.length === 0 && car.image) {
          if (typeof car.image === 'string' && /^https?:\/\//i.test(car.image)) {
            images = [car.image]
          } else if (typeof car.image === 'string' && car.image.startsWith('/')) {
            images = getLocalFolderImages(car.image)
          } else if (typeof car.image === 'string') {
            images = [await toPublicImageUrl(supabase, car.image)]
          }
        }
      }
    } catch (error) {
      console.error('getStaticProps supabase error:', error)
    }
  }

  if (!car) {
    return { notFound: true }
  }

  if (images.length === 0) {
    const localImages = normalizeToImages(car.images)
    images = localImages.length > 0 ? localImages : normalizeToImages(car.image)
  }

  const uniqueImages = Array.from(new Set(images.map((item) => String(item || '').trim()).filter(Boolean)))

  return {
    props: {
      car,
      images: uniqueImages,
    },
    revalidate: 60,
  }
}

export default function CarPage({ car, images }: CarPageProps) {
  const galleryImages = useMemo(() => {
    const list = images.length > 0 ? images : normalizeToImages(car.image)
    return list.length > 0 ? list : []
  }, [car.image, images])

  const [open, setOpen] = useState(false)
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperInstance | null>(null)
  const [mainSwiper, setMainSwiper] = useState<SwiperInstance | null>(null)
  const [lightboxSwiper, setLightboxSwiper] = useState<SwiperInstance | null>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!open || !mainSwiper || !lightboxSwiper) return

    const active = mainSwiper.realIndex || 0
    lightboxSwiper.slideTo(active, 0)
  }, [open, mainSwiper, lightboxSwiper])

  const quickSpecs = [
    car.year ? { label: 'Рік', value: String(car.year) } : null,
    car.km ? { label: 'Пробіг', value: `${Number(car.km).toLocaleString('en-US')} км` } : null,
    car.fuel ? { label: 'Паливо', value: String(car.fuel) } : null,
    car.gearbox ? { label: 'КПП', value: String(car.gearbox) } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  const iconClass = 'h-4 w-4 text-[var(--accent)]'

  const specSections = [
    {
      title: 'Технічні параметри',
      items: [
        car.engine_volume != null
          ? {
              icon: <Cog className={iconClass} strokeWidth={1.8} />,
              label: 'Обʼєм двигуна',
              value: `${String(car.engine_volume).replace('.', ',')} л`,
            }
          : null,
        car.power != null
          ? { icon: <BatteryCharging className={iconClass} strokeWidth={1.8} />, label: 'Потужність', value: `${car.power} к.с.` }
          : null,
        car.fuel ? { icon: <Fuel className={iconClass} strokeWidth={1.8} />, label: 'Паливо', value: String(car.fuel) } : null,
        car.gearbox ? { icon: <Wrench className={iconClass} strokeWidth={1.8} />, label: 'КПП', value: String(car.gearbox) } : null,
        car.drivetrain
          ? { icon: <CircleDot className={iconClass} strokeWidth={1.8} />, label: 'Привід', value: resolveDrivetrainLabel(car.drivetrain) }
          : null,
        car.emission_standard
          ? { icon: <Leaf className={iconClass} strokeWidth={1.8} />, label: 'Екостандарт', value: String(car.emission_standard) }
          : null,
      ].filter(Boolean) as SpecItem[],
    },
    {
      title: 'Загальна інформація',
      items: [
        car.make ? { icon: <Tags className={iconClass} strokeWidth={1.8} />, label: 'Марка', value: String(car.make) } : null,
        car.model ? { icon: <Car className={iconClass} strokeWidth={1.8} />, label: 'Модель', value: String(car.model) } : null,
        car.year ? { icon: <Calendar className={iconClass} strokeWidth={1.8} />, label: 'Рік', value: String(car.year) } : null,
        car.km
          ? { icon: <Gauge className={iconClass} strokeWidth={1.8} />, label: 'Пробіг', value: `${Number(car.km).toLocaleString('en-US')} км` }
          : null,
        car.body_type
          ? { icon: <Car className={iconClass} strokeWidth={1.8} />, label: 'Тип кузова', value: String(car.body_type) }
          : null,
        car.color ? { icon: <Palette className={iconClass} strokeWidth={1.8} />, label: 'Колір', value: String(car.color) } : null,
        car.generation
          ? { icon: <TimerReset className={iconClass} strokeWidth={1.8} />, label: 'Покоління', value: String(car.generation) }
          : null,
        car.vin ? { icon: <ShieldCheck className={iconClass} strokeWidth={1.8} />, label: 'VIN', value: String(car.vin) } : null,
        car.equipment
          ? { icon: <Sparkles className={iconClass} strokeWidth={1.8} />, label: 'Комплектація', value: String(car.equipment) }
          : null,
      ].filter(Boolean) as SpecItem[],
    },
  ]

  const hasAnySpecs = specSections.some((section) => section.items.length > 0)

  return (
    <>
      <Header />
      <main className="container-wide py-5 sm:py-8 relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(180,136,107,0.22),transparent_62%)]" />

        <section className="relative z-10 mb-5 sm:mb-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/catalog" className="inline-flex items-center gap-2 text-sm muted hover:text-white mb-3">
                <span>←</span>
                <span>Повернутися до каталогу</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-tight tracking-wide">{car.title}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickSpecs.map((item) => (
                  <span key={item.label} className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-3 py-1 text-xs sm:text-sm text-white/90">
                    <span className="text-white/60 mr-2">{item.label}</span>
                    <span>{item.value}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="premium-card rounded-2xl px-4 py-3 min-w-[220px]">
              <div className="text-xs uppercase tracking-[0.18em] text-white/55">Ціна в Польщі</div>
              <div className="car-price text-3xl sm:text-4xl mt-1 font-extrabold tracking-wide">{car.price != null ? formatPLN(car.price) : 'Уточнюйте'}</div>
            </div>
          </div>
        </section>

        <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px] gap-6 lg:gap-8 items-start">
          <section className="min-w-0 space-y-4">
            <div className="rounded-3xl border border-white/10 overflow-hidden bg-black/65 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              {galleryImages.length > 0 ? (
                <Swiper
                  modules={[Navigation, Keyboard, Thumbs]}
                  onSwiper={setMainSwiper}
                  keyboard={{ enabled: true }}
                  navigation
                  spaceBetween={0}
                  slidesPerView={1}
                  thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                  className="car-main-swiper"
                >
                  {galleryImages.map((src, index) => (
                    <SwiperSlide key={`${src}-${index}`}>
                      <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="w-full block cursor-zoom-in"
                        aria-label={`Відкрити фото ${index + 1}`}
                      >
                        <img
                          src={src}
                          alt={`${car.title} ${index + 1}`}
                          className="w-full h-[260px] sm:h-[420px] lg:h-[610px] object-cover lg:object-contain"
                        />
                      </button>
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <div className="w-full h-[260px] sm:h-[420px] lg:h-[610px] grid place-items-center muted">
                  Фото відсутнє
                </div>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 sm:p-3">
                <Swiper
                  onSwiper={setThumbsSwiper}
                  modules={[FreeMode, Thumbs]}
                  freeMode
                  watchSlidesProgress
                  spaceBetween={8}
                  slidesPerView={3.2}
                  breakpoints={{
                    640: { slidesPerView: 4.3 },
                    1024: { slidesPerView: 6 },
                    1280: { slidesPerView: 7 },
                  }}
                  className="car-thumbs-swiper"
                >
                  {galleryImages.map((src, index) => (
                    <SwiperSlide key={`thumb-${src}-${index}`}>
                      <div className="h-16 sm:h-20 rounded-xl overflow-hidden border border-white/10">
                        <img src={src} alt={`${car.title} thumb ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}

            <div className="premium-card rounded-2xl p-4 sm:p-5 xl:hidden">
              <div className="text-xs uppercase tracking-[0.16em] text-white/50">Характеристики</div>
              {hasAnySpecs ? (
                <div className="mt-3 space-y-4">
                  {specSections.map((section) =>
                    section.items.length > 0 ? (
                      <div key={`mobile-${section.title}`}>
                        <div className="text-[11px] uppercase tracking-[0.12em] text-white/45 mb-2">{section.title}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {section.items.map((item) => (
                            <div key={`mobile-${section.title}-${item.label}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                              <div className="flex items-center gap-2 text-white/70 text-xs">
                                <span>{item.icon}</span>
                                <span className="uppercase tracking-[0.08em]">{item.label}</span>
                              </div>
                              <div className="mt-1 text-sm text-white/95 break-words">{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <div className="mt-3 text-sm text-white/65">Детальні характеристики будуть додані незабаром.</div>
              )}
            </div>

            {car.description && (
              <div className="premium-card rounded-2xl p-4 sm:p-5">
                <div className="text-xs uppercase tracking-[0.14em] text-white/50">Опис</div>
                <p className="mt-2 text-sm sm:text-base text-white/85 leading-relaxed">{car.description}</p>
              </div>
            )}
          </section>

          <aside className="h-fit xl:sticky xl:top-24 space-y-4">
            <div className="premium-card rounded-2xl p-4 sm:p-5">
              <div className="text-xs uppercase tracking-[0.16em] text-white/50">Контакти</div>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <a href="tel:+48662722070" className="text-center py-3 rounded-lg bg-[var(--accent)] text-black font-semibold">Зателефонувати</a>
                <a href="https://t.me/baoauto" target="_blank" rel="noreferrer" className="text-center py-3 rounded-lg border border-white/15 text-white/90 hover:bg-white/10">Telegram</a>
                <a href="viber://chat?number=%2B48662722070" className="text-center py-3 rounded-lg border border-white/15 text-white/90 hover:bg-white/10">Viber</a>
                <a href="https://instagram.com/baoauto" target="_blank" rel="noreferrer" className="text-center py-3 rounded-lg border border-white/15 text-white/90 hover:bg-white/10">Instagram</a>
              </div>
            </div>

            <div className="premium-card rounded-2xl p-4 sm:p-5 hidden xl:block">
              <div className="text-xs uppercase tracking-[0.16em] text-white/50">Характеристики</div>
              {hasAnySpecs ? (
                <div className="mt-3 space-y-4">
                  {specSections.map((section) =>
                    section.items.length > 0 ? (
                      <div key={section.title}>
                        <div className="text-[11px] uppercase tracking-[0.12em] text-white/45 mb-2">{section.title}</div>
                        <div className="grid grid-cols-1 gap-2">
                          {section.items.map((item) => (
                            <div key={`${section.title}-${item.label}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                              <div className="flex items-center gap-2 text-white/70 text-xs">
                                <span>{item.icon}</span>
                                <span className="uppercase tracking-[0.08em]">{item.label}</span>
                              </div>
                              <div className="mt-1 text-sm text-white/95 break-words">{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <div className="mt-3 text-sm text-white/65">Детальні характеристики будуть додані незабаром.</div>
              )}
            </div>

            <div className="premium-card rounded-2xl p-3 sm:p-4">
              <BaoInfo />
            </div>
          </aside>
        </div>
      </main>

      {open && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 p-2 sm:p-6">
          <button
            type="button"
            aria-label="Закрити"
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 sm:top-5 sm:right-6 z-10 rounded-full bg-white/10 p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="white">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="h-full flex items-center">
            <Swiper
              modules={[Navigation, Keyboard]}
              onSwiper={setLightboxSwiper}
              navigation
              keyboard={{ enabled: true }}
              spaceBetween={12}
              slidesPerView={1}
              className="w-full h-full"
            >
              {galleryImages.map((src, index) => (
                <SwiperSlide key={`modal-${src}-${index}`}>
                  <div className="w-full h-full flex items-center justify-center">
                    <img src={src} alt={`${car.title} full ${index + 1}`} className="max-h-[82vh] max-w-[92vw] object-contain" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
