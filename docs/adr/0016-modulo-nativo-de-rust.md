# El módulo nativo de Rust para las ondas y el hardware

Fecha: 2026-11-04

## Contexto

Dos cosas del servidor se notaban en el uso diario:

- Cada audio del editor pedía su onda con un proceso de FFmpeg (`server/motor.ts`). Lanzar un programa cuesta 150–300 ms la
  primera vez de cada uno (ver `docs/agents/rendimiento.md`), y la onda de un audio de 0,2 s no necesita tanto.
- Leer la memoria de la máquina con librerías de sistema obliga a recorrer procesos, discos y redes. Hacerlo en cada aviso
  o en cada arranque de video es trabajo que no cambia ninguna decisión.

El servidor ya tenía un gobernador pensado solo para renders, pero los renders los lanza el agente desde su skill: no hay
dónde interceptarlos sin tocar los scripts. Lo que sí decide Hermit es cuántos videos del lote arrancan y con cuánta memoria
libre, y ahí es donde el hardware importa.

## Decisión

- **Las ondas se calculan en Rust** (`crates/hermit-native`, `server/native.ts`): Symphonia decodifica WAV, MP3 y AAC/M4A en
  memoria y devuelve un pico cada 20 ms, de 0 a 255, con la misma normalización de raíz cuadrada que FFmpeg.
- **La decodificación corre en un `AsyncTask` de napi**: usa el pool de hilos de libuv y nunca bloquea el event loop. Un
  audio largo ya no detiene el servidor, que era el riesgo de hacerlo síncrono.
- **La máquina se lee una vez**: `hardware_info` guarda un `System` y en cada llamada solo refresca la memoria. Devuelve
  núcleos, memoria total y disponible.
- **`server/gobernador.ts` es la cara en Node**: `hardware` (una sola lectura), `ramLibreBytes()` y `estadoRecursos()`.
  `CABEN` (`server/sessions.ts`) y el aviso de RAM (`shared/limites.ts`) salen de ahí. Sin el módulo, `os.freemem`.
- **El `.node` es opcional**: si no está, `native.ts` devuelve `null` sin lanzar, la onda la sigue sacando FFmpeg y la
  memoria, `os.freemem`. Un clon sin compilar funciona igual.
- **Windows no necesita `node.lib`**: en Windows `napi-sys` resuelve los símbolos de N-API con `libloading` sobre el propio
  proceso. `build.rs` solo llama a `napi-build` fuera de Windows; así no hay `libnode.dll` ni una librería de importación
  que mantener en el repo.
- **El binario viaja con el servidor**: `npm run build-native` lo compila y `npm run compilar` lo llama antes de empaquetar.
  Es un archivo, no entra en el bundle de esbuild; se copia a `app/server/native/hermit_native.node`.

## Consecuencias

- `npm run build-native` necesita Rust en la máquina (`rustup`), y los flujos de GitHub instalan `dtolnay/rust-toolchain`.
  Un sistema sin Rust puede usar Hermit en desarrollo, pero `npm run compilar` falla en vez de vender la app sin el módulo.
- El `.node` y `target/` no se versionan (`.gitignore`): cada sistema compila el suyo. `Cargo.lock` sí se versiona.
- Symphonia no lee todos los formatos (por ejemplo OGG/Opus): esos audios caen a FFmpeg, que sigue disponible.
- Si un archivo está dañado o no tiene muestras, Rust devuelve error y el que llama usa FFmpeg; no se inventa una onda vacía.
- El camino nativo se prueba en `server/native.test.ts` (se salta si no hay módulo); las pruebas de `motor.test.ts` fuerzan
  `HERMIT_SIN_NATIVO=1` para seguir probando el respaldo con el FFmpeg falso.
