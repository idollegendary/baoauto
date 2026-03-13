import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Header(){
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = router.pathname

  const navLinkClass = (active:boolean)=>
    active
      ? 'text-white font-semibold border-b border-[var(--accent)] pb-1'
      : 'muted hover:text-white transition-colors'

  const mobileNavLinkClass = (active:boolean)=>
    active
      ? 'block px-3 py-2 rounded bg-white/10 text-white font-semibold'
      : 'block px-3 py-2 rounded hover:bg-white/10'

  return (
    <header className="py-4 sticky top-0 z-40 bg-[var(--bg)]/90 backdrop-blur-sm border-b border-white/5">
      <div className="container-wide flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo_baoauto.png" alt="BAO AUTO" width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
          <span className="text-2xl font-semibold">BAO AUTO</span>
        </Link>

        <nav className="hidden sm:flex gap-6 items-center">
          <Link href="/catalog" className={navLinkClass(pathname === '/catalog')}>Каталог</Link>
          <Link href="/owners-cars" className={navLinkClass(pathname === '/owners-cars')}>Авто від власників</Link>
          <Link href="/contacts" className={navLinkClass(pathname === '/contacts')}>Контакти</Link>
        </nav>

        {/* Mobile: hamburger */}
        <div className="sm:hidden">
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent relative z-50"
          >
            {open ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {open && (
            <div className="absolute right-4 top-20 z-50 w-56 bg-[var(--bg)] border border-white/10 rounded-lg shadow-lg">
              <ul className="flex flex-col p-3 gap-1 text-white">
                <li>
                  <Link href="/catalog" onClick={()=>setOpen(false)} className={mobileNavLinkClass(pathname === '/catalog')}>Каталог</Link>
                </li>
                <li>
                  <Link href="/owners-cars" onClick={()=>setOpen(false)} className={mobileNavLinkClass(pathname === '/owners-cars')}>Авто від власників</Link>
                </li>
                <li>
                  <Link href="/contacts" onClick={()=>setOpen(false)} className={mobileNavLinkClass(pathname === '/contacts')}>Контакти</Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
