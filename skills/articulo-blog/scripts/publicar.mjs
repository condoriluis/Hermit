// Publica un artículo en el blog del usuario (el que conectó en Hermit → Opciones → Artículos):
// sube la portada a su Cloudinary si lo configuró, genera una vista previa HTML local y envía el
// artículo a la API del blog. La config vive en <app>/data/articulos.json; también valen variables
// de entorno (ARTICULOS_API_URL, ARTICULOS_API_KEY, ARTICULOS_AUTH_HEADER, ARTICULOS_HEADERS,
// ARTICULOS_ENDPOINT, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_FOLDER).
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// <app>/skills/articulo-blog/scripts → <app> ; en desarrollo, la raíz del repo; en la app, la suya.
const RAIZ_APP = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const ARCHIVO_CONFIG = process.env.ARTICULOS_CONFIG || join(RAIZ_APP, 'data', 'articulos.json')

/** Los headers extra de la config: objeto en el JSON, o texto JSON si viene de una variable de entorno. */
function leerHeaders(v) {
  if (!v) return {}
  if (typeof v === 'object') return v
  try {
    const o = JSON.parse(v)
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {}
  } catch {
    return {}
  }
}

/** La config del blog: la del archivo de Hermit, con las variables de entorno por encima. */
function cargarConfiguracion() {
  let guardada = {}
  try {
    guardada = JSON.parse(readFileSync(ARCHIVO_CONFIG, 'utf8'))
  } catch {
    // Sin archivo: el usuario aún no conecta su blog en Opciones → Artículos.
  }
  const cl = guardada.cloudinary ?? {}
  const env = process.env
  const cloudinary =
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
      ? { cloudName: env.CLOUDINARY_CLOUD_NAME, apiKey: env.CLOUDINARY_API_KEY, apiSecret: env.CLOUDINARY_API_SECRET, folder: env.CLOUDINARY_FOLDER || 'articulos' }
      : cl.cloudName && cl.apiKey && cl.apiSecret
        ? { cloudName: cl.cloudName, apiKey: cl.apiKey, apiSecret: cl.apiSecret, folder: cl.folder || 'articulos' }
        : null
  return {
    apiUrl: (env.ARTICULOS_API_URL || guardada.apiUrl || '').replace(/\/+$/, ''),
    apiKey: env.ARTICULOS_API_KEY || guardada.apiKey || '',
    authHeader: env.ARTICULOS_AUTH_HEADER || guardada.authHeader || 'x-api-key',
    headers: leerHeaders(env.ARTICULOS_HEADERS || guardada.headers),
    endpoint: env.ARTICULOS_ENDPOINT || guardada.endpoint || '/api/articles',
    cloudinary,
    categoryId: Number(guardada.categoryId) || 0,
    status: guardada.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
  }
}

/** Sube una imagen a Cloudinary con la API REST oficial, sin dependencias. */
async function subirACloudinary(archivo, config) {
  const buf = readFileSync(archivo)
  const ext = extname(archivo).toLowerCase().replace('.', '') || 'png'
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png'
  const base64 = `data:${mime};base64,${buf.toString('base64')}`

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = config.cloudinary.folder
  const toSign = `folder=${folder}&timestamp=${timestamp}${config.cloudinary.apiSecret}`
  const signature = createHash('sha1').update(toSign).digest('hex')

  const formData = new FormData()
  formData.append('file', base64)
  formData.append('folder', folder)
  formData.append('timestamp', timestamp.toString())
  formData.append('api_key', config.cloudinary.apiKey)
  formData.append('signature', signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Error al subir imagen a Cloudinary (${res.status}): ${errorText}`)
  }

  const json = await res.json()
  return {
    url: json.secure_url,
    publicId: json.public_id,
    bytes: json.bytes || buf.length,
    format: json.format || ext
  }
}

/** Genera una vista previa HTML elegante e independiente para revisar el artículo aunque esté en DRAFT. */
function generarVistaPreviaHtml(payload, proyDir, respuesta, config) {
  const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  const tagsHtml = payload.tags.map((t) => `<span class="tag">#${t}</span>`).join(' ')
  // La dirección pública es la misma que queda en publicado.json: la API no devuelve `url`, solo el slug.
  const urlPublico = `${config.apiUrl}/blog/${respuesta.slug}`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vista previa: ${payload.title}</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card: #131b2e;
      --text: #e2e8f0;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --tag-bg: rgba(56, 189, 248, 0.12);
      --border: #1e293b;
    }
    body {
      margin: 0;
      padding: 40px 20px;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.7;
    }
    .contenedor {
      max-width: 820px;
      margin: 0 auto;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 36px 48px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .aviso {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(234, 179, 8, 0.12);
      color: #facc15;
      border: 1px solid rgba(234, 179, 8, 0.3);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 34px;
      line-height: 1.25;
      margin: 0 0 16px;
      letter-spacing: -0.02em;
      color: #fff;
    }
    .extracto {
      font-size: 18px;
      color: var(--muted);
      margin-bottom: 24px;
      font-weight: 400;
      border-left: 3px solid var(--accent);
      padding-left: 14px;
    }
    .meta {
      display: flex;
      gap: 16px;
      color: var(--muted);
      font-size: 13.5px;
      margin-bottom: 24px;
    }
    .tags {
      margin-bottom: 28px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .tag {
      background: var(--tag-bg);
      color: var(--accent);
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 12.5px;
      font-weight: 600;
    }
    .portada {
      width: 100%;
      aspect-ratio: 16 / 9;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 36px;
      border: 1px solid var(--border);
    }
    .contenido {
      font-size: 17px;
    }
    .contenido h2 {
      font-size: 24px;
      color: #fff;
      margin-top: 36px;
      margin-bottom: 14px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }
    .contenido h3 {
      font-size: 20px;
      color: #e2e8f0;
      margin-top: 24px;
    }
    .contenido p {
      margin-bottom: 20px;
    }
    .contenido ul, .contenido ol {
      padding-left: 24px;
      margin-bottom: 24px;
    }
    .contenido li {
      margin-bottom: 8px;
    }
    .contenido code {
      background: #1e293b;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
      color: #38bdf8;
    }
    .acciones {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn {
      background: var(--accent);
      color: #0b0f19;
      padding: 10px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="contenedor">
    <div class="aviso" style="${payload.status === 'PUBLISHED' ? 'background:rgba(16,185,129,0.12); color:#10b981; border:1px solid rgba(16,185,129,0.25);' : ''}">
      <span>●</span> Estado en el blog: <strong>${payload.status}</strong> ${payload.status === 'PUBLISHED' ? '(En vivo en producción)' : '(Borrador pendiente de aprobación en el panel)'}
    </div>
    <h1>${payload.title}</h1>
    <div class="extracto">${payload.excerpt}</div>
    <div class="meta">
      <span>Fecha: ${fecha}</span>${payload.categoryId ? ` · <span>Categoría ID: ${payload.categoryId}</span>` : ''}
    </div>
    <div class="tags">${tagsHtml}</div>
    ${payload.cover ? `<img class="portada" src="${payload.cover}" alt="${payload.title}">` : ''}
    <div class="contenido">
      ${payload.content}
    </div>
    <div class="acciones">
      <span style="color:var(--muted); font-size:13px;">Slug: <code>${respuesta.slug}</code></span>
      <a class="btn" href="${payload.status === 'PUBLISHED' ? urlPublico : `${config.apiUrl}/admin/articles`}" target="_blank" rel="noopener">
        ${payload.status === 'PUBLISHED' ? 'Ver en Producción ↗' : 'Abrir en el panel del blog ↗'}
      </a>
    </div>
  </div>
</body>
</html>`

  const vistaPath = join(proyDir, 'vista-previa.html')
  writeFileSync(vistaPath, html, 'utf8')
  console.log(`Vista previa local guardada: ${vistaPath}`)
}

async function main() {
  const args = process.argv.slice(2)
  const proyDir = resolve(args[0] || process.cwd())
  const forzarPublicar = args.includes('--publicar')

  const jsonPath = join(proyDir, 'articulo.json')
  if (!existsSync(jsonPath)) {
    console.error(`No se encontró ${jsonPath}. Genera primero el contenido del artículo.`)
    process.exit(1)
  }

  const config = cargarConfiguracion()
  if (!config.apiUrl || !config.apiKey) {
    console.error(`Falta la conexión con el blog: ponla en Hermit → Opciones → Artículos (se guarda en ${ARCHIVO_CONFIG}).`)
    process.exit(1)
  }
  const data = JSON.parse(readFileSync(jsonPath, 'utf8'))

  // La portada: se sube a Cloudinary si el usuario lo configuró; si no, solo vale una que ya sea URL.
  let coverUrl = typeof data.cover === 'string' && data.cover.startsWith('http') ? data.cover : ''
  if (!coverUrl) {
    const portadaCandidata = ['portada.png', 'portada.jpg', 'portada.jpeg', 'portada.webp']
      .map((p) => join(proyDir, p))
      .find((p) => existsSync(p))

    if (portadaCandidata) {
      if (config.cloudinary) {
        console.log(`Subiendo portada ${basename(portadaCandidata)} a Cloudinary...`)
        const resCloud = await subirACloudinary(portadaCandidata, config)
        coverUrl = resCloud.url
        console.log(`Portada subida: ${coverUrl}`)
      } else {
        console.warn('Aviso: sin Cloudinary en Opciones → Artículos, el artículo sale sin portada alojada.')
      }
    }
  }

  const status = forzarPublicar || data.status === 'PUBLISHED' || (!data.status && config.status === 'PUBLISHED') ? 'PUBLISHED' : 'DRAFT'
  const categoryId = Number(data.categoryId) || config.categoryId
  const payload = {
    title: String(data.title || '').trim(),
    slug: data.slug ? String(data.slug).trim() : undefined,
    excerpt: String(data.excerpt || '').trim().slice(0, 500),
    content: String(data.content || '').trim(),
    cover: coverUrl,
    // Sin categoría ni en el artículo ni en la config, el campo no viaja: cada blog decide si la pide.
    ...(categoryId ? { categoryId } : {}),
    status,
    tags: Array.isArray(data.tags) ? data.tags.map((t) => String(t).trim()).filter(Boolean) : []
  }

  if (!payload.title || !payload.content) {
    console.error('El artículo debe tener al menos "title" y "content".')
    process.exit(1)
  }

  console.log(`Publicando en ${config.apiUrl}${config.endpoint} (${payload.status})...`)
  const res = await fetch(`${config.apiUrl}${config.endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
      [config.authHeader]: config.apiKey
    },
    body: JSON.stringify(payload)
  })

  const respuesta = await res.json()
  if (!res.ok || !respuesta.success) {
    console.error(`Error de publicación (${res.status}):`, respuesta)
    process.exit(1)
  }

  // Generar vista previa HTML local
  generarVistaPreviaHtml(payload, proyDir, respuesta, config)

  const resultado = {
    id: respuesta.id,
    slug: respuesta.slug,
    status: payload.status,
    cover: coverUrl,
    categoryId: payload.categoryId,
    url: `${config.apiUrl}/blog/${respuesta.slug}`,
    adminUrl: `${config.apiUrl}/admin/articles`,
    vistaPreviaLocal: 'vista-previa.html',
    fecha: new Date().toISOString()
  }

  const outPath = join(proyDir, 'publicado.json')
  writeFileSync(outPath, JSON.stringify(resultado, null, 2) + '\n', 'utf8')
  console.log(`¡Artículo procesado con éxito!`)
  console.log(`ID: ${resultado.id}`)
  console.log(`Slug: ${resultado.slug}`)
  console.log(`Estado: ${resultado.status}`)
  console.log(`Panel del blog: ${resultado.adminUrl}`)
  console.log(`Vista previa local: ${join(proyDir, 'vista-previa.html')}`)
}

main().catch((err) => {
  console.error('Error fatal al publicar:', err.message)
  process.exit(1)
})
