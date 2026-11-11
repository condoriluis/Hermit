// Publica lo que dejó `npm run compilar` en dist/instalador para este sistema: lo sube al cobro de Hermit (`licencias/`,
// en R2). Primero el instalador (Hermit-Setup-<versión>.exe, el .dmg de Mac o el AppImage de Linux), que desde ese
// momento es el que da https://hermit-licencias.myhermit.workers.dev/descargar (`?so=mac`, `?so=linux`), el enlace de
// myhermit.vercel.app; luego lo demás (el .zip de Mac y los mapas de bloques), y al final latest.yml (latest-mac.yml,
// latest-linux.yml), que es lo que mira la app instalada para ofrecer la versión nueva: cuando lo ve, lo demás ya está.
// Va por partes de 64 MB: el instalador pesa más de lo que aceptan wrangler y un Worker de una vez. La llave está en
// %APPDATA%\hermit\licencias\publicar.txt (es el secreto PUBLICAR del Worker); en GitHub, la rama `venta` la pasa en la
// variable PUBLICAR (.github/workflows/venta.yml). Cada versión nueva es primero de quien apoya (ANTICIPO del Worker)
// y `ANTICIPO` después pasa a ser de todos; PARA_TODOS=1 la suelta ya (un arreglo urgente, o cuando una meta del
// roadmap se cumple y el creador no quiere esperar). FIRMADA=1: la de Mac va
// firmada por Apple, y el cobro deja de explicar cómo abrirla la primera vez.
import { closeSync, existsSync, openSync, readFileSync, readSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const COBRO = 'https://hermit-licencias.myhermit.workers.dev'
const PARTE = 64 * 1024 * 1024
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..')
const VERSION = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).version
const ARCH = process.arch === 'arm64' ? 'arm64' : 'x64'
/** Por sistema: el instalador, lo demás que usa al actualizarse, lo que lee electron-updater y su enlace de descarga. */
const { instalador, otros, ultimo, so } = {
  win32: { instalador: `Hermit-Setup-${VERSION}.exe`, otros: [], ultimo: 'latest.yml', so: '' },
  // La de Apple Silicon, con su canal (scripts/compilar.mjs): cada Mac tiene su última versión.
  darwin: {
    instalador: `Hermit-${VERSION}-mac-${ARCH}.dmg`,
    otros: [`Hermit-${VERSION}-mac-${ARCH}.zip`],
    ultimo: ARCH === 'arm64' ? 'latest-arm64-mac.yml' : 'latest-mac.yml',
    so: ARCH === 'arm64' ? '?so=mac-arm64' : '?so=mac'
  },
  // electron-builder llama x86_64 al AppImage de x64.
  linux: { instalador: `Hermit-${VERSION}-linux-${ARCH === 'x64' ? 'x86_64' : ARCH}.AppImage`, otros: [], ultimo: 'latest-linux.yml', so: '?so=linux' }
}[process.platform]
const LLAVE =(process.env.PUBLICAR || readFileSync(join(process.env.APPDATA ?? '', 'hermit', 'licencias', 'publicar.txt'), 'utf8')).trim()

/** Una petición al cobro; si falla, se corta con su error. */
async function cobro(ruta, metodo, cuerpo) {
  const r = await fetch(`${COBRO}/publicar/${ruta}`, { method: metodo, headers: { authorization: `Bearer ${LLAVE}` }, body: cuerpo })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${ruta}: ${j.error ?? `respondió ${r.status}`}`)
  return j
}

const enDist = (archivo) => join(REPO, 'dist', 'instalador', archivo)

async function subir(archivo) {
  const ruta = enDist(archivo)
  const bytes = statSync(ruta).size
  const q = (extra = '') => `archivo=${encodeURIComponent(archivo)}${extra}`
  console.log(`Publicando ${archivo} (${(bytes / 1024 ** 2).toFixed(1)} MB)`)
  const { upload } = await cobro(`inicio?${q()}`, 'POST')
  const partes = []
  const fd = openSync(ruta, 'r')
  try {
    for (let n = 1, desde = 0; desde < bytes; n++, desde += PARTE) {
      const pedazo = Buffer.alloc(Math.min(PARTE, bytes - desde))
      readSync(fd, pedazo, 0, pedazo.length, desde)
      partes.push(await cobro(`parte?${q(`&upload=${encodeURIComponent(upload)}&n=${n}`)}`, 'PUT', pedazo))
      if (bytes > PARTE) console.log(`  ${Math.round(((desde + pedazo.length) / bytes) * 100)} %`)
    }
  } finally {
    closeSync(fd)
  }
  return cobro(`fin?${q(`&upload=${encodeURIComponent(upload)}`)}`, 'POST', JSON.stringify({ partes, version: VERSION, paraTodos: process.env.PARA_TODOS === '1', firmada: process.platform === 'darwin' && process.env.FIRMADA === '1' }))
}

const u = await subir(instalador)
// El AppImage lleva su mapa dentro: no todos dejan uno aparte.
for (const f of [...otros, ...[instalador, ...otros].map((f) => `${f}.blockmap`)]) if (existsSync(enDist(f))) await subir(f)
await subir(ultimo)
console.log(`\nListo: la ${u.version} es la que se descarga en ${COBRO}/descargar${so}, y la que ofrece Hermit al actualizar.`)
