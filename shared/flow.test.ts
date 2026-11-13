import assert from 'node:assert/strict'
import { test } from 'node:test'
import { A_LA_VEZ, creditosDe, descansoNuevo, elegirCuenta, esFalloDeNavegador, esRechazoDeContenido, espacioEntrePedidos, gastoDeRechazo, IMAGEN_CHATGPT, imagenPosible, lineaClips, lineaImagenes, motivoDeDescanso, RECHAZOS_PARA_BLOQUEAR, RECUERDA_RECHAZO, saldoDe, saldoVigente, tipoDeArchivo, type UsoCuenta } from './flow.ts'

test('cada pedido va a la cuenta libre que lleva más sin generar', () => {
  const cuentas: UsoCuenta[] = [
    { correo: 'a', ocupada: false, usada: 300 },
    { correo: 'b', ocupada: false, usada: 100 },
    { correo: 'c', ocupada: true, usada: 0 }
  ]
  assert.equal(elegirCuenta(cuentas, 'video', 1000), 'b')
  // La que ya lo probó y no pudo, no otra vez.
  assert.equal(elegirCuenta(cuentas, 'video', 1000, ['b']), 'a')
  // Solo queda la ocupada: espera su turno.
  assert.equal(elegirCuenta(cuentas, 'video', 1000, ['a', 'b']), 'esperar')
  assert.equal(elegirCuenta(cuentas, 'video', 1000, ['a', 'b', 'c']), 'ninguna')
})

test('elegirCuenta da prioridad a la cuenta preferida si está libre y disponible', () => {
  const cuentas: UsoCuenta[] = [
    { correo: 'a', ocupada: false, usada: 100 },
    { correo: 'b', ocupada: false, usada: 200 },
    { correo: 'c', ocupada: false, usada: 300 }
  ]
  // Aunque 'c' tenga más 'usada', si es preferida se elige directamente
  assert.equal(elegirCuenta(cuentas, 'video', 1000, [], 'c'), 'c')
  // Si la preferida está ocupada, espera a que se desocupe
  const conOcupada: UsoCuenta[] = [
    { correo: 'a', ocupada: false, usada: 100 },
    { correo: 'c', ocupada: true, usada: 300 }
  ]
  assert.equal(elegirCuenta(conOcupada, 'video', 1000, [], 'c'), 'esperar')
  // Si la preferida ya falló en este pedido (probadas), rota a la siguiente cuenta libre
  assert.equal(elegirCuenta(cuentas, 'video', 1000, ['c'], 'c'), 'a')
})

test('sin créditos una cuenta descansa de videos pero sigue con imágenes, y vuelve al acabar su descanso', () => {
  const cuentas: UsoCuenta[] = [{ correo: 'a', ocupada: false, usada: 0, descansa: { hasta: 5000, motivo: 'creditos' } }]
  assert.equal(elegirCuenta(cuentas, 'video', 1000), 'ninguna')
  assert.equal(elegirCuenta(cuentas, 'imagen', 1000), 'a')
  assert.equal(elegirCuenta(cuentas, 'video', 5000), 'a')
  const frenada: UsoCuenta[] = [{ correo: 'a', ocupada: false, usada: 0, descansa: { hasta: 5000, motivo: 'frenada' } }]
  assert.equal(elegirCuenta(frenada, 'imagen', 1000), 'ninguna')
})

test('el motivo del descanso sale del saldo medido y de la sesión, nunca de las palabras del aviso', () => {
  // Sin sesión y sin saldo leído: se reintenta a los 30 min, no se espera la recarga del día.
  assert.equal(motivoDeDescanso('video', false, null), 'frenada')
  assert.equal(motivoDeDescanso('imagen', false, null), 'frenada')
  // Con el saldo ya leído, si no le llega para el video más barato sí descansa por créditos (las imágenes siguen).
  assert.equal(motivoDeDescanso('video', false, { creditos: 0, piso: false }), 'creditos')
  assert.equal(motivoDeDescanso('video', false, { creditos: 5, piso: false }), 'creditos')
  assert.equal(motivoDeDescanso('video', false, { creditos: 6, piso: false }), 'frenada')
  assert.equal(motivoDeDescanso('video', false, { creditos: 40, piso: false }), 'frenada')
  // Un `piso` es una estimación («al menos esto»), no una lectura: no manda a esperar la recarga.
  assert.equal(motivoDeDescanso('video', false, { creditos: 0, piso: true }), 'frenada')
  // Las imágenes no gastan: con el saldo bajo tampoco es motivo de créditos.
  assert.equal(motivoDeDescanso('imagen', false, { creditos: 0, piso: false }), 'frenada')
  // Si Flow acabó en la de entrar, se perdió la sesión: ese es el motivo, por encima de cualquier otro.
  assert.equal(motivoDeDescanso('video', true, { creditos: 0, piso: false }), 'sesion')
  assert.equal(motivoDeDescanso('imagen', true, null), 'sesion')
})

test('el costo se lee del panel de Flow en cualquier idioma', () => {
  assert.equal(creditosDe('Veo 3.1 - Lite\nx1\nx2\nLa generación usará 10 créditos'), 10)
  assert.equal(creditosDe('x1\nThis generation will use 100 credits'), 100)
  assert.equal(creditosDe('La generación usará 0 créditos'), 0)
  // En el español de España, Flow los llama puntos.
  assert.equal(creditosDe('Veo 3.1 - Lite\nx1\nx4\nLa generación consumirá 10 puntos'), 10)
})

test('sin costo escrito no hay número: así no se genera a ciegas', () => {
  assert.equal(creditosDe('Veo 3.1 - Lite\nx1\nx2'), null)
  assert.equal(creditosDe('Créditos de Google Flow'), null)
})

test('las imágenes usan lo elegido si está conectado y, si no, lo que haya', () => {
  const ambos = { chatgpt: true, google: true }
  assert.equal(imagenPosible('Nano Banana Pro', ambos), 'Nano Banana Pro')
  assert.equal(imagenPosible(IMAGEN_CHATGPT, ambos), IMAGEN_CHATGPT)
  assert.equal(imagenPosible('', ambos), IMAGEN_CHATGPT)
  assert.equal(imagenPosible(IMAGEN_CHATGPT, { chatgpt: false, google: true }), 'Nano Banana 2.1')
  assert.equal(imagenPosible('Nano Banana Pro', { chatgpt: true, google: false }), IMAGEN_CHATGPT)
  assert.equal(imagenPosible('', { chatgpt: false, google: false }), '')
})

test('la línea Imágenes dice con qué generar y sin elección no sale', () => {
  assert.match(lineaImagenes('Nano Banana Pro'), /^Imágenes: genéralas en Google Flow con Nano Banana Pro, no con ChatGPT/)
  assert.match(lineaImagenes(IMAGEN_CHATGPT), /^Imágenes: con ChatGPT/)
  assert.equal(lineaImagenes(''), '')
})

test('lo que baja se reconoce por sus bytes, no por el nombre', () => {
  assert.equal(tipoDeArchivo(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])), 'imagen')
  assert.equal(tipoDeArchivo(Uint8Array.from([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70])), 'video')
  assert.equal(tipoDeArchivo(new TextEncoder().encode('<!doctype html>')), null)
})

test('lo que le queda a una cuenta se lee de su menú, con la hora en que se renueva', () => {
  const ahora = new Date(2026, 10, 3, 15, 0).getTime()
  const mexico = saldoDe('Agencia DK\nCambiar de cuenta\nmovie_filter_auto\n20 créditos de Google Flow\nLos créditos se actualizan todos los días a la(s) 12:02 p.m.\nActualizar', ahora)
  assert.deepEqual(mexico, { creditos: 20, renueva: new Date(2026, 10, 4, 12, 2).getTime() })
  const espana = saldoDe('movie_filter_auto\n50 puntos de Google Flow\nLos puntos se actualizan a diario a las 17:11\nActualizar', ahora)
  assert.deepEqual(espana, { creditos: 50, renueva: new Date(2026, 10, 3, 17, 11).getTime() })
  assert.equal(saldoDe('1,000 credits\nYour credits refresh daily at 12:30 AM', ahora)?.renueva, new Date(2026, 10, 4, 0, 30).getTime())
  assert.deepEqual(saldoDe('1.000 créditos de Google Flow\nSe renuevan el 5 de diciembre', ahora), { creditos: 1000 })
  // Sin gastar aún, Flow dice la hora de ahora: no es cuándo se renuevan.
  assert.deepEqual(saldoDe('50 puntos de Google Flow\nLos puntos se actualizan a diario a las 15:00', ahora), { creditos: 50 })
  assert.equal(saldoDe('Créditos de Google Flow', ahora), null)
})

test('pasada la hora de renovación el saldo no vale: cuenta su piso (lo más que se le vio), nunca cero', () => {
  const ahora = 1_000_000
  // Sin leer: nada que contar.
  assert.equal(saldoVigente(undefined, ahora), null)
  // Leído y aún sin renovar: el número tal cual.
  assert.deepEqual(saldoVigente({ creditos: 30, renueva: ahora + 60_000, maximo: 50 }, ahora), { creditos: 30, piso: false })
  assert.deepEqual(saldoVigente({ creditos: 30, maximo: 50 }, ahora), { creditos: 30, piso: false })
  // Ya renovada: Flow repuso y no acumula, así que no puede quedar por debajo de lo más que se le vio.
  assert.deepEqual(saldoVigente({ creditos: 0, renueva: ahora - 1, maximo: 50 }, ahora), { creditos: 50, piso: true })
  assert.deepEqual(saldoVigente({ creditos: 20, renueva: ahora, maximo: 50 }, ahora), { creditos: 50, piso: true })
  // Sin habérsele visto más que lo que dice ahora, ese es su piso.
  assert.deepEqual(saldoVigente({ creditos: 20, renueva: ahora - 1 }, ahora), { creditos: 20, piso: true })
})

test('el ritmo deja aire entre pedidos y va de uno en uno tras una frenada', () => {
  assert.equal(A_LA_VEZ, 2)
  assert.equal(espacioEntrePedidos(false, 0), 15_000)
  assert.equal(espacioEntrePedidos(false, 1), 30_000)
  assert.equal(espacioEntrePedidos(true, 0), 60_000)
})

test('una frenada seguida descansa el doble, hasta 8 h; sin créditos, hasta su renovación', () => {
  const ahora = 1_000_000
  const primera = descansoNuevo('frenada', ahora)
  assert.deepEqual(primera, { hasta: ahora + 30 * 60_000, motivo: 'frenada', veces: 1 })
  const segunda = descansoNuevo('frenada', ahora + 60 * 60_000, primera)
  assert.deepEqual(segunda, { hasta: ahora + 60 * 60_000 + 60 * 60_000, motivo: 'frenada', veces: 2 })
  // Pasado su recuerdo, vuelve a contar desde uno.
  assert.equal(descansoNuevo('frenada', ahora + 10 * 60 * 60_000, segunda).veces, 1)
  // Sin créditos, hasta que se renueven si se sabe cuándo.
  assert.deepEqual(descansoNuevo('creditos', ahora, undefined, ahora + 5 * 60 * 60_000), { hasta: ahora + 5 * 60 * 60_000, motivo: 'creditos' })
})

test('el descanso guarda lo que dijo Flow, para enseñarlo sin afirmarlo a ciegas', () => {
  const ahora = 1_000_000
  assert.equal(descansoNuevo('frenada', ahora, undefined, undefined, 'Notamos actividad inusual').dicho, 'Notamos actividad inusual')
  // Sin mensaje no se inventa nada, y uno enorme no engorda el archivo.
  assert.equal(descansoNuevo('frenada', ahora).dicho, undefined)
  assert.equal(descansoNuevo('navegador', ahora, undefined, undefined, 'x'.repeat(500)).dicho?.length, 300)
})

test('un fallo de la página no se confunde con una frenada de Google', () => {
  assert.ok(esFalloDeNavegador('locator.click: Timeout 10000ms exceeded.'))
  assert.ok(esFalloDeNavegador('page.goto: net::ERR_CONNECTION_REFUSED at https://labs.google/fx/tools/flow'))
  assert.ok(esFalloDeNavegador('Target page, context or browser has been closed'))
  assert.ok(esFalloDeNavegador('Execution context was destroyed, most likely because of a navigation'))
  assert.ok(esFalloDeNavegador('Protocol error (Target.activateTarget): Target closed'))
  assert.ok(esFalloDeNavegador('locator.waitFor: TimeoutError: waiting for locator(...)'))
  assert.ok(!esFalloDeNavegador('Flow no empezó a generar: notamos actividad inusual'))
  assert.ok(!esFalloDeNavegador('No se pudo generar el audio. Prueba con otra imagen.'))
  assert.ok(!esFalloDeNavegador('Flow dijo que cuesta 600 créditos y el tope es 100.'))
})

test('un rechazo por contenido no es de la cuenta: no gasta y se deja tras tres', () => {
  // Sin gastar y sin frenada: es de lo que se le pide (derechos, política), y no se pasa a otra cuenta.
  assert.ok(esRechazoDeContenido(false, 0))
  // Con frenada, si gastó, o si no se supo: eso no es del clip, lo decide la cuenta o el usuario.
  assert.ok(!esRechazoDeContenido(true, 0))
  assert.ok(!esRechazoDeContenido(false, 10))
  assert.ok(!esRechazoDeContenido(false, null))
  assert.equal(RECHAZOS_PARA_BLOQUEAR, 3)
  assert.equal(RECUERDA_RECHAZO, 6 * 60 * 60_000)
})

test('un fallo técnico de la generación no es un rechazo por contenido', async () => {
  const { esFalloTecnico } = await import('./flow.ts')
  // Los de Veo que no pudo producir: audio, vídeo, imagen.
  assert.ok(esFalloTecnico('Flow no lo generó: No se pudo generar el audio. Prueba con otra imagen.'))
  assert.ok(esFalloTecnico('Flow no lo generó: No se pudo generar el vídeo.'))
  assert.ok(esFalloTecnico("Flow no lo generó: Couldn't generate the video."))
  // Una política de contenido habla de políticas o contenido, no de «no se pudo generar».
  assert.ok(!esFalloTecnico('Flow no lo generó: Este contenido infringe nuestras políticas.'))
  assert.ok(!esFalloTecnico('Flow rechazó el pedido: solicitud no permitida por derechos de autor'))
  assert.ok(!esFalloTecnico('locator.click: Timeout 10000ms exceeded.'))
})

test('un pedido que pasa de su tope de créditos es cosa del pedido, no de la cuenta', async () => {
  const { esPasaTope } = await import('./flow.ts')
  assert.ok(esPasaTope('Flow no preparó el pedido (Cuesta 100 créditos y el tope es 20. No se generó nada.).'))
  assert.ok(esPasaTope('Cuesta 24 créditos y el tope es 20'))
  assert.ok(!esPasaTope('Flow no preparó el pedido (notamos actividad inusual).'))
  assert.ok(!esPasaTope('Flow no lo generó: No se pudo generar el audio.'))
})

test('un fallo del navegador descansa unos minutos y no escala como una frenada', () => {
  const ahora = 1_000_000
  assert.deepEqual(descansoNuevo('navegador', ahora), { hasta: ahora + 5 * 60_000, motivo: 'navegador' })
  // Repetido sigue siendo el tiempo fijo, no el doble.
  assert.deepEqual(descansoNuevo('navegador', ahora + 60_000), { hasta: ahora + 60_000 + 5 * 60_000, motivo: 'navegador' })
})

test('lo que gastó un rechazo se mide con el saldo de antes y el de después', () => {
  assert.equal(gastoDeRechazo({ creditos: 30 }, { creditos: 24 }), 6)
  assert.equal(gastoDeRechazo({ creditos: 30 }, { creditos: 30 }), 0)
  // Subió: se renovó en medio, no se sabe.
  assert.equal(gastoDeRechazo({ creditos: 30 }, { creditos: 50 }), null)
  assert.equal(gastoDeRechazo(null, { creditos: 24 }), null)
})

test('la línea Clips dice el modelo, la resolución y lo que cuesta; sin elección no sale', () => {
  assert.match(lineaClips('Omni 1.2 Flash · 720p'), /^Clips: genéralos en Google Flow con Omni 1\.2 Flash en 720p, 24 créditos cada uno/)
  assert.match(lineaClips('Veo 3.1 - Lite'), /^Clips: genéralos en Google Flow con Veo 3\.1 - Lite, 10 créditos cada uno/)
  assert.equal(lineaClips(''), '')
})

test('AVISO_FRENADA detecta actividad inusual, uso inusual y rate limits de Google Flow', async () => {
  const { AVISO_FRENADA } = await import('./flow.ts')
  assert.ok(AVISO_FRENADA.test('Notamos actividad inusual en tu cuenta'))
  assert.ok(AVISO_FRENADA.test('Uso inusual detectado'))
  assert.ok(AVISO_FRENADA.test('We noticed unusual activity'))
  assert.ok(AVISO_FRENADA.test('Has enviado demasiadas solicitudes'))
  assert.ok(AVISO_FRENADA.test('Too many requests, try again later'))
  assert.ok(AVISO_FRENADA.test('Requesting generations too quickly'))
  assert.ok(AVISO_FRENADA.test('Rate limit exceeded'))
  assert.ok(!AVISO_FRENADA.test('El video se generó correctamente'))
})
