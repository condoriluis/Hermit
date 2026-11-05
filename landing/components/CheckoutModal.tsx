'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  QrCode,
  CreditCard,
  CheckCircle2,
  Copy,
  MessageCircle,
  ShieldCheck,
  Loader2,
  Heart
} from 'lucide-react'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  initialPlan?: string
  defaultAmountUSD?: number
  defaultAmountBOB?: number
  isCustomAmount?: boolean
}

// Tasa de cambio estándar para aportaciones: 1 USD ≈ 7 BOB
const USD_TO_BOB = 7

export default function CheckoutModal({
  isOpen,
  onClose,
  initialPlan = 'amigo',
  defaultAmountUSD = 5,
  defaultAmountBOB = 35,
  isCustomAmount = false,
}: CheckoutModalProps) {
  const [method, setMethod] = useState<'qr' | 'paypal'>('qr')
  const [amountUSD, setAmountUSD] = useState<number>(defaultAmountUSD)
  const [amountBOB, setAmountBOB] = useState<number>(defaultAmountBOB)
  const [isCustom, setIsCustom] = useState(isCustomAmount)
  const [email, setEmail] = useState('')
  const [transactionRef, setTransactionRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    key?: string
    approveUrl?: string
    demoMode?: boolean
    reference?: string
    message?: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setAmountUSD(defaultAmountUSD)
    setAmountBOB(defaultAmountBOB)
    setIsCustom(isCustomAmount)
  }, [defaultAmountUSD, defaultAmountBOB, isCustomAmount])

  if (!isOpen) return null

  const handleUSDChange = (val: number) => {
    const safeVal = Math.max(1, val)
    setAmountUSD(safeVal)
    setAmountBOB(Math.round(safeVal * USD_TO_BOB))
  }

  const handleBOBChange = (val: number) => {
    const safeVal = Math.max(7, val)
    setAmountBOB(safeVal)
    setAmountUSD(Math.max(1, Math.round(safeVal / USD_TO_BOB)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/suscribir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          plan: isCustom ? 'custom' : initialPlan,
          method: method === 'paypal' ? 'paypal' : 'qr_bolivia',
          amount: method === 'paypal' ? amountUSD : amountBOB,
          currency: method === 'paypal' ? 'USD' : 'BOB',
          transactionRef,
        }),
      })

      const data = await res.json()

      if (data.approveUrl) {
        window.location.href = data.approveUrl
        return
      }

      setResult(data)
    } catch (err) {
      console.error(err)
      alert('Error procesando la solicitud. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getWhatsAppLink = (refCode: string) => {
    const currentAmount = method === 'qr' ? `${amountBOB} Bs` : `$${amountUSD} USD`
    const text = encodeURIComponent(
      `¡Hola luchodev! Acabo de realizar un apoyo a Hermit por ${currentAmount}.\nMi correo: ${email}\nNro de Ref / Comprobante: ${
        transactionRef || refCode
      }`
    )
    return `https://wa.me/59170000000?text=${text}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-panel border border-line p-6 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-muted hover:text-text hover:bg-panel-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-left mb-5">
          <span className="text-xs uppercase font-mono tracking-wider text-accent font-bold flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 fill-accent" /> Apoyo Voluntario
          </span>
          <h3 className="text-2xl font-black text-text mt-1">
            Apoyar el desarrollo de Hermit
          </h3>
          <p className="text-xs text-muted mt-1">
            Contribuye con el monto que gustes para seguir sacando nuevas versiones y mejoras.
          </p>
        </div>

        {/* Monto Picker / Editor */}
        <div className="p-4 rounded-xl bg-panel-2 border border-line mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-text-2">
              Monto de contribución:
            </span>
            <div className="flex gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  handleUSDChange(1)
                  setIsCustom(false)
                }}
                className={`px-2.5 py-1 rounded-md border text-xs font-bold transition-all ${
                  amountUSD === 1 && !isCustom
                    ? 'bg-accent text-on-solid border-accent shadow-sm'
                    : 'bg-bg text-muted border-line hover:text-text'
                }`}
              >
                $1 (7 Bs)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUSDChange(5)
                  setIsCustom(false)
                }}
                className={`px-2.5 py-1 rounded-md border text-xs font-bold transition-all ${
                  amountUSD === 5 && !isCustom
                    ? 'bg-accent text-on-solid border-accent shadow-sm'
                    : 'bg-bg text-muted border-line hover:text-text'
                }`}
              >
                $5 (35 Bs)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUSDChange(10)
                  setIsCustom(false)
                }}
                className={`px-2.5 py-1 rounded-md border text-xs font-bold transition-all ${
                  amountUSD === 10 && !isCustom
                    ? 'bg-accent text-on-solid border-accent shadow-sm'
                    : 'bg-bg text-muted border-line hover:text-text'
                }`}
              >
                $10 (70 Bs)
              </button>
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`px-2.5 py-1 rounded-md border text-xs font-bold transition-all ${
                  isCustom
                    ? 'bg-accent text-on-solid border-accent shadow-sm'
                    : 'bg-bg text-muted border-line hover:text-text'
                }`}
              >
                Otro
              </button>
            </div>
          </div>

          {isCustom && (
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-line/60">
              <div>
                <label className="block text-[11px] font-mono text-muted mb-1">
                  Monto en USD ($):
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amountUSD}
                  onChange={(e) => handleUSDChange(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-bg border border-line text-xs font-mono text-text focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-muted mb-1">
                  Monto en BOB (Bs):
                </label>
                <input
                  type="number"
                  min="7"
                  step="1"
                  value={amountBOB}
                  onChange={(e) => handleBOBChange(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-bg border border-line text-xs font-mono text-text focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          <div className="mt-3 text-center">
            <span className="text-lg font-black text-accent font-mono">
              {method === 'qr' ? `${amountBOB} Bs` : `$${amountUSD} USD`}
            </span>
            <span className="text-xs text-muted font-mono ml-1.5">
              ({method === 'qr' ? `$${amountUSD} USD aprox.` : `${amountBOB} Bs aprox.`})
            </span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => {
              setMethod('qr')
              setResult(null)
            }}
            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
              method === 'qr'
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
              setMethod('paypal')
              setResult(null)
            }}
            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
              method === 'paypal'
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

        {/* Form Body */}
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-text-2 mb-1.5">
                Tu correo electrónico:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full px-4 py-2.5 rounded-xl bg-panel-2 border border-line text-text placeholder-placeholder text-sm focus:outline-none focus:border-accent"
              />
            </div>

            {/* QR Payment Details */}
            {method === 'qr' && (
              <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Total a transferir:</span>
                  <span className="text-base font-bold text-accent font-mono">
                    {amountBOB} Bs
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-bg border border-line text-center flex flex-col items-center justify-center">
                  <div className="w-32 h-32 bg-white rounded-lg p-2 flex items-center justify-center shadow-md">
                    <div className="w-full h-full border-2 border-dashed border-gray-400 flex flex-col items-center justify-center text-gray-800 text-[10px] font-mono text-center">
                      <QrCode className="w-14 h-14 text-gray-800 mb-1" />
                      <span>QR SIMPLE / BANCO</span>
                    </div>
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
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="Ej. 18273645"
                    className="w-full px-3 py-2 rounded-lg bg-bg border border-line text-xs text-text placeholder-placeholder focus:outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-on-solid font-bold text-sm shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : method === 'qr' ? (
                <span>Registrar Apoyo de {amountBOB} Bs</span>
              ) : (
                <span>Continuar a PayPal (${amountUSD} USD)</span>
              )}
            </button>
          </form>
        ) : (
          /* Result Confirmation Box */
          <div className="p-5 rounded-xl bg-panel-2 border border-ok/30 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-ok font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 flex-none" />
              <span>¡Muchísimas gracias por tu apoyo!</span>
            </div>

            {result.key && (
              <div>
                <p className="text-xs text-muted mb-1.5 font-mono">
                  Tu clave de licencia generada:
                </p>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bg border border-line">
                  <code className="font-mono text-sm text-accent font-bold flex-1 select-all">
                    {result.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(result.key!)}
                    className="p-1.5 rounded-md text-muted hover:text-text hover:bg-panel-2 text-xs"
                    title="Copiar clave"
                  >
                    {copied ? 'Copiada' : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {method === 'qr' && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-text-2 leading-relaxed">
                  Para activar tu licencia de inmediato, envía tu comprobante por WhatsApp:
                </p>

                <a
                  href={getWhatsAppLink(result.reference || '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Comprobante por WhatsApp</span>
                </a>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-panel border border-line hover:bg-line text-xs text-muted hover:text-text font-semibold transition-all mt-2"
            >
              Cerrar
            </button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-line text-center text-[11px] text-muted flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-ok" />
          <span>Apoyo directo a luchodev para el desarrollo de Hermit</span>
        </div>
      </div>
    </div>
  )
}
