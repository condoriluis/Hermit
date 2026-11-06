/**
 * Los instaladores los sirve el Worker público de Hermit (ver `licencias/`, ruta `/descargar`), el mismo del cobro:
 * el repositorio es privado y sus Releases no se pueden abrir sin sesión. La base está en `cobro.ts`
 * (NEXT_PUBLIC_COBRO_URL), así que apuntar a otro sitio es cambiar esa sola variable.
 */
import { COBRO } from './cobro'

export const DESCARGA = `${COBRO}/descargar`

/** El enlace del instalador de cada sistema: Windows va sin sufijo; Mac deja elegir Intel o Apple Silicon. */
export function enlaceDescarga(so: 'windows' | 'mac' | 'linux'): string {
  return so === 'windows' ? DESCARGA : `${DESCARGA}?so=${so}`
}
