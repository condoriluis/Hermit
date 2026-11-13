---
name: minidrama
description: Hace un minidrama o k-drama episódico (series dramáticas de 1 minuto estilo dorama coreano o novela vertical de alta retención: romances de oficina, CEOs encubiertos, venganzas familiares, matrimonios por contrato), vertical (TikTok, Reels, Shorts) u horizontal (YouTube). Generado en Google Flow con Veo 3.1: los personajes hablan directamente entre ellos con sincronización labial nativa, miradas de tensión dramática y cliffhanger al final para continuar en el siguiente capítulo. Úsalo cuando pidan un minidrama, dorama, serie por episodios, drama coreano o novela vertical.
---

# Minidrama

`<skill>` es esta carpeta y `<base>` es `video-base`, junto a ella. Lee su [`LEEME.md`](../video-base/LEEME.md) (los
errores ya vistos), [`FORMATO.md`](../video-base/FORMATO.md), [`FLOW.md`](../video-base/FLOW.md) y [`PORTADA.md`](../video-base/PORTADA.md) antes de empezar.

## La esencia

Un formato episódico de ficción dramática inspirado en los k-dramas coreanos y las series cortas de alta retención (ReelShort, DramaBox):

- **Personajes y elenco consistentes:** Cada personaje (el CEO frío, la protagonista decidida, la antagonista elegante, el amigo leal) tiene su hoja de personaje fija en `personajes/<nombre>.jpg`. Conservan la misma ropa, peinado y rostro en todos los clips y episodios para dar continuidad perfecta de serie.
- **Diálogos hablados con sincronización labial nativa:** No hay voz en off ni narrador externo. Cada clip de 8 s es un diálogo directo cara a cara generado por Veo 3.1 en Google Flow, con movimiento de boca sincronizado en español y entonación dramática de doblaje.
- **Fórmula de alta retención (60 a 90 segundos):**
  - **Segundos 0–3 (Gancho en frío):** Entra directo al conflicto o revelación (un contrato roto, una bofetada, una mirada de desprecio, la frase: *"Sé tu secreto"*).
  - **Segundos 4–45 (Confrontación y Tensión):** Cruce de palabras, planos y contraplanos con miradas intensas y silencios dramáticos.
  - **Segundos 46–55 (Giro de tuerca):** Un documento revelador, la llegada inesperada de alguien o un cambio radical de poder.
  - **Segundos 56–60 (Cliffhanger / Remate):** Primer plano de tensión máxima, golpe musical dramático y gancho directo: *"¿Aceptará el trato? Deja tu like para la PARTE 2"*.

## Lo que no se negocia

- **Gasta créditos de Flow del usuario:** Antes de pedir los clips de Veo, infórmale cuántos clips son y qué modelo se usará (Veo 3.1 - Lite, 10 créditos por clip de 8 s). Las imágenes previas (personajes, lugares y cuadros) se hacen con Nano Banana y son **gratis**, no gastan créditos. Hermit pide la autorización antes del primer clip: si la herramienta dice que espera permiso, pídeselo y espera con `estado_flow`.
- **Sin narrador ni texto en el render crudo:** Veo genera la voz de los personajes limpia. Los subtítulos dinámicos de alto impacto los coloca después `unir.py`.
- El proyecto va en `<nombre>` (la ruta completa de la línea `Carpeta:` del mensaje: úsala tal cual, no depende de dónde estés). Sin ella, `minidrama-<tema>`.

## Formato

El mensaje trae `Formato: vertical` o `Formato: horizontal`; sin la línea, vertical. Lo común a todos los estilos está en [`FORMATO.md`](../video-base/FORMATO.md).

- **`Formato: vertical`** (1080×1920): encuadre 9:16 cinematográfico para TikTok, Reels y Shorts con los personajes en plano medio o primer plano, dejando margen inferior para los subtítulos dinámicos. Portada de primer fotograma tipo póster de drama.
- **`Formato: horizontal`** (1920×1080, para YouTube): encuadre 16:9 panorámico donde se aprecian los escenarios elegantes (oficinas corporativas, áticos modernos, restaurantes de lujo). La portada no va dentro del video: `portada.png` es la miniatura de YouTube (1280×720) según [`PORTADA.md`](../video-base/PORTADA.md).

## El elenco

Los personajes viven en `personajes/` para reutilizarse en los siguientes episodios:
- `personajes/<nombre>.jpg`: retrato cinematográfico del personaje con vestimenta definida, generado con Nano Banana (`generar_imagen`).
- `personajes/ELENCO.md`: nombre, rol (CEO, heredera, rival), estilo visual, personalidad y su voz (la ficha literal en inglés de [`FLOW.md`](../video-base/FLOW.md), «La voz de cada personaje») para mantener la coherencia.

## Voces: las de Veo o TTS por personaje

Cada clip suena con el audio que Veo le da, y puede cambiar de voz de una escena a otra. Si el usuario quiere que cada
personaje tenga **su voz fija** (lo pide como «voces iguales», «voz por personaje» o «con TTS»), o cuando Veo falla
varias veces seguidas con el audio de una escena, esa escena puede llevar voz TTS:

- `voces/personajes.json`, en la carpeta del proyecto: `{ "<personaje>": "<voz>" }` con la voz de AI Studio, Fish
  Audio o ElevenLabs de cada uno (se elige y se prueba con `/api/voz/probar`, como la narración). Se escribe una vez
  y vale para este video y sus partes siguientes.
- `voces/esc-<NN>.json`, una por escena: `[{ "quien": "<personaje>", "texto": "<su línea>" }, ...]` en el orden en
  que se dicen. Solo las escenas con este archivo suenan con TTS; las demás siguen con el audio de Veo.

El clip se pide igual que siempre, con su diálogo en el prompt (las bocas se mueven); `unir.py` le cambia la pista de
audio por las líneas TTS y los subtítulos salen del guion, con los tiempos reales de cada línea. La sincronía labial
no es exacta: en planos medios no se nota; en un primerísimo plano de cara hablando, mejor dejar esa escena con el
audio de Veo. Si una línea no convence, se regenera su WAV y se vuelve a unir: no gasta créditos de Flow.

## Pasos

1. **Elenco y Biblia de la Serie.** Define a los protagonistas en `personajes/ELENCO.md` y genera sus retratos en `personajes/<nombre>.jpg` usando `generar_imagen` en estilo cinematográfico realista de K-drama. *Si es la continuación de un capítulo anterior, reutiliza los mismos personajes.*
2. **Guion del Capítulo.** En `guion.md`: tabla con escena, plano de cámara, personajes a cuadro, emoción/acción y el diálogo exacto en español entre comillas — frases cortas y sin puntos suspensivos: el audio de Veo falla con pausas largas.
3. **Cuadros.** Primer fotograma de cada escena (`cuadros/esc-<NN>.jpg`) combinando los personajes y el escenario con `generar_imagen`, pasando las referencias de los personajes.
4. **Clips.** Generación en Google Flow con `generar_video` (Veo 3.1 - Lite), pasando el cuadro inicial (`primerCuadro`) y el prompt con la acción y el diálogo entre comillas en español; delante de cada línea, la ficha de voz de ese personaje copiada igual que en `ELENCO.md` (ver [`FLOW.md`](../video-base/FLOW.md), «La voz de cada personaje»). Las líneas que dice el clip quedan también en `dialogos/esc-<NN>.txt`, tal cual y sin más texto, para que `unir.py` compare lo que se oyó con el guion. Si Flow rechaza un clip por su contenido (derechos, política de Google), no es la cuenta: cámbialo de verdad y pídelo otra vez (con `escena` = su número); si cae otra, la versión 100 % original (sin personajes, marcas ni personas con derechos); si cae la tercera, déjalo fuera y sigue: el video sale con los demás.
5. **Montaje.** Corre `python <skill>/scripts/unir.py <nombre> --formato <formato>`: corta silencios muertos con Whisper, compara lo que se oyó con `dialogos/esc-NN.txt` y **no deja pasar** una escena que dijo otra cosa (la lista está en `revision/sospechosas.txt`; se regenera ese clip y se vuelve a unir, o `--forzar` si está bien de verdad), une las tomas a 30 fps, masteriza el audio a -14 LUFS, genera subtítulos dinámicos palabra por palabra y exporta `out/minidrama-<nombre>.mp4`.
6. **Portada.** Generada según [`PORTADA.md`](../video-base/PORTADA.md) con el momento de mayor tensión o mirada dramática entre los protagonistas y título de impacto. En vertical va de primer fotograma con `portada.mjs`.

## Siguiente capítulo (Parte 2, 3...)

Para hacer el siguiente episodio en el mismo proyecto:
1. No regeneres los personajes: conserva `personajes/`.
2. Escribe el nuevo guion continuando directamente el cliffhanger previo.
3. Genera los nuevos clips y une con `unir.py <nombre>-cap2`.

