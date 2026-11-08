import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import type { Card } from '../shared/types.ts'
import { previas } from './previas.ts'
import type { Sessions } from './sessions.ts'

async function pedir(base: string, cards: Card[]): Promise<Record<string, { tipo: string; imagen?: string }>> {
  let cuerpo = ''
  const res = { writeHead: () => {}, end: (b: string) => (cuerpo = b) } as unknown as ServerResponse
  const req = { method: 'GET' } as IncomingMessage
  const sessions = { list: () => [] } as unknown as Sessions
  const api = previas(join(base, 'previas'), () => cards, sessions).api
  assert.equal(await api(req, res, new URL('http://x/api/previas')), true)
  return JSON.parse(cuerpo)
}

test('la previa de una card de imágenes es su última imagen, sin las que empiezan por _', async (t) => {
  const base = mkdtempSync(join(tmpdir(), 'hermit-previas-'))
  t.after(() => rmSync(base, { recursive: true, force: true }))
  const cwd = join(base, 'imagenes')
  const sesion = join(cwd, 'imagen-uno')
  mkdirSync(sesion, { recursive: true })
  for (const [archivo, t] of [['vieja.png', 1], ['nueva.png', 2], ['_a-medias.png', 3]] as const) {
    const file = join(sesion, archivo)
    writeFileSync(file, archivo)
    utimesSync(file, t, t)
  }
  const card = { id: 'imagenes', title: 'Imágenes', cwd, produce: 'imagen' } as unknown as Card

  const salida = await pedir(base, [card])
  assert.equal(salida.imagenes?.tipo, 'imagen')
  const imagen = new URL(salida.imagenes?.imagen ?? '', 'http://x')
  assert.match(imagen.pathname, /^\/api\/piezas\/archivo$/)
  assert.match(imagen.searchParams.get('ruta') ?? '', /[\\/]nueva\.png$/)
  assert.equal(imagen.searchParams.get('t'), '2000')
})

test('la previa de una card de artículos es la portada de su último artículo', async (t) => {
  const base = mkdtempSync(join(tmpdir(), 'hermit-previas-'))
  t.after(() => rmSync(base, { recursive: true, force: true }))
  const cwd = join(base, 'articulos')
  const sesion = join(cwd, 'articulo-uno')
  mkdirSync(sesion, { recursive: true })
  const articulo = join(sesion, 'articulo.md')
  writeFileSync(articulo, '# Uno')
  utimesSync(articulo, 1, 1)
  const portada = join(sesion, 'portada.png')
  writeFileSync(portada, 'png')
  utimesSync(portada, 2, 2)
  const card = { id: 'articulo-blog', title: 'Artículos', cwd, produce: 'articulo' } as unknown as Card

  const salida = await pedir(base, [card])
  assert.equal(salida['articulo-blog']?.tipo, 'imagen')
  const imagen = new URL(salida['articulo-blog']?.imagen ?? '', 'http://x')
  assert.match(imagen.pathname, /^\/api\/piezas\/archivo$/)
  assert.match(imagen.searchParams.get('ruta') ?? '', /[\\/]portada\.png$/)
  assert.equal(imagen.searchParams.get('t'), '1000')
})
