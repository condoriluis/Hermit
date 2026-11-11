---
name: video-motivacional
description: Hace un video motivacional o de desarrollo y disciplina, vertical (TikTok, Reels, Shorts) u horizontal (YouTube). Formato altamente viralizable en lote con clips cinematográficos en cámara lenta (entrenamiento, paisajes desérticos o urbanos oscuros, estatuas clásicas, lluvia), voz grave y pausada, música épica o de piano progresivo, y citas contundentes con subtítulos minimalistas. Úsala cuando pidan un video motivacional, de estoicismo o mentalidad.
---

# Motivacional

`<skill>` es esta carpeta y `<base>` es `video-base`, junto a ella. Lee su [`LEEME.md`](../video-base/LEEME.md) (los
errores ya vistos), [`FORMATO.md`](../video-base/FORMATO.md), [`VOZ.md`](../video-base/VOZ.md) y [`PORTADA.md`](../video-base/PORTADA.md) antes de empezar.

## La esencia

Un formato centrado en la emoción pura, la pausa dramática y la estética cinematográfica sobria.

- **Cadencia reflexiva:** La voz no habla rápido; hace pausas de 0,5 a 1 s entre reflexiones para permitir que la música y la imagen calen.
- **Visual cinematográfico sombrío:** Imágenes en blanco y negro o desaturadas con alto contraste (estatuas de mármol, figuras solitarias en la niebla, entrenamiento silencioso).
- **Música que construye:** Una pista de piano o ambiente orquestal que empieza sutil y alcanza un clímax en la última frase.
- **Tipografía sobria:** Subtítulos limpios, sin colores estridentes; blanco puro sobre fondo oscuro, con palabras clave en mayúsculas sutiles.

## Lo que el usuario pidió y no se negocia

- **Cero clichés vacíos:** El mensaje debe transmitir peso emocional y psicológico real, inspirado en estoicismo, disciplina o superación genuina.
- **Audio cinematográfico:** Mezcla impecable donde la voz se sienta profunda y presente por encima de la música.
- El proyecto va en `<nombre>` (la línea `Carpeta:` del mensaje), dentro del directorio donde Hermit te lanzó. Sin ella, `motivacional-<tema>`.

## Formato

El mensaje trae `Formato: vertical` o `Formato: horizontal`; sin la línea, vertical. Lo común a todos los estilos está en [`FORMATO.md`](../video-base/FORMATO.md).

- **`Formato: vertical`** (1080×1920): encuadre centrado o en tercios verticales, subtítulos al tercio inferior con margen de seguridad respecto a los botones laterales de las redes. Portada de primer fotograma.
- **`Formato: horizontal`** (1920×1080, para YouTube): cinematografía 16:9 con espacio para barras sutiles o encuadres anamórficos. La portada no va dentro del video: `portada.png` es la miniatura de YouTube (1280×720) según [`PORTADA.md`](../video-base/PORTADA.md).

## Pasos

1. **Tema.** Se define el ángulo o la enseñanza estoica/motivacional en `fuentes/tema.md`.
2. **Guion.** En `guion.md`: frases de impacto, pausas anotadas y remate contundente.
3. **Voz.** La voz se genera de forma autónoma: con `generar_voz` si el mensaje indica una voz de AI Studio, o automáticamente con TTS en `public/voz.wav` sin detener el turno. Se masteriza con `node <base>/scripts/masterizar.mjs` a −14 LUFS.
4. **Material.** Clips de archivo libres en 4K o HD con tratamiento de color oscuro en `fuentes/material/`.
5. **Revisión.** Hoja de contacto en `revision/hoja.png` con `node <base>/scripts/hoja.mjs` para validar ritmo y contraste de lectura.
6. **Subtítulos.** Se queman con `python <base>/scripts/subtitulos.py <video> out/motivacional-<nombre>.mp4 --voz public/voz.wav --estilo minimal --formato <vertical|horizontal>`: blanco puro palabra a palabra, sin colores estridentes. Si el vídeo abre con una tarjeta o un plano sin voz, `--offset <segundos>` para que entren cuando empiece la narración.
7. **Final y Portada.** El render final queda en `out/motivacional-<nombre>.mp4`, comprobado con `comprobar.mjs`. En vertical se adhiere la portada de primer fotograma con `portada.mjs`; en horizontal se genera `portada.png` para YouTube.

