/**
 * Avisos y umbrales para la concurrencia de videos en Hermit (ADR 0011).
 *
 * El umbral `VIDEOS_SIN_AVISO` es fijo (decisión de UX). Cuando se conoce la
 * memoria de la máquina, el aviso la usa para dar un motivo concreto.
 */

/** Con cuántos videos trabajando a la vez Hermit deja de arrancar otro sin preguntar.
 *  No es un tope duro: el usuario puede ignorarlo. */
export const VIDEOS_SIN_AVISO = 2

export interface ContextoAviso {
  /** MB de RAM libre en este momento. */
  ramLibreMb?: number
  /** MB de RAM total de la máquina. */
  ramTotalMb?: number
}

/**
 * Texto de aviso antes de arrancar más videos de los recomendados.
 * Sin pasarse de `VIDEOS_SIN_AVISO` no hay aviso; con poca memoria, lo dice.
 */
export function avisoDeVideos(trabajando: number, nuevos = 1, ctx: ContextoAviso = {}): string | undefined {
  const total = trabajando + nuevos
  if (total <= VIDEOS_SIN_AVISO) return

  const ya =
    trabajando === 1 ? 'Ya hay 1 video trabajando'
    : trabajando ? `Ya hay ${trabajando} videos trabajando`
    : `Son ${total} videos`
  const conteo = trabajando
    ? ` y con ${nuevos === 1 ? 'este' : 'estos'} serían ${total}`
    : ''

  const base = `${ya}${conteo}. Con más de ${VIDEOS_SIN_AVISO} a la vez, la computadora puede ir lenta y el audio puede tardar bastante más`
  const { ramLibreMb, ramTotalMb } = ctx
  if (ramLibreMb === undefined || ramTotalMb === undefined || ramTotalMb <= 0) {
    return `${base}, sobre todo con poca memoria.`
  }

  const porcentaje = Math.round((ramLibreMb / ramTotalMb) * 100)
  if (ramLibreMb < 1500) {
    return `${base}: solo quedan ${ramLibreMb} MB libres (${porcentaje} % de ${ramTotalMb} MB).`
  }
  if (ramLibreMb < 3000) {
    return `${base}: quedan ${ramLibreMb} MB libres (${porcentaje} %).`
  }
  return `${base}.`
}
