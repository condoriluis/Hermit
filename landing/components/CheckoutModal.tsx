'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  X,
  QrCode,
  CreditCard,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Loader2,
  Heart
} from 'lucide-react'
import { COBRO, configPaypal, enBolivianos, registrarSuscripcion, suscribir, TERMINOS, type Plan } from '@/lib/cobro'

declare global {
  interface Window {
    paypal?: {
      Buttons: (opciones: Record<string, unknown>) => { render: (el: HTMLElement) => void }
    }
  }
}

/** El SDK de PayPal se carga una sola vez, con el client id del cobro. */
let sdkPaypal: Promise<boolean> | undefined
function cargarSdkPaypal(clientId: string): Promise<boolean> {
  sdkPaypal ??= new Promise((listo) => {
    const s = document.createElement('script')
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=subscription&vault=true&components=buttons`
    s.onload = () => listo(true)
    s.onerror = () => listo(false)
    document.body.appendChild(s)
  })
  return sdkPaypal
}

// El número de soporte (solo dígitos, como lo pide wa.me) y la imagen del QR, desde el entorno.
const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_SOPORTE || '').replace(/\D/g, '')
const QR_IMG = process.env.NEXT_PUBLIC_QR_IMG_URL || '/QR-pago.jpg'

interface CheckoutModalProps {
  isOpen: boolean
  onClose(): void
  plan: Plan
  /** Lo que cuesta el apoyo en dólares: un mes o un año. */
  precioUSD: number
  /** El cambio del día: cuántos bolivianos vale un dólar. */
  cambio: number
}

const cada = (plan: Plan) => (plan === 'mensual' ? 'cada mes' : 'por un año')

export default function CheckoutModal({ isOpen, onClose, plan, precioUSD, cambio }: CheckoutModalProps) {
  const [metodo, setMetodo] = useState<'qr' | 'paypal'>('qr')
  const [email, setEmail] = useState('')
  const [acepto, setAcepto] = useState(false)
  const [comprobante, setComprobante] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [paypalFallo, setPaypalFallo] = useState(false)
  const [qrLista, setQrLista] = useState(false)
  const paypalRef = useRef<HTMLDivElement>(null)

  const bob = enBolivianos(precioUSD, cambio)

  useEffect(() => {
    if (isOpen) {
      setError('')
      setEnviado(false)
      setPaypalFallo(false)
      setQrLista(false)
    }
  }, [isOpen])

  // El mensual se paga con el botón oficial de PayPal aquí mismo (el SDK ofrece tarjeta sin cuenta). El año sigue con
  // su orden y su enlace. El botón aparece cuando ya hay correo y términos aceptados, que es lo que el cobro pide.
  useEffect(() => {
    if (!isOpen || metodo !== 'paypal' || plan !== 'mensual' || !email.includes('@') || !acepto) return
    let vivo = true
    ;(async () => {
      const cfg = await configPaypal()
      const listo = cfg ? await cargarSdkPaypal(cfg.clientId) : false
      if (!vivo) return
      if (!cfg || !listo || !window.paypal || !paypalRef.current) {
        setPaypalFallo(true)
        return
      }
      paypalRef.current.innerHTML = ''
      window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', height: 44 },
        createSubscription: (_data: unknown, actions: { subscription: { create: (o: object) => Promise<string> } }) =>
          actions.subscription.create({ plan_id: cfg.planId }),
        onApprove: async (data: { subscriptionID?: string }) => {
          const r = await registrarSuscripcion(email, TERMINOS, String(data.subscriptionID ?? ''))
          if (r.id) {
            window.location.href = `${COBRO}/gracias?s=${r.id}`
            return
          }
          setError(r.error ?? 'No pudimos registrar tu suscripción. Intenta otra vez en un momento.')
        },
        onCancel: () => setError('Cancelaste el pago. Si quieres, puedes intentarlo otra vez.'),
        onError: () => setError('PayPal no pudo abrir el pago. Intenta otra vez en un momento.')
      }).render(paypalRef.current)
    })()
    return () => {
      vivo = false
    }
  }, [isOpen, metodo, plan, email, acepto])

  if (!isOpen) return null

  const aviso =
    metodo === 'paypal'
      ? plan === 'mensual'
        ? `Soy mayor de 18 años y acepto los términos y el cobro automático de $${precioUSD} cada mes, hasta que lo cancele.`
        : `Soy mayor de 18 años y acepto los términos de este apoyo de $${precioUSD}.`
      : 'Soy mayor de 18 años y acepto los términos.'

  const enlaceWhatsApp = () => {
    const texto = encodeURIComponent(
      `¡Hola luchodev! Apoyé a Hermit con ${bob} Bs ($${precioUSD} ${cada(plan)}).\nMi correo: ${email}\nNro. de comprobante: ${
        comprobante || 'no lo tengo a mano'
      }`
    )
    return `https://wa.me/${WHATSAPP}?text=${texto}`
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    // El mensual con PayPal se paga con el botón del SDK que está en el modal; el formulario no hace nada ahí.
    if (metodo === 'paypal' && plan === 'mensual') return
    // Por QR se paga a mano: se manda el comprobante y la clave llega por correo al confirmarlo.
    if (metodo === 'qr') {
      if (WHATSAPP) window.open(enlaceWhatsApp(), '_blank', 'noopener,noreferrer')
      setEnviado(true)
      return
    }
    setOcupado(true)
    const r = await suscribir(email, plan, TERMINOS)
    setOcupado(false)
    if (r.enlace) {
      window.location.href = r.enlace
      return
    }
    setError(r.error ?? 'No pudimos abrir el pago. Intenta otra vez en un momento.')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-panel border border-line p-5 sm:p-7 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-muted hover:text-text hover:bg-panel-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-left mb-5">
          <span className="text-xs uppercase font-mono tracking-wider text-accent font-bold flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 fill-accent" /> Apoyo Voluntario
          </span>
          <h3 className="text-2xl font-black text-text mt-1">Apoyar el desarrollo de Hermit</h3>
          <p className="text-xs text-muted mt-1">
            Contribuye con el monto que gustes para seguir sacando nuevas versiones y mejoras.
          </p>
        </div>

        {/* Lo que se va a pagar */}
        <div className="p-4 rounded-xl bg-panel-2 border border-line mb-5 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-mono font-bold text-text-2">
              Apoyo {plan === 'mensual' ? 'al mes' : 'al año'}
            </div>
            <div className="text-[11px] text-muted">${precioUSD} USD {cada(plan)}</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-accent font-mono">{bob.toLocaleString('es-MX')} Bs</div>
            <div className="text-[11px] text-muted font-mono">1 USD ≈ {cambio.toLocaleString('es-MX')} Bs</div>
          </div>
        </div>

        {enviado ? (
          <div className="p-5 rounded-xl bg-panel-2 border border-ok/30 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-ok font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 flex-none" />
              <span>¡Muchísimas gracias por tu apoyo!</span>
            </div>
            <p className="text-xs text-text-2 leading-relaxed">
              Tu clave llega a <b>{email}</b> en cuanto confirmemos tu pago (si no lo ves, revisa spam o promociones).
              {WHATSAPP
                ? ' Si ya pagaste y no se abrió WhatsApp, mándanos el comprobante con el botón de abajo.'
                : ' Mándanos el comprobante por el medio donde te atendemos y te la activamos enseguida.'}
            </p>
            {WHATSAPP && (
              <a
                href={enlaceWhatsApp()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Comprobante por WhatsApp</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-panel border border-line hover:bg-line text-xs text-muted hover:text-text font-semibold transition-all"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-4">
            {/* Método de pago */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMetodo('qr')
                  setError('')
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                  metodo === 'qr'
                    ? 'bg-accent/10 border-accent text-text shadow-glow'
                    : 'bg-panel-2/60 border-line text-muted hover:text-text hover:border-line-strong'
                }`}
              >
                <QrCode className="w-5 h-5 text-accent flex-none" />
                <div>
                  <div className="text-xs font-extrabold text-text">Pago por QR (Bolivia)</div>
                  <div className="text-[10px] text-muted">BNB, BCP, Unión, Simple</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMetodo('paypal')
                  setError('')
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                  metodo === 'paypal'
                    ? 'bg-accent/10 border-accent text-text shadow-glow'
                    : 'bg-panel-2/60 border-line text-muted hover:text-text hover:border-line-strong'
                }`}
              >
                <CreditCard className="w-5 h-5 text-accent flex-none" />
                <div>
                  <div className="text-xs font-extrabold text-text">PayPal (Internacional)</div>
                  <div className="text-[10px] text-muted">Tarjetas y saldo PayPal</div>
                </div>
              </button>
            </div>

            <div>
              <label className="block text-xs font-mono text-text-2 mb-1.5">Tu correo electrónico:</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full px-4 py-2.5 rounded-xl bg-panel-2 border border-line text-text placeholder-placeholder text-sm focus:outline-none focus:border-accent"
              />
              <p className="text-[11px] text-muted mt-1.5">
                Ahí te llega tu clave de Hermit, también para el QR.
              </p>
            </div>

            {metodo === 'qr' && (
              <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Total a transferir:</span>
                  <span className="text-base font-bold text-accent font-mono">{bob.toLocaleString('es-MX')} Bs</span>
                </div>

                <div className="p-4 rounded-lg bg-bg border border-line text-center flex flex-col items-center justify-center">
                  <div className="w-40 h-40 bg-white rounded-lg p-2 flex items-center justify-center shadow-md relative overflow-hidden">
                    {QR_IMG && !qrLista && (
                      <div className="absolute inset-2 rounded bg-gray-200 animate-pulse" aria-hidden="true" />
                    )}
                    {QR_IMG ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={QR_IMG}
                        alt="QR para pagar el apoyo"
                        onLoad={() => setQrLista(true)}
                        onError={() => setQrLista(true)}
                        className={`w-full h-full object-contain rounded transition-opacity duration-300 ${qrLista ? 'opacity-100' : 'opacity-0'}`}
                      />
                    ) : (
                      <div className="w-full h-full border-2 border-dashed border-gray-400 flex flex-col items-center justify-center text-gray-800 text-[10px] font-mono text-center">
                        <QrCode className="w-14 h-14 text-gray-800 mb-1" />
                        <span>QR SIMPLE / BANCO</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted mt-2 font-mono">
                    Escanea con la app de cualquier banco boliviano
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-muted mb-1">
                    Nro. de Comprobante / Transacción (opcional):
                  </label>
                  <input
                    type="text"
                    value={comprobante}
                    onChange={(e) => setComprobante(e.target.value)}
                    placeholder="Ej. 18273645"
                    className="w-full px-3 py-2 rounded-lg bg-bg border border-line text-xs text-text placeholder-placeholder focus:outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>
            )}

            <label className="flex items-start gap-2.5 text-[11px] text-muted leading-relaxed cursor-pointer">
              <input
                type="checkbox"
                checked={acepto}
                onChange={(e) => setAcepto(e.target.checked)}
                className="mt-0.5 accent-[#4f8cff]"
              />
              <span>
                {aviso}{' '}
                <a
                  href="/terminos"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  Términos y condiciones
                </a>
                .
              </span>
            </label>

            {error && <p className="text-xs text-bad">{error}</p>}

            {metodo === 'paypal' && plan === 'mensual' ? (
              <div>
                <div ref={paypalRef} className="min-h-[44px]" />
                {!email.includes('@') || !acepto ? (
                  <p className="text-[11px] text-muted text-center mt-2">
                    Escribe tu correo y marca los términos para ver los botones de PayPal.
                  </p>
                ) : paypalFallo ? (
                  <p className="text-xs text-bad text-center mt-2">
                    PayPal no pudo cargar. Revisa tu conexión e intenta de nuevo.
                  </p>
                ) : null}
              </div>
            ) : (
              <button
                type="submit"
                disabled={ocupado || !email || !acepto}
                className="w-full py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-on-solid font-bold text-sm shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {ocupado ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Abriendo PayPal…</span>
                  </>
                ) : metodo === 'qr' ? (
                  <span>Ya pagué {bob.toLocaleString('es-MX')} Bs</span>
                ) : (
                  <span>Continuar a PayPal (${precioUSD} USD)</span>
                )}
              </button>
            )}
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-line text-center text-[11px] text-muted flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-ok" />
          <span>Apoyo directo a luchodev para el desarrollo de Hermit</span>
        </div>
      </div>
    </div>
  )
}
