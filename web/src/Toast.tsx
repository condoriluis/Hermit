import { useEffect, useState } from 'react'
import { Icono } from './Iconos'

export type ToastTipo = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  tipo: ToastTipo
  titulo: string
  descripcion?: string
  duracion?: number
}

type Listener = (toasts: ToastItem[]) => void
let toastsActivos: ToastItem[] = []
const listeners = new Set<Listener>()

function emitir() {
  for (const fn of listeners) fn([...toastsActivos])
}

export const toast = {
  success(titulo: string, opciones?: { descripcion?: string; duracion?: number }) {
    toast.agregar('success', titulo, opciones)
  },
  error(titulo: string, opciones?: { descripcion?: string; duracion?: number }) {
    toast.agregar('error', titulo, opciones)
  },
  info(titulo: string, opciones?: { descripcion?: string; duracion?: number }) {
    toast.agregar('info', titulo, opciones)
  },
  agregar(tipo: ToastTipo, titulo: string, opciones?: { descripcion?: string; duracion?: number }) {
    const id = Math.random().toString(36).slice(2, 9)
    const duracion = opciones?.duracion ?? 3800
    const item: ToastItem = {
      id,
      tipo,
      titulo,
      descripcion: opciones?.descripcion,
      duracion
    }
    // Mantenemos hasta 3 toasts visibles apilados estilo Sonner
    toastsActivos = [item, ...toastsActivos.slice(0, 2)]
    emitir()

    if (duracion > 0) {
      setTimeout(() => {
        toast.quitar(id)
      }, duracion)
    }
  },
  quitar(id: string) {
    toastsActivos = toastsActivos.filter((t) => t.id !== id)
    emitir()
  }
}

/**
 * Contenedor global de Toasts estilo Sonner para Hermit.
 * Flotante, moderno, con sombra profunda y la paleta de Hermit.
 */
export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    listeners.add(setItems)
    return () => void listeners.delete(setItems)
  }, [])

  if (!items.length) return null

  return (
    <div className="hermit-toast-container" role="region" aria-label="Notificaciones">
      {items.map((t, idx) => (
        <div
          key={t.id}
          className={`hermit-toast hermit-toast-${t.tipo}`}
          style={{
            '--idx': idx,
            zIndex: 1000 - idx
          } as React.CSSProperties}
          onClick={() => toast.quitar(t.id)}
        >
          <span className="hermit-toast-icono">
            {t.tipo === 'success' && <Icono de="palomita" />}
            {t.tipo === 'error' && <Icono de="cerrar" />}
            {t.tipo === 'info' && <Icono de="foco" />}
          </span>
          <div className="hermit-toast-contenido">
            <strong className="hermit-toast-titulo">{t.titulo}</strong>
            {t.descripcion && <span className="hermit-toast-desc">{t.descripcion}</span>}
          </div>
          <button className="hermit-toast-cerrar" onClick={(e) => (e.stopPropagation(), toast.quitar(t.id))} aria-label="Cerrar">
            <Icono de="cerrar" />
          </button>
        </div>
      ))}
    </div>
  )
}

