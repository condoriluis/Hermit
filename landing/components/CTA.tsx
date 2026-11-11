'use client'

import React from 'react'
import Image from 'next/image'
import { Monitor, Terminal } from 'lucide-react'
import { AppleLogo } from '@/components/Icons'
import { enlaceDescarga } from '@/lib/descargas'
import { Animar } from './Animar'

export default function CTA() {
  return (
    <section id="descargar" className="py-24 relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-gradient-to-t from-panel-2 via-bg to-bg -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accent/10 blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Animar className="w-16 h-16 rounded-2xl bg-panel-2 border border-line flex items-center justify-center mx-auto mb-6 shadow-glow">
          <Image src="/icon.svg" width={36} height={36} alt="Hermit" />
        </Animar>

        <Animar delay={80}>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-text font-heading tracking-tight max-w-3xl mx-auto">
          Comienza a crear con agentes visuales hoy mismo
        </h2>

        <p className="mt-5 text-base sm:text-xl text-muted max-w-2xl mx-auto">
          Descarga el instalador de Hermit gratis, directo desde la web. Sin registros forzados ni suscripciones obligatorias.
        </p>
        </Animar>

        {/* Multi-OS Download Buttons */}
        <Animar delay={180}>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href={enlaceDescarga('windows')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-4 rounded-xl bg-accent hover:bg-accent-hover text-on-solid font-bold text-sm shadow-glow transition-all active:scale-95 font-heading"
          >
            <Monitor className="w-5 h-5" />
            <div className="text-left">
              <div className="text-xs uppercase opacity-80 font-mono">Descargar para</div>
              <div className="text-base font-extrabold leading-none">Windows (.exe)</div>
            </div>
          </a>

          <a
            href={enlaceDescarga('mac')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-4 rounded-xl bg-panel hover:bg-panel-2 border border-line hover:border-line-strong text-text font-bold text-sm transition-all active:scale-95 font-heading"
          >
            <AppleLogo className="w-5 h-5 text-accent" />
            <div className="text-left">
              <div className="text-xs uppercase text-muted font-mono">Descargar para</div>
              <div className="text-base font-extrabold leading-none">macOS (.dmg)</div>
            </div>
          </a>

          <a
            href={enlaceDescarga('linux')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-4 rounded-xl bg-panel hover:bg-panel-2 border border-line hover:border-line-strong text-text font-bold text-sm transition-all active:scale-95 font-heading"
          >
            <Terminal className="w-5 h-5 text-accent" />
            <div className="text-left">
              <div className="text-xs uppercase text-muted font-mono">Descargar para</div>
              <div className="text-base font-extrabold leading-none">Linux (AppImage)</div>
            </div>
          </a>
        </div>
        </Animar>
      </div>
    </section>
  )
}
