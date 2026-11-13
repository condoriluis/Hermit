import type { Card, Etapa } from './types.ts'

/**
 * Cómo se lee el avance de un hilo de video, lo mismo en el estudio (`web/src/Estudio.tsx`, `usePasos` en Etapas.tsx) que
 * en la barra lateral (`server/avances.ts`): en qué etapa va.
 */

/** Si los hilos de esta card se ven en el estudio: los de un estilo de video, cuyas etapas dicen su fase. */
export const esDeEstudio = (card?: Card) => !!card?.etapas?.some((e) => e.fase)

/**
 * En qué etapa va el hilo (`-1`: terminó) y cuáles se saltó. Una etapa sin hacer con otra posterior ya hecha se saltó (una
 * revisión que no hizo falta). La última de la fase Video no se salta: sin ella no hay video, aunque ya esté lo de
 * después. La última de todas, tampoco: el hilo no ha terminado hasta que esté.
 */
export function enCurso(etapas: (Etapa & { hecha: boolean })[]) {
  const final = etapas.findLastIndex((e) => e.fase === 'video')
  const saltada = (i: number) => i !== final && !etapas[i].hecha && etapas.slice(i + 1).some((e) => e.hecha)
  return { current: etapas.findIndex((e, i) => !e.hecha && !saltada(i)), saltada }
}

/** Una etapa no puede tardar más de una semana: más que eso es un dato corrupto o una espera larguísima. */
const TOPE_ETAPA = 7 * 86_400_000

/**
 * Cuánto tardó cada etapa, en segundos: su `hechaEn` menos el de la anterior ya hecha (la primera, desde `desde`, que
 * suele ser el `createdAt` del hilo). `undefined` en las que no están hechas o cuyo tiempo no cuadra. Las saltadas no
 * cuentan: la siguiente se mide desde la última que sí se hizo.
 */
export function tiemposDe(etapas: { hecha: boolean; hechaEn?: number }[], desde: number): (number | undefined)[] {
  let antes = desde
  return etapas.map((e) => {
    if (!e.hecha || !e.hechaEn) return undefined
    const d = e.hechaEn - antes
    antes = e.hechaEn
    return d > 0 && d <= TOPE_ETAPA ? Math.round(d / 1000) : undefined
  })
}
