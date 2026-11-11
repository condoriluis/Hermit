// Da de alta un apoyo cobrado a mano —el QR de Bolivia— después de ver el comprobante en la banca: crea su licencia
// en el Worker (o le suma el periodo si ya tiene una pagada) y le manda la clave por correo. Uso:
//   node scripts/apoyo.mjs <correo> <mensual|anual>
// La llave es la de `npm run publicar` (%APPDATA%\hermit\licencias\publicar.txt).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const COBRO = 'https://hermit-licencias.myhermit.workers.dev'
const [email, plan] = process.argv.slice(2)
if (!email || (plan !== 'mensual' && plan !== 'anual')) {
  console.error('Uso: node scripts/apoyo.mjs <correo> <mensual|anual>')
  process.exit(1)
}
const LLAVE = (process.env.PUBLICAR || readFileSync(join(process.env.APPDATA ?? '', 'hermit', 'licencias', 'publicar.txt'), 'utf8')).trim()

const r = await fetch(`${COBRO}/admin/apoyo`, {
  method: 'POST',
  headers: { authorization: `Bearer ${LLAVE}`, 'content-type': 'application/json' },
  body: JSON.stringify({ email, plan })
})
const j = await r.json().catch(() => ({}))
if (!r.ok) {
  console.error(`El cobro respondió ${r.status}: ${j.error ?? ''}`)
  process.exit(1)
}
console.log(`Apoyo ${plan} para ${j.email}:`)
console.log(`  clave ${j.clave} · vale hasta ${j.pagadaHasta}`)
console.log(j.correo ? '  correo con la clave: enviado.' : '  correo con la clave: NO salió — dásela a mano (arriba está).')
