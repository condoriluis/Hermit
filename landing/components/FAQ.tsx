'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Animar } from './Animar'

const faqs = [
  {
    q: '¿Es realmente gratis? ¿Cuál es el modelo?',
    a: 'Hermit es un software de escritorio 100% gratuito e independiente. Puedes descargar el ejecutable (.exe, .dmg o AppImage) y usar todas las herramientas sin pagar nada. El apoyo voluntario ($5 USD al mes o $50 USD al año) es opcional para respaldar a luchodev en el mantenimiento de nuevas versiones.',
  },
  {
    q: '¿Qué agentes de inteligencia artificial puedo conectar?',
    a: 'Puedes trabajar con el agente de IA que ya tengas o prefieras: Claude, ChatGPT (Codex), Gemini, Devin, Grok, Cursor, Muse, Pi, DeepSeek, OpenCode o Antigravity, con tu propia cuenta o llave. Pagas únicamente el consumo directo a tu proveedor de IA, sin tarifas infladas.',
  },
  {
    q: '¿Dónde se guardan mis videos y artículos?',
    a: 'En tu propia computadora. Todos los archivos (videos .mp4 verticales u horizontales, artículos en Markdown con su portada, presentaciones en PPTX y PDF, imágenes y portadas en PNG) se generan y almacenan en tus carpetas locales, asegurando tu total privacidad.',
  },
  {
    q: '¿Cómo funciona el pago por QR desde Bolivia?',
    a: 'Al pulsar en "Apoyar", eliges la pestaña de Pago por QR y el monto del apoyo al cambio del dólar del día ($5 al mes o $50 al año, en bolivianos). Escaneas con tu aplicación bancaria (BNB, BCP, Banco Unión o Simple) y envías el comprobante por WhatsApp con un solo clic para registrar tu contribución.',
  },
  {
    q: '¿Puedo crear mis propias herramientas o tareas personalizadas?',
    a: 'Sí, Hermit es modular: puedes añadir tus propias tareas creando una carpeta con tus instrucciones y la aplicación la mostrará automáticamente como una tarjeta lista para trabajar.',
  },
]

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Animar className="text-center mb-16">
          <span className="text-xs uppercase font-mono tracking-widest text-accent font-bold">
            Respuestas Rápidas
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-text font-heading tracking-tight mt-2">
            Preguntas Frecuentes
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Todo directo y claro sobre cómo funciona Hermit en tu escritorio.
          </p>
        </Animar>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx
            return (
              <Animar key={idx} delay={idx * 70}>
              <div
                className="rounded-2xl bg-panel border border-line overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full text-left p-6 flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className="text-base sm:text-lg font-bold text-text font-heading">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-accent flex-none transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-muted leading-relaxed border-t border-line/60 pt-4 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
              </Animar>
            )
          })}
        </div>
      </div>
    </section>
  )
}
