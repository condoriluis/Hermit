---
name: devnovela
description: Hace una devnovela, vertical (TikTok, Reels, Shorts) u horizontal (YouTube). Es una telenovela cómica de un minuto o dos con lenguajes y herramientas de programación convertidos en personajes 3D originales estilo Pixar, con cabeza de objeto o símbolo y cuerpo humano, que hablan con sus propias voces y viven dramas de oficina, deploys, código legacy y merges imposibles. Los mismos personajes en todos los clips, un conflicto en el primer segundo y un final que pide la siguiente parte. Úsala cuando pidan una devnovela, una novela de programación, una historia con lenguajes de programación como personajes, otro capítulo o la parte 2 de una que ya se hizo.
---

# Devnovela

`<skill>` es esta carpeta y `<base>` es `video-base`, junto a ella. Lee su [`LEEME.md`](../video-base/LEEME.md) (los
errores ya vistos), [`FORMATO.md`](../video-base/FORMATO.md), [`FLOW.md`](../video-base/FLOW.md) y
[`PORTADA.md`](../video-base/PORTADA.md) antes de empezar.

## La esencia

- **Personajes que se reconocen.** Cada uno es un lenguaje o una herramienta de programación convertido en un personaje
  3D original: su **cabeza es un objeto o símbolo** que lo representa —un corchete, un servidor, una taza, un pergamino,
  una gema, un contenedor—, con ojos, boca, cejas y cara expresiva, sobre un cuerpo humano con su ropa de siempre. Nunca
  es un animal genérico. Salen idénticos en todos los clips, porque cada clip parte de un cuadro armado con sus hojas de
  personaje. Si un personaje cambia de cara, de cabeza, de cuerpo o de ropa entre clips, el video se cae.
- **Drama de telenovela, dicho serio.** Deploy del viernes, herencia del código legacy, merge conflict, bug en
  producción, auditoría, despido, traición entre frontend y backend. Los personajes lo viven en serio. La gracia es que
  son lenguajes de programación y que su objeto pesa en la historia: el corchete que encierra todo, el servidor que
  aguanta, la taza que habla en párrafos, el pergamino que carga con lo viejo, la gema que presume, el contenedor que se
  lo lleva a otra parte.
- **Hablan ellos, sin narrador.** Cada clip son 8 s de uno o dos personajes diciéndose algo. Veo genera las voces con la
  boca a tiempo, y las voces son las que dice el guion para cada personaje.
- **Cámara casi quieta.** Plano medio o entero, dos o tres personajes, un lugar por escena. Lo que se mueve es la cara y
  las manos. Es lo que Veo hace bien.
- **Gancho y cliffhanger.** El primer segundo ya es el conflicto, sin presentación. El último clip deja la pregunta
  abierta, y el video acaba ahí, en «Parte N».

## Lo que no se negocia

- **Gasta créditos del usuario.** Antes de pedir los clips, dile cuántos son, el modelo y el total. Ejemplo: 10 clips en
  Lite, 100 créditos. Las imágenes (hojas, lugares, cuadros) no gastan. Hermit pide la autorización antes del primer
  clip: si la herramienta dice que espera permiso, pídeselo y espera con `estado_flow`.
- **Cabeza de objeto o símbolo, no animal ni logo.** Los personajes son diseños originales: la cabeza es un objeto o
  símbolo que representa al lenguaje o la herramienta, con cara, y el cuerpo es humano. No uses logos, mascotas
  oficiales, capturas de pantalla, colores registrados ni tipografías de la marca, ni animales genéricos. Puedes nombrar
  «Python», «PHP» o «Java» en los diálogos, pero no reproducir sus marcas. Tampoco personas reales ni historias copiadas
  de otro canal: se miden, no se copian.
- **Sin texto en lo generado.** Ni letreros, ni logos, ni subtítulos, ni marcas de agua en los cuadros o los clips. Los
  subtítulos los pone `unir.py`.
- El proyecto va en la carpeta de la línea `Carpeta: <nombre>` del mensaje, con ese nombre exacto (el estudio de Hermit
  la busca ahí). Sin la línea, `devnovela-<tema>`.

## Formato

El mensaje trae `Formato: vertical` o `Formato: horizontal`; sin la línea, vertical. Lo común a todos los estilos está
en [`FORMATO.md`](../video-base/FORMATO.md).

- **`Formato: vertical`** (1080×1920): cuadros y clips en `9:16`. Los personajes se ven de cuerpo entero o de la rodilla
  para arriba, uno al lado del otro y al centro. Abajo queda aire para los subtítulos y la interfaz de TikTok. Lleva la
  portada de primer fotograma (paso 8).
- **`Formato: horizontal`** (1920×1080): cuadros y clips en `16:9`. Los personajes van a los tercios, frente a frente,
  con el lugar a lo ancho. Así entran tres personajes sin achicarse. `unir.py … --formato horizontal`. La portada no va
  dentro del video: `portada.png` es la miniatura de YouTube (en [`PORTADA.md`](../video-base/PORTADA.md), «En horizontal»).

Todo cuadro va en el formato del video: un cuadro vertical animado en horizontal sale recortado.

## El elenco

Los personajes viven en `personajes/`, en la carpeta donde arrancas (la de todas las devnovelas). Así se usan otra vez
en la parte 2 sin rehacerlos. Cada uno lleva su hoja `personajes/<nombre>.jpg` y su renglón en
`personajes/ELENCO.md`: nombre, qué lenguaje o herramienta representa, **qué objeto o símbolo lleva por cabeza**, cómo es
su cara, qué ropa lleva, su voz (edad, tono, acento) y en qué capítulos sale. Antes de inventar a uno, mira si ya está.

Un elenco de cuatro a seis funciona mejor que uno de doce. Cada uno necesita una silueta distinta y una personalidad que
se entienda en un solo plano. La cabeza siempre es un objeto o símbolo con cara, nunca un animal. Estos son ejemplos
originales, no obligatorios:

- **Corchete** (Python): cabeza de dos corchetes entrelazados, ojos curiosos y sonrisa lenta; cuerpo humano, ropa verde
  de trabajo. Habla poco y resuelve.
- **Servidor** (PHP): cabeza de torre de servidor con luces y cara de veterano; cuerpo humano, chaqueta gastada. Aguanta
  todo y no suelta el servidor.
- **Taza** (Java): cabeza de taza de café humeante con cejas dramáticas; cuerpo humano, traje corporativo. Nunca dice en
  una frase lo que cabe en tres.
- **Pergamino** (Perl): cabeza de rollo de pergamino con cara de sabio; cuerpo humano, ropa vieja. Carga con el código
  que nadie más quiere tocar.
- **Gema** (Ruby): cabeza de gema facetada con cara presumida; cuerpo humano, ropa elegante. Convence a todos de que su
  idea es la más bonita.
- **Contenedor** (Docker): cabeza de caja de contenedor con ojos tranquilos; cuerpo humano, ropa de mudanza. Mete todo y
  se lo lleva a otra parte.

Si el usuario pide un lenguaje o una herramienta que no está, invéntalo con la misma regla: un objeto o símbolo 3D con
cara, un cuerpo humano, una personalidad clara y una paleta propia. Si no se te ocurre un objeto, inventa un símbolo
abstracto; no pongas un animal ni copies el logo o la mascota oficial.

## Pasos

1. **Historia.** Un tema del usuario, una idea suya o, si no dio nada, una de las tramas de arriba con un giro propio.
   Si es otra parte de una que ya se hizo, lee su `guion.md` y su `ELENCO.md` y sigue desde su cliffhanger. Listo cuando
   puedes contar la historia en tres frases: el conflicto, el giro y la pregunta con que acaba.
2. **Guion.** En `guion.md` de la carpeta del proyecto: el título, la parte, el elenco de este capítulo y una tabla con
   una fila por escena. Cada fila lleva el número, el lugar, quién sale, el plano, lo que hacen y lo que dicen, entre
   comillas y con quién lo dice. Que sean de 8 a 12 escenas (de 64 a 96 s). En cada escena caben unas 20 palabras, de uno
   o dos personajes. El drama tiene que entenderse sin saber programar: el lenguaje es el disfraz, no el chiste. Listo
   cuando el primer clip ya es el conflicto, cada escena empuja la historia y el último deja la pregunta.
3. **Personajes.** Los que falten, con `generar_imagen` en `formato` `9:16`, a `personajes/<nombre>.jpg`. Cada uno de
   cuerpo entero, de frente, de pie, con su ropa, sobre un fondo liso claro y sin texto, logos ni animales. El pedido, en
   inglés: `3D animated character, Pixar style, human body with a <object or symbol> for a head, the head has expressive
   eyes, eyebrows and mouth, <features>, wearing <clothes>, full body, front view, standing, neutral expression, plain
   light background, no text, no logos, no animals`. Míralos. Si uno no salió como dice `ELENCO.md` o salió con cabeza de
   animal, pídelo otra vez diciendo qué corregir. Listo cuando cada personaje del capítulo tiene su hoja y su renglón en
   `ELENCO.md`.
4. **Lugares.** Cada lugar del guion, vacío, con `generar_imagen` en el formato del video, a `lugares/<lugar>.jpg` del
   proyecto: el mismo 3D tipo Pixar, con luz cálida y sin personas, texto ni logos. Listo cuando cada lugar tiene su
   imagen.
5. **Cuadros.** El primer cuadro de cada escena, con `generar_imagen` en el formato del video y en `referencias` las
   hojas de quienes salen más la del lugar (cuatro como mucho), a `cuadros/esc-<NN>.jpg`. El pedido dice dónde está cada
   uno, hacia dónde mira, su gesto al empezar la escena, el plano, y que todo sea igual a las referencias y sin texto,
   logos ni animales. Mira todos en una hoja (`node <base>/scripts/hoja.mjs cuadros revision/cuadros.png`). Si uno cambió
   de cara, de cabeza o de ropa, o salió con texto, logo o cabeza de animal, pídelo otra vez: no gasta. Listo cuando los
   personajes se ven iguales en todos.
6. **Clips.** Mira con `estado_flow` sin `id` cuánto les queda a sus cuentas. Dile al usuario cuántos clips son, cuánto
   gastan y si alcanzan (paso «Lo que no se negocia»), y pídelos todos seguidos, sin esperar uno para pedir el siguiente.
   Se reparten entre sus cuentas, tres a la vez. Usa `generar_video` con `primerCuadro` `cuadros/esc-<NN>.jpg`, el
   formato del video, Veo 3.1 - Lite (salvo que el usuario pida otro) y `salida` `clips/esc-<NN>.mp4`. El prompt, en
   inglés, describe la acción. El diálogo va en español, entre comillas y con quién lo dice y cómo suena su voz (la de
   `ELENCO.md`). Al final, `static camera, no music, no subtitles, no text on screen, no logos, no animals`. Espera los
   pendientes con `estado_flow`. Listo cuando están todos los clips. Si una cuenta se quedó sin créditos, la herramienta ya pasó a
   otra. Si ninguna puede, dile al usuario cuántos faltan y cuándo vuelven sus cuentas, y para ahí.
7. **Montaje.** `python <skill>/scripts/unir.py <nombre> --formato <formato>` se corre desde la carpeta del proyecto.
   Transcribe cada clip y le corta el final muerto: Veo deja de 1 a 2 s en que nadie habla ni se mueve, y se corta a
   0,35 s de su última palabra. Luego une los clips en orden, masteriza el audio y pone los subtítulos
   (`--sin-subtitulos` si el usuario no los quiere). Mira `revision/transcripcion.txt` contra el guion y una hoja del
   video (`node <base>/scripts/hoja.mjs out/devnovela-<nombre>.mp4 revision/hoja.png --cada 2`). Si un clip dice otra
   cosa, habla con la voz de otro, cambia a un personaje o trae texto, repítelo una vez con el prompt corregido.
   Repetirlo gasta otra vez: si sigue mal, déjalo y díselo al usuario. Al final,
   `node <base>/scripts/comprobar.mjs out/devnovela-<nombre>.mp4 --duracion <s> --fps 30 --tamano <1080x1920 o
   1920x1080>`. Listo cuando pasa y cada escena dice lo del guion.
8. **Portada.** Según [`PORTADA.md`](../video-base/PORTADA.md): el personaje del conflicto, grande y con su cara del
   momento más fuerte, y de 2 a 5 palabras del drama («BORRARON MAIN», «EL DEPLOY DEL VIERNES», «LA HERENCIA DEL LEGACY»).
   Van tres cuadros del video de referencia, para que sea el mismo elenco. En vertical va de primer fotograma
   (`portada.mjs`). Entrega la ruta del video, el guion, los créditos gastados y con qué cuentas, y lo que no revisaste:
   el audio no lo oyes, solo lo transcribes.

## Las imágenes

Todo se hace con Flow, que también hace los clips. La línea `Imágenes:` del mensaje elige el modelo de Nano Banana
(sin ella, Nano Banana 2.1). Si dice ChatGPT, usa Flow de todos modos para las hojas, los lugares y los cuadros, y díselo
al usuario: los cuadros tienen que salir del mismo Flow que los anima, con las mismas referencias.
