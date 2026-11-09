"""
La limpieza del audio de cada clip de Veo, para los estilos que unen clips con voces generadas (frutinovela,
animalnovela, devnovela y minidrama). Veo deja, por debajo de la voz, un colchón de ambiente continuo que al masterizar
a −14 LUFS sube con ella y se oye como un murmullo; aquí se baja antes de unir, clip por clip, para que el máster no lo
realce.

    from sonido import LIMPIAR

`LIMPIAR` es una cadena de FFmpeg, en este orden: `highpass` quita el retumbe de debajo de 85 Hz, `afftdn` baja el
ruido de banda ancha (suave: 12 dB, con el piso a −40), y `agate` cierra el fondo en los huecos y en los silencios. La
voz queda 10 dB o más por encima del umbral de la compuerta, así que no la toca: en los ocho clips de prueba, el fondo
en los huecos bajó unos 28 dB y el nivel de la voz no cambió.
"""

LIMPIAR = "highpass=f=85,afftdn=nr=12:nf=-40,agate=threshold=0.0398:ratio=3:attack=5:release=250:range=0.06"
