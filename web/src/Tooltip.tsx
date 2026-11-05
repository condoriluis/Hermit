import { useEffect, useState } from 'react'

interface TooltipState {
  texto: string
  x: number
  y: number
  arriba: boolean
  derecho: boolean
  visible: boolean
}

let timeoutMostrar: ReturnType<typeof setTimeout> | null = null
let ultimoOculto = 0

/**
 * Sistema de tooltip profesional y fluido para Hermit.
 * Detecta elementos con `data-tooltip` o el atributo nativo `title`, neutralizando
 * el retraso y estilo tosco del navegador y dibujando un flotante oscuro estilizado con la paleta de Hermit.
 */
export function TooltipGlobal() {
  const [estado, setEstado] = useState<TooltipState>({
    texto: '',
    x: 0,
    y: 0,
    arriba: true,
    derecho: false,
    visible: false
  })

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
        const rect = el.getBoundingClientRect()
        const xCentro = rect.left + rect.width / 2
        // Decidimos si colocarlo arriba o abajo según el espacio en pantalla
        const arriba = rect.top >= 36
        const y = arriba ? rect.top - 6 : rect.bottom + 6

        // Lado derecho si el elemento lo pide explícitamente o está dentro de la barra lateral
        const enSidebar = !!el.closest('aside.sidebar')
        const ladoDerecho =
          enSidebar ||
          (el.hasAttribute('data-tooltip-lado') && el.getAttribute('data-tooltip-lado') === 'derecho')
        const x = ladoDerecho
          ? rect.right + 8
          : Math.max(12, Math.min(window.innerWidth - 12, xCentro))
        // Tooltip derecho: Y centrado en el elemento; arriba/abajo: lógica normal
        const yFinal = ladoDerecho ? rect.top + rect.height / 2 : y

        setEstado({
          texto,
          x,
          y: yFinal,
          arriba,
          derecho: ladoDerecho,
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
    window.addEventListener('scroll', ocultar, { passive: true })

    return () => {
      document.removeEventListener('pointerover', mostrar)
      document.removeEventListener('pointerout', ocultar)
      document.removeEventListener('pointerdown', alBajar)
      document.removeEventListener('focusin', mostrar)
      document.removeEventListener('focusout', ocultar)
      window.removeEventListener('scroll', ocultar)
      if (timeoutMostrar) clearTimeout(timeoutMostrar)
    }
  }, [])

  if (!estado.visible && !estado.texto) return null

  return (
    <div
      role="tooltip"
      className={`hermit-tooltip${estado.visible ? ' visible' : ''}${estado.arriba ? ' arriba' : ' abajo'}${estado.derecho ? ' derecho' : ''}`}
      style={{
        left: `${estado.x}px`,
        top: `${estado.y}px`
      }}
    >
      {estado.texto}
    </div>
  )
}

