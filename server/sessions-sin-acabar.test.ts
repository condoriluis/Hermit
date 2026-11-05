import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import type { AgentEvent, Card } from '../shared/types.ts'
import type { AgentOptions } from './agent.ts'
import { esperaDe, queFalta, traeArchivo, type Espera } from './etapas.ts'
import { Sessions } from './sessions.ts'

/** Un hilo con un agente de mentira, el reloj a mano y lo que le falta a su video en `falta`. */
function preparar(t: test.TestContext, model = 'codex:gpt-prueba') {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const dir = mkdtempSync(join(tmpdir(), 'hermit-sin-acabar-'))
  const eventos: AgentEvent[] = []
  const mandados: string[] = []
  const h = { falta: ['Video', 'Portada'] }
  let emitir!: AgentOptions['onEvent']
  const sessions = new Sessions(
    dir,
    (_, __, events) => eventos.push(...events),
    () => {},
    () => {},
    () => {},
    (opts) => {
      emitir = opts.onEvent
      return { send: (texto: string) => void mandados.push(texto), steer() {}, compact() {}, async interrupt() {}, close() {} }
    },
    () => h.falta
  )
  const meta = sessions.create({ cardId: 'video-explicativo', cwd: dir, title: 'Prueba', model })
  t.after(() => {
    sessions.closeAll()
    rmSync(dir, { recursive: true, force: true })
  })
  const emit = (e: AgentEvent) => emitir(e)
  return Object.assign(h, {
    sessions,
    meta,
    emit,
    /** Las veces que Hermit le pidió que siguiera. */
    pedidos: () => mandados.filter((m) => m.startsWith('Cerraste tu turno')),
    avisos: () => eventos.flatMap((e) => (e.t === 'info' ? [e.text] : [])),
    /** Un turno que trabaja y acaba (`ok`) con `texto` como último mensaje; luego pasa el rato de calma. */
    turno(texto = 'Preparé un borrador. El video aún no está terminado.', { ok = true, herramienta = 'Bash' } = {}) {
      emit({ t: 'tool', id: `h${Math.random()}`, name: herramienta, input: {} })
      for (const trozo of texto.match(/.{1,12}/g) ?? []) emit({ t: 'text', id: 'm', delta: trozo })
      emit({ t: 'turn_end', at: Date.now(), ok })
      t.mock.timers.tick(4000)
    }
  })
}

test('si el agente cierra su turno con el video a medias, Hermit le pide que siga con lo que falta', (t) => {
  const h = preparar(t)
  h.sessions.send(h.meta.id, 'Hazme el video')
  h.turno()
  assert.equal(h.pedidos().length, 1)
  assert.match(h.pedidos()[0], /falta Video, Portada/)
  assert.ok(h.avisos().some((a) => a.includes('Hermit le pide que siga')))
  assert.equal(h.sessions.meta(h.meta.id)?.running, true)
})

test('también a Claude; y no si el video ya está o si lo siguiente lo das tú', (t) => {
  const h = preparar(t, 'claude-prueba')
  h.sessions.send(h.meta.id, 'Hazme el video')
  h.turno()
  assert.equal(h.pedidos().length, 1)
  h.falta = []
  h.turno('Listo: el video y la portada.')
  assert.equal(h.pedidos().length, 1)
})

test('no se le insiste si te pregunta algo, si no trabajó o si detuviste su turno', (t) => {
  const h = preparar(t)
  h.sessions.send(h.meta.id, 'Hazme el video')
  h.turno('El guion está listo. ¿Lo dejo así o lo cambio?')
  h.emit({ t: 'turn_start', at: Date.now() })
  h.turno('¿Cuál prefieres?', { herramienta: 'request_user_input' })
  h.emit({ t: 'turn_start', at: Date.now() })
  h.turno('Lo paro aquí.', { ok: false })
  h.sessions.send(h.meta.id, '¿Qué voz usaste?')
  h.emit({ t: 'text', id: 'r', delta: 'Usé Daro.' })
  h.emit({ t: 'turn_end', at: Date.now(), ok: true })
  t.mock.timers.tick(4000)
  assert.equal(h.pedidos().length, 0)
})

test('si abre otro turno antes de la calma, no se le pide nada', (t) => {
  const h = preparar(t)
  h.sessions.send(h.meta.id, 'Hazme el video')
  h.emit({ t: 'tool', id: 'h', name: 'Bash', input: {} })
  h.emit({ t: 'turn_end', at: Date.now(), ok: true })
  h.emit({ t: 'turn_start', at: Date.now() })
  t.mock.timers.tick(5000)
  assert.equal(h.pedidos().length, 0)
})

test('se le pide como mucho tres veces seguidas; luego te toca a ti, y un mensaje tuyo vuelve a contar', (t) => {
  const h = preparar(t, 'opencode:modelo-prueba')
  h.sessions.send(h.meta.id, 'Hazme el video')
  for (let i = 0; i < 5; i++) h.turno()
  assert.equal(h.pedidos().length, 3)
  assert.ok(h.avisos().some((a) => a.includes('Dile tú cómo seguir')))
  h.sessions.send(h.meta.id, 'Sigue')
  h.turno()
  assert.equal(h.pedidos().length, 4)
})

test('queFalta lee lo que falta de las etapas de la card, salvo lo que espera al usuario', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'hermit-que-falta-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const card = {
    id: 'estilo',
    etapas: [
      { nombre: 'Guion', listo: 'guion.md', fase: 'guion' },
      { nombre: 'Tu voz', listo: 'voz/original.wav', espera: 'Grábala', fase: 'sonido' },
      { nombre: 'Voz lista', listo: 'voz/rapida.wav', fase: 'sonido' },
      { nombre: 'Video', listo: 'out/!(borrador*).mp4', fase: 'video' },
      { nombre: 'Portada', listo: 'portada.png', fase: 'entrega' }
    ]
  } as unknown as Card
  const meta = { cwd: dir } as Parameters<typeof queFalta>[0]
  const poner = (ruta: string) => (mkdirSync(join(dir, ruta, '..'), { recursive: true }), writeFileSync(join(dir, ruta), 'x'))
  poner('guion.md')
  // Espera tu voz: no le falta nada que pueda hacer el agente.
  assert.deepEqual(queFalta(meta, card), [])
  // Con la voz generada (sin la grabada, que se saltó) y solo un borrador, le faltan el video y la portada.
  poner('voz/rapida.wav')
  poner('out/borrador.mp4')
  assert.deepEqual(queFalta(meta, card), ['Video', 'Portada'])
  poner('portada.png')
  assert.deepEqual(queFalta(meta, card), ['Video'])
  // Un MP4 recién escrito aún no cuenta (se está renderizando); lo de esta prueba ya no se mueve.
  writeFileSync(join(dir, 'out', 'video.mp4'), 'x')
  const viejo = new Date(Date.now() - 60_000)
  utimesSync(join(dir, 'out', 'video.mp4'), viejo, viejo)
  assert.deepEqual(queFalta(meta, card), [])
})

test('esperaDe dice qué espera el usuario y traeArchivo si su mensaje ya lo trae', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'hermit-espera-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const voz = {
    id: 'estilo',
    etapas: [{ nombre: 'Tu voz', listo: 'voz/original.wav', espera: 'Grábala', fase: 'sonido' }]
  } as unknown as Card
  const meta = { cwd: dir } as Parameters<typeof esperaDe>[0]
  const espera = esperaDe(meta, voz)
  assert.deepEqual(espera, { etapa: 'Tu voz', archivo: 'voz/original.wav', voz: true })
  const wav = join(dir, 'mi voz.wav')
  writeFileSync(wav, 'x')
  assert.equal(traeArchivo(`Aquí está: "${wav}"`, espera!), true)
  assert.equal(traeArchivo('Sigue', espera!), false)
  writeFileSync(join(dir, 'nota.mp3'), 'x')
  assert.equal(traeArchivo(`"${join(dir, 'nota.mp3')}"`, espera!), false)
  mkdirSync(join(dir, 'voz'), { recursive: true })
  writeFileSync(join(dir, 'voz', 'original.wav'), 'x')
  assert.equal(esperaDe(meta, voz), undefined)

  const grabacion = {
    id: 'estilo',
    etapas: [{ nombre: 'Tu grabación', listo: 'media/cam_raw.*', espera: 'Grábate', fase: 'sonido' }]
  } as unknown as Card
  const video = esperaDe(meta, grabacion)
  assert.deepEqual(video, { etapa: 'Tu grabación', archivo: 'media/cam_raw.*', voz: false })
  const mp4 = join(dir, 'IMG_1234.mp4')
  writeFileSync(mp4, 'x')
  assert.equal(traeArchivo(`"${mp4}"`, video!), true)
  assert.equal(traeArchivo(`"${wav}"`, video!), false)
  mkdirSync(join(dir, 'media'), { recursive: true })
  writeFileSync(join(dir, 'media', 'cam_raw.mp4'), 'x')
  const viejo = new Date(Date.now() - 60_000)
  utimesSync(join(dir, 'media', 'cam_raw.mp4'), viejo, viejo)
  assert.equal(esperaDe(meta, grabacion), undefined)
})

test('sin el archivo que espera su etapa no abre un turno nuevo; sí con la ruta o con permiso', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'hermit-espera-turno-'))
  const eventos: AgentEvent[] = []
  const mandados: string[] = []
  const espera: Espera = { etapa: 'Tu voz', archivo: 'voz/original.wav', voz: true }
  let emitir!: AgentOptions['onEvent']
  const sessions = new Sessions(
    dir,
    (_, __, events) => eventos.push(...events),
    () => {},
    () => {},
    () => {},
    (opts) => {
      emitir = opts.onEvent
      return { send: (texto: string) => void mandados.push(texto), steer() {}, compact() {}, async interrupt() {}, close() {} }
    },
    () => [],
    () => espera
  )
  const meta = sessions.create({ cardId: 'video-explicativo', cwd: dir, title: 'Prueba', model: 'codex:gpt-prueba' })
  t.after(() => {
    sessions.closeAll()
    rmSync(dir, { recursive: true, force: true })
  })
  const cierra = () => emitir({ t: 'turn_end', at: Date.now(), ok: true })

  // El primero pasa: el agente tiene que pedir el archivo.
  sessions.send(meta.id, 'Hazme el video')
  assert.equal(mandados.length, 1)
  cierra()

  // Sin el archivo, un mensaje nuevo no abre turno y avisa.
  sessions.send(meta.id, 'Sigue')
  assert.equal(mandados.length, 1)
  assert.ok(eventos.some((e) => e.t === 'info' && e.text.includes('Falta «Tu voz»')))

  // Con una ruta real sí.
  const wav = join(dir, 'mi-voz.wav')
  writeFileSync(wav, 'x')
  sessions.send(meta.id, `Aquí está: "${wav}"`)
  assert.equal(mandados.length, 2)
  cierra()

  // Generar la voz lo pide con permiso explícito.
  sessions.send(meta.id, 'No la voy a grabar: genérala tú.', undefined, [], { permitirEspera: true })
  assert.equal(mandados.length, 3)
})
