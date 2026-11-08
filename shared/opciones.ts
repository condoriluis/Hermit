/**
 * Las preguntas cerradas del agente: Hermit le pide (`server/claude.ts`) que las cierre con un bloque `<opciones>`, una
 * respuesta por línea. Lo leen dos: la web, que lo separa del texto para dibujarlo como botones (`web/src/items.ts`), y
 * el servidor, que necesita saber si el turno acabó preguntando algo para no insistirle (`server/sessions.ts`). Cuenta el
 * bloque que empieza en su propia línea, fuera de un bloque de código; sin cerrar (aún se escribe), llega hasta el final.
 * Ninguno se queda en el texto, que markdown.ts enseñaría con las etiquetas escritas: el último son los botones, y uno de
 * antes queda como lista.
 */
export function partirOpciones(text: string): { texto: string; opciones: string[] } {
  if (!text.includes('<')) return { texto: text, opciones: [] }
  const fuera: string[] = []
  // Cada bloque, con el sitio del texto donde estaba.
  const bloques: { en: number; opciones: string[] }[] = []
  let abierto: string[] | null = null
  let codigo = false
  for (const l of text.split('\n')) {
    if (abierto) {
      const cierra = l.search(/<\/opciones>/i)
      if (cierra < 0) abierto.push(l)
      else {
        abierto.push(l.slice(0, cierra))
        bloques.push({ en: fuera.length, opciones: respuestas(abierto) })
        abierto = null
        // Lo que siga va en su propio párrafo.
        fuera.push('', l.slice(cierra + '</opciones>'.length).trim())
      }
      continue
    }
    if (/^\s*(```|~~~)/.test(l)) codigo = !codigo
    else if (!codigo && /^\s*<opciones>/i.test(l)) {
      const resto = l.replace(/^\s*<opciones>/i, '')
      const cierra = resto.search(/<\/opciones>/i)
      // Todo en una línea (`<opciones>Sí</opciones>`): un bloque de una sola respuesta.
      if (cierra >= 0) {
        bloques.push({ en: fuera.length, opciones: respuestas([resto.slice(0, cierra)]) })
        fuera.push('', resto.slice(cierra + '</opciones>'.length).trim())
      } else abierto = [resto]
      continue
    }
    fuera.push(l)
  }
  // Mientras se escribe, las etiquetas llegan a trozos: un `</opc` tras la última respuesta, o un `<opc` al final del
  // texto, aún no se sabe qué son, y no se enseñan.
  if (abierto) {
    const ultima = abierto.length - 1
    abierto[ultima] = abierto[ultima].replace(/<\/?[a-z]*$/i, (cola) => ('</opciones>'.startsWith(cola.toLowerCase()) ? '' : cola))
    bloques.push({ en: fuera.length, opciones: respuestas(abierto) })
  } else if (!codigo && fuera.length) {
    const ultima = fuera[fuera.length - 1].trim().toLowerCase()
    if (ultima.startsWith('<') && '<opciones>'.startsWith(ultima)) fuera.pop()
  }
  const ultimo = bloques.pop()
  // De atrás adelante, para que el sitio de cada uno siga valiendo.
  for (const b of bloques.reverse()) fuera.splice(b.en, 0, '', ...b.opciones.map((o) => `- ${o}`), '')
  return { texto: fuera.join('\n').trim(), opciones: ultimo?.opciones ?? [] }
}

/** Las respuestas de un bloque, una por línea, sin la viñeta o el número que a veces les pone el agente. */
const respuestas = (lineas: string[]) => lineas.map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim()).filter(Boolean)
