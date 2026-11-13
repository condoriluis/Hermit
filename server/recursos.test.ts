import assert from 'node:assert/strict'
import test from 'node:test'
import { hardware } from './gobernador.ts'
import { arbolesDe, fijarHilos, hilosPara, type ProcesoInfo } from './recursos.ts'

const NUCLEOS = hardware.nucleos

test('hilosPara: un agente solo tiene todos los núcleos; con varios se reparten', () => {
  assert.equal(hilosPara(1), NUCLEOS)
  assert.equal(hilosPara(0), NUCLEOS)
  assert.equal(hilosPara(2), Math.max(2, Math.floor(NUCLEOS / 2)))
  // El piso es 2: con muchísimos agentes nadie se queda sin hilos.
  assert.equal(hilosPara(NUCLEOS * 10), 2)
  // Y nunca pasa de los núcleos de la máquina.
  assert.ok(hilosPara(2) <= NUCLEOS)
})

test('fijarHilos escribe las variables de hilos y respeta las del usuario', () => {
  const tocadas = ['OMP_NUM_THREADS', 'MKL_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'NUMEXPR_NUM_THREADS', 'VECLIB_MAXIMUM_THREADS']
  const antes = Object.fromEntries(tocadas.map((v) => [v, process.env[v]]))
  try {
    // El usuario puso la suya: no se toca jamás.
    process.env.OMP_NUM_THREADS = '7'
    delete process.env.MKL_NUM_THREADS
    fijarHilos(1)
    assert.equal(process.env.OMP_NUM_THREADS, '7')
    assert.equal(process.env.MKL_NUM_THREADS, String(hilosPara(1)))
    // La que puso Hermit sí se actualiza con el nuevo reparto.
    fijarHilos(NUCLEOS * 10)
    assert.equal(process.env.MKL_NUM_THREADS, '2')
    assert.equal(process.env.OMP_NUM_THREADS, '7')
  } finally {
    for (const [v, valor] of Object.entries(antes)) {
      if (valor === undefined) delete process.env[v]
      else process.env[v] = valor
    }
  }
})

test('arbolesDe suma la memoria de cada árbol colgado del servidor', () => {
  const procesos: ProcesoInfo[] = [
    { pid: 100, ppid: 0, nombre: 'servidor', memoriaMb: 50 },
    { pid: 200, ppid: 100, nombre: 'claude', memoriaMb: 300 },
    { pid: 201, ppid: 200, nombre: 'ffmpeg', memoriaMb: 100 },
    { pid: 202, ppid: 201, nombre: 'ffmpeg-hijo', memoriaMb: 50 },
    { pid: 300, ppid: 100, nombre: 'node-herramienta', memoriaMb: 20 },
    { pid: 400, ppid: 999, nombre: 'ajeno', memoriaMb: 9999 }
  ]
  const { totalMb, raices } = arbolesDe(procesos, 100)
  assert.equal(totalMb, 300 + 100 + 50 + 20)
  assert.deepEqual(
    raices.map((r) => [r.nombre, r.mb]),
    [
      ['claude', 450],
      ['node-herramienta', 20]
    ]
  )
  // El proceso ajeno (otro árbol) no cuenta.
  assert.ok(!raices.some((r) => r.nombre === 'ajeno'))
})
