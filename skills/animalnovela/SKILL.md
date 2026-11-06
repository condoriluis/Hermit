---
name: animalnovela
description: Hace una animalnovela (telenovela cómica donde conviven personas y animales 3D estilo Pixar como gatos aristócratas, leones consentidos o gallinas chismosas), vertical (TikTok, Reels, Shorts) u horizontal (YouTube). Generada en Google Flow con Veo 3.1: los personajes hablan directamente entre ellos con sincronización labial nativa y drama familiar absurdo en cada escena, sin narrador externo. Úsala cuando pidan una telenovela de animales, comedia de mascotas que hablan o un sketch con animales y personas.
---

# Animalnovela

`<skill>` es esta carpeta y `<base>` es `video-base`, junto a ella. Lee su [`LEEME.md`](../video-base/LEEME.md) (los
errores ya vistos), [`FORMATO.md`](../video-base/FORMATO.md), [`FLOW.md`](../video-base/FLOW.md) y [`PORTADA.md`](../video-base/PORTADA.md) antes de empezar.

## La esencia

Un formato cómico de ficción donde conviven humanos y animales antropomórficos 3D estilo Pixar con personalidades muy marcadas.

- **Personajes que se reconocen:** Cada personaje (el gato elegante, la gallina dramática, el león gigante, el humano estresado) tiene su hoja de personaje fija en `personajes/<nombre>.jpg`. Conservan la misma ropa y aspecto en todos los clips para dar continuidad perfecta de serie.
- **Hablan ellos mismos con sincronización labial:** No hay voz en off ni narrador. Cada clip de 8 s es un diálogo directo generado por Veo 3.1 en Google Flow, con movimiento de boca a tiempo y acentos acordes a su papel.
- **Drama y conflicto absurdo:** Discusiones cotidianas llevadas al extremo (la comida robada, el alquiler sin pagar, las plumas en el sofá, celos y romances secretos).
- **Gancho y cliffhanger:** El primer segundo entra directo al grito o reclamo del conflicto. El último clip deja la intriga abierta ("Parte 2").

## Lo que no se negocia

- **Gasta créditos de Flow del usuario:** Antes de pedir los clips de Veo, infórmale cuántos clips son y qué modelo se usará (Veo 3.1 - Lite). Las imágenes previas (personajes, lugares y cuadros) no gastan créditos. Hermit pide la autorización antes del primer clip: si la herramienta dice que espera permiso, pídeselo y espera con `estado_flow`.
- **Sin narrador ni texto en el render crudo:** Veo genera la voz de los personajes limpia. Los subtítulos dinámicos los incorpora después `unir.py`.
- El proyecto va en la carpeta de la línea `Carpeta: <nombre>` del mensaje, con ese nombre exacto (el estudio de Hermit
  la busca ahí). Sin la línea, `animalnovela-<tema>`.

## Formato

El mensaje trae `Formato: vertical` o `Formato: horizontal`; sin la línea, vertical. Lo común a todos los estilos está en [`FORMATO.md`](../video-base/FORMATO.md).

- **`Formato: vertical`** (1080×1920): encuadre 9:16 con los personajes de cuerpo entero o medio cuerpo, dejando margen inferior para los subtítulos y la interfaz de TikTok y Reels. Portada de primer fotograma.
- **`Formato: horizontal`** (1920×1080, para YouTube): encuadre 16:9 panorámico donde caben varios personajes frente a frente en la sala o cocina. La portada no va dentro del video: `portada.png` es la miniatura de YouTube (1280×720) según [`PORTADA.md`](../video-base/PORTADA.md).

## El elenco

Los personajes viven en `personajes/` para reutilizarse en los siguientes episodios:
- `personajes/<nombre>.jpg`: imagen 3D generada del personaje con fondo neutro.
- `personajes/ELENCO.md`: nombre, especie, vestimenta, tono de voz y rasgos de personalidad.

## Pasos

1. **Historia.** Conflicto cotidiano entre el humano y los animales con un giro y remate para continuar en la parte 2.
2. **Guion.** En `guion.md` de la carpeta del proyecto: el título, la parte, el elenco de este capítulo y una tabla con
   una fila por escena. Cada fila lleva el número, el lugar, quién sale, el plano, lo que hacen y lo que dicen, entre
   comillas y con quién lo dice. Que sean de 8 a 12 escenas (de 64 a 96 s). En cada escena caben unas 20 palabras, de uno
   o dos personajes. Listo cuando el primer clip ya es el conflicto, cada escena empuja la historia y el último deja la
   pregunta.
3. **Personajes y Lugares.** Generación en Google Flow con `generar_imagen` en estilo 3D animado tipo Pixar.
4. **Cuadros.** Primer fotograma de cada escena combinando las referencias de los personajes y el lugar en `cuadros/esc-<NN>.jpg`.
5. **Clips.** Generación en Veo con `generar_video`, pasando el cuadro inicial y el prompt con los diálogos en español entre comillas.
6. **Montaje.** `python <skill>/scripts/unir.py <nombre> --formato <formato>` corta el silencio residual con Whisper, une las tomas, masteriza el audio a −14 LUFS y coloca los subtítulos.
7. **Portada.** Generada según [`PORTADA.md`](../video-base/PORTADA.md) con el personaje en su momento más expresivo y título de alto impacto. En vertical va de primer fotograma con `portada.mjs`.

