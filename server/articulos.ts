/**
 * Dónde publica la card «Artículos»: la API del blog de cada quien y, si la tiene, su Cloudinary para la portada.
 * Vive en `data/articulos.json` (sobrevive a las actualizaciones, es del usuario) y lo leen los scripts de la skill
 * `articulo-blog`, que lo buscan en `<app>/data/` — en desarrollo, la raíz del repo; en la app instalada, la suya.
 */
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ArticulosConfig } from '../shared/types.ts'
import { cuerpo, json } from './http.ts'
import { guardar } from './disco.ts'

const vacio = (s: unknown, max = 500) => (typeof s === 'string' ? s.trim().slice(0, max) : '')

/** Solo lo que la config conoce, limpio: cualquier otro campo del cliente se tira. */
function limpiar(d: ArticulosConfig): ArticulosConfig {
  const c: ArticulosConfig = {}
  const apiUrl = vacio(d.apiUrl, 300)
  if (apiUrl) {
    try {
      const u = new URL(apiUrl)
      if (u.protocol === 'https:' || u.protocol === 'http:') c.apiUrl = u.origin + u.pathname.replace(/\/+$/, '')
    } catch {
      // Una dirección que no es URL se guarda tal cual: el script dirá que no responde.
      if (/^https?:\/\//.test(apiUrl)) c.apiUrl = apiUrl.replace(/\/+$/, '')
    }
  }
  const apiKey = vacio(d.apiKey, 500)
  if (apiKey) c.apiKey = apiKey
  const cl = d.cloudinary ?? {}
  const cloudinary = {
    cloudName: vacio(cl.cloudName, 100),
    apiKey: vacio(cl.apiKey, 100),
    apiSecret: vacio(cl.apiSecret, 100),
    folder: vacio(cl.folder, 100) || 'articulos'
  }
  if (cloudinary.cloudName || cloudinary.apiKey || cloudinary.apiSecret) c.cloudinary = cloudinary
  if (Number.isFinite(d.categoryId) && (d.categoryId as number) > 0) c.categoryId = Math.floor(d.categoryId as number)
  if (d.status === 'PUBLISHED' || d.status === 'DRAFT') c.status = d.status
  return c
}

export function articulos(app: string) {
  const archivo = join(app, 'data', 'articulos.json')
  const leer = (): ArticulosConfig => {
    try {
      return JSON.parse(readFileSync(archivo, 'utf8')) as ArticulosConfig
    } catch {
      return {}
    }
  }
  async function api(req: IncomingMessage, res: ServerResponse, path: string): Promise<boolean> {
    if (path !== '/api/articulos/config') return false
    if (req.method === 'GET') return json(res, 200, leer()), true
    if (req.method === 'POST') {
      const c = limpiar(await cuerpo<ArticulosConfig>(req))
      mkdirSync(dirname(archivo), { recursive: true })
      guardar(archivo, JSON.stringify(c, null, 1))
      return json(res, 200, c), true
    }
    return false
  }
  return { api }
}
