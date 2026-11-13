import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { test } from 'node:test'
import { RECHAZOS_PARA_BLOQUEAR } from '../shared/flow.ts'
import { guardar } from './disco.ts'
import { Rechazado } from './flow/pagina.ts'
import { flow } from './flow/index.ts'

interface Respuesta {
  status: number
  cuerpo: any
}

function respuesta() {
  const r = {
    status: 0,
    cuerpo: undefined as any,
    writeHead(status: number) {
      r.status = status
    },
    end(cuerpo: string) {
      r.cuerpo = JSON.parse(cuerpo)
    }
  }
  return r as unknown as ServerResponse & Respuesta
}

async function pedir(f: ReturnType<typeof flow>, metodo: string, ruta: string, datos?: unknown) {
  const req = Object.assign(Readable.from(datos === undefined ? [] : [Buffer.from(JSON.stringify(datos))]), { method: metodo, url: ruta }) as unknown as IncomingMessage
  const res = respuesta()
  // El servidor recibe la ruta sin la consulta, y `req.url` la lleva entera (de ahí sale `esperar`).
  assert.equal(await f.api(req, res, ruta.split('?')[0]), true)
  return res
}

const DERECHOS = 'No podemos generar esto: parece incluir personajes con derechos de autor.'

/** Deja anotado en `ajustes.json` que esa escena ya tuvo `veces` rechazos por contenido, como si hubieran pasado antes. */
function sembrarRechazos(app: string, clave: string, veces: number) {
  const carpeta = join(app, 'data', 'flow')
  mkdirSync(carpeta, { recursive: true })
  guardar(join(carpeta, 'ajustes.json'), JSON.stringify({ rechazos: { [clave]: { veces, ultimo: Date.now() } } }))
}

/** Un Flow que siempre rechaza por contenido, sin gastar: cuenta cuántas veces lo tocaron. */
function flowQueRechaza(app: string) {
  let abiertas = 0
  const f = flow(app, {
    cuenta: () => 'yo@gmail.com',
    enEdge: async () => {
      abiertas++
      throw new Rechazado(DERECHOS, DERECHOS, 0)
    },
    abrirEnEdge: async () => {}
  })
  return { f, veces: () => abiertas }
}

test('un rechazo por contenido se apunta y a la tercera Hermit la deja bloqueada', async (t) => {
  const app = mkdtempSync(join(tmpdir(), 'hermit-flow-'))
  t.after(() => rmSync(app, { recursive: true, force: true }))
  const salida = resolve(join(app, 'clip.mp4'))
  // Esta escena ya cayó dos veces por su contenido: el rechazo que viene es el tercero y la deja por perdida.
  sembrarRechazos(app, salida, RECHAZOS_PARA_BLOQUEAR - 1)
  const { f, veces } = flowQueRechaza(app)
  const creado = await pedir(f, 'POST', '/api/flow/generar', { tipo: 'video', prompt: 'un ogro y un gato con botas', salida, hilo: 'h1' })
  // El video gasta: espera el permiso del usuario antes de intentarlo.
  assert.equal(creado.cuerpo.permiso, 'pendiente')
  await pedir(f, 'POST', `/api/flow/permisos/${creado.cuerpo.id}`, { permitir: true, todos: true })
  const trabajo = await pedir(f, 'GET', `/api/flow/trabajos/${creado.cuerpo.id}?esperar=45`)
  assert.equal(trabajo.cuerpo.estado, 'bloqueado')
  assert.match(trabajo.cuerpo.aviso, new RegExp(`rechazó esta escena ${RECHAZOS_PARA_BLOQUEAR} veces`))
  assert.match(trabajo.cuerpo.aviso, /derechos o política de Google/)
  // No es un `error` que el agente vaya a reintentar: es terminal y nadie lo reencola.
  assert.equal(trabajo.cuerpo.error, undefined)
  assert.equal(veces(), 1)
})

test('una escena ya bloqueada se contesta al momento y sin volver a tocar Flow', async (t) => {
  const app = mkdtempSync(join(tmpdir(), 'hermit-flow-'))
  t.after(() => rmSync(app, { recursive: true, force: true }))
  const salida = resolve(join(app, 'clip.mp4'))
  sembrarRechazos(app, salida, RECHAZOS_PARA_BLOQUEAR)
  const { f, veces } = flowQueRechaza(app)
  // El agente insiste con otro prompt: da igual, no se vuelve a pedir ni se toca Flow.
  const creado = await pedir(f, 'POST', '/api/flow/generar', { tipo: 'video', prompt: 'ahora sin el ogro', salida, hilo: 'h1' })
  assert.equal(creado.cuerpo.estado, 'bloqueado')
  assert.match(creado.cuerpo.aviso, new RegExp(`ya rechazó esta escena ${RECHAZOS_PARA_BLOQUEAR} veces`))
  assert.equal(veces(), 0)
  // No queda nada en fila: un video con una escena menos, pero el turno sigue.
  assert.equal((await pedir(f, 'GET', '/api/flow')).cuerpo.enFila, 0)
})

test('los rechazos se cuentan por escena: otro archivo de la misma escena comparte sus intentos', async (t) => {
  const app = mkdtempSync(join(tmpdir(), 'hermit-flow-'))
  t.after(() => rmSync(app, { recursive: true, force: true }))
  // La escena esc-03 ya tiene dos rechazos; el agente la pide ahora a OTRO archivo (el truco de antes para evadir el
  // bloqueo): con `escena` declarada, el contador es el mismo y este tercer rechazo la deja bloqueada.
  sembrarRechazos(app, 'esc-03', RECHAZOS_PARA_BLOQUEAR - 1)
  const { f, veces } = flowQueRechaza(app)
  const salida = resolve(join(app, 'clip-otro-nombre.mp4'))
  const creado = await pedir(f, 'POST', '/api/flow/generar', { tipo: 'video', prompt: 'la misma escena, otro prompt', salida, escena: 'esc-03', hilo: 'h1' })
  assert.equal(creado.cuerpo.permiso, 'pendiente')
  await pedir(f, 'POST', `/api/flow/permisos/${creado.cuerpo.id}`, { permitir: true, todos: true })
  const trabajo = await pedir(f, 'GET', `/api/flow/trabajos/${creado.cuerpo.id}?esperar=45`)
  assert.equal(trabajo.cuerpo.estado, 'bloqueado')
  assert.equal(veces(), 1)
})

test('una escena bloqueada no se puede esquivar pidiendo el mismo contenido a otro archivo sin `escena`', async (t) => {
  const app = mkdtempSync(join(tmpdir(), 'hermit-flow-'))
  t.after(() => rmSync(app, { recursive: true, force: true }))
  // Sin `escena`, la clave es la salida: dos archivos distintos son dos escenas para Hermit (comportamiento de antes).
  sembrarRechazos(app, resolve(join(app, 'clip-a.mp4')), RECHAZOS_PARA_BLOQUEAR)
  const { f, veces } = flowQueRechaza(app)
  const creado = await pedir(f, 'POST', '/api/flow/generar', { tipo: 'video', prompt: 'el mismo clip', salida: resolve(join(app, 'clip-b.mp4')), hilo: 'h1' })
  assert.notEqual(creado.cuerpo.estado, 'bloqueado')
  assert.equal(creado.cuerpo.permiso, 'pendiente')
  assert.equal(veces(), 0)
})
