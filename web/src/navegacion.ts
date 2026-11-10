import { useSyncExternalStore } from 'react'

/**
 * Atrás y adelante de la app. La navegación es por hash (`#/s/<id>`, `#/new/<card>`…), así que cada cambio crea una
 * entrada en el historial del navegador: retroceder y avanzar es `history.back()`/`forward()`. Aquí solo se sabe si se
 * puede (la app no expone la posición en el historial).
 *
 * Todo `hashchange` que no venga de nuestros botones es una entrada nueva (un `go()`, un `location.hash =` de otra
 * parte o editar el hash): la delantera se pierde, como en un navegador. Los dos botones ponen `pop` antes de llamar a
 * history: cuando llega el `hashchange` se sabe que fue un retroceso y no una entrada nueva.
 */
let marca = 0 // en qué entrada estamos (0 = la primera)
let tope = 0 // la última entrada conocida
let pop: -1 | 0 | 1 = 0 // -1 atrás, +1 adelante, mientras llega su hashchange
const oyentes = new Set<() => void>()
const aviso = () => oyentes.forEach((f) => f())

addEventListener('hashchange', () => {
  if (pop === -1) marca = Math.max(0, marca - 1)
  else if (pop === 1) marca = Math.min(tope, marca + 1)
  else tope = ++marca
  pop = 0
  aviso()
})

/** Si `history.back()` no cambia nada (no había entrada), la marca no queda puesta para el próximo cambio. */
const olvido = () => setTimeout(() => (pop = 0), 400)

export const navegacion = {
  puedeAtras: () => marca > 0,
  puedeAdelante: () => marca < tope,
  atras: () => {
    pop = -1
    olvido()
    history.back()
  },
  adelante: () => {
    pop = 1
    olvido()
    history.forward()
  },
  oir: (f: () => void) => {
    oyentes.add(f)
    return () => void oyentes.delete(f)
  }
}

/** Si se puede ir atrás/adelante («10», «01», «11» o «00»), re-renderizando al cambiar. */
export function useNavegacion(): [boolean, boolean] {
  const s = useSyncExternalStore(navegacion.oir, () => `${navegacion.puedeAtras() ? 1 : 0}${navegacion.puedeAdelante() ? 1 : 0}`)
  return [s[0] === '1', s[1] === '1']
}
