import Link from 'next/link'
import { useState } from 'react'

export default function Header(){
  const [open, setOpen] = useState(false)

  return (
    <header className="py-4 sticky top-0 z-40 bg-[var(--bg)]/90 backdrop-blur-sm border-b border-white/5">
      <div className="container-wide flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo_baoauto.png" alt="BAO AUTO" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/logo.svg'}} className="w-12 h-12 rounded-full object-cover" />
          <span className="text-2xl font-semibold">BAO AUTO</span>
        </Link>

        <nav className="hidden sm:flex gap-6 items-center">
          <Link href="/catalog" className="muted">Каталог</Link>
          <a className="muted">Новинки</a>
          <a className="muted">Контакти</a>
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
            <div className="absolute right-4 top-20 z-40 w-56 bg-white dark:bg-slate-900 rounded-lg shadow-lg ring-1 ring-black/5">
              <ul className="flex flex-col p-3 gap-2">
                <li>
                  <Link href="/catalog" className="block px-3 py-2 rounded hover:bg-slate-50">Каталог</Link>
                </li>
                <li>
                  <a className="block px-3 py-2 rounded hover:bg-slate-50">Новинки</a>
                </li>
                <li>
                  <a className="block px-3 py-2 rounded hover:bg-slate-50">Контакти</a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
