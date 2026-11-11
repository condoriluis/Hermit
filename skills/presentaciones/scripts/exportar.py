# Exporta la presentación a PowerPoint, PDF, portada y vista previa.
# Uso: python exportar.py   (en la carpeta del hilo, donde está presentacion.json)
#
# Lee `presentacion.json`:
#   { "titulo": "...", "subtitulo": "...", "autor": "...",
#     "slides": [ { "tipo": "portada|seccion|contenido|cierre",
#                   "titulo": "...", "subtitulo": "...",
#                   "puntos": ["..."], "imagen": "diapositivas/02.png", "notas": "..." } ] }
# Escribe: presentacion.pptx, presentacion.pdf, portada.png (si no existe),
# vista-previa.html y exportado.json.
import base64
import io
import json
import os
import re
import sys
import tempfile
from html import escape

from PIL import Image, ImageDraw, ImageFont
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from fpdf import FPDF

# La paleta por defecto es la de Hermit; `presentacion.json` puede traer "acento" y "fondo"
# ("#RRGGBB") para heredar los colores de la marca o del equipo de quien presenta.
BG = (10, 14, 20)
PANEL = (17, 23, 34)
PANEL2 = (24, 33, 47)
LINEA = (38, 50, 70)
TEXTO = (230, 237, 247)
MUTED = (148, 163, 184)
ACENTO = (79, 140, 255)

ANCHO, ALTO = 13.333, 7.5  # diapositiva 16:9 en pulgadas


def _hex(rgb):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(c))) for c in rgb)


def _parse_hex(s):
    """'#RGB' o '#RRGGBB' -> tupla; None si no es un color válido."""
    if not isinstance(s, str):
        return None
    s = s.strip().lstrip('#')
    if len(s) == 3:
        s = ''.join(c * 2 for c in s)
    if len(s) != 6:
        return None
    try:
        return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        return None


def _lum(rgb):
    return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255


def _mezcla(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def aplicar_paleta(datos):
    """Fija la paleta global: la de Hermit por defecto, o la del JSON si trae
    "acento"/"fondo" válidos. Deriva paneles, líneas y texto del fondo (tema oscuro
    o claro) y separa el acento del fondo si no contrasta."""
    global BG, PANEL, PANEL2, LINEA, TEXTO, MUTED, ACENTO
    fondo = _parse_hex(datos.get('fondo')) or BG
    acento = _parse_hex(datos.get('acento')) or ACENTO
    # Si el acento no contrasta con el fondo, se aleja un punto.
    if abs(_lum(acento) - _lum(fondo)) < 0.22:
        acento = tuple(max(0, min(255, c + (70 if _lum(acento) < _lum(fondo) else -70))) for c in acento)
    BG = fondo
    ACENTO = acento
    if _lum(fondo) < 0.45:  # fondo oscuro: paneles más claros, texto claro
        PANEL = tuple(min(255, c + d) for c, d in zip(fondo, (7, 9, 14)))
        PANEL2 = tuple(min(255, c + d) for c, d in zip(fondo, (14, 19, 27)))
        LINEA = tuple(min(255, c + d) for c, d in zip(fondo, (28, 36, 50)))
        TEXTO, MUTED = (230, 237, 247), (148, 163, 184)
    else:  # fondo claro: paneles blanquecinos, texto oscuro
        PANEL = _mezcla(fondo, (248, 250, 253), 0.65)
        PANEL2 = _mezcla(fondo, (228, 234, 243), 0.5)
        LINEA = _mezcla(fondo, (110, 125, 150), 0.4)
        TEXTO, MUTED = (26, 34, 52), (100, 115, 135)


def leer_json():
    with open('presentacion.json', encoding='utf-8') as f:
        datos = json.load(f)
    if not datos.get('slides'):
        sys.exit('presentacion.json no tiene "slides".')
    return limpiar_datos(datos)


# Firmas de mojibake donde un byte UTF-8 ya se perdió como '?' (no hay decode posible,
# pero cada firma corresponde a un solo carácter conocido).
_MOJIBAKE = {
    'â?¢': '•', 'â?¬': '–', 'â?"': '“', 'â?"': '”', 'â?˜': '‘', 'â?™': '’',
    'â?': '→', 'â?¦': '…', 'â?T': '™', 'â?o': '°',
}


def arreglar(t):
    """Deshace el mojibake típico: UTF-8 leído como latin-1 («â?¢», «Ã©», «Â¿»).
    Si el texto trae esas marcas, se reinterpreta como UTF-8; si no, queda igual."""
    t = str(t)
    if 'â' in t or 'Ã' in t or 'Â' in t:
        try:
            return t.encode('latin-1').decode('utf-8')
        except (UnicodeEncodeError, UnicodeDecodeError):
            for malo, bueno in _MOJIBAKE.items():
                t = t.replace(malo, bueno)
    return t


def limpiar_datos(datos):
    """Arregla todos los textos del JSON de una vez (títulos, puntos, notas, imagen…)."""
    if isinstance(datos, str):
        return arreglar(datos)
    if isinstance(datos, list):
        return [limpiar_datos(x) for x in datos]
    if isinstance(datos, dict):
        return {k: limpiar_datos(v) for k, v in datos.items()}
    return datos


def esc(t):
    """Texto seguro para HTML: conserva acentos y símbolos (UTF-8), solo escapa HTML."""
    return escape(arreglar(t))


# Lo que las fuentes base de fpdf no tienen: se cambia por lo que sí, no por un '?'.
_TRADUCCION = str.maketrans({'—': '-', '–': '-', '“': '"', '”': '"', '‘': "'", '’': "'", '…': '...',
                             '•': '·', '→': '->', '←': '<-', '⇒': '=>', '✓': 'ok', '✔': 'ok'})


def limpio(t):
    """Texto seguro para las fuentes base de fpdf (latin-1) y sin caracteres de control. Los acentos se quedan:
    NUNCA se descomponen (NFKD rompería «é» en «e?»)."""
    t = ''.join(ch if ch == '\n' or ch.isprintable() else ' ' for ch in arreglar(t).translate(_TRADUCCION))
    return t.encode('latin-1', 'replace').decode('latin-1')


def envolver(draw, texto, fuente, ancho):
    """Parte `texto` en renglones que quepan en `ancho` píxeles."""
    palabras, lineas, actual = str(texto).split(), [], ''
    for p in palabras:
        prueba = f'{actual} {p}'.strip()
        if draw.textlength(prueba, font=fuente) <= ancho or not actual:
            actual = prueba
        else:
            lineas.append(actual)
            actual = p
    if actual:
        lineas.append(actual)
    return lineas


_RECORTES = {}


def imagen_169(ruta):
    """La imagen lista para una diapositiva 16:9: si no lo es (retrato, cuadrada, panorámica),
    se recorta al centro a 16:9 — una diapositiva nunca lleva una imagen deformada ni con
    bandas. Devuelve la ruta (la original si ya es 16:9, o un JPEG temporal del recorte)."""
    ruta = str(ruta)
    if ruta in _RECORTES:
        return _RECORTES[ruta]
    salida = ruta
    try:
        with Image.open(ruta) as im:
            w, h = im.size
            if abs((w / h) - (16 / 9)) / (16 / 9) > 0.08:
                # Recorte centrado a 16:9.
                objetivo = w / (16 / 9)
                if objetivo <= h:
                    top = (h - objetivo) / 2
                    caja = (0, top, w, top + objetivo)
                else:
                    objetivo_w = h * (16 / 9)
                    left = (w - objetivo_w) / 2
                    caja = (left, 0, left + objetivo_w, h)
                recorte = im.convert('RGB').crop(tuple(round(x) for x in caja))
                tmp = os.path.join(tempfile.gettempdir(), 'hermit-slide-' + str(abs(hash(ruta))) + '.jpg')
                recorte.save(tmp, 'JPEG', quality=90)
                salida = tmp
    except Exception:
        pass
    _RECORTES[ruta] = salida
    return salida


def cuadro_imagen(ruta, max_w, max_h):
    """Tamaño (ancho, alto) para meter la imagen en un cuadro sin deformarla ni salirse.
    `max_w`/`max_h` en pulgadas (pptx) o milímetros (pdf): la proporción es la misma."""
    try:
        with Image.open(imagen_169(ruta)) as im:
            razon = im.height / im.width
    except Exception:
        return max_w, max_w * 0.6
    w, h = max_w, max_w * razon
    if h > max_h:
        h, w = max_h, max_h / razon
    return w, h


# ---------- portada.png (16:9, para la galería) ----------

def fuente(tam):
    for ruta in (
        'C:/Windows/Fonts/segoeui.ttf',
        'C:/Windows/Fonts/arial.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/System/Library/Fonts/Supplemental/Arial.ttf',
    ):
        if os.path.exists(ruta):
            return ImageFont.truetype(ruta, tam)
    return ImageFont.load_default()


def portada(datos, slides):
    if os.path.exists('portada.png'):
        return 'portada.png'
    W, H = 1600, 900
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    # Franja de acento arriba y título centrado, como una diapositiva de portada.
    d.rectangle([0, 0, W, 10], fill=ACENTO)
    f_titulo = fuente(96)
    f_sub = fuente(44)
    f_pie = fuente(34)
    titulo = str(datos.get('titulo') or 'Presentación')
    y = H // 2 - 140
    for linea in envolver(d, titulo, f_titulo, W - 220)[:3]:
        w = d.textlength(linea, font=f_titulo)
        d.text(((W - w) / 2, y), linea, font=f_titulo, fill=TEXTO)
        y += 118
    sub = datos.get('subtitulo') or datos.get('tema') or ''
    if sub:
        y += 20
        for linea in envolver(d, sub, f_sub, W - 320)[:2]:
            w = d.textlength(linea, font=f_sub)
            d.text(((W - w) / 2, y), linea, font=f_sub, fill=MUTED)
            y += 56
    pie = datos.get('autor') or f'{len(slides)} diapositivas'
    w = d.textlength(str(pie), font=f_pie)
    d.text(((W - w) / 2, H - 110), str(pie), font=f_pie, fill=MUTED)
    img.save('portada.png')
    return 'portada.png'


# ---------- presentacion.pptx ----------

def pptx_color(rgb):
    return RGBColor(*rgb)


def a_pptx(datos, slides):
    prs = Presentation()
    prs.slide_width, prs.slide_height = Inches(ANCHO), Inches(ALTO)
    vacia = prs.slide_layouts[6]

    for i, s in enumerate(slides):
        tipo = s.get('tipo', 'contenido')
        slide = prs.slides.add_slide(vacia)
        fondo = slide.background.fill
        fondo.solid()
        fondo.fore_color.rgb = pptx_color(BG)
        # La barra de acento arriba y el número abajo a la derecha: la marca de cada diapositiva.
        barra = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, Inches(0.09))
        barra.fill.solid()
        barra.fill.fore_color.rgb = pptx_color(ACENTO)
        barra.line.fill.background()
        num = slide.shapes.add_textbox(Inches(ANCHO - 1.1), Inches(ALTO - 0.55), Inches(0.8), Inches(0.4))
        pn = num.text_frame.paragraphs[0]
        pn.text = str(i + 1)
        pn.font.size, pn.font.color.rgb = Pt(12), pptx_color(MUTED)
        pn.alignment = PP_ALIGN.RIGHT

        if tipo == 'portada':
            caja = slide.shapes.add_textbox(Inches(0.9), Inches(2.4), Inches(11.5), Inches(2.6))
            tf = caja.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = str(s.get('titulo') or datos.get('titulo') or 'Presentación')
            p.font.size, p.font.bold, p.font.color.rgb = Pt(44), True, pptx_color(TEXTO)
            if s.get('subtitulo') or datos.get('subtitulo'):
                p2 = tf.add_paragraph()
                p2.text = str(s.get('subtitulo') or datos.get('subtitulo'))
                p2.font.size, p2.font.color.rgb = Pt(22), pptx_color(MUTED)
            # La imagen de portada, si la hay, a la derecha ocupando todo su alto útil.
            img = s.get('imagen') or datos.get('portada_imagen')
            if img and os.path.exists(img):
                w, h = cuadro_imagen(img, 3.6, 4.6)
                slide.shapes.add_picture(imagen_169(img), Inches(9.5), Inches(1.45), width=Inches(w), height=Inches(h))
        elif tipo == 'seccion':
            barra = slide.shapes.add_textbox(Inches(0.9), Inches(2.9), Inches(11.5), Inches(1.4))
            p = barra.text_frame.paragraphs[0]
            p.text = str(s.get('titulo', ''))
            p.font.size, p.font.bold, p.font.color.rgb = Pt(40), True, pptx_color(ACENTO)
        elif tipo == 'cierre':
            caja = slide.shapes.add_textbox(Inches(0.9), Inches(2.8), Inches(11.5), Inches(2))
            tf = caja.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = str(s.get('titulo') or '¡Gracias!')
            p.font.size, p.font.bold, p.font.color.rgb = Pt(36), True, pptx_color(TEXTO)
            if s.get('subtitulo'):
                p2 = tf.add_paragraph()
                p2.text = str(s['subtitulo'])
                p2.font.size, p2.font.color.rgb = Pt(20), pptx_color(MUTED)
        else:  # contenido
            caja = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(11.7), Inches(1.1))
            tf_t = caja.text_frame
            tf_t.word_wrap = True
            p = tf_t.paragraphs[0]
            p.text = str(s.get('titulo', ''))
            p.font.size, p.font.bold, p.font.color.rgb = Pt(30), True, pptx_color(TEXTO)
            if s.get('subtitulo'):
                p2 = tf_t.add_paragraph()
                p2.text = str(s['subtitulo'])
                p2.font.size, p2.font.color.rgb = Pt(15), pptx_color(MUTED)
            puntos = s.get('puntos') or []
            img = s.get('imagen')
            tiene_img = bool(img) and os.path.exists(img)
            if tiene_img:
                caja2 = slide.shapes.add_textbox(Inches(0.9), Inches(1.75), Inches(6.3), Inches(5.1))
            elif puntos:
                caja2 = slide.shapes.add_textbox(Inches(0.9), Inches(1.7), Inches(11.5), Inches(5.2))
            if puntos or tiene_img:
                tf2 = caja2.text_frame
                tf2.word_wrap = True
                for j, punto in enumerate(puntos):
                    par = tf2.paragraphs[0] if j == 0 else tf2.add_paragraph()
                    par.text = f'•  {punto}'
                    par.font.size, par.font.color.rgb, par.space_after = Pt(18), pptx_color(TEXTO), Pt(10)
            if tiene_img:
                # La imagen manda en la mitad derecha: es lo que se proyecta.
                w, h = cuadro_imagen(img, 5.0, 5.0)
                slide.shapes.add_picture(imagen_169(img), Inches(7.6), Inches(1.7), width=Inches(w), height=Inches(h))
        if s.get('notas'):
            slide.notes_slide.notes_text_frame.text = str(s['notas'])

    prs.save('presentacion.pptx')


# ---------- presentacion.pdf ----------

def a_pdf(datos, slides):
    # 16:9 apaisado: 338 × 190 mm (proporción 16:9 como la diapositiva).
    pdf = FPDF(unit='mm', format=(338, 190))
    pdf.set_auto_page_break(False)
    pdf.set_margins(16, 12, 16)

    for i, s in enumerate(slides):
        pdf.add_page()
        tipo = s.get('tipo', 'contenido')
        pdf.set_fill_color(*BG)
        pdf.rect(0, 0, 338, 190, 'F')
        pdf.set_fill_color(*ACENTO)
        pdf.rect(0, 0, 338, 1.6, 'F')
        # El número de la diapositiva, abajo a la derecha.
        pdf.set_y(176)
        pdf.set_font('helvetica', '', 10)
        pdf.set_text_color(*MUTED)
        pdf.cell(0, 6, str(i + 1), align='R')

        if tipo == 'portada':
            pdf.set_y(62)
            pdf.set_font('helvetica', 'B', 30)
            pdf.set_text_color(*TEXTO)
            pdf.multi_cell(0, 13, limpio(s.get('titulo') or datos.get('titulo') or 'Presentación'), align='C')
            pdf.ln(2)
            pdf.set_font('helvetica', '', 15)
            pdf.set_text_color(*MUTED)
            pdf.multi_cell(0, 8, limpio(s.get('subtitulo') or datos.get('subtitulo') or ''), align='C')
            img = s.get('imagen') or datos.get('portada_imagen')
            if img and os.path.exists(img) and img.lower().endswith(('.png', '.jpg', '.jpeg')):
                w, h = cuadro_imagen(img, 90, 70)
                pdf.image(imagen_169(img), x=(338 - w) / 2, y=118, w=w, h=h)
        elif tipo == 'seccion':
            pdf.set_y(78)
            pdf.set_font('helvetica', 'B', 26)
            pdf.set_text_color(*ACENTO)
            pdf.multi_cell(0, 12, limpio(s.get('titulo', '')), align='C')
        elif tipo == 'cierre':
            pdf.set_y(72)
            pdf.set_font('helvetica', 'B', 24)
            pdf.set_text_color(*TEXTO)
            pdf.multi_cell(0, 11, limpio(s.get('titulo') or '¡Gracias!'), align='C')
            pdf.ln(2)
            pdf.set_font('helvetica', '', 14)
            pdf.set_text_color(*MUTED)
            pdf.multi_cell(0, 8, limpio(s.get('subtitulo') or ''), align='C')
        else:
            pdf.set_y(14)
            pdf.set_font('helvetica', 'B', 19)
            pdf.set_text_color(*TEXTO)
            pdf.multi_cell(0, 9, limpio(s.get('titulo', '')))
            if s.get('subtitulo'):
                pdf.set_x(16)
                pdf.set_font('helvetica', '', 12)
                pdf.set_text_color(*MUTED)
                pdf.multi_cell(0, 6, limpio(s['subtitulo']))
            pdf.ln(1)
            pdf.set_draw_color(*LINEA)
            pdf.line(16, pdf.get_y(), 322, pdf.get_y())
            pdf.ln(4)
            tiene_img = bool(s.get('imagen')) and os.path.exists(s['imagen']) and s['imagen'].lower().endswith(('.png', '.jpg', '.jpeg'))
            ancho_texto = 196 if tiene_img else 306
            pdf.set_font('helvetica', '', 12.5)
            pdf.set_text_color(*TEXTO)
            for punto in s.get('puntos') or []:
                pdf.multi_cell(ancho_texto, 6.8, limpio(f'•  {punto}'))
                pdf.ln(1.2)
            if tiene_img:
                # La imagen ocupa toda la mitad derecha, grande como en la diapositiva.
                w, h = cuadro_imagen(s['imagen'], 100, 140)
                pdf.image(imagen_169(s['imagen']), x=322 - w, y=30, w=w, h=h)
    pdf.output('presentacion.pdf')


def imagen_data_uri(ruta):
    """La imagen como data URI JPEG (máx. 1280 px de ancho): la vista previa es un solo HTML que se abre en cualquier
    lado, también fuera de Hermit, sin depender de rutas ni del servidor."""
    try:
        img = Image.open(ruta).convert('RGB')
        if img.width > 1280:
            img = img.resize((1280, round(img.height * 1280 / img.width)), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, 'JPEG', quality=82)
        return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')
    except Exception:
        return ''


# ---------- vista-previa.html ----------

def css_rgb(rgb):
    return '#%02x%02x%02x' % rgb


def vista_previa(datos, slides):
    partes = [f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><title>{esc(datos.get("titulo", "Presentación"))}</title>
<style>
body{{margin:0;background:{css_rgb(BG)};color:{css_rgb(TEXTO)};font-family:system-ui,sans-serif;padding:28px 20px;display:flex;flex-direction:column;gap:22px;align-items:center}}
.slide{{width:min(1040px,100%);aspect-ratio:16/9;background:{css_rgb(PANEL)};border:1px solid {css_rgb(LINEA)};border-radius:14px;padding:4.5% 5%;box-sizing:border-box;display:flex;flex-direction:column;gap:3.5%;position:relative;overflow:hidden}}
.slide::before{{content:"";position:absolute;top:0;left:0;right:0;height:5px;background:{css_rgb(ACENTO)}}}
.num{{position:absolute;top:12px;right:16px;font-size:12px;color:{css_rgb(MUTED)}}}
h2{{margin:0;font-size:clamp(20px,3.6vw,34px);line-height:1.2}}
.sub{{color:{css_rgb(MUTED)};font-size:clamp(14px,2.1vw,20px)}}
ul{{margin:0;padding-left:1.15em;font-size:clamp(14px,2.2vw,20px);line-height:1.6}}
li{{margin-bottom:.35em}}
img{{max-width:46%;max-height:74%;object-fit:contain;border-radius:10px;align-self:flex-end;box-shadow:0 8px 30px rgba(0,0,0,.45)}}
.cuerpo{{display:flex;gap:4%;flex:1;min-height:0;align-items:stretch}}
.cuerpo>div{{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}}
.portada{{justify-content:center;align-items:center;text-align:center}}
.portada h2{{font-size:clamp(28px,5.2vw,52px)}}
.portada img{{max-width:52%;max-height:56%;margin-top:3%}}
.seccion{{justify-content:center;align-items:center;text-align:center}}
.seccion h2{{color:{css_rgb(ACENTO)}}}
.cierre{{justify-content:center;align-items:center;text-align:center}}
</style></head><body>''']
    for i, s in enumerate(slides, 1):
        tipo = s.get('tipo', 'contenido')
        img = ''
        if s.get('imagen') and os.path.exists(s['imagen']):
            uri = imagen_data_uri(imagen_169(s['imagen']))
            if uri:
                img = f'<img src="{uri}" alt="">'
        if tipo == 'portada':
            partes.append(f'<div class="slide portada"><div class="num">{i}</div><h2>{esc(s.get("titulo") or datos.get("titulo", ""))}</h2><div class="sub">{esc(s.get("subtitulo") or datos.get("subtitulo") or "")}</div>{img}</div>')
        elif tipo == 'seccion':
            partes.append(f'<div class="slide seccion"><div class="num">{i}</div><h2>{esc(s.get("titulo", ""))}</h2></div>')
        elif tipo == 'cierre':
            partes.append(f'<div class="slide cierre"><div class="num">{i}</div><h2>{esc(s.get("titulo") or "¡Gracias!")}</h2><div class="sub">{esc(s.get("subtitulo") or "")}</div></div>')
        else:
            puntos = ''.join(f'<li>{esc(p)}</li>' for p in (s.get('puntos') or []))
            sub = f'<div class="sub">{esc(s["subtitulo"])}</div>' if s.get('subtitulo') else ''
            partes.append(f'<div class="slide"><div class="num">{i}</div><div><h2>{esc(s.get("titulo", ""))}</h2>{sub}</div><div class="cuerpo"><div><ul>{puntos}</ul></div>{img}</div></div>')
    partes.append('</body></html>')
    with open('vista-previa.html', 'w', encoding='utf-8') as f:
        f.write(''.join(partes))


# ---------- main ----------

def main():
    if not os.path.exists('presentacion.json'):
        sys.exit('No hay presentacion.json en esta carpeta.')
    datos = leer_json()
    slides = datos['slides']
    os.chdir(os.path.dirname(os.path.abspath('presentacion.json')))
    aplicar_paleta(datos)

    port = portada(datos, slides)
    a_pptx(datos, slides)
    a_pdf(datos, slides)
    vista_previa(datos, slides)

    # Un '?' entre letras suele ser un acento perdido al escribir el JSON (no hay forma de
    # saber cuál era): se avisa para que se corrija el texto y se exporte de nuevo.
    textos = json.dumps(datos, ensure_ascii=False)
    sospechosos = len(re.findall(r'[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]\?[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]', textos))
    if sospechosos:
        print(f'Ojo: hay {sospechosos} «?» entre letras que parecen acentos perdidos en presentacion.json. '
              'Corrige los acentos y vuelve a correr el exportador.')

    with open('exportado.json', 'w', encoding='utf-8') as f:
        json.dump({
            'titulo': datos.get('titulo', ''),
            'diapositivas': len(slides),
            'pptx': 'presentacion.pptx',
            'pdf': 'presentacion.pdf',
            'portada': port,
            'vista-previa': 'vista-previa.html',
            'acentos_sospechosos': sospechosos or None,
        }, f, ensure_ascii=False, indent=2)
    print(f'Listo: {len(slides)} diapositivas -> presentacion.pptx, presentacion.pdf, portada.png, vista-previa.html')


if __name__ == '__main__':
    main()
