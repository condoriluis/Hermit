---
name: video-top
description: Hace un video de top o ranking (Top 3, 5 o 10 curiosidades, lugares, misterios o datos asombrosos), vertical (TikTok, Reels, Shorts) u horizontal (YouTube). Formato faceless de alto RPM con cuenta regresiva, tarjetas numeradas, clips e imágenes reales de archivo para cada puesto, efectos de sonido de cambio de puesto y narración ágil. Úsala cuando pidan un top, un ranking, curiosidades o datos que no sabías.
---

# Top curiosidades

`<skill>` es esta carpeta y `<base>` es `video-base`, junto a ella. Lee su [`LEEME.md`](../video-base/LEEME.md) (los
errores ya vistos), [`FORMATO.md`](../video-base/FORMATO.md), [`VOZ.md`](../video-base/VOZ.md) y [`PORTADA.md`](../video-base/PORTADA.md) antes de empezar.

## La esencia

El rey de la retención y monetización por su estructura intrínseca de recompensa (el espectador quiere llegar al número 1).

- **Estructura de cuenta regresiva:** Cada elemento tiene su tarjeta numerada clara ("Número 5", "Número 4"...), con sonido de golpe seco y un titular intrigante.
- **Ritmo constante:** Cada puesto dura entre 10 y 18 segundos en formato vertical (total ~60 s), o entre 45 y 90 segundos en formato horizontal largo.
- **Material visual dinámico:** Por cada puesto se muestran de 2 a 4 fotos o clips de video reales con paneos y zoom lentos, nunca imágenes estáticas aburridas.

## Lo que el usuario pidió y no se negocia

- **Datos comprobables:** Los datos deben ser ciertos, de fuentes confiables (anotadas en `fuentes/investigacion.md`).
- **El número 1 debe ser el más impactante:** La lista se ordena de menor a mayor sorpresa para evitar abandono prematuro.
- El proyecto va en `trabajo/video-top/<nombre>` (la línea `Carpeta: <nombre>` del mensaje). Sin ella, `top-<tema>`.

## Formato

El mensaje trae `Formato: vertical` o `Formato: horizontal`; sin la línea, vertical. Lo común a todos los estilos está en [`FORMATO.md`](../video-base/FORMATO.md).

- **`Formato: vertical`** (1080×1920): las tarjetas de número van en el tercio superior o central superior, con subtítulos en la franja baja cuidando no tapar la interfaz de TikTok y Reels. Lleva la portada de primer fotograma.
- **`Formato: horizontal`** (1920×1080, para YouTube): pantalla completa 16:9 con espacio para gráficos laterales o números de diseño limpio. La portada no va dentro del video: `portada.png` es la miniatura de YouTube (1280×720) según [`PORTADA.md`](../video-base/PORTADA.md).

## Pasos

1. **Investigación.** Se investigan los puntos del top y se redactan en `fuentes/investigacion.md` con sus fuentes.
2. **Guion.** En `guion.md`: gancho de 3 segundos, desglose de cada puesto en cuenta regresiva y remate pidiendo interacción (ej. "¿Cuál te sorprendió más?").
3. **Voz.** La voz se genera de forma autónoma: con `generar_voz` si el mensaje indica una voz de AI Studio, o automáticamente con TTS en `public/voz.wav` sin detener el turno. Se masteriza a −14 LUFS con `node <base>/scripts/masterizar.mjs`.
4. **Material.** Imágenes y clips de alta definición para cada puesto en `fuentes/material/`.
5. **Revisión.** Se comprueba la hoja de contactos con `node <base>/scripts/hoja.mjs` en `revision/hoja.png`.
6. **Final y Portada.** Render en `out/top-<nombre>.mp4`. Comprobación con `comprobar.mjs`. En vertical se fija la portada de primer fotograma; en horizontal se entrega la miniatura de YouTube en `portada.png`.

