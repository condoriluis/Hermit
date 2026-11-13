"""
Voces TTS por personaje para las escenas que la llevan (`voces/esc-NN.json` en el proyecto): la voz de cada línea la
pone un motor fijo (AI Studio, Fish Audio o ElevenLabs, vía `/api/voz/generar` de Hermit), no Veo — así un personaje
suena igual en todas las escenas. El clip se genera normal (con su audio, para que las bocas se muevan) y aquí se le
cambia la pista de audio por las líneas TTS, que además marcan los subtítulos con los tiempos reales de cada WAV.

Archivos del proyecto:
    voces/personajes.json   {"Cocardo": "Charon", "Lima": "Aoede"} — la voz fija de cada personaje
    voces/esc-NN.json        [{"quien": "Cocardo", "texto": "Se viene el especial de la casa."}, ...]

`preparar()` devuelve, por escena con archivo, su mp4 con el audio TTS y los segmentos sintéticos (mismo formato que
`transcribir`) para subtítulos y transcripcion.txt. Las escenas sin `voces/esc-NN.json` no se tocan: siguen con el
audio de Veo.
"""

import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

URL = __import__("os").environ.get("HERMIT_URL", "http://127.0.0.1:4848")
INICIO = 0.3      # lo que tarda en empezar a hablar tras empezar el clip
ENTRE_LINEAS = 0.35


def _pedir(ruta: str, datos: dict | None = None) -> dict:
    pedido = urllib.request.Request(URL + ruta, data=json.dumps(datos).encode() if datos else None,
                                    headers={"content-type": "application/json"})
    try:
        with urllib.request.urlopen(pedido, timeout=120) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        try:
            sys.exit(f"Voz TTS: {json.load(e).get('error', e)}")
        except Exception:
            sys.exit(f"Voz TTS: {e}")


def _wav_de(texto: str, voz: str, destino: Path) -> None:
    """La línea en WAV con la voz fija del personaje, por la API de voz de Hermit. AI Studio falla a rachas (403 y
    429 sueltos): se reintenta hasta tres veces antes de parar el montaje."""
    if destino.exists():
        return
    error = ""
    for espera in (0, 45, 90, 150):
        if espera:
            time.sleep(espera)
        t = _pedir("/api/voz/generar", {"texto": texto, "voz": voz, "salida": str(destino.resolve())})
        while t.get("estado") in ("en-fila", "generando"):
            time.sleep(3)
            t = _pedir(f"/api/voz/trabajos/{t['id']}?esperar=40")
        if t.get("estado") == "lista" or destino.exists():
            return
        error = t.get("error", "no se generó la línea")
    sys.exit(f"Voz TTS: {error} (4 intentos; si es la cuota del día de AI Studio, mañana sale)")


def _duracion(wav: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def preparar(proyecto: Path, clips: list[Path], revision: Path) -> dict:
    """
    Por cada clip con `voces/<stem>.json`: genera las líneas TTS, las mezcla en un audio para la duración del clip,
    deja `revision/<stem>-voz.mp4` (video igual, audio TTS) y devuelve `{stem: {"mp4": Path, "segmentos": [...]}}`.
    """
    mapa_path = proyecto / "voces" / "personajes.json"
    if not mapa_path.exists():
        return {}
    mapa = json.loads(mapa_path.read_text(encoding="utf-8"))
    salida = {}
    carpeta_wav = revision / "voz"
    for clip in clips:
        vf = proyecto / "voces" / f"{clip.stem}.json"
        if not vf.exists():
            continue
        lineas = json.loads(vf.read_text(encoding="utf-8"))
        if not lineas:
            continue
        carpeta_wav.mkdir(exist_ok=True)
        total = _duracion(clip)
        wavs, t, segmentos = [], INICIO, []
        for i, linea in enumerate(lineas):
            quien, texto = linea["quien"], linea["texto"].strip()
            voz = mapa.get(quien)
            if not voz:
                sys.exit(f"{clip.stem}: «{quien}» no tiene voz en voces/personajes.json (hay: {', '.join(mapa)}).")
            wav = carpeta_wav / f"{clip.stem}-{i}.wav"
            _wav_de(texto, voz, wav)
            dur = _duracion(wav)
            wavs.append((t, wav))
            segmentos.append({"start": t, "end": min(t + dur, total), "text": texto})
            t += dur + ENTRE_LINEAS
        # El audio de la escena: cada línea en su sitio, silencio alrededor, a la duración del clip.
        mezcla = revision / f"{clip.stem}-voz.wav"
        entradas, filtros = [], []
        for j, (desde, wav) in enumerate(wavs):
            entradas += ["-i", str(wav)]
            filtros.append(f"[{j}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={int(desde * 1000)}|{int(desde * 1000)}[l{j}]")
        filtros.append("".join(f"[l{j}]" for j in range(len(wavs))) + f"amix=inputs={len(wavs)}:normalize=0,apad,atrim=0:{total:.3f},asetpts=PTS-STARTPTS[a]")
        subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", *entradas, "-filter_complex", ";".join(filtros),
                        "-map", "[a]", "-c:a", "pcm_s16le", str(mezcla)], check=True)
        mp4 = revision / f"{clip.stem}-voz.mp4"
        subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(clip), "-i", str(mezcla),
                        "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "pcm_s16le", "-t", f"{total:.3f}", str(mp4)],
                       check=True)
        salida[clip.stem] = {"mp4": mp4, "segmentos": segmentos}
        print(f"  {clip.stem}: {len(lineas)} línea(s) con voz TTS")
    return salida
