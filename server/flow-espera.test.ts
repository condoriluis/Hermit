import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { test } from 'node:test'
import { SinEmpezar } from './flow/pagina.ts'
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

test('Si ninguna cuenta puede, el pedido espera en vez de fallar: Hermit lo reintenta solo', async (t) => {
  const app = mkdtempSync(join(tmpdir(), 'hermit-flow-'))
  t.after(() => rmSync(app, { recursive: true, force: true }))
  const f = flow(app, {
    cuenta: () => 'yo@gmail.com',
    // Flow la frena al primer intento: la cuenta descansa y ya no queda ninguna que pueda con el pedido.
    enEdge: async () => {
      throw new SinEmpezar('Flow la frenó por actividad inusual')
    },
    abrirEnEdge: async () => {}
  })
  const creado = await pedir(f, 'POST', '/api/flow/generar', { tipo: 'imagen', prompt: 'un perezoso', salida: join(app, 'x.jpg') })
  // Antes esto mismo daba `error` con un «Vuelven a probar desde…» que el agente leía como un fallo que reintentar.
  const trabajo = await pedir(f, 'GET', `/api/flow/trabajos/${creado.cuerpo.id}`)
  assert.equal(trabajo.cuerpo.estado, 'esperando')
  assert.ok(trabajo.cuerpo.espera > Date.now(), 'dice cuándo se reintenta')
  assert.match(trabajo.cuerpo.aviso, /fren/i)
  assert.equal(trabajo.cuerpo.error, undefined)
  // Y no se pierde: sigue en la fila de Hermit, no contado como un fallo.
  assert.equal((await pedir(f, 'GET', '/api/flow')).cuerpo.pendientes.length, 0)
})
