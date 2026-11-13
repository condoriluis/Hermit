---
name: devnovela
description: Crea devnovelas verticales u horizontales con lenguajes y herramientas como personajes 3D humanos cuya cabeza es su logo o símbolo reconocible. Úsala para episodios nuevos o continuaciones de una devnovela.
---

# Devnovela

`<skill>` es esta carpeta y `<base>` es `video-base`, junto a ella. Lee su [`LEEME.md`](../video-base/LEEME.md) (los
errores ya vistos), [`FORMATO.md`](../video-base/FORMATO.md), [`FLOW.md`](../video-base/FLOW.md) y
[`PORTADA.md`](../video-base/PORTADA.md) antes de empezar.

## La esencia

- **Personajes que se reconocen.** Cada lenguaje o herramienta es un personaje con cuerpo humano y una cabeza 3D formada
  por su logo oficial reconocible o por su símbolo icónico. El logo es la cabeza misma, no una insignia flotante, una
  máscara genérica ni un objeto vagamente relacionado. Lleva ojos, cejas y boca integrados sin perder la silueta que lo
  identifica, y ropa urbana inspirada en sus colores. No inventes una papelera, un bote, una caja o un cilindro cuando
  el usuario espera el logo. Salen idénticos en todos los clips, porque cada clip parte de un cuadro armado con sus hojas
  de personaje. Si un personaje cambia de cara, cabeza, cuerpo o ropa entre clips, el video se cae.
- **Drama de telenovela, dicho serio.** Deploy del viernes, herencia del código legacy, merge conflict, bug en
  producción, auditoría, despido, traición entre frontend y backend. Los personajes lo viven en serio. La gracia es que
  el lenguaje o la herramienta es el personaje: su símbolo reconocible forma parte de su cara y su identidad, no se
  sustituye por un objeto genérico.
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
- **Logo como cabeza.** Usa la forma y los colores principales del logo o símbolo reconocible del lenguaje o herramienta.
  La cabeza completa adopta esa silueta y tiene ojos, cejas y boca integrados. No la conviertas en una cabeza humana,
  una mascota, un robot ni un recipiente genérico. Si el símbolo oficial representa un animal, úsalo como emblema gráfico
  3D, no como un animal realista. No inventes una marca cuando no puedas confirmar cuál es: pregunta o usa una referencia
  que proporcione el usuario. No añadas logos sueltos a la escena ni copies historias de otro canal.
- **Sin texto añadido.** No generes letreros, subtítulos ni marcas de agua. Las letras que formen parte inseparable del
  icono oficial pueden permanecer en la cabeza; no añadas nombres o palabras a la ropa ni al fondo. Los subtítulos los
  pone `unir.py`.
- El proyecto va en la ruta completa de la línea `Carpeta:` del mensaje, tal cual (el estudio de Hermit
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
`personajes/ELENCO.md`: nombre, qué lenguaje o herramienta representa, **cuál es el logo o símbolo exacto de su cabeza**,
su silueta y colores, cómo son sus rasgos, qué ropa lleva, su voz (la ficha literal en inglés de
[`FLOW.md`](../video-base/FLOW.md), «La voz de cada personaje») y en qué capítulos sale. Antes de inventar a uno, mira si
ya está y conserva su diseño.

Un elenco de cuatro a seis funciona mejor que uno de doce. Cada uno necesita una silueta distinta y una personalidad que
se entienda en un solo plano. No hay una lista cerrada de lenguajes compatibles: representa los que pida el usuario,
incluidos lenguajes nuevos o poco conocidos, sin intentar enumerarlos todos ni reemplazar sus marcas por objetos
inventados. Si no conoces su símbolo oficial, compruébalo en una fuente fiable; si no puedes identificarlo con certeza,
pide una referencia antes de generar.

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

1. **Historia.** Un tema del usuario, una idea suya o, si no dio nada, una de las tramas de arriba con un giro propio.
   Si es otra parte de una que ya se hizo, lee su `guion.md` y su `ELENCO.md` y sigue desde su cliffhanger. Listo cuando
   puedes contar la historia en tres frases: el conflicto, el giro y la pregunta con que acaba.
2. **Guion.** En `guion.md` de la carpeta del proyecto: el título, la parte, el elenco de este capítulo y una tabla con
   una fila por escena. Cada fila lleva el número, el lugar, quién sale, el plano, lo que hacen y lo que dicen, entre
   comillas y con quién lo dice — frases cortas y sin puntos suspensivos: el audio de Veo falla con pausas largas.
   Que sean de 8 a 12 escenas (de 64 a 96 s). En cada escena caben unas 20 palabras, de uno
   o dos personajes. El drama tiene que entenderse sin saber programar: el lenguaje es el disfraz, no el chiste. Listo
   cuando el primer clip ya es el conflicto, cada escena empuja la historia y el último deja la pregunta.
3. **Personajes.** Los que falten, con `generar_imagen` en `formato` `9:16`, a `personajes/<nombre>.jpg`, uno por imagen.
   Cada uno debe tener cuerpo humano completo, dos brazos, dos manos, dos piernas y dos pies; estar de frente y de pie,
   con ropa urbana inspirada en los colores de su marca, sobre fondo claro y liso. Identifica el símbolo con precisión y
   describe su silueta y colores en el prompt; no basta con escribir el nombre del lenguaje o «su logo». Si el logo no es
   reconocible para el modelo, usa una imagen de referencia verificada en `referencias`. Rellena esta plantilla en inglés
   con el diseño anotado en `ELENCO.md`:

   ```text
   Create one high-quality stylized 3D animated humanoid character representing <LANGUAGE OR TOOL>. The entire head itself is the recognizable official <LOGO OR ICON, DESCRIBED BY ITS DISTINCTIVE SHAPE AND COLORS>, rendered as a dimensional sculptural head. Preserve its distinctive silhouette and main colors; do not reinterpret it as a trash can, bin, box, cylinder, helmet, human head, or unrelated object. Integrate large expressive cartoon eyes, eyebrows, and a mouth into the logo surface without obscuring its identity. Fully human body with two arms, two hands, two legs, and two feet; natural proportions and expressive body language. Modern streetwear inspired by <BRAND COLORS>, no extra logos or words on clothing. <PERSONALITY>. Full body, standing upright, facing the camera, neutral pose, centered on a clean light gray background. Premium polished 3D animated feature-film style, consistent visual universe for the DevNovelas series. No floating logo, no extra text, no watermark, no realistic animal head, no robot body.
   ```

   Mírala. Si la cabeza no conserva el símbolo reconocible, parece un objeto genérico, o Flow la interpreta como animal
   real, papelera o recipiente, vuelve a pedir solo esa hoja: nombra el error concreto y exige la silueta del logo. Si hay
   una referencia fiable del logo, pásala en `referencias`. Lista cuando cada personaje del capítulo tiene su hoja y su
   renglón en `ELENCO.md`.
4. **Lugares.** Cada lugar del guion, vacío, con `generar_imagen` en el formato del video, a `lugares/<lugar>.jpg` del
   proyecto: el mismo 3D tipo Pixar, con luz cálida y sin personas, texto ni logos. Listo cuando cada lugar tiene su
   imagen.
5. **Cuadros.** El primer cuadro de cada escena, con `generar_imagen` en el formato del video y en `referencias` las
   hojas de quienes salen más la del lugar (cuatro como mucho), a `cuadros/esc-<NN>.jpg`. El pedido dice dónde está cada
   uno, hacia dónde mira, su gesto al empezar la escena y el plano. Pide que coincidan con las referencias, incluidos
   los logos integrados en sus cabezas; sin texto añadido, logos sueltos ni animales. Mira todos en una hoja
   (`node <base>/scripts/hoja.mjs cuadros revision/cuadros.png`). Si cambia una cabeza, cara o ropa, o aparece un logo
   suelto o texto, pídelo otra vez: no gasta. Listo cuando los personajes se ven iguales en todos.
6. **Clips.** Mira con `estado_flow` sin `id` cuánto les queda a sus cuentas. Dile al usuario cuántos clips son, cuánto
   gastan y si alcanzan (paso «Lo que no se negocia»), y pídelos todos seguidos, sin esperar uno para pedir el siguiente.
   Se reparten entre sus cuentas, tres a la vez. Usa `generar_video` con `primerCuadro` `cuadros/esc-<NN>.jpg`, el
   formato del video, Veo 3.1 - Lite (salvo que el usuario pida otro) y `salida` `clips/esc-<NN>.mp4`. El prompt, en
   inglés, describe la acción. El diálogo va en español, entre comillas y con quién lo dice; delante de cada línea, la
   ficha de voz de ese personaje copiada igual que en `ELENCO.md` (ver [`FLOW.md`](../video-base/FLOW.md), «La voz de
   cada personaje»). Las líneas que dice el clip quedan también en `dialogos/esc-<NN>.txt`, tal cual y sin más texto,
   para que `unir.py` compare lo que se oyó con el guion. Conserva las cabezas-logo de la imagen de referencia; al
   final, `static camera, no music, no subtitles, no added text on screen, no extra logos, no realistic animals`. Espera los
   pendientes con `estado_flow`. Listo cuando están todos los clips. Si una cuenta se quedó sin créditos, la herramienta ya pasó a
   otra. Si ninguna puede, dile al usuario cuántos faltan y cuándo vuelven sus cuentas, y para ahí. Si Flow rechaza un clip
   por su contenido (derechos, política de Google), no es la cuenta: cámbialo de verdad y pídelo otra vez (con
   `escena` = su número); si cae otra, la versión 100 % original (sin personajes, marcas ni personas con derechos); si
   cae la tercera, déjalo fuera y sigue: el video sale con los demás, y al final se lo dices al usuario.
7. **Montaje.** `python <skill>/scripts/unir.py <nombre> --formato <formato>` se corre desde la carpeta del proyecto.
   Transcribe cada clip y le corta el final muerto: Veo deja de 1 a 2 s en que nadie habla ni se mueve, y se corta a
   0,35 s de su última palabra. Luego une los clips en orden, masteriza el audio y pone los subtítulos
   (`--sin-subtitulos` si el usuario no los quiere). Si `unir.py` para con «Escenas que no dicen lo del guion», una
   escena dijo otra cosa: regenera ese clip con el prompt corregido (o más corto y con menos hablantes) y vuelve a
   unir; `revision/sospechosas.txt` dice qué se esperaba y qué se oyó. Si están bien de verdad, `--forzar`. Mira
   `revision/transcripcion.txt` contra el guion y una hoja del
   video (`node <base>/scripts/hoja.mjs out/devnovela-<nombre>.mp4 revision/hoja.png --cada 2`). Si un clip dice otra
   cosa, habla con la voz de otro, cambia a un personaje o trae texto, repítelo una vez con el prompt corregido.
   Repetirlo gasta otra vez: si sigue mal, déjalo y díselo al usuario. Al final,
   `node <base>/scripts/comprobar.mjs out/devnovela-<nombre>.mp4 --duracion <s> --fps 30 --tamano <1080x1920 o
   1920x1080>`. Listo cuando pasa y cada escena dice lo del guion.
8. **Portada.** Sigue [`PORTADA.md`](../video-base/PORTADA.md) para referencias, formato y área segura. Elige un título
   gancho de 2 a 5 palabras que resuma el conflicto o giro más fuerte del episodio, no el nombre de la serie ni el tema
   genérico. Que suene dramático y concreto («¡SE CAYÓ PRODUCCIÓN!», «BORRARON MAIN», «EL DEPLOY ARDIÓ»); conserva el
   texto exacto, con sus acentos y signos, en español.

   La portada debe reconocerse como Devnovela y mantener el mundo 3D de la serie. Usa al protagonista del conflicto,
   grande y con una expresión intensa; conserva su cabeza-logo y su ropa según `ELENCO.md`. El título lleva tipografía
   gruesa, compacta y muy legible, en mayúsculas y en dos o tres líneas. Elige colores vivos ligados al logo del
   protagonista y a la escena: un color dominante brillante y, como máximo, un acento fuerte, sobre un fondo que dé
   contraste. Por ejemplo, amarillo eléctrico o cian con acento naranja o rojo y contorno o sombra oscura. No uses un
   arcoíris de colores, no tapes la cara ni la cabeza, y no añadas logos sueltos: el logo del personaje forma parte de
   su cabeza. El único texto de la imagen es el título.

   Genera la portada con tres cuadros del propio video como referencias para conservar el elenco y la escena. Mírala
   entera y en miniatura: el título debe leerse y coincidir exactamente con el elegido, y el personaje, el texto y la
   expresión deben quedar en el área segura que indica `PORTADA.md`. En horizontal, pon el título a un lado y el
   protagonista al otro. En vertical va de primer fotograma (`portada.mjs`). Entrega la ruta del video, el guion, los
   créditos gastados y con qué cuentas, y lo que no revisaste: el audio no lo oyes, solo lo transcribes.

## Las imágenes

Todo se hace con Flow, que también hace los clips. La línea `Imágenes:` del mensaje elige el modelo de Nano Banana
(sin ella, Nano Banana 2.1). Si dice ChatGPT, usa Flow de todos modos para las hojas, los lugares y los cuadros, y díselo
al usuario: los cuadros tienen que salir del mismo Flow que los anima, con las mismas referencias.
