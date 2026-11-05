/**
 * scripts/build-native.mjs
 *
 * Compila el módulo nativo de Rust (`crates/hermit-native`) y deja el binario listo
 * en `server/native/hermit_native.node`.
 *
 * Uso:
 *   npm run build-native        → release (producción)
 *   npm run build-native:dev    → debug (compilación rápida)
 *
 * En Windows no hace falta node.lib: los símbolos de N-API se resuelven al cargar
 * (napi-sys usa libloading sobre el propio proceso). En Mac y Linux, napi-build
 * pone los enlaces que sí hacen falta. `npm run compilar` lo llama antes de
 * empaquetar, y el .node viaja con el resto del servidor.
 */

import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CRATE = join(ROOT, 'crates', 'hermit-native')
const DESTINO = join(ROOT, 'server', 'native', 'hermit_native.node')
const DEV = process.argv.includes('--dev')
const PERFIL = DEV ? 'debug' : 'release'

/** El archivo que produce `cargo` en cada sistema. */
const BINARIO = {
  win32: 'hermit_native.dll',
  darwin: 'libhermit_native.dylib',
  linux: 'libhermit_native.so'
}[process.platform]

if (!BINARIO) {
  console.error(`[build-native] Sistema no soportado: ${process.platform}`)
  process.exit(1)
}

function cargo(args, opciones = {}) {
  return execFileSync('cargo', args, { cwd: CRATE, ...opciones })
}

/** El `target/` del workspace (en la raíz, no en la carpeta del crate). */
function target() {
  try {
    return JSON.parse(cargo(['metadata', '--no-deps', '--format-version', '1'], { encoding: 'utf8' })).target_directory
  } catch (error) {
    if (error?.code === 'ENOENT') console.error('[build-native] No se encontró cargo. Instala Rust (https://rustup.rs) para compilar el módulo nativo.')
    else console.error('[build-native] cargo metadata falló. Revisa el error de arriba.')
    process.exit(1)
  }
}

console.log(`\n[build-native] Compilando hermit-native (${PERFIL})…`)
const TARGET = target()
try {
  cargo(['build', ...(DEV ? [] : ['--release'])], { stdio: 'inherit' })
} catch {
  console.error('[build-native] cargo build falló. Revisa el error de arriba.')
  process.exit(1)
}

const origen = join(TARGET, PERFIL, BINARIO)
if (!existsSync(origen)) {
  console.error(`[build-native] No se encontró el binario compilado en:\n  ${origen}`)
  process.exit(1)
}

mkdirSync(dirname(DESTINO), { recursive: true })
copyFileSync(origen, DESTINO)

// Que Node lo pueda cargar de verdad: un binario de otra arquitectura o una
// compilación a medias se ve aquí y no en la app de un cliente.
try {
  execFileSync(
    process.execPath,
    ['-e', `const m = require(${JSON.stringify(DESTINO)}); if (!m.hardwareInfo || !m.calcularPicosAudio) process.exit(1)`],
    { stdio: 'inherit' }
  )
} catch {
  console.error('[build-native] El módulo se compiló pero Node no lo pudo cargar.')
  process.exit(1)
}

const kb = Math.round(statSync(DESTINO).size / 1024)
console.log(`[build-native] Listo: ${DESTINO} (${kb} KB)\n`)
