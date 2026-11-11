---
name: presentaciones
description: Investiga un tema, crea las diapositivas, diseña sus imágenes, redacta el contenido y exporta la presentación a PowerPoint (.pptx) y PDF listos para presentar o compartir. Cada una queda en la galería «Mis presentaciones» de Hermit.
---

# Presentaciones

Esta skill hace una presentación completa a partir de un tema: investiga, estructura las diapositivas, diseña las
imágenes de cada una, redacta el contenido y **exporta el `.pptx` y el `.pdf`** con `scripts/exportar.py`, sin
necesitar PowerPoint instalado. Todo queda en la carpeta del hilo y la presentación aparece en **Mis presentaciones**.

## La línea `Carpeta:` y el `Formato:`

- `Carpeta: <nombre>`: la carpeta del hilo, la raíz donde va todo.
- `Formato: horizontal` (siempre): las diapositivas son **16:9** (1920×1080 al generar imágenes). Si el mensaje pide
  otro formato (vertical para historias, cuadrado), esa manda.

## Cómo trabajas

1. **Enfoque** (fase Idea). Investiga el tema con las herramientas de búsqueda y guarda `tema.md` en la raíz: de qué
   trata, para quién es, los datos clave y las fuentes consultadas (en `fuentes/` lo que valga la pena conservar).
2. **Guion** (fase Guion). Escribe dos archivos:
   - `diapositivas.md`: el guion legible, diapositiva por diapositiva — título, puntos y notas del orador. Es lo que
     el usuario lee en el monitor.
   - `presentacion.json`: la misma presentación **estructurada**, que es lo que exporta el script. Esquema:

     ```json
     {
       "titulo": "Título de la presentación",
       "subtitulo": "De qué trata, en una línea",
       "autor": "Quién la presenta (opcional)",
       "acento": "#RRGGBB (opcional: el color de marca del usuario)",
       "fondo": "#RRGGBB (opcional: el fondo de su marca)",
       "slides": [
         { "tipo": "portada", "titulo": "…", "subtitulo": "…" },
         { "tipo": "seccion", "titulo": "Primera parte" },
         { "tipo": "contenido", "titulo": "…", "subtitulo": "línea de apoyo (opcional)", "puntos": ["…", "…"], "imagen": "diapositivas/03.png", "notas": "…" },
         { "tipo": "cierre", "titulo": "Gracias", "subtitulo": "…" }
       ]
     }
     ```

     - `tipo`: `portada` (la primera), `seccion` (un divisor de parte), `contenido` (título + `puntos` + `imagen`
       opcional + `notas` para el orador) y `cierre` (la última). Sin `tipo`, es `contenido`.
     - `imagen`: ruta relativa a la diapositiva, dentro de `diapositivas/` (`diapositivas/03.png`). Opcional; las
       diapositivas de texto se ven bien sin ella.
     - `notas`: lo que dice el orador en esa diapositiva; va a las notas del orador del `.pptx`.
3. **Diseño** (fase Guion). Genera las imágenes de las diapositivas que las llevan, en `diapositivas/` con nombres
   numerados (`diapositivas/01.png`, `02.png`…), con el motor de la línea `Imágenes:` si la hay, en 16:9. Si una
   diapositiva no necesita imagen, no la tiene. **Mira cada imagen** antes de seguir.
4. **Exportado** (fase Entrega). Corre el exportador **desde la carpeta del hilo**:

   ```
   python <ruta de esta skill>/scripts/exportar.py
   ```

   (la ruta de la skill te la dice el sistema; si no, `scripts/exportar.py` junto a este SKILL.md). Escribe
   `presentacion.pptx`, `presentacion.pdf`, `portada.png` (si no existía), `vista-previa.html` y `exportado.json`.
   - Si falta un paquete de Python (`pptx`, `fpdf` o `PIL`), el instalador de requisitos de Hermit los pone; si el
     error dice `No module named`, dilo tal cual.
   - **Nunca** escribas el `.pptx` ni el `.pdf` a mano: siempre con el script, para que queden iguales.

## Reglas de contenido y diseño

Una presentación profesional se reconoce en el primer vistazo: **poco texto, mucho aire, títulos que se leen desde
lejos y una sola familia visual**. El exportador ya pone la barra de acento, el número de diapositiva y la paleta de
Hermit; tu trabajo es que el contenido la acompañe.

**Texto**

- **Pocos puntos por diapositiva**: 3 a 5, cada uno de **una línea** (máx. ~10 palabras). Si un punto necesita dos
  líneas, divídelo o pásalo a las notas del orador.
- **`subtitulo` también en `contenido`**: una línea de apoyo bajo el título que contextualice («Cómo funciona, de
  punta a punta»). Es la diferencia entre una diapositiva que se lee y una que parece un esquema.
- **Si la presentación es corta** (4-6 diapositivas), cada una tiene que decir más: subtítulo siempre, puntos que
  sean frases con sujeto y verbo (no etiquetas sueltas), y `notas` completas. Una presentación de 4 diapositivas
  con 3 líneas cada una es un resumen, no una presentación.
- **Titular que diga algo**: «El problema» no; «El 70 % abandona en el primer minuto» sí. Frases cortas, sin
  artículos de más.
- **Tamaños**: el título es lo más grande de la diapositiva; los puntos, la mitad; las notas no aparecen nunca.
- Nada de párrafos, citas largas ni viñetas anidadas: si el texto no cabe en una pantalla de proyector, no va.

**Imágenes**

- **16:9 siempre** (1920×1080). Si el motor devuelve otra proporción (retrato, cuadrada), **regenera o recorta**:
  una imagen vertical en una diapositiva horizontal queda pequeña y con bandas. El exportador recorta al centro a
  16:9 como último recurso, pero es mejor que la imagen nazca bien.
- Una por diapositiva como mucho, y solo donde aporte: diagramas, fotos, capturas, comparaciones. Un texto con
  imagen de fondo genérica queda **peor** que solo texto.
- Nada de imágenes con marca de agua ni de baja resolución.

**Estructura**

- La primera diapositiva es `portada` y la última `cierre`; entre ellas, `seccion` para dividir en partes (cada
  3-5 diapositivas de contenido, como mucho) y `contenido` para lo demás.
- Unas **8 a 15 diapositivas** salvo que el tema pida otra cosa: una presentación de 30 diapositivas es un documento,
  no una presentación.
- Cada `seccion` lleva título propio y corto («El problema», «La solución», «Los números»), no «Parte 2».
- Cierra con una idea, no con «Gracias»: «Empieza hoy» dice más que «Gracias por su atención».

**Paleta**

- Por defecto la presentación sale con la paleta de Hermit (fondo oscuro, acento azul). **Si el usuario menciona
  colores, marca, equipo o empresa** — o el tema lo sugiere claramente (una presentación para un club, una tienda,
  un canal con identidad) — pon `"acento"` y/o `"fondo"` en el JSON con su color real (`#RRGGBB`). La presentación
  debe sentirse del que la pide, no de Hermit.
- El exportador deriva de eso todo lo demás: paneles, líneas, texto claro u oscuro según el fondo, y separa el
  acento del fondo si no contrasta. Tú solo eliges los dos colores; nunca inventes paletas intermedias.
- Si el usuario no dice nada de colores, **no pongas nada**: la paleta de Hermit ya queda profesional.

**Voz**

- `notas`: lo que dice el orador en esa diapositiva, en prosa completa. Quien presente debe poder hablar 30-60 s por
  diapositiva solo con sus notas.
- `subtitulo`: una línea que enganche o cierre el círculo (portada y cierre) o que contextualice el título
  (contenido).

**Idioma y codificación**

- El del usuario, siempre con acentos y puntuación correctos (`á`, `é`, `í`, `ó`, `ú`, `ñ`, `¿`, `¡`).
- **Escribe `presentacion.json` y `diapositivas.md` en UTF-8**: con la herramienta de archivos o con Python
  (`json.dump(..., ensure_ascii=False)`). **Nunca** con `echo`, `Out-File` ni comandos del shell de Windows: corrompen
  los acentos y quedan `?` que ya no se pueden recuperar.
- Antes de exportar, relee el JSON: ningún `?` entre letras (`según`, no `seg?n`). El exportador avisa si quedan.

## Si falla

- **Sin `presentacion.json` o sin `slides`:** el script lo dice; revisa el JSON (comas, comillas) y vuelve a correrlo.
- **Una imagen no existe:** el script la salta y la diapositiva sale sin ella; corrige la ruta y repite.
- **Error de Python o de paquetes:** pásalo tal cual; no improvises otro exportador.
