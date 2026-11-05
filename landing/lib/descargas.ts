/**
 * Los instaladores los sirve el Worker público de Hermit (ver `licencias/`, ruta `/descargar`), no GitHub:
 * el repositorio es privado y sus Releases no se pueden abrir sin sesión. Se puede apuntar a otro sitio con
 * NEXT_PUBLIC_DESCARGA_URL sin tocar el código.
 */
export const DESCARGA =
  process.env.NEXT_PUBLIC_DESCARGA_URL || 'https://hermit-licencias.myhermit.workers.dev/descargar'

/** El enlace del instalador de cada sistema: Windows va sin sufijo; Mac deja elegir Intel o Apple Silicon. */
export function enlaceDescarga(so: 'windows' | 'mac' | 'linux'): string {
  return so === 'windows' ? DESCARGA : `${DESCARGA}?so=${so}`
}
