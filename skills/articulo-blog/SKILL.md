---
name: articulo-blog
description: Redacta artículos profesionales y optimizados para SEO para Blogi con título, extracto, contenido, categoría, tags e imagen de portada generada con IA, y los publica automáticamente en https://miblogi.vercel.app.
---

# Artículos para Blogi

Esta skill redacta artículos completos, atractivos y optimizados para SEO para la plataforma **Blogi** (`https://miblogi.vercel.app`).
Genera la imagen de portada editorial en 16:9 con IA, sube la imagen a Cloudinary en la carpeta `miblogi`, registra la imagen en la tabla `media` de Blogi para que se vea en el gestor de archivos (`/admin/media`), genera una vista previa HTML local y registra el artículo en producción vía su API REST protegida.

## Categorías disponibles en Blogi

1. **Tips Tecnología** (`categoryId: 1`, slug: `tips-tecnologia`): Consejos de programación, arquitectura web, herramientas para desarrolladores, Next.js, Node.js, bases de datos y buenas prácticas.
2. **Inteligencia Artificial** (`categoryId: 2`, slug: `inteligencia-artificial`): Agentes autónomos, modelos LLM, ingeniería de prompts, automatización, herramientas de IA y su impacto tecnológico.

## Estructura del artículo (`articulo.json`)

El artículo se genera en `articulo.json` con los siguientes campos obligatorios:

```json
{
  "title": "Título llamativo y optimizado para SEO (50-70 caracteres)",
  "slug": "titulo-en-minusculas-con-guiones",
  "excerpt": "Extracto persuasivo de 140 a 280 caracteres que incite al clic y resuma el valor del artículo.",
  "content": "<p>Primer párrafo con el gancho...</p><h2>Subtítulo H2</h2><p>Explicación detallada...</p>",
  "categoryId": 1,
  "status": "DRAFT",
  "tags": ["Tecnología", "Next.js", "Guía"]
}
```

- **`status`**: `"DRAFT"` (borrador para revisar en el panel) o `"PUBLISHED"` (público de inmediato si el usuario lo pide o indica «publicar»).
- **`content`**: Redactado en HTML semántico limpio (`<p>`, `<h2>`, `<h3>`, `<ul>`, `<li>`, `<code>`, `<pre>`, `<blockquote>`, `<strong>`). Estructura con fluidez editorial:
  - **Introducción**: Contexto rápido y problema a resolver.
  - **Desarrollo**: Dividido en secciones con `<h2>` descriptivos, explicaciones técnicas claras, ejemplos de código o listas de pasos.
  - **Conclusión / Reflexión**: Resumen aplicable y llamada al debate o acción.

## Formato

- **`Formato: horizontal`** (estándar para artículos web): la imagen de portada se genera en formato 16:9 (1200×675 px o 1536×864 px), óptima para cabecera del artículo en Blogi y metadatos Open Graph / redes sociales.
- **`Formato: vertical`**: la plataforma web de Blogi utiliza encuadre horizontal 16:9 para sus cabeceras; si se indica vertical, la portada se mantiene en 16:9 para la web.

## Imagen de portada de alto impacto (`portada.png`)

La imagen **no debe ser genérica ni sencilla**. Debe tener estética editorial moderna de revista tecnológica de alta gama (estilo *Wired*, *MIT Technology Review*, *The Verge* o *Stripe Press*):

- **Proporción**: 16:9 widescreen (1200×675 px).
- **Estilo visual**: Arte conceptual 3D hiperrealista, render en Octane/Cinema4D o fotografía cinematográfica con iluminación volumétrica dramática, reflejos sutiles, texturas de vidrio esmerilado, circuitos holográficos limpios o metales oscuros satinados.
- **Paleta de color**: Sofisticada y de alto contraste (obsidiana con toques cian y ámbar, azul eléctrico profundo o minimalismo monocromático de alta tecnología).
- **Regla estricta**: **SIN texto ni letras dentro de la imagen** (el título ya lo muestra Blogi en la cabecera web; meter texto en la imagen se ve redundante y desalineado).
- Guardar como `portada.png` en la raíz de la carpeta del artículo.

## Fases de trabajo en tiempo real en Hermit

Para que la interfaz de Hermit (la barra de fases superior, el avance lateral y el chat) actualice en **tiempo real** cada paso, debes ejecutar y comunicar cada fase secuencialmente:

### 1. Fase Idea: Enfoque y plan SEO (`tema.md`)
1. Informa brevemente en el chat: *"💡 **Idea**: Definiendo enfoque editorial y estructura SEO en `tema.md`..."*
2. Guarda de inmediato `tema.md` en la raíz de la carpeta del artículo con:
   - Título propuesto y extracto SEO (140-280 caracteres).
   - Categoría elegida (`1`: Tips Tecnología, o `2`: Inteligencia Artificial).
   - Tesis central y problema que resuelve.
   - Esquema de secciones `<h2>` y `<h3>`.
   - Tags objetivo.
   *(Al crearse `tema.md`, la UI marca en verde la fase Idea y avanza en tiempo real).*

### 2. Fase Guion: Redacción y Portada (`articulo.md`, `articulo.json` y `portada.png`)
1. Informa en el chat: *"✍️ **Guion**: Redactando contenido completo y generando portada 16:9..."*
2. Guarda **`articulo.md`**: El artículo formateado en Markdown legible (título, extracto, subtítulos, párrafos y bloques de código) para lectura fluida en el panel.
3. Guarda **`articulo.json`**: El objeto JSON con el HTML semántico en el campo `content` necesario para la API de Blogi.
4. Genera directamente la imagen final en 16:9 widescreen (1200×675 px) y guárdala como **`portada.png`**. No dejes imágenes intermedias con otros nombres para no duplicar miniaturas.

### 3. Fase Entrega: Publicación y Vista Previa (`vista-previa.html` y `publicado.json`)
1. Informa en el chat: *"🚀 **Entrega**: Publicando en Blogi y generando vista previa..."*
2. Si el usuario pidió expresamente publicar de inmediato (o no dejarlo en draft), usa el flag `--publicar`:
```bash
node skills/articulo-blog/scripts/publicar.mjs <carpeta_del_articulo> --publicar
```
Si no lo especificó, se publica como borrador (`DRAFT`) para revisión segura en el panel:
```bash
node skills/articulo-blog/scripts/publicar.mjs <carpeta_del_articulo>
```
Esto sube la portada a Cloudinary, registra la imagen en la tabla `media` de PostgreSQL, genera `vista-previa.html` (que se muestra automáticamente en el visor de entrega) y envía el artículo a Blogi en producción.
3. Concluye en el chat con el resumen del artículo, su URL de administración y el enlace a la vista previa.

## Modo por lotes (N temas)

Cuando el usuario pida generar N artículos a la vez:
1. Divide cada tema en su propia carpeta: `trabajo/articulo-blog/blog-<slug>`.
2. Para cada tema, redacta el contenido en `articulo.json`, genera su `portada.png` y ejecuta `publicar.mjs`.
3. Informa al usuario un resumen con la lista de los artículos creados, sus URLs de administración y sus vistas previas locales.
