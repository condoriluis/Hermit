---
name: animalnovela
description: Hace una animalnovela (telenovela cómica donde conviven personas y animales 3D estilo Pixar con cabeza de su especie y cuerpo humano, como gatos aristócratas, leones consentidos o gallinas chismosas), vertical (TikTok, Reels, Shorts) u horizontal (YouTube). Los personajes hablan entre ellos con sincronización labial nativa y viven un drama familiar absurdo en cada escena, sin narrador externo, todo generado en Google Flow con Veo 3.1. Úsala cuando pidan una telenovela de animales, comedia de mascotas que hablan o un sketch con animales y personas.
---

# Animalnovela

`<skill>` es esta carpeta y `<base>` es `video-base`, junto a ella. Lee su [`LEEME.md`](../video-base/LEEME.md) (los
errores ya vistos), [`FORMATO.md`](../video-base/FORMATO.md), [`FLOW.md`](../video-base/FLOW.md) (las herramientas
`generar_imagen` y `generar_video`, lo que gastan y qué hacer si fallan) y [`PORTADA.md`](../video-base/PORTADA.md) antes
de empezar.

## La esencia

Un formato cómico de ficción donde conviven humanos y animales 3D con **cabeza de su especie y cuerpo humano**, estilo
Pixar y con personalidades muy marcadas.

- **Personajes que se reconocen.** Cada animal tiene cabeza de su especie y cuerpo humano: torso, dos brazos, dos manos,
  dos piernas y dos pies, de pie y con su ropa de siempre. La cabeza lleva el morro o el pico, las orejas, los ojos y el
  color de su especie, con cejas y boca integradas. Los humanos del elenco van con su cuerpo y su cara. Salen idénticos
  en todos los clips, porque cada clip parte de un cuadro armado con sus hojas de personaje. Si un personaje cambia de
  cabeza, de cara o de ropa entre clips, el video se cae.
- **Drama de telenovela, dicho serio.** Discusiones cotidianas llevadas al extremo (la comida robada, el alquiler sin
  pagar, las plumas en el sofá, celos y romances secretos). Los personajes lo viven en serio. La gracia es que son
  animales y que su especie pesa en la historia: el gato que se lame, la gallina que cacarea, el león que ruge.
- **Hablan ellos, sin narrador.** Cada clip son 8 s de uno o dos personajes diciéndose algo. Veo genera las voces con la
  boca a tiempo, y las voces son las que dice el guion para cada personaje.
- **Cámara casi quieta.** Plano medio o entero, dos o tres personajes, un lugar por escena. Lo que se mueve es la cara y
  las manos. Es lo que Veo hace bien.
- **Gancho y cliffhanger.** El primer segundo ya es el conflicto, sin presentación. El último clip deja la pregunta
  abierta, y el video acaba ahí, en «Parte N».

## Lo que no se negocia

- **Gasta créditos de Flow del usuario.** Antes de pedir los clips, dile cuántos son, el modelo y el total. Ejemplo: 10
  clips en Veo 3.1 - Lite, 100 créditos. Las imágenes (hojas, lugares, cuadros) no gastan. Hermit pide la autorización
  antes del primer clip: si la herramienta dice que espera permiso, pídeselo y espera con `estado_flow`.
- **Cabeza de animal, cuerpo humano.** La cabeza es la de su especie, dibujada en 3D de película, con su silueta, sus
  orejas, su morro o pico y sus ojos. El cuerpo es humano: torso, dos brazos, dos manos, dos piernas y dos pies, de pie y
  de frente. No es un animal realista, no va a cuatro patas, no lleva cuerpo de animal, y no es un humano con orejas
  pegadas. Si un animal sale así, se vuelve a pedir solo su hoja.
- **Ningún personaje ni historia de otro canal.** Los ejemplos se miden, no se copian: elenco, nombres y tramas son
  nuevos. El personaje con el diseño de una película, de una marca o de una persona real no va.
- **Sin texto en lo generado.** Ni letreros, ni subtítulos, ni marcas de agua en los cuadros o los clips. Los subtítulos
  los pone `unir.py`.
- El proyecto va en la carpeta de la línea `Carpeta: <nombre>` del mensaje, con ese nombre exacto (el estudio de Hermit
  la busca ahí). Sin la línea, `animalnovela-<tema>`.

## Formato

El mensaje trae `Formato: vertical` o `Formato: horizontal`; sin la línea, vertical. Lo común a todos los estilos está en
[`FORMATO.md`](../video-base/FORMATO.md).

- **`Formato: vertical`** (1080×1920): cuadros y clips en `9:16`. Los personajes se ven de cuerpo entero o de la rodilla
  para arriba, uno al lado del otro y al centro. Abajo queda aire para los subtítulos y la interfaz de TikTok y Reels.
  Lleva la portada de primer fotograma (paso 8).
- **`Formato: horizontal`** (1920×1080, para YouTube): cuadros y clips en `16:9`. Los personajes van a los tercios,
  frente a frente, con el lugar a lo ancho. Así entran tres personajes sin achicarse. `unir.py … --formato horizontal`.
  La portada no va dentro del video: `portada.png` es la miniatura de YouTube (en [`PORTADA.md`](../video-base/PORTADA.md),
  «En horizontal»).

Todo cuadro va en el formato del video: un cuadro vertical animado en horizontal sale recortado.

## El elenco

Los personajes viven en `personajes/`, en la carpeta donde arrancas (la de todas las animalnovelas). Así se usan otra vez
en la parte 2 sin rehacerlos. Cada uno lleva su hoja `personajes/<nombre>.jpg` y su renglón en `personajes/ELENCO.md`:
nombre, especie, **cómo es su cabeza** (forma, color, orejas, morro o pico, ojos), su cuerpo y su ropa (los humanos, su
cara), su voz (la ficha literal en inglés de [`FLOW.md`](../video-base/FLOW.md), «La voz de cada personaje») y en qué
capítulos sale. Antes de inventar a uno, mira si ya está y conserva su diseño.

## Pasos

1. **Historia.** Un tema del usuario, una idea suya o, si no dio nada, un conflicto cotidiano entre el humano y los
   animales (la comida robada, el alquiler sin pagar, las plumas en el sofá, un romance secreto) con un giro propio. Si es
   otra parte de una que ya se hizo, lee su `guion.md` y su `ELENCO.md` y sigue desde su cliffhanger. Listo cuando puedes
   contar la historia en tres frases: el conflicto, el giro y la pregunta con que acaba.
2. **Guion.** En `guion.md` de la carpeta del proyecto: el título, la parte, el elenco de este capítulo y una tabla con
   una fila por escena. Cada fila lleva el número, el lugar, quién sale, el plano, lo que hacen y lo que dicen, entre
   comillas y con quién lo dice. Que sean de 8 a 12 escenas (de 64 a 96 s). En cada escena caben unas 20 palabras, de uno
   o dos personajes. Listo cuando el primer clip ya es el conflicto, cada escena empuja la historia y el último deja la
   pregunta.
3. **Personajes.** Los que falten, con `generar_imagen` en `formato` `9:16`, a `personajes/<nombre>.jpg`, uno por imagen.
   Cada animal con cuerpo humano completo (dos brazos, dos manos, dos piernas y dos pies), de pie y de frente, con su
   ropa, sobre fondo claro y liso. La cabeza es la de su especie, de dibujo 3D, con sus ojos, cejas y boca; no un animal
   realista, no a cuatro patas, no un humano. Rellena esta plantilla en inglés con el diseño anotado en `ELENCO.md`:

   ```text
   Create one high-quality stylized 3D animated humanoid character representing <ANIMAL>. The head is the recognizable head of a <ANIMAL, WITH ITS SHAPE, COLOR, EARS, SNOUT OR BEAK AND EYES>, rendered as a dimensional cartoon character head: integrate large expressive cartoon eyes, eyebrows, and a mouth into it without losing its silhouette. Fully human body with two arms, two hands, two legs, and two feet; natural proportions and expressive body language. Wearing <ROPA, SEGÚN EL PERSONAJE>. <PERSONALIDAD>. Full body, standing upright, facing the camera, neutral pose, centered on a clean light gray background. Premium polished 3D animated feature-film style, consistent visual universe for the AnimalNovelas series. No realistic animal, no animal on four legs, no animal-shaped body, no human head or human face, no extra text, no watermark.
   ```

   Si el capítulo lleva un humano, pide su hoja igual: persona 3D de cuerpo entero, de frente, con su ropa y su cara, sin
   nada de animal. Míralas. Si la cabeza no es la de su especie, salió animal realista, a cuatro patas o con cuerpo de
   animal, o cambió la ropa, vuelve a pedir solo esa hoja y nombra el error concreto. Listo cuando cada personaje del
   capítulo tiene su hoja y su renglón en `ELENCO.md`.
4. **Lugares.** Cada lugar del guion, vacío, con `generar_imagen` en el formato del video, a `lugares/<lugar>.jpg` del
   proyecto: el mismo 3D tipo Pixar, con luz cálida y sin personas, texto ni logos. Listo cuando cada lugar tiene su
   imagen.
5. **Cuadros.** El primer cuadro de cada escena, con `generar_imagen` en el formato del video y en `referencias` las
   hojas de quienes salen más la del lugar (cuatro como mucho), a `cuadros/esc-<NN>.jpg`. El pedido dice dónde está cada
   uno, hacia dónde mira, su gesto al empezar la escena, el plano, y que todo coincida con las referencias: la cabeza de
   su especie, el cuerpo humano y la ropa de cada uno, sin texto. Mira todos en una hoja
   (`node <base>/scripts/hoja.mjs cuadros revision/cuadros.png`). Si uno cambió de cabeza o de ropa, salió a cuatro patas
   o con texto, pídelo otra vez: no gasta. Listo cuando los personajes se ven iguales en todos.
6. **Clips.** Mira con `estado_flow` sin `id` cuánto les queda a sus cuentas. Dile al usuario cuántos clips son, cuánto
   gastan y si alcanzan (paso «Lo que no se negocia»), y pídelos todos seguidos, sin esperar uno para pedir el siguiente.
   Se reparten entre sus cuentas, tres a la vez. Usa `generar_video` con `primerCuadro` `cuadros/esc-<NN>.jpg`, el
   formato del video, Veo 3.1 - Lite (salvo que el usuario pida otro) y `salida` `clips/esc-<NN>.mp4`. El prompt, en
   inglés, describe la acción y conserva la cabeza de su especie y el cuerpo humano de la referencia. El diálogo va en
   español, entre comillas y con quién lo dice; delante de cada línea, la ficha de voz de ese personaje copiada igual que
   en `ELENCO.md` (ver [`FLOW.md`](../video-base/FLOW.md), «La voz de cada personaje»). Al final, `static camera, no
   music, no subtitles, no added text on screen, no realistic animals`. Espera los pendientes con `estado_flow`. Listo
   cuando están todos los clips. Si una cuenta se quedó sin créditos, la herramienta ya pasó a otra. Si ninguna puede,
   dile al usuario cuántos faltan y cuándo vuelven sus cuentas, y para ahí. Si Flow rechaza un clip por su contenido
   (derechos, política de Google), cámbialo de verdad una vez; si vuelve a caer, déjalo fuera y sigue: el video sale con
   los demás, y al final se lo dices al usuario.
7. **Montaje.** `python <skill>/scripts/unir.py <nombre> --formato <formato>` se corre desde la carpeta del proyecto.
   Transcribe cada clip y le corta el final muerto: Veo deja de 1 a 2 s en que nadie habla ni se mueve, y se corta a
   0,35 s de su última palabra (`--sin-recortar` deja el clip entero). Luego los lleva al tamaño del formato a 30 fps, los
   une, masteriza el audio y pone los subtítulos en bloques de hasta tres palabras, con la más larga en amarillo
   (`--sin-subtitulos` si el usuario no los quiere). Mira `revision/transcripcion.txt` contra el guion y una hoja del
   video (`node <base>/scripts/hoja.mjs out/animalnovela-<nombre>.mp4 revision/hoja.png --cada 2`). Si un clip dice otra
   cosa, habla con la voz de otro, cambia a un personaje o trae texto, repítelo una vez con el prompt corregido.
   Repetirlo gasta otra vez: si sigue mal, déjalo y díselo al usuario. Al final,
   `node <base>/scripts/comprobar.mjs out/animalnovela-<nombre>.mp4 --duracion <s> --fps 30 --tamano <1080x1920 o
   1920x1080>`. Listo cuando pasa y cada escena dice lo del guion.
8. **Portada.** Según [`PORTADA.md`](../video-base/PORTADA.md): el personaje del conflicto, grande y con la cara del
   momento más fuerte, y de 2 a 5 palabras del drama («¡ME ENGAÑÓ!», «LA ADOPTARON»). Van tres cuadros del video de
   referencia, para que sea el mismo elenco. En vertical va de primer fotograma (`portada.mjs`). Entrega la ruta del
   video, el guion, los créditos gastados y con qué cuentas, y lo que no revisaste: el audio no lo oyes, solo lo
   transcribes.

## Las imágenes

Todo se hace con Flow, que también hace los clips. La línea `Imágenes:` del mensaje elige el modelo de Nano Banana
(sin ella, Nano Banana 2.1). Si dice ChatGPT, usa Flow de todos modos para las hojas, los lugares y los cuadros, y díselo
al usuario: los cuadros tienen que salir del mismo Flow que los anima, con las mismas referencias.
