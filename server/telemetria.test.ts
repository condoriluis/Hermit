import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { tiemposDe } from '../shared/etapas.ts'
import type { Avance, Card, SessionMeta } from '../shared/types.ts'
import { anotar } from './telemetria.ts'

const card = (etapas: Card['etapas']): Card => ({ id: 'video-x', title: 'Video X', description: '', cwd: 'D:/videos', produce: 'video', etapas })
const meta = { id: 'h1', cardId: 'video-x', cwd: 'D:/videos', title: 'Hilo', model: 'claude-prueba', createdAt: 1_000_000, updatedAt: 1_000_000, running: false } as SessionMeta
const etapasDe = (hechas: [string, number][]): Avance['etapas'] =>
  hechas.map(([nombre, hechaEn]) => ({ nombre, listo: `${nombre}.md`, hecha: true, hechaEn, archivos: [] }))
const leer = (ruta: string) => JSON.parse(readFileSync(ruta, 'utf8'))

test('tiemposDe: cada etapa tarda desde la anterior ya hecha; las saltadas no cuentan', () => {
  const etapas = [
    { hecha: true, hechaEn: 1_060_000 }, // 60 s desde `desde`
    { hecha: false }, // saltada: no mide ni corta la cuenta
    { hecha: true, hechaEn: 1_300_000 }, // 240 s desde la primera, no desde `desde`
    { hecha: true } // sin hechaEn: no mide
  ]
  assert.deepEqual(tiemposDe(etapas, 1_000_000), [60, undefined, 240, undefined])
})

test('tiemposDe: ignora tiempos imposibles (negativos o de más de una semana)', () => {
  const etapas = [
    { hecha: true, hechaEn: 900_000 }, // antes de `desde`
    { hecha: true, hechaEn: 1_000_000 + 8 * 86_400_000 } // más de una semana
  ]
  assert.deepEqual(tiemposDe(etapas, 1_000_000), [undefined, undefined])
})

test('anotar: una muestra por etapa en equipo.json, y no repite la misma', () => {
  const dir = mkdtempSync(join(tmpdir(), 'telemetria-'))
  const ruta = join(dir, 'equipo.json')
  try {
    const c = card([{ nombre: 'Guion', listo: 'guion.md' }, { nombre: 'Video', listo: 'out/v.mp4' }])
    const folder = join(dir, 'episodio-1')
    const etapas = etapasDe([['Guion', 1_120_000], ['Video', 1_220_000]]) // Guion 120 s, Video 100 s
    anotar(c, meta, folder, etapas, ruta)
    anotar(c, meta, folder, etapas, ruta) // la misma marca: no duplica
    let d = leer(ruta)
    assert.equal(d.etapas['video-x'].etapas['Guion'].seg, 120)
    assert.equal(d.etapas['video-x'].etapas['Video'].seg, 100)
    assert.equal(d.etapas['video-x'].etapas['Guion'].n, 1)
    // Otro episodio del mismo estilo: la media se mueve.
    const etapas2 = etapasDe([['Guion', 1_060_000], ['Video', 1_160_000]]) // Guion 60 s, Video 100 s
    anotar(c, meta, join(dir, 'episodio-2'), etapas2, ruta)
    d = leer(ruta)
    assert.equal(d.etapas['video-x'].etapas['Guion'].seg, 90)
    assert.equal(d.etapas['video-x'].etapas['Guion'].n, 2)
    // Un card que no produce video no anota nada.
    const otra = { ...c, produce: undefined } as Card
    anotar(otra, meta, join(dir, 'episodio-3'), etapas, ruta)
    assert.equal(Object.keys(leer(ruta).etapas_hechos).length, 2)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
