import { NextResponse } from 'next/server'
import { RESPALDO_BOB } from '@/lib/cobro'

/**
 * El dólar del mercado en Bolivia (el P2P de Binance, que es el que sigue la gente), para pasar los precios a
 * bolivianos al cambio del día. Se refresca cada cinco minutos: no hace falta pedirlo en cada visita.
 */
const FUENTE = 'https://bo.dolarapi.com/v1/dolares/binance'

export const revalidate = 300

export async function GET() {
  try {
    const r = await fetch(FUENTE, { next: { revalidate: 300 } })
    if (r.ok) {
      const d = await r.json()
      const bob = Number(d?.venta)
      if (Number.isFinite(bob) && bob > 0) return NextResponse.json({ bob, cuando: d?.fechaActualizacion ?? null })
    }
  } catch {
    // Sin la fuente se sigue con el respaldo: el apoyo se puede pagar igual.
  }
  return NextResponse.json({ bob: RESPALDO_BOB, cuando: null })
}
