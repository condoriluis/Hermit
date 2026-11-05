---
name: video-politica
description: Hace un video de análisis político y económico incisivo y riguroso («Política sin filtro»), vertical (TikTok, Reels, Shorts) u horizontal (YouTube). Formato de alto impacto y debate basado en evidencia demostrable: qué decidió el político, cuánto costó, a quién benefició y cómo afectó a los ciudadanos, con documentos oficiales resaltados, cifras duras, subtítulos dinámicos en colores de choque y remate polarizante para comentarios. Úsalo cuando pidan un video de política, análisis de gobernantes, medidas económicas polémicas o noticias políticas sin censura.
---

# Política sin filtro

`<skill>` es esta carpeta y `<base>` es `video-base`, junto a ella. Lee su [`LEEME.md`](../video-base/LEEME.md) (los
errores ya vistos), [`FORMATO.md`](../video-base/FORMATO.md), [`VOZ.md`](../video-base/VOZ.md) y [`PORTADA.md`](../video-base/PORTADA.md) antes de empezar.

## La esencia

Un formato periodístico incisivo, serio y de alta retención donde se expone la gestión de figuras públicas y gobiernos con datos fríos y pruebas contundentes:

- **Crítica dura fundamentada en evidencia:** Se puede señalar con firmeza que una decisión perjudicó al país, siempre que haya respaldo. Es mejor exponer decretos, partidas presupuestarias, contratos y consecuencias cuantificables que atribuir delitos o intenciones sin pruebas judiciales.
- **Estructura de 60 segundos (Retención máxima):**
  - **0–5 s (El Gancho):** Dato demoledor o pregunta incómoda que detiene el scroll (*«¿A dónde fueron a parar los 40 millones del fondo de emergencia?»*).
  - **5–20 s (La Decisión):** Qué hizo el político, en qué fecha y qué prometió al anunciarlo.
  - **20–40 s (El Impacto Real):** Qué consecuencias trajo al país o la población: inflación, desempleo, a qué sector benefició y cómo afectó al bolsillo común.
  - **40–55 s (Las Pruebas):** Recortes de auditorías oficiales, contratos, leyes en gaceta o declaraciones grabadas con efecto de resaltador.
  - **55–60 s (Cierre crítico + Pregunta):** Conclusión frontal y pregunta abierta para detonar el debate en los comentarios (*«Los números están ahí. La pregunta es: ¿negligencia o beneficio propio? Te leo en los comentarios»*).
- **Subtítulos de impacto visual:** Tipografía gruesa y limpia con colores dinámicos de choque: **amarillo fluorescente** para cifras, dinero y fechas; **rojo alarma** para palabras de conflicto y tensión; **blanco puro** con contorno negro profundo de fondo.
- **Material híbrido (Fotos reales + IA):**
  - El usuario puede arrastrar fotos reales del político, capturas de prensa, tweets o páginas de contratos a `fuentes/material/`.
  - Si el usuario no sube archivos propios, Hermit genera las ilustraciones, gráficos conceptuales y portadas con Nano Banana sin detener el turno.

## Lo que no se negocia

- **Rigurosidad en los datos:** Cifras, fechas y nombres deben estar respaldados en `fuentes/caso.md`.
- **Sin marcas de agua ni rótulos artificiales:** Las imágenes (sean fotos reales, capturas o generadas) se muestran siempre limpias, profesionales y a pantalla completa. Queda estrictamente prohibido estampar textos como «Recreación visual», «No es foto de prensa» o sellos ficticios sobre la imagen; la transparencia sobre las fuentes se expresa en el contenido del análisis y en el guion, no ensuciando el material visual.
- **Audio masterizado a −14 LUFS:** Con música incidental de tensión a bajo volumen (−22 dB) para no tapar la voz.
- El proyecto va en `trabajo/video-politica/<nombre>` (la línea `Carpeta: <nombre>` del mensaje). Sin ella, `politica-<tema>`.

## Formato

El mensaje trae `Formato: vertical` o `Formato: horizontal`; sin la línea, vertical. Lo común a todos los estilos está en [`FORMATO.md`](../video-base/FORMATO.md).

- **`Formato: vertical`** (1080×1920): encuadre 9:16 con titulares superiores de alerta, documentos en el tercio central y subtítulos dinámicos palabra por palabra en la franja baja (cuidando no tapar los botones de TikTok/Shorts). Portada de primer fotograma de alto impacto.
- **`Formato: horizontal`** (1920×1080, para YouTube): encuadre 16:9 con documentos a pantalla completa, gráficos de barras o comparativas lado a lado. La portada no va dentro del video: `portada.png` es la miniatura de YouTube (1280×720) según [`PORTADA.md`](../video-base/PORTADA.md).

## Pasos

1. **Investigación y Fuentes.** Se registran los hechos, cifras oficiales y citas en `fuentes/caso.md`.
2. **Guion.** En `guion.md`: estructurado en los 5 bloques exactos (0–5s, 5–20s, 20–40s, 40–55s, 55–60s) con los textos de los titulares y llamadas de atención.
3. **Voz.** Voz firme y autoritaria generada con Google AI Studio (Gemini TTS) en `public/voz.wav` (o la voz grabada por el usuario si lo prefiere), masterizada con `masterizar.mjs`.
4. **Material y Evidencia.** Se compilan en `fuentes/material/` las imágenes propias del usuario (capturas, documentos) o se generan recreaciones y portadas con Nano Banana.
5. **Revisión.** Se genera la hoja de contactos en `revision/hoja.png` con `hoja.mjs` para validar la cadencia de imágenes contra la voz.
6. **Montaje y Subtítulos.** Se corre `python <skill>/scripts/montar.py <nombre> [--formato vertical|horizontal]`: alinea la transcripción Whisper palabra por palabra, genera los subtítulos dinámicos `.ass` en UTF-8 (con colores de choque en amarillo y rojo), mezcla la música de fondo y exporta `out/politica-<nombre>.mp4`.
7. **Portada.** Generada según [`PORTADA.md`](../video-base/PORTADA.md) con el rostro del político y titular de impacto; en vertical va de primer fotograma con `portada.mjs`.

