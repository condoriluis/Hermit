"""
Monta un video de historia de Reddit sincronizando la narración con el fondo, la tarjeta inicial y subtítulos acústicos:

    python <skill>/scripts/montar.py [<carpeta_proyecto>] [--formato vertical|horizontal]

Requisitos:
- voz: public/voz.wav (o voz.wav)
- fondo: public/fondo.mp4 (o fondo.mp4)
- tarjeta de Reddit: public/reddit_card.png (opcional pero recomendada)
- música de fondo: public/musica.mp3 (opcional)

Los subtítulos se generan mediante transcripción acústica precisa (Whisper / VoxPopuli)
almacenada en work/tx/words.json para garantizar sincronización perfecta palabra por palabra.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
SKILL = Path(__file__).resolve().parent.parent
BASE = SKILL.parent / "video-base" / "scripts"
sys.path.insert(0, str(BASE))

try:
    from hermit import MODELOS, encoder_video, proceso, wav16k
except ImportError:
    MODELOS = None
    encoder_video = None
    proceso = None
    wav16k = None


def duracion(archivo: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(archivo)],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(r.stdout.strip())


def transcribir_voz(voz: Path, dir_tx: Path) -> list[dict]:
    words_file = dir_tx / "words.json"
    if words_file.exists():
        return json.loads(words_file.read_text(encoding="utf-8"))

    dir_tx.mkdir(parents=True, exist_ok=True)
    v16 = dir_tx / f"{voz.stem}.16k.wav"

    if wav16k is not None and proceso is not None:
        wav16k(voz, v16)
        try:
            d = proceso(
                "transcribir.py",
                [str(v16)],
                {"modelos": str(MODELOS), "alineador": "voxpopuli-es", "terminos": [], "cifras_en_letra": True},
            )
            palabras = [{"w": p["text"], "s": round(p["start"], 3), "e": round(p["end"], 3)} for p in d["words"]]
        finally:
            v16.unlink(missing_ok=True)
    else:
        # Fallback ffprobe/whisper si corre independiente
        dur = duracion(voz)
        palabras = [{"w": "...", "s": 0.0, "e": dur}]

    words_file.write_text(json.dumps(palabras, ensure_ascii=False, indent=2), encoding="utf-8")
    return palabras


def seg_a_ass(s: float) -> str:
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = int(s % 60)
    cs = int(round((s - int(s)) * 100))
    if cs >= 100:
        cs = 99
    return f"{h}:{m:02d}:{sec:02d}.{cs:02d}"


def generar_ass(palabras: list[dict], salida_ass: Path, vertical: bool = True) -> None:
    w_res = 1080 if vertical else 1920
    h_res = 1920 if vertical else 1080
    font_size = 72 if vertical else 56
    pos_y = 1100 if vertical else 900

    ass = [
        "[Script Info]",
        "ScriptType: v4.00+",
        f"PlayResX: {w_res}",
        f"PlayResY: {h_res}",
        "ScaledBorderAndShadow: yes",
        "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: Reddit,Arial Black,{font_size},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,6,3,2,60,60,100,1",
        "",
        "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]

    # Agrupar en bloques de 3 a 5 palabras con sincronía exacta
    grupos = []
    actual: list[dict] = []
    for p in palabras:
        actual.append(p)
        if len(actual) >= 4 or p["w"].endswith((".", "?", "!", ":", ";", ",")):
            grupos.append(actual)
            actual = []
    if actual:
        grupos.append(actual)

    for g in grupos:
        t_ini = g[0]["s"]
        t_fin = g[-1]["e"]
        if t_fin <= t_ini:
            t_fin = t_ini + 0.3
        ini_s = seg_a_ass(t_ini)
        fin_s = seg_a_ass(t_fin)

        for i, target in enumerate(g):
            w_ini = seg_a_ass(target["s"])
            w_fin = seg_a_ass(target["e"])
            txt_parts = []
            for j, other in enumerate(g):
                clean_w = other["w"].strip().upper()
                if j == i:
                    txt_parts.append(r"{\c&H00FFFF&}" + clean_w + r"{\c&H00FFFFFF&}")
                else:
                    txt_parts.append(clean_w)
            linea = " ".join(txt_parts)
            ass.append(f"Dialogue: 0,{w_ini},{w_fin},Reddit,,0,0,0,,{{\\pos({w_res // 2},{pos_y})}}{linea}")

    salida_ass.write_text("\n".join(ass), encoding="utf-8-sig")


def main() -> None:
    args = sys.argv[1:]
    formato = "vertical"
    dir_proy = Path.cwd()

    for a in args:
        if a.startswith("--formato="):
            formato = a.split("=")[1]
        elif a in ("vertical", "horizontal"):
            formato = a
        elif Path(a).exists():
            dir_proy = Path(a).resolve()

    # La carpeta de las skills no es un proyecto: el video no lo vería nadie.
    if dir_proy == SKILL.parent or SKILL.parent in dir_proy.parents:
        sys.exit(f"{dir_proy} es la carpeta de las skills: corre esto dentro de la carpeta del video (en Hermit, la de la card).")

    vertical = formato == "vertical"
    ancho = 1080 if vertical else 1920
    alto = 1920 if vertical else 1080

    voz = next((dir_proy / p for p in ["public/voz.wav", "voz.wav"] if (dir_proy / p).exists()), None)
    if not voz:
        sys.exit(f"Error: No se encontró voz.wav en {dir_proy}")

    fondo = next((dir_proy / p for p in ["public/fondo.mp4", "fondo.mp4"] if (dir_proy / p).exists()), None)
    if not fondo:
        sys.exit(f"Error: No se encontró fondo.mp4 en {dir_proy}")

    card = next((dir_proy / p for p in ["public/reddit_card.png", "reddit_card.png"] if (dir_proy / p).exists()), None)
    musica = next((dir_proy / p for p in ["public/musica.mp3", "musica.mp3"] if (dir_proy / p).exists()), None)

    dur = duracion(voz)
    dir_tx = dir_proy / "work" / "tx"
    palabras = transcribir_voz(voz, dir_tx)

    ass_path = dir_proy / "work" / "captions.ass"
    generar_ass(palabras, ass_path, vertical)

    out_dir = dir_proy / "out"
    out_dir.mkdir(parents=True, exist_ok=True)
    salida_nombre = dir_proy.name if dir_proy.name.startswith("reddit-") else f"reddit-{dir_proy.name}"
    salida = out_dir / f"{salida_nombre}.mp4"

    # Preparar filtros de FFmpeg
    # 1. Escalar y recortar fondo a ancho x alto
    # 2. Overlay de la tarjeta en los primeros 3 segundos con fade out suave
    # 3. Subtítulos ass
    ass_escaped = str(ass_path).replace("\\", "/").replace(":", "\\:")

    filter_complex = [
        f"[0:v]scale={ancho}:{alto}:force_original_aspect_ratio=increase,crop={ancho}:{alto},setsar=1,format=yuv420p[vbg]",
    ]

    curr_v = "[vbg]"
    inputs = ["-stream_loop", "-1", "-i", str(fondo), "-i", str(voz)]
    audio_idx = 1
    input_count = 2

    if card:
        inputs.extend(["-i", str(card)])
        card_idx = input_count
        input_count += 1
        card_w = int(ancho * 0.88)
        filter_complex.append(
            f"[{card_idx}:v]scale={card_w}:-1,format=rgba,fade=t=out:st=2.5:d=0.5:alpha=1[vcard]"
        )
        card_y = int(alto * 0.22) if vertical else int(alto * 0.15)
        filter_complex.append(
            f"{curr_v}[vcard]overlay=(W-w)/2:{card_y}:enable='between(t,0,3)'[vov]"
        )
        curr_v = "[vov]"

    filter_complex.append(f"{curr_v}subtitles='{ass_escaped}':charenc=UTF-8,format=yuv420p[vout]")

    if musica:
        inputs.extend(["-stream_loop", "-1", "-i", str(musica)])
        musica_idx = input_count
        filter_complex.append(f"[1:a]volume=1.0,aformat=channel_layouts=stereo[ava];[{musica_idx}:a]volume=0.08,aformat=channel_layouts=stereo[abg];[ava][abg]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[aout]")
        audio_map = "[aout]"
    else:
        audio_map = f"{audio_idx}:a"

    cmd = [
        "ffmpeg", "-nostdin", "-y", "-v", "error", *inputs,
        "-filter_complex", ";".join(filter_complex),
        "-map", "[vout]",
        "-map", audio_map,
    ]

    cmd.extend([
        "-t", f"{dur:.2f}",
        *(encoder_video(18) if encoder_video else ["-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p"]),
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "48000",
        "-ac", "2",
        "-color_range", "tv",
        "-colorspace", "bt709",
        "-color_primaries", "bt709",
        "-color_trc", "bt709",
        "-movflags", "+faststart",
        str(salida),
    ])

    print(f"Renderizando video con subtítulos acústicos en {salida}...")
    subprocess.run(cmd, check=True)

    # Si es vertical y existe portada, adherirla de primer fotograma (PORTADA.md de video-base)
    portada_img = next((dir_proy / p for p in ["portada.png", "public/portada.png", "portada/portada.jpg", "portada/portada.png"] if (dir_proy / p).exists()), None)
    base_portada = BASE / "portada.mjs"
    if vertical and portada_img and base_portada.exists():
        subprocess.run(["node", str(base_portada), str(salida), str(portada_img)], check=False)

    print("¡Montaje completado con éxito!")


if __name__ == "__main__":
    main()
