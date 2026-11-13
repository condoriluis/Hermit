---
name: video-crimen
description: Hace un video de misterio, true crime o caso real sin resolver, vertical (TikTok, Reels, Shorts) u horizontal (YouTube). Formato de alta fidelidad de audiencia con fotos de expedientes, mapas interactivos, recortes de periódicos de la época, efectos de audio de ambiente tenso, narración misteriosa y preguntas abiertas al público. Úsala cuando pidan un caso real, un misterio o un video de true crime.
---

# Misterio y Crimen

`<skill>` es esta carpeta y `<base>` es `video-base`, junto a ella. Lee su [`LEEME.md`](../video-base/LEEME.md) (los
errores ya vistos), [`FORMATO.md`](../video-base/FORMATO.md), [`VOZ.md`](../video-base/VOZ.md) y [`PORTADA.md`](../video-base/PORTADA.md) antes de empezar.

## La esencia

Uno de los géneros con mayor tiempo promedio de reproducción y comunidad recurrente en YouTube y TikTok.

- **Atmósfera inmersiva y fría:** Iluminación en clave baja, tonos fríos o sepia vintage, efecto de grano sutil de película y viñetas oscuras en los bordes.
- **Evidencia tangible:** Mapas satelitales con pines que señalan el lugar de los hechos, recortes de noticias reales de la prensa, fotografías de archivo con fechas precisas sobrepuestas.
- **Narrativa de tensión:** Comienza con la última vez que se supo algo ("A las 11:42 PM de un martes de lluvia..."), sigue la cronología y expone las teorías principales.
- **Diseño sonoro inquietante:** Drones graves de fondo, sonido de proyector o máquinas de escribir al mostrar fechas, y silencios repentinos en giros desconcertantes.

## Lo que el usuario pidió y no se negocia

- **Respeto y rigor:** Cero morbo gratuito; los hechos, nombres y fechas deben corresponder a registros periodísticos o judiciales reales, anotados en `fuentes/caso.md`.
- **Efecto cliffhanger:** Termina planteando las preguntas o teorías que siguen abiertas, invitando al debate en los comentarios.
- El proyecto va en `<nombre>` (la ruta completa de la línea `Carpeta:` del mensaje: úsala tal cual, no depende de dónde estés). Sin ella, `crimen-<tema>`.

## Formato

El mensaje trae `Formato: vertical` o `Formato: horizontal`; sin la línea, vertical. Lo común a todos los estilos está en [`FORMATO.md`](../video-base/FORMATO.md).

- **`Formato: vertical`** (1080×1920): los mapas y documentos se adaptan en vertical con zoom en los párrafos clave; subtítulos en amarillo o blanco con sombra marcada. Portada de primer fotograma.
- **`Formato: horizontal`** (1920×1080, para YouTube): tablero de investigación panorámico, líneas de tiempo y documentos a doble página. La portada no va dentro del video: `portada.png` es la miniatura de YouTube (1280×720) según [`PORTADA.md`](../video-base/PORTADA.md).

## Pasos

1. **Investigación.** Se compila la cronología del caso en `fuentes/caso.md` con nombres, fechas y ubicaciones comprobadas.
2. **Guion.** En `guion.md`: gancho con la hora/fecha del incidente, desglose de los hechos y cierre con las interrogantes.
3. **Voz.** La voz se genera de forma autónoma: con `generar_voz` si el mensaje indica una voz de AI Studio, o automáticamente con TTS en `public/voz.wav` sin detener el turno. Se masteriza con `node <base>/scripts/masterizar.mjs` a −14 LUFS.
4. **Material.** Documentos, recortes y fotos de archivo en `fuentes/evidencia/`.
5. **Revisión.** Se extrae la hoja de contactos con `node <base>/scripts/hoja.mjs` en `revision/hoja.png`.
6. **Subtítulos.** Se queman con `python <base>/scripts/subtitulos.py <video> out/crimen-<nombre>.mp4 --voz public/voz.wav --estilo crimen --formato <vertical|horizontal>`: blanco con contorno marcado y la palabra que se dice en ámbar, como las fechas y sellos de un expediente. Si el vídeo abre con una tarjeta o un plano sin voz, `--offset <segundos>`.
7. **Final y Portada.** Render final en `out/crimen-<nombre>.mp4`, comprobado con `comprobar.mjs`. En vertical se adhiere la portada de primer fotograma; en horizontal se entrega la miniatura de YouTube en `portada.png`.

