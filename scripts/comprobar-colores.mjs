import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const RAIZ = join(process.cwd(), 'web', 'src')
const EXCLUIDOS = new Set(['tokens.css', 'Opciones.css', 'Logos.tsx'])
const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/g

function archivos(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(dir, entrada.name)
    if (entrada.isDirectory()) return archivos(ruta)
    if (!/\.(css|tsx?|jsx?)$/.test(entrada.name)) return []
    if (EXCLUIDOS.has(entrada.name)) return []
    return [ruta]
  })
}

function esMascara(linea) {
  return /\bmask(?:-image)?\s*:/.test(linea)
}

const fallos = []
for (const ruta of archivos(RAIZ)) {
  const nombre = relative(process.cwd(), ruta)
  readFileSync(ruta, 'utf8').split('\n').forEach((linea, i) => {
    const colores = linea.match(COLOR) ?? []
    if (!colores.length) return
    if (esMascara(linea) && colores.every((color) => /^#000$/i.test(color))) return
    fallos.push(`${nombre}:${i + 1}  ${linea.trim()}`)
  })
}

if (fallos.length) {
  console.error(`Colores fuera de tokens.css (${fallos.length}):`)
  for (const fallo of fallos) console.error(`  ${fallo}`)
  process.exitCode = 1
} else {
  console.log('Colores centralizados en tokens.css')
}
