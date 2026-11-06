/**
 * El Worker del cobro de Hermit (`licencias/`): es el mismo que usa la app instalada, así que el precio, la cuenta y la
 * clave que se ven aquí son los de verdad. Sirve los instaladores (`descargas.ts`), enseña el precio (`/precio`) y abre
 * el pago con PayPal (`/suscribir`), que es lo que llama esta página.
 */
export const COBRO = process.env.NEXT_PUBLIC_COBRO_URL || 'https://hermit-licencias.myhermit.workers.dev'

/**
 * La versión publicada de los términos: la fecha de «Última actualización» de `/terminos`. Es la única fuente —la página
 * la muestra y el cobro la manda—, así que al cambiar los términos solo se toca aquí (`lib/legal.ts` la lee).
 */
export const TERMINOS = '2026-11-07'

/** Lo que se paga por el apoyo: un mes, o un año de una vez. */
export type Plan = 'mensual' | 'anual'

/** El precio de hoy, el mismo para todos: `mensual` y `anual` en `moneda`, y los lugares de fundador que quedan. */
export interface Precios {
  mensual: number
  anual: number
  moneda: string
  quedan: number
}

/** El precio de hoy, como lo da el cobro. Si no contesta, se sigue con el que ya se tenía. */
export async function precios(): Promise<Precios | undefined> {
  try {
    const r = await fetch(`${COBRO}/precio`)
    if (!r.ok) return
    const p = await r.json()
    return {
      mensual: Number(p.mensual),
      anual: Number(p.anual),
      moneda: String(p.moneda ?? 'USD'),
      quedan: Number(p.quedan ?? 0),
    }
  } catch {
    return
  }
}

/**
 * Abre el pago de un apoyo y da el enlace de PayPal donde se paga. La clave la manda el cobro por correo al confirmarse el
 * pago, nunca antes: cualquiera podría escribir el correo de otro.
 */
export async function suscribir(email: string, plan: Plan, terminos: string): Promise<{ enlace?: string; error?: string }> {
  try {
    const r = await fetch(`${COBRO}/suscribir`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, plan, acepto: true, terminos }),
    })
    const d = await r.json().catch(() => ({}))
    if (d.enlace) return { enlace: String(d.enlace) }
    return { error: String(d.error ?? 'No pudimos abrir el pago. Intenta otra vez en un momento.') }
  } catch {
    return { error: 'No pudimos llegar al cobro de Hermit. Revisa tu conexión e intenta otra vez.' }
  }
}

/** El dólar del mercado en Bolivia, si su fuente no contesta: así nadie se queda sin poder pagar. */
export const RESPALDO_BOB = 12

/** El precio en bolivianos al cambio del día, hacia arriba: un cambio que se mueve no deja la cuenta corta. */
export const enBolivianos = (usd: number, bob = RESPALDO_BOB) => Math.ceil(usd * bob)
