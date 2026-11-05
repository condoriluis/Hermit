use napi::bindgen_prelude::*;
use napi::{Env, Task};
use napi_derive::napi;
use std::fs::File;
use std::path::Path;
use std::sync::{Mutex, OnceLock};
use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::{DecoderOptions, CODEC_TYPE_NULL};
use symphonia::core::errors::Error as SymphoniaError;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use sysinfo::System;

/// La misma resolución que `server/motor.ts`: un pico cada 20 ms.
const PICOS_POR_SEGUNDO: f64 = 50.0;

#[napi(object)]
pub struct HardwareInfo {
  pub cpu_cores: u32,
  pub total_memory_mb: f64,
  pub available_memory_mb: f64,
}

/// Un solo `System` para todo el proceso: crearlo recorre la máquina entera.
/// Después solo se refresca la memoria, que es lo único que cambia entre llamadas.
fn sistema() -> &'static Mutex<System> {
  static SISTEMA: OnceLock<Mutex<System>> = OnceLock::new();
  SISTEMA.get_or_init(|| {
    let mut sistema = System::new();
    sistema.refresh_cpu_all();
    sistema.refresh_memory();
    Mutex::new(sistema)
  })
}

fn en_mb(bytes: u64) -> f64 {
  bytes as f64 / (1024.0 * 1024.0)
}

/// Núcleos, memoria total y memoria disponible en caliente.
#[napi]
pub fn hardware_info() -> HardwareInfo {
  let mut sistema = sistema().lock().unwrap_or_else(|veneno| veneno.into_inner());
  sistema.refresh_memory();
  HardwareInfo {
    cpu_cores: sistema.cpus().len().max(1) as u32,
    total_memory_mb: en_mb(sistema.total_memory()),
    available_memory_mb: en_mb(sistema.available_memory()),
  }
}

/// La onda se calcula en el pool de hilos de libuv: un audio largo no frena al servidor.
pub struct TareaPicos {
  ruta: String,
}

#[napi]
pub fn calcular_picos_audio(ruta: String) -> AsyncTask<TareaPicos> {
  AsyncTask::new(TareaPicos { ruta })
}

impl Task for TareaPicos {
  type Output = Vec<u8>;
  type JsValue = Buffer;

  fn compute(&mut self) -> Result<Self::Output> {
    calcular_picos(Path::new(&self.ruta))
  }

  fn resolve(&mut self, _env: Env, picos: Self::Output) -> Result<Self::JsValue> {
    Ok(Buffer::from(picos))
  }
}

fn calcular_picos(ruta: &Path) -> Result<Vec<u8>> {
  if !ruta.is_file() {
    return Err(Error::new(
      Status::InvalidArg,
      format!("Archivo no encontrado: {}", ruta.display()),
    ));
  }

  let archivo = File::open(ruta).map_err(|e| {
    Error::new(
      Status::GenericFailure,
      format!("No se pudo abrir {}: {e}", ruta.display()),
    )
  })?;
  let flujo = MediaSourceStream::new(Box::new(archivo), Default::default());

  let mut pista = Hint::new();
  if let Some(ext) = ruta.extension().and_then(|e| e.to_str()) {
    pista.with_extension(ext);
  }

  let formato = symphonia::default::get_probe()
    .format(
      &pista,
      flujo,
      &FormatOptions::default(),
      &MetadataOptions::default(),
    )
    .map_err(|e| Error::new(Status::GenericFailure, format!("Formato no reconocido: {e}")))?;
  let mut formato = formato.format;

  let pista = formato
    .tracks()
    .iter()
    .find(|t| t.codec_params.codec != CODEC_TYPE_NULL)
    .ok_or_else(|| Error::new(Status::GenericFailure, "No se encontró pista de audio"))?;
  let id_pista = pista.id;
  let frecuencia = pista.codec_params.sample_rate.unwrap_or(44_100) as f64;
  let canales = pista
    .codec_params
    .channels
    .map(|c| c.count())
    .unwrap_or(2) as f64;
  let muestras_por_pico = ((frecuencia * canales) / PICOS_POR_SEGUNDO).max(1.0) as usize;

  let mut decodificador = symphonia::default::get_codecs()
    .make(&pista.codec_params, &DecoderOptions::default())
    .map_err(|e| Error::new(Status::GenericFailure, format!("Codec no soportado: {e}")))?;

  let mut picos: Vec<u8> = Vec::new();
  let mut maximo: f32 = 0.0;
  let mut contador: usize = 0;

  loop {
    let paquete = match formato.next_packet() {
      Ok(paquete) => paquete,
      // Se acabó el archivo (o cambió el flujo): lo ya calculado sirve.
      Err(_) => break,
    };
    if paquete.track_id() != id_pista {
      continue;
    }

    let audio = match decodificador.decode(&paquete) {
      Ok(audio) => audio,
      // Un paquete dañado no debe tirar toda la onda.
      Err(SymphoniaError::DecodeError(_)) => continue,
      Err(e) => {
        return Err(Error::new(
          Status::GenericFailure,
          format!("No se pudo decodificar el audio: {e}"),
        ))
      }
    };

    let mut muestras = SampleBuffer::<f32>::new(audio.capacity() as u64, *audio.spec());
    muestras.copy_interleaved_ref(audio);
    for &muestra in muestras.samples() {
      let valor = muestra.abs();
      if valor > maximo {
        maximo = valor;
      }
      contador += 1;
      if contador >= muestras_por_pico {
        // La raíz levanta lo bajo: la voz se ve aunque esté grabada floja.
        picos.push((maximo.sqrt() * 255.0).round().min(255.0) as u8);
        maximo = 0.0;
        contador = 0;
      }
    }
  }

  if picos.is_empty() {
    return Err(Error::new(
      Status::GenericFailure,
      "El audio no tiene muestras",
    ));
  }
  Ok(picos)
}
