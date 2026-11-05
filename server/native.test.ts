import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { hardwareInfo, picosAudioNativo } from './native.ts'

// Sin el módulo compilado (una copia recién clonada) todo esto se salta: el
// servidor usa FFmpeg y sigue igual.
const hayModulo = hardwareInfo() !== null

function wavDePrueba(ruta: string, segundos = 0.2) {
  const frecuencia = 44_100
  const canales = 2
  const muestras = Math.round(frecuencia * segundos)
  const datos = muestras * canales * 2
  const wav = Buffer.alloc(44 + datos)
  wav.write('RIFF', 0)
  wav.writeUInt32LE(36 + datos, 4)
  wav.write('WAVE', 8)
  wav.write('fmt ', 12)
  wav.writeUInt32LE(16, 16)
  wav.writeUInt16LE(1, 20)
  wav.writeUInt16LE(canales, 22)
  wav.writeUInt32LE(frecuencia, 24)
  wav.writeUInt32LE(frecuencia * canales * 2, 28)
  wav.writeUInt16LE(canales * 2, 32)
  wav.writeUInt16LE(16, 34)
  wav.write('data', 36)
  wav.writeUInt32LE(datos, 40)
  for (let i = 0; i < muestras; i++) {
    const valor = Math.round(Math.sin((2 * Math.PI * 440 * i) / frecuencia) * 32767)
    wav.writeInt16LE(valor, 44 + i * 4)
    wav.writeInt16LE(valor, 46 + i * 4)
  }
  writeFileSync(ruta, wav)
}

test('el módulo de Rust reporta núcleos y memoria de la máquina', { skip: !hayModulo }, () => {
  const info = hardwareInfo()!
  assert.ok(info.cpuCores >= 1)
  assert.ok(info.totalMemoryMb >= info.availableMemoryMb)
  assert.ok(info.availableMemoryMb >= 0)
})

test('la onda nativa tiene 50 picos por segundo, de 0 a 255', { skip: !hayModulo }, async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'hermit-native-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const ruta = join(dir, 'voz.wav')
  wavDePrueba(ruta)

  const picos = await picosAudioNativo(ruta)
  assert.ok(picos)
  assert.equal(picos.length, 10)
  assert.deepEqual(Array.from(picos), Array(10).fill(255))
})

test('un audio que no se puede decodificar deja que FFmpeg lo intente', { skip: !hayModulo }, async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'hermit-native-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const ruta = join(dir, 'roto.wav')
  writeFileSync(ruta, 'no es un audio')
  assert.equal(await picosAudioNativo(ruta), null)
})
