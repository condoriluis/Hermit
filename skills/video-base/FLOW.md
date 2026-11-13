# Google Flow: imágenes y clips generados

Hermit genera en Google Flow con las cuentas de Google del usuario (la de la voz y las que agregó en Opciones), con el MCP
`flow` (en Claude, `mcp__flow__generar_video` y `mcp__flow__generar_imagen`). Reparte los pedidos entre ellas: si una se
queda sin créditos, el pedido pasa solo a otra sin gastar.

## La línea `Imágenes:`

El usuario elige en el compositor de Hermit con qué se hacen las imágenes del video. Lo elegido llega en el primer
mensaje y manda sobre lo que diga tu skill:

- `Imágenes: genéralas en Google Flow con <modelo> …`: toda imagen nueva (texturas, portada, ilustraciones) va con
  `generar_imagen` y ese `modelo`. No uses Codex ni mires `codex login status`.
- `Imágenes: con ChatGPT …`: con Codex, como diga tu skill.
- Sin la línea: lo que diga tu skill.

En los estilos que hacen clips, la línea `Clips: genéralos en Google Flow con <modelo> …` dice el `modelo`, la
`resolucion` (en Omni) y el `tope` de cada `generar_video`. La eligió el usuario: manda sobre tu skill, y ese tope ya lo autorizó.

**Cada paso de tu skill sale igual que con Codex**, con estos cambios:

- El pedido es el mismo `.txt`, en inglés, sin lo que habla de `image_gen`, de copiar el PNG o de responder con el nombre
  del archivo: pásalo en `prompt`. `DESCRIBE AQUÍ` se rellena igual.
- Lo que tu skill pasa con `-i` va en `referencias`, en rutas absolutas (probado con tres). Sale el mismo personaje.
- `formato`: `1:1` para poses, bocas y texturas; `9:16` para la portada.
- Deja un JPEG, de 1024×1024 en `1:1` y 768×1376 en `9:16`, en `<nombre>.jpg`. Tu paso sigue con el PNG:
  `ffmpeg -nostdin -v error -y -i <nombre>.jpg <nombre>.png`.
- Míralo siempre: si algo no salió, pídelo otra vez diciendo qué corregir. Si lo demás quedó bien, pasa el intento fallido
  en `referencias` y pide solo ese cambio: conserva el título tal cual. Las imágenes no gastan créditos.

## Las herramientas

Los clips, cuando el usuario los pida o tu skill lo diga.

- `generar_imagen`: Nano Banana. `salida` es un `.jpg` en ruta absoluta.
- `generar_video`: 8 s con audio, 720p. **Gasta los créditos del usuario:** Lite 10, Fast 20, Quality 100, Omni 1.2
  Flash 24 y Omni 1.1 Flash 12 (8 y 6 con `resolucion` `360p`, que se ve borroso: solo si el usuario la pide). Fast,
  Quality y Omni 1.1 se van de Flow el 5 de diciembre de 2026. Una cuenta gratis tiene 50 al día. `salida` es un `.mp4` en ruta absoluta. Parte de una de estas:
  - **Solo texto.**
  - **`primerCuadro`** (y, si quieres, `ultimoCuadro`): el video empieza en esa imagen. Es lo más fiable para que los
    personajes y el lugar salgan iguales de un clip a otro: arma el cuadro con `generar_imagen` y las hojas de los
    personajes en `referencias` (gratis) y anímalo. El cuadro va en el mismo `formato` que el video.
  - **`referencias`** (hasta 3): sigue a esos personajes sin partir de una imagen. No va con `primerCuadro`.

Usa Veo 3.1 - Lite salvo que el usuario (en el chat o con la línea `Clips:`) o tu skill pidan otro. Cada pedido da un resultado. Antes de un lote de clips,
llama a `estado_flow` sin `id`: dice cuántos créditos le quedan a cada cuenta y cuántos videos van hoy. Dile al usuario
cuántos clips son, cuánto gastan y si alcanzan. Cada video hecho dice también cuánto queda. Si un pedido cuesta más que `tope` (20), no se genera: no subas el tope sin que el
usuario lo pida.

Lo que se dice en el clip va en el prompt, entre comillas y con quién lo dice: Veo genera las voces con el movimiento de
la boca. Que quepa en 8 s: unas 20 palabras por clip. Las líneas van **cortas y con puntuación simple**: sin puntos
suspensivos (`...`), sin incisos ni comas dobles — el generador de audio de Veo falla más con pausas largas y frases
enroscadas, y un `...` puede tirar el clip entero aunque todo lo demás esté bien. El golpe dramático lo da la imagen,
no la puntuación.

Tarda cerca de un minuto. Si no acabó en 40 s, la herramienta te da un id: sigue con lo que no lo necesita y espéralo con
`estado_flow`. Lo que no depende de lo anterior pídelo seguido: Hermit lo pone en fila y lo genera con calma (con
varias cuentas, hasta tres a la vez), para que Google no lo vea como actividad rara.

## La voz de cada personaje

Veo pone la voz de quien habla dentro de cada clip, y **cada clip es una generación aparte**: sin nada que la fije, un
mismo personaje sale con otra voz en cada escena y, en un diálogo, hasta se las puede intercambiar. Lo único que Veo
recibe para acertar son las palabras del prompt, así que la voz se fija con **una ficha literal por personaje** (los
estilos con elenco la guardan en el renglón de cada uno en `ELENCO.md`).

- **La ficha es una sola frase en inglés**, con el género, la edad, el tono, el timbre, el ritmo, el acento y la entrega.
  Ejemplo: `deep, slow, authoritative male voice, neutral Latin-American Spanish, warm, gravelly`.
- **En cada prompt va copiada igual**, palabra por palabra, junto al nombre de quien habla y delante de su diálogo. No se
  parafrasea, no se acorta ni se cambia una palabra: cada reescritura es una voz nueva. Si un clip se repite, la ficha se
  copia igual.
- **Dos personajes nunca llevan fichas parecidas**: que apunten a extremos distintos (uno muy grave y lento, otro agudo y
  rápido, otro cálido y medio); con dos parecidas, Veo las confunde.
- **Dos hablantes como mucho por clip.** Con tres, Veo reparte peor las voces y es más fácil que las cruce.

## Si falla

Lo primero es ver de quién es el fallo: **de la cuenta** lo maneja Hermit solo (tú no haces nada) y **de lo que le pides
a Flow** es cosa del clip, y hay que cambiarlo.

**De la cuenta (o de la configuración):** no lo reintentes; haz lo que dice y sigue.

- **Sin cuenta conectada, o se fue la sesión:** dile al usuario que conecte la de la voz en Opciones → Voz o agregue una
  en Opciones → Google Flow.
- **Ninguna cuenta puede ahora** (sin créditos o frenadas): no es un error. El pedido se queda esperando y **Hermit lo
  reintenta solo** a la hora que dice. No gastó nada. Dile al usuario cuántos clips faltan y que puede esperar o agregar
  cuentas en Opciones → Google Flow, y **no lo vuelvas a pedir** en el mismo turno: mientras las cuentas descansen, solo
  darías vueltas.
- **Flow lo rechazó por «actividad inusual»:** si no gastó, Hermit ya lo pasó a otra cuenta y, si ninguna pudo, el
  pedido queda esperando (ver arriba). Si el error dice que cobró o que no se supo, no lo repitas: dile al usuario qué
  clips faltan y cuánto se gastó.
- **Pide confirmar los derechos de las imágenes:** dile al usuario que los confirme en Opciones → Google Flow (o en
  «Confirmar derechos», junto al menú Imágenes). Esa decisión no es tuya: no la saltes. Lo que no necesite imágenes
  (referencias o fotogramas) sigue.
- **Es su primera vez con una cuenta, o no dejó crear un proyecto:** que abra Flow con esa cuenta en Opciones → Google
  Flow y acepte su aviso.

**De lo que le pides (el clip):** Flow lo rechaza por derechos o por su política —los personajes de una película, una
marca, una persona real—. No se arregla cambiando de cuenta: cae igual en todas. La escena tiene **tres vidas**, y los
rechazos se cuentan por escena (pasa `escena` con su número, p. ej. `esc-03`, para que valgan aunque pidas el archivo
con otro nombre):

1. **Cámbialo de verdad** — otros personajes, sin la marca, el mismo beat— y pídelo otra vez.
2. Si vuelve a caer, **la versión libre de derechos**: la misma escena y el mismo diálogo, pero con una representación
   100 % original (personajes, escenario y objetos inventados; nada de películas, series, marcas ni personas reales).
3. Si cae la tercera, Hermit la deja **bloqueada**: no la vuelve a pedir ni con otro prompt ni con otro archivo. No
   insistas: sigue con las demás escenas —lo ya generado vale— y, al final, dile al usuario cuál quedó fuera y por qué.
   Un video con una escena menos es mejor que un turno que no acaba.

Los rechazos por contenido no gastan créditos; lo que sí gasta es la versión que sí sale.

**Fallo técnico, no de contenido:** si Flow dice que no pudo generar el audio o el vídeo («No se pudo generar el
audio», «No se pudo generar el vídeo»), eso no es un rechazo por derechos ni gasta las vidas de la escena: no cobró
créditos y puedes pedir el mismo clip otra vez. No lo
confundas con un rechazo de contenido: ese sí cuenta para las tres vidas.

**Si el audio falla una y otra vez en la misma escena** (dos o tres fallos técnicos seguidos), no insistas con el
mismo prompt: Veo no está fallando por azar, es la escena. Simplifícala —un solo personaje, una sola línea, menos
utilería y menos acción— y pide el clip de nuevo con `escena` nueva (p. ej. `esc-12b`) para no arrastrar su
historial. Si ni así sale, reescribe la escena en el guion (otro encuadre u otro beat) antes de gastar más intentos:
una escena cambiada que sale es mejor que la perfecta que Veo no logra.
