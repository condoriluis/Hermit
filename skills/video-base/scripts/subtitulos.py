"""
Subtítulos karaoke para los estilos que no tienen plantilla propia (motivacional, crimen, top). Se corre desde la
raíz del proyecto:

    python <base>/scripts/subtitulos.py <video.mp4> <salida.mp4> --voz public/voz.wav
        [--formato vertical|horizontal] [--estilo minimal|crimen|top] [--offset 0]

Toma los tiempos de la voz (`--voz`, la pista ya masterizada; si no se pasa, el audio del propio vídeo) y los pasa por
el Whisper de Hermit. Escribe los subtítulos palabra a palabra en ASS —cada palabra se pinta en el color del estilo
mientras se dice— y los quema sobre el vídeo. Deja el `.ass` al lado de la salida, por si hay que retocar.

`--offset` retrasa los subtítulos (segundos): para vídeos que abren con una tarjeta o un plano sin voz antes de que
empiece la narración. El audio del vídeo no se toca, salvo que no tenga pista y sí `--voz`: entonces la voz entra como
audio de la salida.

Los tres estilos:
- `minimal` (motivacional): blanco puro, contorno fino, palabra activa en blanco cálido apenas más cálido. Sobrio.
- `crimen`: blanco con contorno marcado y palabra activa en ámbar, como las fechas y sellos de un expediente.
- `top`: blanco en Arial Black grande, palabra activa en amarillo puro. El golpe de cuenta regresiva.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
BASE = Path(__file__).resolve().parent
PROYECTO = Path.cwd()
sys.path.insert(0, str(BASE))
from hermit import transcribir  # el Python de Hermit y Whisper, de video-base

FORMATOS = {"vertical": (1080, 1920), "horizontal": (1920, 1080)}
# Palabras por línea y color de la palabra activa (ASS: &HAABBGGRR). `minimal` apenas calienta el blanco.
ESTILOS = {
    "minimal": {"palabras": 4, "fuente": "Arial", "negrita": 0, "acento": "&H00E6F4FF", "tinta": "&H00FFFFFF", "espaciado": 1, "contorno": 0.10, "sombra": 0.04},
    "crimen": {"palabras": 3, "fuente": "Arial Black", "negrita": -1, "acento": "&H0042B0FF", "tinta": "&H00FFFFFF", "espaciado": 0, "contorno": 0.14, "sombra": 0.08},
    "top": {"palabras": 3, "fuente": "Arial Black", "negrita": -1, "acento": "&H0000FFFF", "tinta": "&H00FFFFFF", "espaciado": 0, "contorno": 0.12, "sombra": 0.06},
}


def ffmpeg(*args: str) -> None:
    # -nostdin: dentro de un ciclo de la shell, ffmpeg se come la entrada del ciclo.
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", *args], check=True)


def tiene_audio(video: Path) -> bool:
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", str(video)], capture_output=True, text=True)
    return bool(r.stdout.strip())


def segundos(texto: str) -> float:
    return float(texto.replace(",", "."))


def tiempo(s: float) -> str:
    cs = max(round(s * 100), 0)
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def palabras_tiempo(segmentos: list[dict], offset: float) -> list[tuple[float, float, str]]:
    """Cada palabra con su tiempo: dentro del segmento se reparte por lo largo de cada una."""
    salida = []
    for s in segmentos:
        palabras = [p for p in re.findall(r"\S+", s.get("text", "")) if p.strip()]
        if not palabras:
            continue
        peso = [len(re.sub(r"[^\wáéíóúñü]", "", p.lower())) or 1 for p in palabras]
        total = sum(peso)
        t = s["start"] + offset
        for p, w in zip(palabras, peso):
            fin = t + (s["end"] - s["start"]) * w / total
            salida.append((t, fin, p))
            t = fin
    return salida


def linea(texto: str) -> str:
    """La línea limpia para ASS: sin llaves ni barras invertidas, sin puntuación final."""
    return re.sub(r"[{}\\]", "", texto).strip(" ,;:!?¡¿")


def ass(palabras: list[tuple[float, float, str]], estilo: dict, ancho: int, alto: int) -> str:
    """Un Dialogue por grupo de palabras; dentro, `{\\k}` por palabra: el karaoke las pinta en el acento al decirlas."""
    vertical = alto > ancho
    letra = round(ancho * (0.068 if vertical else 0.040)) if estilo["fuente"] == "Arial Black" else round(ancho * (0.056 if vertical else 0.034))
    margen = round(alto * (0.21 if vertical else 0.10))
    contorno = max(round(letra * estilo["contorno"]), 1)
    sombra = max(round(letra * estilo["sombra"]), 1)
    cabeza = (
        "[Script Info]\nScriptType: v4.00+\n"
        f"PlayResX: {ancho}\nPlayResY: {alto}\nWrapStyle: 0\nScaledBorderAndShadow: yes\n\n"
        "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        f"Style: Sub,{estilo['fuente']},{letra},{estilo['tinta']},{estilo['acento']},&H00000000,&H96000000,{estilo['negrita']},0,0,0,100,100,{estilo['espaciado']},0,1,{contorno},{sombra},2,60,60,{margen},1\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )

    # Agrupar en líneas de hasta `palabras` palabras, cortando también tras puntuación de cierre.
    grupos: list[list[tuple[float, float, str]]] = []
    actual: list[tuple[float, float, str]] = []
    for p in palabras:
        actual.append(p)
        if len(actual) >= estilo["palabras"] or re.search(r"[.!?…:;]$", p[2]):
            grupos.append(actual)
            actual = []
    if actual:
        grupos.append(actual)

    lineas = []
    for g in grupos:
        partes = []
        for ini, fin, texto in g:
            w = linea(texto)
            if not w:
                continue
            # \k va en centésimas de segundo; mínimo 1 para que no quede invisible.
            partes.append("{\\k" + str(max(round((fin - ini) * 100), 1)) + "}" + w.upper() + " ")
        if partes:
            lineas.append(f"Dialogue: 0,{tiempo(g[0][0])},{tiempo(g[-1][1])},Sub,,0,0,0,,{''.join(partes).rstrip()}")
    return cabeza + "\n".join(lineas) + "\n"


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) < 2:
        sys.exit(__doc__)
    video, salida = Path(args[0]), Path(args[1])
    formato = "vertical"
    estilo = "minimal"
    voz = None
    offset = 0.0
    i = 1
    while i < len(sys.argv):
        a = sys.argv[i]
        if a == "--formato":
            formato = sys.argv[i + 1]
            i += 1
        elif a == "--estilo":
            estilo = sys.argv[i + 1]
            i += 1
        elif a == "--voz":
            voz = Path(sys.argv[i + 1])
            i += 1
        elif a == "--offset":
            offset = segundos(sys.argv[i + 1])
            i += 1
        i += 1
    if formato not in FORMATOS:
        sys.exit('--formato es "vertical" u "horizontal".')
    if estilo not in ESTILOS:
        sys.exit(f'--estilo es uno de: {", ".join(ESTILOS)}.')
    if not video.is_file():
        sys.exit(f"No existe {video}.")

    ancho, alto = FORMATOS[formato]
    salida.parent.mkdir(parents=True, exist_ok=True)
    ass_path = salida.with_suffix(".ass")

    # Los tiempos salen de la voz (o del audio del vídeo si no se pasa --voz).
    if voz is not None:
        if not voz.is_file():
            sys.exit(f"No existe {voz}.")
        datos = transcribir(voz)
    elif tiene_audio(video):
        datos = transcribir(video)
    else:
        sys.exit("El vídeo no tiene audio y no se pasó --voz: no hay de dónde sacar los tiempos.")

    segmentos = datos.get("segmentos", [])
    if not segmentos:
        sys.exit("El Whisper no oyó voz: sin tiempos no hay subtítulos.")
    ass_path.write_text(ass(palabras_tiempo(segmentos, offset), ESTILOS[estilo], ancho, alto), encoding="utf-8-sig", newline="\n")

    # Desde la carpeta de salida: la ruta absoluta de `subtitles` en Windows (C:\…) rompe su sintaxis.
    entradas = ["-i", video.name]
    maps = ["-map", "0:v"]
    if voz is not None and not tiene_audio(video):
        entradas += ["-i", str(voz)]
        maps += ["-map", "1:a"]
    else:
        maps += ["-map", "0:a?"]
    subprocess.run(
        ["ffmpeg", "-nostdin", "-y", "-v", "error", *entradas, *maps,
         "-vf", f"subtitles={ass_path.name}:charenc=UTF-8",
         "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", salida.name],
        cwd=salida.parent, check=True,
    )
    print(f"Listo: {salida}")
    print(f"Subtítulos ({estilo}, {len(segmentos)} segmentos): {ass_path}")


if __name__ == "__main__":
    main()
