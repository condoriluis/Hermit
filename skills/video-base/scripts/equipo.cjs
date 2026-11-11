// El render según esta computadora, y lo que tarda aquí, para Opciones → Tu equipo de Hermit (server/equipo.ts) y para
// decir cuánto falta. Lo medido va en `equipo.json`, junto a los modelos (%APPDATA%/youtube), el mismo archivo donde la
// voz apunta lo suyo (python/procesos/medidas.py de Hermit):
//
//   const equipo = require(path.join(process.env.HERMIT_SKILLS || path.join(os.homedir(), ".claude", "skills"), "video-base", "scripts", "equipo.cjs"));
//   await equipo.tarjeta3D(navegador, desde)  // con qué dibuja el 3D el Chrome de Remotion; avisa si es por software
//   equipo.estimado(cuadros)             // «unos 12 min» para tantos cuadros a tamaño completo, si ya se midió
//   equipo.anotarRender(cuadros, segundos)   // solo el render final, a tamaño completo
//   equipo.falta(parte, desde)           // «unos 4 min», de lo que lleva (0 a 1) desde `desde` (Date.now())
//
// Los cuadros por segundo se promedian con los de antes: un render con la máquina ocupada no lo mueve todo.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const APPDATA = process.env.APPDATA || (process.platform === "darwin" ? path.join(os.homedir(), "Library", "Application Support") : path.join(os.homedir(), ".config"));
const EQUIPO = path.join(APPDATA, "youtube", "equipo.json");

const tiempo = (s) => (s < 90 ? `unos ${Math.max(5, Math.round(s / 5) * 5)} s` : `unos ${Math.round(s / 60)} min`);

function leer() {
  try {
    return JSON.parse(fs.readFileSync(EQUIPO, "utf8"));
  } catch {
    return {};
  }
}

function escribir(d) {
  try {
    fs.mkdirSync(path.dirname(EQUIPO), { recursive: true });
    const temporal = `${EQUIPO}.${process.pid}.tmp`;
    fs.writeFileSync(temporal, JSON.stringify(d, null, 1));
    fs.renameSync(temporal, EQUIPO);
  } catch {}
}

function guardar(cambio) {
  try {
    const d = leer();
    d.render = { ...d.render, ...cambio };
    escribir(d);
  } catch {}
}

function anotarRender(cuadros, segundos) {
  if (cuadros < 60 || segundos <= 0) return;
  const antes = leer().render?.final?.cuadros;
  const ahora = cuadros / segundos;
  guardar({ final: { cuadros: Math.round((antes ? (antes + ahora) / 2 : ahora) * 100) / 100, fecha: new Date().toISOString().slice(0, 10) } });
}

/** «unos 12 min» para `cuadros` del render final, de lo medido aquí; "" si aún no se midió. */
function estimado(cuadros) {
  const medido = leer().render?.final?.cuadros;
  return medido ? tiempo(cuadros / medido) : "";
}

/**
 * Con qué dibuja el 3D el Chrome de Remotion (`navegador`, de openBrowser), del renderizador de WebGL. Si es por software
 * (SwiftShader: una tarjeta que Chrome no puede usar, un escritorio remoto), lo avisa: en el banco del 27 de octubre fue
 * un cuadro por segundo contra 9 con la tarjeta, y un video de 10 min serían horas. Lo apunta para Tu equipo.
 * `desde` es el `createRequire` del proyecto, para usar su @remotion/renderer.
 */
async function tarjeta3D(navegador, desde) {
  try {
    const dist = path.dirname(desde.resolve("@remotion/renderer"));
    // Por su ruta, como prestitcher-memory-usage en render.cjs: no lo exporta.
    const { getPageAndCleanupFn } = desde(path.join(dist, "get-browser-instance.js"));
    const { puppeteerEvaluateWithCatch } = desde(path.join(dist, "puppeteer-evaluate.js"));
    const { page, cleanupPage } = await getPageAndCleanupFn({
      passedInInstance: navegador, browserExecutable: null, chromiumOptions: {}, forceDeviceScaleFactor: undefined, indent: false,
      logLevel: "error", onBrowserDownload: () => ({ version: null, onProgress: () => {} }), chromeMode: "headless-shell",
      pageIndex: 0, onBrowserLog: null, onLog: () => {},
    });
    const { value } = await puppeteerEvaluateWithCatch({
      pageFunction: () => {
        const gl = document.createElement("canvas").getContext("webgl2");
        if (!gl) return "";
        const info = gl.getExtension("WEBGL_debug_renderer_info");
        return gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
      },
      frame: null, args: [], page, timeoutInMilliseconds: 20000,
    });
    await cleanupPage();
    const software = !value || /swiftshader|llvmpipe|software/i.test(value);
    guardar({ tarjeta: { nombre: value || "sin WebGL", software, fecha: new Date().toISOString().slice(0, 10) } });
    if (software)
      console.log("⚠ El 3D se está dibujando sin la tarjeta de video (por software): este render va a ir muy lento. " +
        "Dile al usuario cuánto falta (lo de abajo) y que, si su computadora tiene tarjeta, actualice su controlador.");
    return { nombre: value, software };
  } catch {
    return null;
  }
}

const falta = (parte, desde) => tiempo(((Date.now() - desde) / 1000) * ((1 - parte) / Math.max(parte, 0.01)));

// ---------- El encoder de video de esta computadora ----------
//
// Codificar el video final es una parte del render; con la tarjeta (NVIDIA, Intel Quick Sync, VideoToolbox de
// Apple, Media Foundation) puede ir varias veces más rápido que libx264. Cuál conviene aquí no se adivina: se mide.
// `medirEncoder()` codifica unos segundos de prueba con cada encoder que este FFmpeg trae y con libx264, y deja en
// `equipo.json` el más rápido — solo si el de hardware gana por margen; si no, libx264. Los scripts de las skills lo
// leen con `encoderArgs()` (aquí) o `encoder_video()` de hermit.py, y sin medida codifican con libx264 como siempre.

const { execFileSync, spawnSync } = require("node:child_process");

/** Los encoders H.264 de hardware que se prueban, con los argumentos de calidad de cada uno (un CRV ~18). */
const ENCODERS = {
  h264_nvenc: { args: (c) => ["-c:v", "h264_nvenc", "-rc", "vbr", "-cq", String(Math.min(51, c)), "-preset", "p4", "-pix_fmt", "yuv420p"] },
  h264_qsv: { args: (c) => ["-c:v", "h264_qsv", "-preset", "medium", "-global_quality", String(Math.min(51, c + 4)), "-pix_fmt", "yuv420p"] },
  h264_videotoolbox: { args: () => ["-c:v", "h264_videotoolbox", "-q:v", "65"] },
  h264_mf: { args: () => ["-c:v", "h264_mf", "-rate_control", "quality", "-quality", "85"] },
};
const X264 = { args: (c) => ["-c:v", "libx264", "-crf", String(c), "-preset", "medium", "-pix_fmt", "yuv420p"] };

/** La versión de FFmpeg, una vez por proceso: la medida del encoder se rehace solo si cambió. */
let version = null;
function ffmpegVersion() {
  if (version === null) {
    try {
      version = execFileSync("ffmpeg", ["-version"], { encoding: "utf8", timeout: 10000 }).split("\n")[0].trim();
    } catch {
      version = "";
    }
  }
  return version;
}

/** Los encoders que este FFmpeg compila (`ffmpeg -hide_banner -encoders`). Vacío si no hay FFmpeg. */
function encodersDeFfmpeg() {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-encoders"], { encoding: "utf8", timeout: 15000 });
  if (r.status !== 0) return new Set();
  return new Set([...r.stdout.matchAll(/^\s*V[\w.]+\s+(\S+)/gm)].map((m) => m[1]).filter((n) => /^h264_/.test(n)));
}

/** Milisegundos que tarda en codificar 4 s de 1080×1920 de prueba; -1 si falla. Dos veces y la mejor: la primera
 *  paga la carga del encoder y un solo número se puede deformar por lo que haga el equipo en ese momento. */
function prueba(args) {
  let mejor = -1;
  for (let i = 0; i < 2; i++) {
    const t = Date.now();
    const r = spawnSync(
      "ffmpeg",
      ["-hide_banner", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=1080x1920:rate=30", "-t", "4", "-an", ...args, "-f", "null", "-"],
      { encoding: "utf8", timeout: 90000, windowsHide: true }
    );
    if (r.status === 0 && !r.error) mejor = mejor < 0 ? Date.now() - t : Math.min(mejor, Date.now() - t);
  }
  return mejor;
}

/**
 * Mide cada encoder de hardware que este FFmpeg trae contra libx264 y deja el ganador en `equipo.json`
 * (`encode: { nombre, ms, x264, ffmpeg, fecha }`). El hardware solo gana si es al menos 15 % más rápido:
 * la diferencia de calidad, aunque pequeña, no se juega por segundos. Sin FFmpeg o sin ninguno que funcione,
 * queda libx264 (y no se vuelve a medir hasta que cambie el FFmpeg).
 */
async function medirEncoder() {
  const version = ffmpegVersion();
  if (!version) return null; // sin FFmpeg no hay nada que medir; se reintenta la próxima vez
  const disponibles = encodersDeFfmpeg();
  if (!disponibles.size) return null;

  const candidatos = Object.keys(ENCODERS).filter((n) => disponibles.has(n));
  const base = prueba(X264.args(18));
  const medidas = [];
  for (const n of candidatos) {
    const ms = prueba(ENCODERS[n].args(18));
    if (ms > 0) medidas.push({ nombre: n, ms });
  }
  // El más rápido que supere a libx264 por margen; si ninguno, el procesador.
  const ganador = medidas.filter((m) => base > 0 && m.ms <= base * 0.85).sort((a, b) => a.ms - b.ms)[0];
  const encode = {
    nombre: ganador ? ganador.nombre : "libx264",
    ms: ganador ? ganador.ms : base > 0 ? base : undefined,
    x264: base > 0 ? base : undefined,
    ffmpeg: version,
    fecha: new Date().toISOString().slice(0, 10),
  };
  const d = leer();
  d.encode = encode;
  escribir(d);
  return encode;
}

/**
 * Los argumentos de ffmpeg para codificar el video de esta computadora (`calidad` ~ CRF). Si aún no se midió el
 * encoder (o cambió el FFmpeg), lo mide una vez. Sin medida posible, libx264 — lo de siempre.
 */
async function encoderArgs(calidad = 18) {
  let encode = leer().encode;
  if (!encode || encode.ffmpeg !== ffmpegVersion()) encode = (await medirEncoder()) ?? encode;
  const hacer = ENCODERS[encode?.nombre]?.args ?? X264.args;
  return hacer(calidad);
}

module.exports = { anotarRender, encoderArgs, estimado, falta, medirEncoder, tarjeta3D, tiempo };
