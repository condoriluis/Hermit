import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type Lado = 'arriba' | 'abajo' | 'derecho' | 'izquierda'

interface TooltipState {
  texto: string
  /** El rectángulo del elemento que lo abrió: desde ahí se recoloca si no cabe. */
  rect: { top: number; left: number; right: number; bottom: number; width: number; height: number }
  lado: Lado
  /** El punto de anclaje: centro-abajo/arriba para arriba/abajo, medio-lado para derecho/izquierda. */
  x: number
  y: number
  visible: boolean
}

const MARGEN = 8
// La holgura visual la pone el transform de cada lado en CSS (6px arriba/abajo, 8px a los lados).
const H_VERTICAL = 6
const H_HORIZONTAL = 8

let timeoutMostrar: ReturnType<typeof setTimeout> | null = null
let ultimoOculto = 0

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

/**
 * Sistema de tooltip profesional y fluido para Hermit.
 * Detecta elementos con `data-tooltip` o el atributo nativo `title`, neutralizando
 * el retraso y estilo tosco del navegador y dibujando un flotante oscuro estilizado con la paleta de Hermit.
 * El texto envuelve líneas (`\n` se respeta) y, ya medido, se recoloca: si no cabe arriba baja, si no cabe a la
 * derecha salta a la izquierda, y nunca se sale de la ventana.
 */
export function TooltipGlobal() {
  const ref = useRef<HTMLDivElement>(null)
  const [estado, setEstado] = useState<TooltipState>({ texto: '', rect: { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }, lado: 'arriba', x: 0, y: 0, visible: false })

  useEffect(() => {
    function buscarTexto(target: EventTarget | null): { el: HTMLElement; texto: string } | null {
      if (!(target instanceof HTMLElement)) return null
      const el = target.closest<HTMLElement>('[data-tooltip], [title], [data-hermit-title]')
      if (!el) return null

      // Si tiene title nativo, lo movemos a data-hermit-title para evitar el popup del navegador
      if (el.hasAttribute('title')) {
        const t = el.getAttribute('title')?.trim() ?? ''
        el.removeAttribute('title')
        if (t) el.setAttribute('data-hermit-title', t)
      }

      const texto = el.getAttribute('data-tooltip')?.trim() || el.getAttribute('data-hermit-title')?.trim() || ''
      return texto ? { el, texto } : null
    }

    function mostrar(e: PointerEvent | FocusEvent) {
      const match = buscarTexto(e.target)
      if (!match) {
        ocultar()
        return
      }

      const { el, texto } = match
      const ahora = Date.now()
      // Si recientemente hubo un tooltip (modo 'warm'), se muestra casi de inmediato (20ms)
      const retraso = ahora - ultimoOculto < 350 ? 20 : 200

      if (timeoutMostrar) clearTimeout(timeoutMostrar)

      timeoutMostrar = setTimeout(() => {
        const r = el.getBoundingClientRect()
        const rect = { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height }
        // Lado derecho si el elemento lo pide explícitamente o está dentro de la barra lateral
        const enSidebar = !!el.closest('aside.sidebar')
        const prefiereDerecho = enSidebar || el.getAttribute('data-tooltip-lado') === 'derecho'
        const lado: Lado = prefiereDerecho ? 'derecho' : rect.top >= 36 ? 'arriba' : 'abajo'

        setEstado({
          texto,
          rect,
          lado,
          x: prefiereDerecho ? rect.right : rect.left + rect.width / 2,
          y: prefiereDerecho ? rect.top + rect.height / 2 : lado === 'arriba' ? rect.top : rect.bottom,
          visible: true
        })
      }, retraso)
    }

    function ocultar() {
      if (timeoutMostrar) {
        clearTimeout(timeoutMostrar)
        timeoutMostrar = null
      }
      ultimoOculto = Date.now()
      setEstado((prev) => (prev.visible ? { ...prev, visible: false } : prev))
    }

    function alBajar() {
      ocultar()
    }

    document.addEventListener('pointerover', mostrar, { passive: true })
    document.addEventListener('pointerout', ocultar, { passive: true })
    document.addEventListener('pointerdown', alBajar, { passive: true })
    document.addEventListener('focusin', mostrar, { passive: true })
    document.addEventListener('focusout', ocultar, { passive: true })
    // Con captura: también esconde al hacer scroll dentro de un panel (Ideas, Opciones…), no solo el de la ventana.
    document.addEventListener('scroll', ocultar, { capture: true, passive: true })

    return () => {
      document.removeEventListener('pointerover', mostrar)
      document.removeEventListener('pointerout', ocultar)
      document.removeEventListener('pointerdown', alBajar)
      document.removeEventListener('focusin', mostrar)
      document.removeEventListener('focusout', ocultar)
      document.removeEventListener('scroll', ocultar, { capture: true })
      if (timeoutMostrar) clearTimeout(timeoutMostrar)
    }
  }, [])

  // Recoloca el tooltip ya medido: envuelve, voltea de lado si no cabe y lo mantiene dentro de la ventana.
  useLayoutEffect(() => {
    if (!estado.visible || !ref.current) return
    const el = ref.current
    const w = el.offsetWidth
    const h = el.offsetHeight
    const { rect } = estado
    const vw = window.innerWidth
    const vh = window.innerHeight
    let { lado, x, y } = estado

    if (lado === 'arriba' || lado === 'abajo') {
      const cabeArriba = h + H_VERTICAL <= rect.top - MARGEN
      const cabeAbajo = h + H_VERTICAL <= vh - rect.bottom - MARGEN
      if (lado === 'arriba' && !cabeArriba && cabeAbajo) lado = 'abajo'
      else if (lado === 'abajo' && !cabeAbajo && cabeArriba) lado = 'arriba'
      x = clamp(rect.left + rect.width / 2, MARGEN + w / 2, vw - MARGEN - w / 2)
      y = lado === 'arriba' ? rect.top : rect.bottom
    } else {
      const cabeDerecha = w + H_HORIZONTAL <= vw - rect.right - MARGEN
      const cabeIzquierda = w + H_HORIZONTAL <= rect.left - MARGEN
      if (lado === 'derecho' && !cabeDerecha && cabeIzquierda) lado = 'izquierda'
      else if (lado === 'izquierda' && !cabeIzquierda && cabeDerecha) lado = 'derecho'
      x = lado === 'derecho' ? rect.right : rect.left
      y = clamp(rect.top + rect.height / 2, MARGEN + h / 2, vh - MARGEN - h / 2)
    }

    if (lado !== estado.lado || x !== estado.x || y !== estado.y) {
      setEstado((prev) => ({ ...prev, lado, x, y }))
    }
  }, [estado])

  if (!estado.visible && !estado.texto) return null

  return (
    <div ref={ref} role="tooltip" className={`hermit-tooltip ${estado.lado}${estado.texto.length < 26 ? ' corto' : ''}${estado.visible ? ' visible' : ''}`} style={{ left: `${estado.x}px`, top: `${estado.y}px` }}>
      {estado.texto}
    </div>
  )
}
