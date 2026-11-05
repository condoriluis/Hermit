'use client'

import React, { useState } from 'react'
import { Heart, Coffee, Sparkles, Crown, Download, ShieldCheck, QrCode, Check } from 'lucide-react'
import CheckoutModal from './CheckoutModal'

export default function Pricing() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState<{
    id: string
    title: string
    amountUSD: number
    amountBOB: number
    custom?: boolean
  }>({
    id: 'cafecito',
    title: 'Un Cafecito',
    amountUSD: 1,
    amountBOB: 7,
  })

  const openCheckout = (tier: typeof selectedTier) => {
    setSelectedTier(tier)
    setModalOpen(true)
  }

  return (
    <section id="apoyo" className="py-24 relative bg-panel/30 border-y border-line/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase font-mono tracking-widest text-accent font-semibold">
            Software Independiente & Accesible
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-text tracking-tight mt-2">
            Hermit es gratis. Apoya con lo que gustes.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Descarga y usa la aplicación completa gratis. Si valoras el proyecto y deseas que
            continúe mejorando con nuevas versiones, puedes apoyar con una contribución accesible.
          </p>
        </div>

        {/* 4 Accessible Support Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {/* 1. Gratis */}
          <div className="rounded-2xl bg-panel border border-line p-6 flex flex-col justify-between shadow-card hover:border-line-strong transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-muted font-bold">
                  Uso Libre
                </span>
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

          {/* 2. Un Cafecito ($1+ USD / 7+ Bs) */}
          <div className="rounded-2xl bg-panel border border-line p-6 flex flex-col justify-between shadow-card hover:border-accent/60 transition-all group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-accent font-bold flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5" /> Lo que gustes
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-panel-2 text-muted border border-line">
                  Desde $1
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-text">$1+</span>
                <span className="text-xs text-muted font-mono">USD (7+ Bs)</span>
              </div>

              <p className="text-xs text-muted mt-2">
                Una sola vez o mensual. Tú eliges el monto para invitarme un café y apoyar el trabajo.
              </p>

              <hr className="border-line my-4" />

              <div className="space-y-2.5 text-xs text-text-2">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent flex-none" />
                  <span>Monto libre voluntario</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent flex-none" />
                  <span>Agradecimiento del creador</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent flex-none" />
                  <span>Pago con QR Bolivia o PayPal</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() =>
                  openCheckout({
                    id: 'custom',
                    title: 'Lo que gustes',
                    amountUSD: 1,
                    amountBOB: 7,
                    custom: true,
                  })
                }
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-panel-2 hover:bg-line text-text font-bold text-xs border border-line group-hover:border-accent/40 transition-all"
              >
                <Heart className="w-3.5 h-3.5 text-accent" />
                <span>Elegir Monto Libre</span>
              </button>
            </div>
          </div>

          {/* 3. Apoyo Amigo ($5 USD / 35 Bs) */}
          <div className="rounded-2xl bg-gradient-to-b from-panel via-panel-2 to-panel border-2 border-accent p-6 flex flex-col justify-between shadow-glow relative">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-accent text-on-solid text-[10px] font-mono font-bold uppercase tracking-wider">
              Popular
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-accent font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Apoyo Activo
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-semibold">
                  Recomendado
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-text">$5</span>
                <span className="text-xs text-muted font-mono">USD (35 Bs)</span>
              </div>

              <p className="text-xs text-muted mt-2">
                Un apoyo mensual muy accesible para mantener el proyecto activo y recibir novedades.
              </p>

              <hr className="border-line my-4" />

              <div className="space-y-2.5 text-xs text-text-2">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent flex-none" />
                  <span>Sin recordatorios en la app</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent flex-none" />
                  <span>Nuevas versiones anticipadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent flex-none" />
                  <span>Insignia de Aportador</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() =>
                  openCheckout({
                    id: 'amigo',
                    title: 'Apoyo Activo',
                    amountUSD: 5,
                    amountBOB: 35,
                  })
                }
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-on-solid font-bold text-xs shadow-glow transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apoyar con $5 USD (35 Bs)</span>
              </button>
            </div>
          </div>

          {/* 4. Apoyo Grande ($10 USD / 70 Bs) */}
          <div className="rounded-2xl bg-panel border border-line p-6 flex flex-col justify-between shadow-card hover:border-line-strong transition-all">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-text font-bold flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-warn" /> Apoyo Grande
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-panel-2 text-warn border border-warn/30 font-semibold">
                  Fundador
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-text">$10</span>
                <span className="text-xs text-muted font-mono">USD (70 Bs)</span>
              </div>

              <p className="text-xs text-muted mt-2">
                Para quienes usan Hermit frecuentemente y desean impulsar el desarrollo al máximo.
              </p>

              <hr className="border-line my-4" />

              <div className="space-y-2.5 text-xs text-text-2">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-warn flex-none" />
                  <span>Insignia de Apoyo Grande</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-warn flex-none" />
                  <span>Tu nombre en créditos web</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-warn flex-none" />
                  <span>Prioridad en sugerencias</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() =>
                  openCheckout({
                    id: 'grande',
                    title: 'Apoyo Grande',
                    amountUSD: 10,
                    amountBOB: 70,
                  })
                }
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-panel-2 hover:bg-line text-text font-bold text-xs border border-line transition-all active:scale-95"
              >
                <Crown className="w-3.5 h-3.5 text-warn" />
                <span>Apoyar con $10 USD (70 Bs)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Payment Methods Banner */}
        <div className="mt-12 text-center flex items-center justify-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1.5 font-semibold text-text">
            <ShieldCheck className="w-4 h-4 text-ok" /> Métodos de pago aceptados:
          </span>
          <span className="flex items-center gap-1 font-mono text-accent">
            <QrCode className="w-3.5 h-3.5" /> QR Simple (Bolivia - BNB, BCP, Unión)
          </span>
          <span>·</span>
          <span className="font-mono text-text-2">PayPal (Internacional)</span>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialPlan={selectedTier.id as any}
        defaultAmountUSD={selectedTier.amountUSD}
        defaultAmountBOB={selectedTier.amountBOB}
        isCustomAmount={selectedTier.custom}
      />
    </section>
  )
}
