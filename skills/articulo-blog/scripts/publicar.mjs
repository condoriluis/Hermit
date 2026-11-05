// Publica un artículo en Blogi (https://miblogi.vercel.app): sube la portada local
// a Cloudinary (carpeta miblogi), registra el medio en la base de datos de Blogi para
// que aparezca en el panel /admin/media, crea una vista previa HTML local y envía el artículo a la API.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'

const URL_PRODUCCION = 'https://miblogi.vercel.app'
const RUTA_ENV_BLOGI = 'C:\\Users\\SALA-PC\\Documents\\github\\blogi\\.env'

/** Lee las credenciales de Cloudinary y Blogi desde process.env o desde blogi/.env. */
function cargarConfiguracion() {
  const env = { ...process.env }
  if (existsSync(RUTA_ENV_BLOGI)) {
    try {
      const lineas = readFileSync(RUTA_ENV_BLOGI, 'utf8').split('\n')
      for (const l of lineas) {
        const limpia = l.trim()
        if (!limpia || limpia.startsWith('#')) continue
        const eq = limpia.indexOf('=')
        if (eq > 0) {
          const k = limpia.slice(0, eq).trim()
          let v = limpia.slice(eq + 1).trim()
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1)
          }
          env[k] ??= v
        }
      }
    } catch {}
  }

  return {
    apiUrl: env.BLOGI_API_URL || URL_PRODUCCION,
    apiKey: env.API_SECRET_KEY || 'OJUscW8F5tMhXAuPjOV4lbwjesH9dOWrwFZlqMJsvXLzP6G4PmrwVR3Zv41Y',
    cloudName: env.CLOUDINARY_CLOUD_NAME || 'dvyvl6ukj',
    cloudinaryApiKey: env.CLOUDINARY_API_KEY || '599786817477182',
    cloudinaryApiSecret: env.CLOUDINARY_API_SECRET || 'krnp13cuh7AJO8Y4lu9K7Ux21WM',
    databaseUrl: env.DATABASE_URL || 'postgresql://postgres.luwhetapdfwmipjdtmzp:X3omzUkH2UiEbmNs@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'
  }
}

/** Sube una imagen a Cloudinary en la carpeta miblogi usando la API REST oficial sin dependencias. */
async function subirACloudinary(archivo, config) {
  const buf = readFileSync(archivo)
  const ext = extname(archivo).toLowerCase().replace('.', '') || 'png'
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png'
  const base64 = `data:${mime};base64,${buf.toString('base64')}`

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'miblogi'
  const toSign = `folder=${folder}&timestamp=${timestamp}${config.cloudinaryApiSecret}`
  const signature = createHash('sha1').update(toSign).digest('hex')

  const formData = new FormData()
  formData.append('file', base64)
  formData.append('folder', folder)
  formData.append('timestamp', timestamp.toString())
  formData.append('api_key', config.cloudinaryApiKey)
  formData.append('signature', signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
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

/** Registra el medio en la tabla `media` de la base de datos de Blogi para que se vea en el gestor de archivos. */
async function registrarMediaEnBaseDeDatos(info, config) {
  try {
    const { PrismaClient } = await import('c:/Users/SALA-PC/Documents/github/blogi/lib/generated/prisma/index.js')
    const prisma = new PrismaClient({
      datasources: { db: { url: config.databaseUrl } }
    })

    const creado = await prisma.media.create({
      data: {
        name: info.name,
        provider: 'cloudinary',
        extension: info.format || 'png',
        type: info.format === 'jpg' || info.format === 'jpeg' ? 'image/jpeg' : 'image/png',
        size: info.bytes || 0,
        url: info.url,
        externalId: info.publicId
      }
    })

    await prisma.$disconnect()
    console.log(`Medio registrado en Gestor de Archivos de Blogi (/admin/media) con ID: ${creado.id}`)
  } catch (err) {
    console.warn(`Aviso: No se pudo registrar en la tabla media de Blogi: ${err.message}`)
  }
}

/** Genera una vista previa HTML elegante e independiente para revisar el artículo aunque esté en DRAFT. */
function generarVistaPreviaHtml(payload, proyDir, respuesta) {
  const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  const tagsHtml = payload.tags.map((t) => `<span class="tag">#${t}</span>`).join(' ')

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
      <span>●</span> Estado en Blogi: <strong>${payload.status}</strong> ${payload.status === 'PUBLISHED' ? '(En vivo en producción)' : '(Borrador pendiente de aprobación en el panel)'}
    </div>
    <h1>${payload.title}</h1>
    <div class="extracto">${payload.excerpt}</div>
    <div class="meta">
      <span>Fecha: ${fecha}</span> · <span>Categoría ID: ${payload.categoryId}</span>
    </div>
    <div class="tags">${tagsHtml}</div>
    ${payload.cover ? `<img class="portada" src="${payload.cover}" alt="${payload.title}">` : ''}
    <div class="contenido">
      ${payload.content}
    </div>
    <div class="acciones">
      <span style="color:var(--muted); font-size:13px;">Slug: <code>${respuesta.slug}</code></span>
      <a class="btn" href="${payload.status === 'PUBLISHED' ? respuesta.url : 'https://miblogi.vercel.app/admin/articles'}" target="_blank" rel="noopener">
        ${payload.status === 'PUBLISHED' ? 'Ver en Producción ↗' : 'Abrir en Panel de Blogi ↗'}
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
  const data = JSON.parse(readFileSync(jsonPath, 'utf8'))

  // Determinar o subir la portada
  let coverUrl = data.cover
  let mediaInfo = null

  if (!coverUrl || !coverUrl.startsWith('http')) {
    const portadaCandidata = ['portada.png', 'portada.jpg', 'portada.jpeg', 'portada.webp']
      .map((p) => join(proyDir, p))
      .find((p) => existsSync(p))

    if (portadaCandidata) {
      console.log(`Subiendo portada ${basename(portadaCandidata)} a Cloudinary...`)
      const resCloud = await subirACloudinary(portadaCandidata, config)
      coverUrl = resCloud.url
      mediaInfo = {
        name: basename(portadaCandidata, extname(portadaCandidata)),
        url: resCloud.url,
        publicId: resCloud.publicId,
        bytes: resCloud.bytes,
        format: resCloud.format
      }
      console.log(`Portada subida: ${coverUrl}`)

      // Registrar en la tabla media de Blogi
      await registrarMediaEnBaseDeDatos(mediaInfo, config)
    }
  }

  const payload = {
    title: String(data.title || '').trim(),
    slug: data.slug ? String(data.slug).trim() : undefined,
    excerpt: String(data.excerpt || '').trim().slice(0, 500),
    content: String(data.content || '').trim(),
    cover: coverUrl || '',
    categoryId: Number(data.categoryId) || 1,
    status: forzarPublicar || data.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    tags: Array.isArray(data.tags) ? data.tags.map((t) => String(t).trim()).filter(Boolean) : []
  }

  if (!payload.title || !payload.content) {
    console.error('El artículo debe tener al menos "title" y "content".')
    process.exit(1)
  }

  console.log(`Publicando en ${config.apiUrl}/api/articles (${payload.status})...`)
  const res = await fetch(`${config.apiUrl}/api/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey
    },
    body: JSON.stringify(payload)
  })

  const respuesta = await res.json()
  if (!res.ok || !respuesta.success) {
    console.error(`Error de publicación (${res.status}):`, respuesta)
    process.exit(1)
  }

  // Generar vista previa HTML local
  generarVistaPreviaHtml(payload, proyDir, respuesta)

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
  console.log(`Panel de control: ${resultado.adminUrl}`)
  console.log(`Vista previa local: ${join(proyDir, 'vista-previa.html')}`)
}

main().catch((err) => {
  console.error('Error fatal al publicar:', err.message)
  process.exit(1)
})
