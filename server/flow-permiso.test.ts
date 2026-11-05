import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { test } from 'node:test'
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
  assert.equal(await f.api(req, res, ruta), true)
  return res
}

test('Flow no genera un video sin permiso y el rechazo no gasta', async (t) => {
  const app = mkdtempSync(join(tmpdir(), 'hermit-flow-'))
  t.after(() => rmSync(app, { recursive: true, force: true }))
  const f = flow(app, {
    cuenta: () => 'yo@gmail.com',
    enEdge: async () => {
      throw new Error('no debería abrir Edge sin permiso')
    },
    abrirEnEdge: async () => {}
  })
  const salida = join(app, 'clip.mp4')
  const creado = await pedir(f, 'POST', '/api/flow/generar', { tipo: 'video', prompt: 'un perezoso', salida, hilo: 'h1' })
  assert.equal(creado.status, 200)
  assert.equal(creado.cuerpo.estado, 'en-fila')
  assert.equal(creado.cuerpo.permiso, 'pendiente')
  assert.equal(creado.cuerpo.hilo, 'h1')
  const estado = await pedir(f, 'GET', '/api/flow')
  assert.equal(estado.cuerpo.pendientes.length, 1)
  assert.equal(estado.cuerpo.pendientes[0].id, creado.cuerpo.id)
  assert.equal(estado.cuerpo.enFila, 0)
  const rechazo = await pedir(f, 'POST', `/api/flow/permisos/${creado.cuerpo.id}`, { permitir: false })
  assert.equal(rechazo.status, 200)
  assert.equal(rechazo.cuerpo.pendientes.length, 0)
  const trabajo = await pedir(f, 'GET', `/api/flow/trabajos/${creado.cuerpo.id}`)
  assert.equal(trabajo.cuerpo.estado, 'error')
  assert.match(trabajo.cuerpo.error, /no autorizó/)
})

test('El permiso de todos los clips del hilo deja pasar el siguiente sin preguntar', async (t) => {
  const app = mkdtempSync(join(tmpdir(), 'hermit-flow-'))
  t.after(() => rmSync(app, { recursive: true, force: true }))
  const f = flow(app, {
    cuenta: () => 'yo@gmail.com',
    enEdge: async () => {
      throw new Error('sin navegador en la prueba')
    },
    abrirEnEdge: async () => {}
  })
  const uno = await pedir(f, 'POST', '/api/flow/generar', { tipo: 'video', prompt: 'uno', salida: join(app, 'uno.mp4'), hilo: 'h2' })
  assert.equal(uno.cuerpo.permiso, 'pendiente')
  const permiso = await pedir(f, 'POST', `/api/flow/permisos/${uno.cuerpo.id}`, { permitir: true, todos: true })
  assert.equal(permiso.status, 200)
  assert.equal(permiso.cuerpo.pendientes.length, 0)
  const dos = await pedir(f, 'POST', '/api/flow/generar', { tipo: 'video', prompt: 'dos', salida: join(app, 'dos.mp4'), hilo: 'h2' })
  assert.notEqual(dos.cuerpo.permiso, 'pendiente')
  assert.equal((await pedir(f, 'GET', '/api/flow')).cuerpo.pendientes.length, 0)
})
