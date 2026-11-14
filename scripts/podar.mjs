// Poda a fondo del bucket de descargas: deja en R2 solo lo que se sirve —la última versión y la `anterior/` de cada
// sistema, con sus mapas de bloques— y borra todo instalador versionado de más. La poda de cada publicación ya
// conserva dos por tipo; esta limpia también los .blockmap viejos y lo que haya quedado de versiones saltadas.
// La llave es la de `npm run publicar` (%APPDATA%\hermit\licencias\publicar.txt).
//   node scripts/podar.mjs [--probar]   (--probar: dice qué borraría, sin borrar)
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const COBRO = 'https://hermit-licencias.myhermit.workers.dev'
const LLAVE = (process.env.PUBLICAR || readFileSync(join(process.env.APPDATA ?? '', 'hermit', 'licencias', 'publicar.txt'), 'utf8')).trim()

const r = await fetch(`${COBRO}/podar${process.argv.includes('--probar') ? '?seco=1' : ''}`, {
  method: 'POST',
  headers: { authorization: `Bearer ${LLAVE}` }
})
const j = await r.json().catch(() => ({}))
if (!r.ok) {
  console.error(`El cobro respondió ${r.status}: ${j.error ?? ''}`)
  process.exit(1)
}
if (process.argv.includes('--probar')) {
  console.log(`Se conservarían las versiones ${j.conservar.join(', ')}.`)
  console.log(`Se borrarían ${j.archivos} archivos (${j.mb} MB):`)
  for (const k of j.claves ?? []) console.log(`  ${k}`)
} else {
  console.log(`Poda lista: se conservan las versiones ${j.conservar.join(', ')}.`)
  console.log(`Borrados ${j.archivos} archivos (${j.mb} MB liberados).`)
}
