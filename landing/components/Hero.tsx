'use client'

import React, { useState, useEffect } from 'react'
import { Download, Play, HardDrive, Zap, Sparkles, Monitor, Eye } from 'lucide-react'
import { AppleLogo } from '@/components/Icons'
import { enlaceDescarga } from '@/lib/descargas'

type So = 'windows' | 'mac' | 'linux'

export default function Hero() {
  const [os, setOs] = useState<{ name: string; ext: string; so: So }>({ name: 'Windows', ext: '.exe', so: 'windows' })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase()
      if (ua.includes('mac')) {
        setOs({ name: 'Mac', ext: '.dmg', so: 'mac' })
      } else if (ua.includes('linux')) {
        setOs({ name: 'Linux', ext: '.AppImage', so: 'linux' })
      } else {
        setOs({ name: 'Windows', ext: '.exe', so: 'windows' })
      }
    }
  }, [])

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background radial gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-accent/15 via-accent/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#26324415_1px,transparent_1px),linear-gradient(to_bottom,#26324415_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Title - Accessible & Clear for Everyone */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-heading text-text max-w-5xl mx-auto leading-[1.14]">
          Crea videos y artículos con Inteligencia Artificial{' '}
          <span className="bg-gradient-to-r from-accent via-accent-hover to-[#8db8ff] bg-clip-text text-transparent">
            directo en tu computadora
          </span>
        </h1>

        {/* Subtitle - Easy to understand */}
        <p className="mt-6 text-lg sm:text-xl text-muted max-w-3xl mx-auto leading-relaxed font-normal">
          Elige qué quieres crear en una tarjeta visual, escribe el tema y mira cómo el asistente
          redacta el guion, graba la voz y arma el video o artículo paso a paso frente a ti.
        </p>

        {/* Action CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none">
          <a
            href={enlaceDescarga(os.so)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-accent hover:bg-accent-hover text-on-solid font-bold text-base font-heading transition-all shadow-glow hover:scale-[1.02] active:scale-95"
          >
            <Download className="w-5 h-5" />
            <span>Descargar Gratis ({os.name})</span>
          </a>

          <a
            href="#demostracion"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-panel hover:bg-panel-2 border border-line hover:border-line-strong text-text font-semibold text-base transition-all"
          >
            <Play className="w-4 h-4 text-accent fill-accent" />
            <span>Ver Cómo Funciona</span>
          </a>
        </div>

        {/* Systems compatibility note */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted">
          <span>Disponible para:</span>
          <span className="flex items-center gap-1 text-text-2 font-mono">
            <Monitor className="w-3.5 h-3.5 text-accent" /> Windows
          </span>
          <span className="text-line">|</span>
          <span className="flex items-center gap-1 text-text-2 font-mono">
            <AppleLogo className="w-3.5 h-3.5 text-accent inline-block" /> Mac
          </span>
          <span className="text-line">|</span>
          <span className="flex items-center gap-1 text-text-2 font-mono">Linux</span>
        </div>

        {/* Real practical badges */}
        <div className="mt-14 pt-10 border-t border-line/60 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-panel-2 border border-line text-accent">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text font-heading">En tu computadora</h4>
              <p className="text-xs text-muted mt-0.5">Tus videos y textos se guardan en tus carpetas.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-panel-2 border border-line text-accent">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text font-heading">Paso a paso a la vista</h4>
              <p className="text-xs text-muted mt-0.5">Ves cada fase: idea, guion, voz y archivo listo.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-panel-2 border border-line text-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text font-heading">Sin cobros sorpresa</h4>
              <p className="text-xs text-muted mt-0.5">La app es libre y usas tu propia cuenta de IA.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-panel-2 border border-line text-accent">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text font-heading">Rápido y sencillo</h4>
              <p className="text-xs text-muted mt-0.5">Sin registros raros ni configuraciones difíciles.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
