"""
Monta un video de «Política sin filtro» en el formato final. Se corre desde la raíz del proyecto (o con `--en <carpeta>`, la ruta de `Carpeta:`):

    python <skill>/scripts/montar.py <nombre> [--en <carpeta>] [--formato vertical|horizontal] [--sin-subtitulos]

Toma la narración en `public/voz.wav` (o `voz.wav`), la transcribe palabra por palabra con el Whisper de Hermit,
alinea las imágenes y documentos de `fuentes/material/` con transiciones de paneo continuo, genera subtítulos
dinámicos con colores de choque (amarillo para cifras/dinero y rojo para palabras de alarma) en UTF-8, mezcla
la música incidental de tensión a bajo volumen y masteriza el audio a -14 LUFS. Deja `out/politica-<nombre>.mp4`.
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
# `--en <carpeta>` es la ruta completa de la línea `Carpeta:` de Hermit: el proyecto no depende del directorio donde se
# corra; sin ella, el directorio actual.
_en = sys.argv[sys.argv.index("--en") + 1] if "--en" in sys.argv[:-1] else ""
PROYECTO = Path(_en).resolve() if _en else Path.cwd()
# La carpeta de las skills no es un proyecto: el video no lo vería nadie.
if PROYECTO == SKILL.parent or SKILL.parent in PROYECTO.parents:
    sys.exit(f"{PROYECTO} es la carpeta de las skills: pasa la ruta completa de la línea `Carpeta:`.")
FORMATOS = {"vertical": (1080, 1920), "horizontal": (1920, 1080)}
FPS = 30
PALABRAS_POR_BLOQUE = 3

# Palabras de impacto para colorear automáticamente
PATRON_NUMEROS = re.compile(r"\d+[\d.,]*|\$|€|%|millon|millones|mil|dolar|dolares|pesos|euros|bitcoin", re.I)
PATRON_ALARMA = re.compile(r"escandalo|crisis|quiebra|despido|renuncia|traicion|culpable|fraude|corrupcion|deuda|alerta|urgente|peligro|secreto|estafa|conflicto", re.I)


def ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", *args], check=True)


def duracion(archivo: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(archivo)], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def seg_a_ass(s: float) -> str:
    cs = round(s * 100)
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def color_palabra(palabra: str) -> str:
    limpia = re.sub(r"[^\w$%]", "", palabra.lower())
    if PATRON_ALARMA.search(limpia):
        # Rojo vibrante en ASS BGR: &H003333FF&
        return "{\\c&H003333FF&}" + palabra + "{\\c&H00FFFFFF&}"
    if PATRON_NUMEROS.search(limpia):
        # Amarillo fluorescente en ASS BGR: &H0000FFFF&
        return "{\\c&H0000FFFF&}" + palabra + "{\\c&H00FFFFFF&}"
    return palabra


def generar_subtitulos_ass(segmentos: list[dict], ancho: int, alto: int, salida: Path) -> None:
    """Genera subtítulos dinámicos de alto contraste, palabra por palabra con resaltado en amarillo y rojo."""
    vertical = alto > ancho
    letra = round(ancho * 0.078) if vertical else round(alto * 0.088)
    margen_v = round(alto * 0.25) if vertical else round(alto * 0.10)

    cabeza = (
        "[Script Info]\n"
        "ScriptType: v4.00+\n"
        f"PlayResX: {ancho}\n"
        f"PlayResY: {alto}\n"
        "WrapStyle: 0\n"
        "ScaledBorderAndShadow: yes\n\n"
        "[V4+ Styles]\n"
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        f"Style: Politica,Arial Black,{letra},&H00FFFFFF,&H00FFFFFF,&H00000000,&H90000000,1,0,0,0,100,100,0,0,1,{round(letra * 0.14)},{round(letra * 0.08)},2,50,50,{margen_v},1\n\n"
        "[Events]\n"
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )

    eventos = []
    for s in segmentos:
        palabras = s.get("text", "").split()
        if not palabras:
            continue
        bloques = [palabras[i : i + PALABRAS_POR_BLOQUE] for i in range(0, len(palabras), PALABRAS_POR_BLOQUE)]
        largo_total = sum(len(" ".join(b)) for b in bloques) or 1
        t_actual = s["start"]
        dur_segmento = max(s["end"] - s["start"], 0.3)

        for b in bloques:
            dur_bloque = dur_segmento * (len(" ".join(b)) / largo_total)
            t_fin = t_actual + dur_bloque
            palabras_coloreadas = [color_palabra(p.upper()) for p in b]
            texto_linea = " ".join(palabras_coloreadas)
            eventos.append(f"Dialogue: 0,{seg_a_ass(t_actual)},{seg_a_ass(t_fin)},Politica,,0,0,0,,{texto_linea}")
            t_actual = t_fin

    salida.write_text(cabeza + "\n".join(eventos) + "\n", encoding="utf-8-sig")


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit(__doc__)
    nombre = args[0]
    formato = sys.argv[sys.argv.index("--formato") + 1] if "--formato" in sys.argv else "vertical"
    if formato not in FORMATOS:
        sys.exit('--formato es "vertical" u "horizontal".')
    ancho, alto = FORMATOS[formato]

    revision = PROYECTO / "revision"
    revision.mkdir(exist_ok=True)
    out_dir = PROYECTO / "out"
    out_dir.mkdir(exist_ok=True)

    # 1. Localizar la voz
    voz = next((PROYECTO / p for p in ["public/voz.wav", "public/voz/narracion.wav", "voz.wav"] if (PROYECTO / p).exists()), None)
    if not voz:
        sys.exit("Falta el audio en public/voz.wav o voz.wav.")

    dur_total = duracion(voz)
    print(f"Duración de la voz: {dur_total:.1f} s")

    # 2. Transcripción acústica con Whisper de Hermit
    from hermit import encoder_video, transcribir
    resultado_tx = transcribir(voz)
    segmentos = resultado_tx.get("segmentos", [])
    (revision / "transcripcion.json").write_text(json.dumps(segmentos, ensure_ascii=False, indent=1), encoding="utf-8", newline="\n")

    # 3. Subtítulos de impacto
    ass_path = revision / "subtitulos.ass"
    generar_subtitulos_ass(segmentos, ancho, alto, ass_path)

    # 4. Material visual (imágenes / capturas / documentos)
    carpetas_mat = [PROYECTO / "fuentes/material", PROYECTO / "material", PROYECTO / "fuentes"]
    imagenes = []
    for c in carpetas_mat:
        if c.exists():
            imagenes.extend(sorted(c.glob("*.{jpg,jpeg,png,webp}")))
            if not imagenes:
                for ext in ["*.jpg", "*.jpeg", "*.png", "*.webp"]:
                    imagenes.extend(sorted(c.glob(ext)))
    imagenes = sorted(set(imagenes))

    # Si no hay imágenes en fuentes/material, buscar cuadros o portadas
    if not imagenes:
        for ext in ["cuadros/*.jpg", "portada.png", "*.jpg", "*.png"]:
            imagenes.extend(sorted(PROYECTO.glob(ext)))
        imagenes = sorted(set(imagenes))

    # 5. Generar video base (si hay imágenes, repartirlas con Ken Burns; si no, fondo sobrio)
    video_crudo = revision / "visual.mp4"
    if imagenes:
        dur_foto = dur_total / len(imagenes)
        tramos = []
        entradas_v = []
        for i, img in enumerate(imagenes):
            entradas_v.extend(["-loop", "1", "-t", f"{dur_foto:.3f}", "-i", str(img)])
            # Paneo suave alternado
            zoom_in = i % 2 == 0
            z_expr = "min(zoom+0.0015,1.15)" if zoom_in else "max(1.15-0.0015*on,1.0)"
            tramos.append(f"[{i}:v]scale={ancho * 2}:{alto * 2},fps={FPS},zoompan=z='{z_expr}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={ancho}x{alto}:fps={FPS},setsar=1,format=yuv420p[v{i}]")
        concat_v = "".join(f"[v{i}]" for i in range(len(imagenes))) + f"concat=n={len(imagenes)}:v=1:a=0[v]"
        ffmpeg(*entradas_v, "-filter_complex", ";".join(tramos) + ";" + concat_v, "-map", "[v]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-t", f"{dur_total:.3f}", str(video_crudo))
    else:
        # Fondo oscuro de noticiero
        ffmpeg("-f", "lavfi", "-i", f"color=c=#0f141c:s={ancho}x{alto}:d={dur_total:.3f}:r={FPS}", "-c:v", "libx264", "-pix_fmt", "yuv420p", str(video_crudo))

    # 6. Masterización de audio (voz + música incidental opcional a -22 dB)
    audio_master = revision / "audio_master.wav"
    musica = next((PROYECTO / p for p in ["public/musica.mp3", "musica.mp3", "public/musica.wav"] if (PROYECTO / p).exists()), None)
    if musica:
        audio_mezclado = revision / "mezcla.wav"
        ffmpeg("-i", str(voz), "-stream_loop", "-1", "-i", str(musica), "-filter_complex", "[1:a]volume=0.08[m];[0:a][m]amix=inputs=2:duration=first[a]", "-map", "[a]", str(audio_mezclado))
        subprocess.run(["node", str(BASE / "masterizar.mjs"), str(audio_mezclado), str(audio_master)], check=True)
    else:
        subprocess.run(["node", str(BASE / "masterizar.mjs"), str(voz), str(audio_master)], check=True)

    # 7. Render final con subtítulos UTF-8
    final = out_dir / f"politica-{nombre}.mp4"
    sub_filtros = ["-vf", f"subtitles={ass_path.name}:charenc=UTF-8"] if "--sin-subtitulos" not in sys.argv else []

    subprocess.run(
        ["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", video_crudo.name, "-i", audio_master.name, "-map", "0:v", "-map", "1:a", *sub_filtros,
         *encoder_video(18), "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(final)],
        cwd=revision, check=True
    )

    # 8. Si es vertical y existe portada, adherirla de primer fotograma (PORTADA.md de video-base)
    portada_img = next((PROYECTO / p for p in ["portada.png", "public/portada.png", "portada/portada.png", "portada/portada.jpg"] if (PROYECTO / p).exists()), None)
    if alto > ancho and portada_img:
        subprocess.run(["node", str(BASE / "portada.mjs"), str(final), str(portada_img)], check=False)

    print(f"Video final de Política sin filtro listo: {final}")


if __name__ == "__main__":
    main()

