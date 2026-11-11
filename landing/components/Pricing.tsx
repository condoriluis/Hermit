'use client'

import React, { useEffect, useState } from 'react'
import { Sparkles, Crown, Download, ShieldCheck, QrCode, Check, CreditCard } from 'lucide-react'
import CheckoutModal from './CheckoutModal'
import { Animar } from './Animar'
import { enBolivianos, precios, RESPALDO_BOB, type Plan, type Precios } from '@/lib/cobro'

export default function Pricing() {
  // El precio y el cambio salen del cobro y del mercado: se ven al momento, no escritos aquí.
  const [p, setP] = useState<Precios>({ mensual: 5, anual: 50, moneda: 'USD', quedan: 0 })
  const [bob, setBob] = useState<number>()
  const [plan, setPlan] = useState<Plan | null>(null)

  useEffect(() => {
    precios().then((x) => x && setP(x))
    fetch('/api/cambio')
      .then((r) => r.json())
      .then((d) => setBob(Number(d.bob)))
      .catch(() => {})
  }, [])

  const cambio = bob ?? RESPALDO_BOB
  const bs = (usd: number) => `${enBolivianos(usd, cambio).toLocaleString('es-MX')} Bs`

  return (
    <section id="apoyo" className="py-24 relative bg-panel/30 border-y border-line/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Animar className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase font-mono tracking-widest text-accent font-semibold">
            Software Independiente & Accesible
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-text tracking-tight mt-2">
            Hermit es gratis. Apoya con lo que gustes.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Descarga y usa la aplicación completa gratis. Si valoras el proyecto y deseas que continúe mejorando con
            nuevas versiones, puedes apoyar al mes o al año por un precio accesible.
          </p>
        </Animar>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {/* 1. Gratis */}
          <Animar delay={0} className="h-full">
          <div className="h-full rounded-2xl bg-panel border border-line p-6 flex flex-col justify-between shadow-card hover:border-line-strong transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-muted font-bold">Uso Libre</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-panel-2 text-ok border border-ok/30 font-semibold">
                  Gratis
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-text">$0</span>
                <span className="text-xs text-muted font-mono">/ para siempre</span>
              </div>

              <p className="text-xs text-muted mt-2">
                Descarga el instalador compilado (.exe / .dmg) y utilízalo sin restricciones.
              </p>

              <hr className="border-line my-4" />

              <div className="space-y-2.5 text-xs text-text-2">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-ok flex-none" />
                  <span>Todas las herramientas incluidas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-ok flex-none" />
                  <span>100% privado en tu computadora</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-ok flex-none" />
                  <span>Conecta tus propias llaves de IA</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <a
                href="#descargar"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-panel-2 hover:bg-line text-text font-bold text-xs border border-line transition-all"
              >
                <Download className="w-3.5 h-3.5 text-accent" />
                <span>Descargar Gratis</span>
              </a>
            </div>
          </div>
          </Animar>

          {/* 2. Apoyo al mes */}
          <Animar delay={110} className="h-full">
          <div className="h-full rounded-2xl bg-gradient-to-b from-panel via-panel-2 to-panel border-2 border-accent p-6 flex flex-col justify-between shadow-glow relative">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-accent text-on-solid text-[10px] font-mono font-bold uppercase tracking-wider">
              Popular
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-accent font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Apoyo al mes
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-semibold">
                  Recomendado
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-text">${p.mensual}</span>
                <span className="text-xs text-muted font-mono">USD / mes</span>
              </div>
              <p className="text-[11px] text-accent font-mono mt-1">≈ {bs(p.mensual)}</p>

              <p className="text-xs text-muted mt-2">
                Un apoyo mensual muy accesible para mantener el proyecto activo.
              </p>

              <hr className="border-line my-4" />

              <div className="space-y-2.5 text-xs text-text-2">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent flex-none" />
                  <span>Sin recordatorios en la app</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent flex-none" />
                  <span>Insignia de quien apoya</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent flex-none" />
                  <span>Decides qué sale primero</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setPlan('mensual')}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-on-solid font-bold text-xs shadow-glow transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apoyar con ${p.mensual} al mes</span>
              </button>
            </div>
          </div>
          </Animar>

          {/* 3. Apoyo al año */}
          <Animar delay={220} className="h-full">
          <div className="h-full rounded-2xl bg-panel border border-line p-6 flex flex-col justify-between shadow-card hover:border-line-strong transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-text font-bold flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-warn" /> Apoyo al año
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-panel-2 text-warn border border-warn/30 font-semibold">
                  Ahorras 2 meses
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-text">${p.anual}</span>
                <span className="text-xs text-muted font-mono">USD / año</span>
              </div>
              <p className="text-[11px] text-warn font-mono mt-1">≈ {bs(p.anual)}</p>

              <p className="text-xs text-muted mt-2">
                Un solo pago y listo: vale un año entero de apoyo, sin cobros cada mes.
              </p>

              <hr className="border-line my-4" />

              <div className="space-y-2.5 text-xs text-text-2">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-warn flex-none" />
                  <span>Todo lo del apoyo al mes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-warn flex-none" />
                  <span>Dos meses de regalo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-warn flex-none" />
                  <span>Se renueva cuando tú quieras</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setPlan('anual')}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-panel-2 hover:bg-line text-text font-bold text-xs border border-line transition-all active:scale-95"
              >
                <Crown className="w-3.5 h-3.5 text-warn" />
                <span>Apoyar con ${p.anual} el año</span>
              </button>
            </div>
          </div>
          </Animar>
        </div>

        {/* Payment Methods Banner */}
        <Animar delay={140}>
        <div className="mt-8 text-center flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted">
          <span className="flex items-center gap-1.5 font-semibold text-text">
            <ShieldCheck className="w-4 h-4 text-ok" /> Métodos de pago aceptados:
          </span>
          <span className="flex items-center gap-1 font-mono text-accent">
            <QrCode className="w-3.5 h-3.5" /> QR Simple (Bolivia - BNB, BCP, Unión)
          </span>
          <span>·</span>
          <span className="flex items-center gap-1 font-mono text-text-2">
            <CreditCard className="w-3.5 h-3.5" /> PayPal (fuera de Bolivia)
          </span>
        </div>
        <p className="mt-2 text-center text-[11px] font-mono text-muted">
          Los precios en bolivianos van al cambio del dólar del mercado de hoy: 1 USD ≈ {cambio.toLocaleString('es-MX')} Bs.
        </p>
        </Animar>
      </div>

      <CheckoutModal
        isOpen={plan !== null}
        onClose={() => setPlan(null)}
        plan={plan ?? 'mensual'}
        precioUSD={plan === 'anual' ? p.anual : p.mensual}
        cambio={cambio}
      />
    </section>
  )
}
