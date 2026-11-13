"""
Une los clips de un minidrama en el video final. Se corre desde la raíz del proyecto (o con `--en <carpeta>`, la ruta de `Carpeta:`):

    python <skill>/scripts/unir.py <nombre> [--en <carpeta>] [--formato vertical|horizontal] [--duracion 30|45|1:30|2 min]
        [--sin-subtitulos] [--sin-recortar]

Toma `clips/esc-*.mp4` en orden y transcribe cada uno con el Whisper de Hermit. Corta el final muerto de cada clip, el
segundo o dos en que nadie habla ni se mueve, a 0,35 s de su última palabra, salvo `--sin-recortar`. Con `--duracion`,
recorta por el final hasta esa duración, sin dejar un clip de menos de 2 s; si los clips no llegan, avisa y no estira. Los lleva al
tamaño del formato (Veo da 720p) a 30 fps, limpia el fondo de cada clip (`sonido.py`, de video-base), une su audio y
lo masteriza (`masterizar.mjs` de video-base, -14 LUFS y -1 dBTP). Deja lo que dicen en `revision/transcripcion.txt`, para compararlo con el guion, y salvo `--sin-subtitulos`
lo pone encima en bloques de hasta tres palabras, con la palabra clave resaltada en amarillo. Las escenas con `voces/esc-NN.json`
suenan con la voz TTS fija de cada personaje (`voces/personajes.json`, voz_tts.py de video-base) y sus subtítulos son
el guion mismo. Deja `out/minidrama-<nombre>.mp4`.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
SKILL = Path(__file__).resolve().parent.parent
BASE = SKILL.parent / "video-base" / "scripts"
sys.path.insert(0, str(BASE))
from sonido import LIMPIAR  # la limpieza del audio de los clips de Veo, de video-base

# `--en <carpeta>` es la ruta completa de la línea `Carpeta:` de Hermit: el proyecto no depende del directorio donde se
# corra; sin ella, el directorio actual.
_en = sys.argv[sys.argv.index("--en") + 1] if "--en" in sys.argv[:-1] else ""
PROYECTO = Path(_en).resolve() if _en else Path.cwd()
# La carpeta de las skills no es un proyecto: los clips y el video no los vería nadie.
if PROYECTO == SKILL.parent or SKILL.parent in PROYECTO.parents:
    sys.exit(f"{PROYECTO} es la carpeta de las skills: pasa la ruta completa de la línea `Carpeta:`.")
FORMATOS = {"vertical": (1080, 1920), "horizontal": (1920, 1080)}
FPS = 30
PALABRAS = 3
# Lo que queda del clip tras su última palabra, y lo menos que dura un clip cortado.
MARGEN = 0.35
MINIMO = 2.0


def ffmpeg(*args: str) -> None:
    # -nostdin: dentro de un ciclo de la shell, ffmpeg se come la entrada del ciclo.
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", *args], check=True)


def con_audio(clip: Path) -> bool:
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", str(clip)], capture_output=True, text=True)
    return bool(r.stdout.strip())


def duracion(clip: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(clip)], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def segundos(texto: str) -> float:
    """Los segundos de `--duracion`: «30», «30 s», «1:30», «2 min»."""
    t = texto.strip().lower().replace(",", ".")
    m = re.fullmatch(r"(?:(\d+):)?(\d+(?:\.\d+)?)\s*(s|seg|segundos?|m|min|minutos?)?", t)
    if not m:
        sys.exit(f'--duracion no se entiende: "{texto}". Usa segundos o minutos, por ejemplo 30 s o 2 min.')
    n = float(m.group(2)) * (60 if m.group(3) and m.group(3).startswith("m") else 1)
    return n + (int(m.group(1)) * 60 if m.group(1) else 0)


def corte(clip: Path, segmentos: list[dict]) -> float:
    """
    Dónde acaba el clip: poco después de su última palabra. Veo deja de 1 a 2 s al final en que nadie habla ni se mueve,
    y con ruido de fondo, así que el silencio no se puede medir: se corta en lo que oye Whisper. Sin voz, entero. En un
    cuadro exacto, para que los fotogramas cuadren.
    """
    total = duracion(clip)
    if not segmentos:
        return total
    return min(total, round(max(segmentos[-1]["end"] + MARGEN, MINIMO) * FPS) / FPS)


def unir(clips: list[Path], cortes: list[float], ancho: int, alto: int, salida: Path) -> None:
    """Todos al mismo tamaño, fps y audio, cada uno hasta su corte, y uno tras otro. Un clip sin audio va con silencio."""
    entradas = [a for c in clips for a in ("-i", str(c))]
    filtros = []
    n = len(clips)
    for i, (c, fin) in enumerate(zip(clips, cortes)):
        filtros.append(f"[{i}:v]trim=end={fin:.3f},setpts=PTS-STARTPTS,scale={ancho}:{alto}:force_original_aspect_ratio=increase,crop={ancho}:{alto},setsar=1,fps={FPS},format=yuv420p[v{i}]")
        if con_audio(c):
            # La voz va limpia (LIMPIAR, de video-base): Veo deja un colchón de ambiente por debajo y el máster lo
            # subiría con la voz. El desvanecido de 60 ms evita el chasquido en el corte.
            filtros.append(f"[{i}:a]atrim=end={fin:.3f},asetpts=PTS-STARTPTS,{LIMPIAR},afade=t=out:st={max(fin - 0.06, 0):.3f}:d=0.06,aresample=48000,aformat=channel_layouts=stereo[a{i}]")
        else:
            # El silencio entra después de los clips: es la entrada que sigue.
            filtros.append(f"[{entradas.count('-i')}:a]anull[a{i}]")
            entradas += ["-f", "lavfi", "-t", f"{fin:.3f}", "-i", "anullsrc=r=48000:cl=stereo"]
    filtros.append("".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[v][a]")
    ffmpeg(*entradas, "-filter_complex", ";".join(filtros), "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-c:a", "pcm_s16le", str(salida))


def tiempo(s: float) -> str:
    cs = round(s * 100)
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def bloques(segmentos: list[dict]) -> list[tuple[float, float, str]]:
    """Cada segmento, en bloques de hasta PALABRAS palabras; su tiempo se reparte por lo largo de cada bloque."""
    salida = []
    for s in segmentos:
        palabras = s["text"].split()
        if not palabras:
            continue
        grupos = [palabras[i : i + PALABRAS] for i in range(0, len(palabras), PALABRAS)]
        largo = sum(len(" ".join(g)) for g in grupos)
        t = s["start"]
        for g in grupos:
            fin = t + (s["end"] - s["start"]) * len(" ".join(g)) / largo
            salida.append((t, fin, " ".join(g)))
            t = fin
    return salida


def ass(bloques_: list[tuple[float, float, str]], ancho: int, alto: int) -> str:
    """Blanco con contorno negro y la palabra más larga de cada bloque en amarillo. En vertical, encima de la interfaz de TikTok."""
    letra = round(ancho * 0.075) if alto > ancho else round(alto * 0.085)
    margen = round(alto * 0.27) if alto > ancho else round(alto * 0.08)
    cabeza = (
        "[Script Info]\nScriptType: v4.00+\n"
        f"PlayResX: {ancho}\nPlayResY: {alto}\nWrapStyle: 0\n\n"
        "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        f"Style: Base,Arial Black,{letra},&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,{round(letra * 0.12)},{round(letra * 0.06)},2,60,60,{margen},1\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )
    lineas = []
    for ini, fin, texto in bloques_:
        palabras = re.sub(r"[{}\\]", "", texto).upper().split()
        larga = max(range(len(palabras)), key=lambda i: len(re.sub(r"\W", "", palabras[i])))
        palabras[larga] = "{\\c&H0000FFFF&}" + palabras[larga] + "{\\c&H00FFFFFF&}"
        lineas.append(f"Dialogue: 0,{tiempo(ini)},{tiempo(fin)},Base,,0,0,0,,{' '.join(palabras)}")
    return cabeza + "\n".join(lineas) + "\n"


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit(__doc__)
    nombre = args[0]
    formato = sys.argv[sys.argv.index("--formato") + 1] if "--formato" in sys.argv else "vertical"
    if formato not in FORMATOS:
        sys.exit('--formato es "vertical" u "horizontal".')
    ancho, alto = FORMATOS[formato]
    clips = sorted((PROYECTO / "clips").glob("esc-*.mp4"))
    if not clips:
        sys.exit("No hay clips en clips/esc-*.mp4.")
    revision = PROYECTO / "revision"
    revision.mkdir(exist_ok=True)
    (PROYECTO / "out").mkdir(exist_ok=True)
    from hermit import cobertura, encoder_video, transcribir  # el Python de Hermit y Whisper, y el encoder de video, de video-base

    # Las escenas con `voces/esc-NN.json` suenan con TTS por personaje (voz_tts.py, de video-base): su audio y sus
    # subtítulos salen del guion, no de lo que oiga Whisper en el clip. Se preparan antes de transcribir para no
    # gastar Whisper en ellas.
    from voz_tts import preparar as preparar_tts
    tts = preparar_tts(PROYECTO, clips, revision)

    voz = [tts[c.stem]["segmentos"] if c.stem in tts else (transcribir(c).get("segmentos", []) if con_audio(c) else []) for c in clips]
    cortes = [duracion(c) if "--sin-recortar" in sys.argv else corte(c, p) for c, p in zip(clips, voz)]
    total = sum(cortes)
    if "--duracion" in sys.argv:
        i = sys.argv.index("--duracion") + 1
        if i >= len(sys.argv):
            sys.exit("--duracion necesita segundos o minutos, por ejemplo 30 s o 2 min.")
        objetivo = segundos(sys.argv[i])
        while cortes and total > objetivo:
            sobra = total - objetivo
            if cortes[-1] - sobra >= MINIMO:
                cortes[-1] -= sobra
                total = objetivo
            else:
                total -= cortes.pop()
                clips.pop()
                voz.pop()
        if total < objetivo - 0.5:
            print(f"Aviso: los clips duran {total:.1f} s y pediste {objetivo:.1f} s; no se estira: faltan {objetivo - total:.1f} s.")
    segmentos, renglones, inicio = [], [], 0.0
    for c, fin, propios in zip(clips, cortes, voz):
        segmentos += [{**s, "start": s["start"] + inicio, "end": min(s["end"], fin) + inicio} for s in propios if s["start"] < fin]
        marca = " [voz TTS]" if c.stem in tts else ""
        renglones.append(f"{c.stem}{marca} ({inicio:.1f}-{inicio + fin:.1f} s, de {duracion(c):.1f}): {' '.join(s['text'].strip() for s in propios) or '(sin voz)'}")
        inicio += fin
    (revision / "transcripcion.txt").write_text("\n".join(renglones) + "\n", encoding="utf-8", newline="\n")

    # La puerta del guion: cada clip debe decir lo que su `dialogos/esc-NN.txt` dice (las mismas líneas del prompt
    # de Flow). Whisper transcribe hasta el balbuceo de Veo; si no se parece, el clip está mal aunque el video salga:
    # se regenera y se vuelve a unir, o `--forzar` cuando lo que se oyó está bien de verdad.
    malas, sin_guion = [], 0
    for c, propios in zip(clips, voz):
        if c.stem in tts:
            continue  # su audio ya es el guion: no hay nada que transcribir ni comparar
        dicho = " ".join(s["text"].strip() for s in propios)
        f = PROYECTO / "dialogos" / f"{c.stem}.txt"
        if not f.exists() or not f.read_text(encoding="utf-8").strip():
            sin_guion += bool(dicho.strip())
            continue
        esperado = f.read_text(encoding="utf-8").strip()
        rec, prec = cobertura(dicho, esperado)
        if rec < 0.75 or prec < 0.75:
            malas.append((c.stem, esperado, dicho, rec, prec))
    if sin_guion:
        print(f"Ojo: {sin_guion} clip(s) hablaron sin `dialogos/esc-NN.txt`: no se pudieron comparar con el guion.")
    if malas:
        (revision / "sospechosas.txt").write_text(
            "\n\n".join(f"{n}: esperaba «{e}»\n   oyó «{d or '(nada)'}»\n   acuerdo {r:.0%} del guion, {p:.0%} limpio" for n, e, d, r, p in malas) + "\n",
            encoding="utf-8", newline="\n")
        if "--forzar" not in sys.argv:
            print("Escenas que no dicen lo del guion:")
            for n, e, d, r, p in malas:
                print(f"  {n}: «{e}» → se oyó «{d or '(nada)'}»")
            sys.exit("Regenera esos clips y vuelve a unir (o pasa --forzar si están bien de verdad).")
        print("Se siguen con --forzar: las escenas listadas saldrán con lo que se oyó.")
    elif (revision / "sospechosas.txt").exists():
        (revision / "sospechosas.txt").unlink()  # montaje limpio: no queda una lista vieja de un intento anterior

    crudo = revision / "crudo.mkv"
    print(f"Uniendo {len(clips)} clips a {ancho}x{alto}: {inicio:.1f} s…")
    # Las escenas TTS entran con su audio cambiado (`revision/esc-NN-voz.mp4`); las demás, el clip de Veo tal cual.
    clips_final = [tts[c.stem]["mp4"] if c.stem in tts else c for c in clips]
    unir(clips_final, cortes, ancho, alto, crudo)

    audio = revision / "audio.wav"
    subprocess.run(["node", str(BASE / "masterizar.mjs"), str(crudo), str(audio)], check=True)
    (revision / "transcripcion.json").write_text(json.dumps(segmentos, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")

    final = PROYECTO / "out" / f"minidrama-{nombre}.mp4"
    video = ["-vf", "subtitles=subtitulos.ass:charenc=UTF-8"] if "--sin-subtitulos" not in sys.argv else []
    if video:
        (revision / "subtitulos.ass").write_text(ass(bloques(segmentos), ancho, alto), encoding="utf-8-sig", newline="\n")
    # Desde revision/: la ruta del filtro `subtitles` en Windows (C:\…) rompe su sintaxis.
    subprocess.run(
        ["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", crudo.name, "-i", audio.name, "-map", "0:v", "-map", "1:a", *video,
         *encoder_video(18), "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(final)],
        cwd=revision, check=True,
    )
    print(f"Listo: {final}")
    print(f"Transcripción, para compararla con el guion: {revision / 'transcripcion.txt'}")


if __name__ == "__main__":
    main()

