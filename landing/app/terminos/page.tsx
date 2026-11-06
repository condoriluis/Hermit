import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/Footer'
import { TERMINOS } from '@/lib/cobro'
import { ACTUALIZADO, SELLER } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Términos y condiciones — Hermit',
  description: 'Quién ofrece Hermit, qué es gratis, cómo funciona el apoyo voluntario y la ley que lo rige.',
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold font-heading text-text">{titulo}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-2">{children}</div>
    </section>
  )
}

export default function Terminos() {
  return (
    <>
      <header className="border-b border-line">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/icon.svg" width={28} height={28} alt="Hermit" className="w-7 h-7 rounded-lg" />
            <span className="text-lg font-extrabold font-heading text-text">Hermit</span>
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-text transition-colors">
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <p className="text-xs uppercase font-mono tracking-widest text-accent font-bold">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-text mt-2">Términos y condiciones</h1>
          <p className="text-sm text-muted mt-3">
            Última actualización: <time dateTime={TERMINOS}>{ACTUALIZADO}</time>. Rigen el uso de Hermit, de este sitio y del
            apoyo voluntario. Al crear tu cuenta o al apoyar, los aceptas.
          </p>

          <Seccion titulo="1. Quién ofrece Hermit">
            <p>
              Hermit lo desarrolla y lo ofrece <b>{SELLER.nombre}</b> (marca «{SELLER.marca}»), con domicilio en{' '}
              {SELLER.domicilio}. Es quien recibe los apoyos.
            </p>
            <p>
              Contacto: <a className="text-accent hover:underline" href={`mailto:${SELLER.correo}`}>{SELLER.correo}</a>{' '}
              · WhatsApp {SELLER.whatsapp}.
            </p>
          </Seccion>

          <Seccion titulo="2. Qué es Hermit">
            <p>
              Es una aplicación de escritorio que instalas en tu computadora (Windows, macOS o Linux) y que trabaja con tu
              propia cuenta de un proveedor de inteligencia artificial (Anthropic, OpenAI, DeepSeek u Ollama) para crear
              videos, artículos y otras tareas. Corre en tu equipo y lo que produces se guarda ahí.
            </p>
          </Seccion>

          <Seccion titulo="3. Gratis, con apoyo voluntario">
            <p>
              Hermit es <b>gratis</b>: puedes descargarlo y usar todas sus herramientas sin pagar nada. No hay versión de
              pago ni funciones bloqueadas.
            </p>
            <p>
              El <b>apoyo es voluntario</b> y sostiene el desarrollo de las nuevas versiones. Quien apoya recibe las
              novedades antes y deja de ver el recordatorio en la app.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Apoyo <b>mensual</b>: <b>5 USD</b>, se cobra cada mes de forma automática hasta que lo canceles.
              </li>
              <li>
                Apoyo <b>anual</b>: <b>50 USD</b>, un solo pago; no se renueva solo.
              </li>
            </ul>
            <p>Los precios están en dólares estadounidenses (USD) y no incluyen impuestos.</p>
          </Seccion>

          <Seccion titulo="4. Cómo se paga">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <b>Pago por QR (Bolivia)</b>: transfieres el monto en bolivianos, al cambio del día, y nos envías el
                comprobante por WhatsApp.
              </li>
              <li>
                <b>PayPal (internacional)</b>: con tarjeta o con tu saldo de PayPal.
              </li>
            </ul>
            <p>
              Cuando se confirma el pago, te llega por correo una <b>clave</b>. Con ella quitas el recordatorio y entras
              desde dos computadoras a la vez.
            </p>
          </Seccion>

          <Seccion titulo="5. Renovación y cancelación">
            <ul className="list-disc pl-5 space-y-1">
              <li>El apoyo <b>mensual se renueva solo</b> cada mes hasta que lo canceles.</li>
              <li>El apoyo <b>anual es un pago único</b>: no se renueva solo; si quieres continuar, lo haces tú.</li>
              <li>
                Puedes <b>cancelar cuando quieras</b>, desde la app o escribiéndonos. Dejamos de cobrar de inmediato y te
                damos un <b>folio</b> de la cancelación. Lo que ya pagaste sigue valiendo hasta el final del periodo.
              </li>
              <li>Si hubo un cobro por error, escríbenos y lo devolvemos.</li>
            </ul>
          </Seccion>

          <Seccion titulo="6. Tu contenido y la licencia del software">
            <p>
              El <b>contenido que creas con Hermit es tuyo</b>: puedes usarlo y venderlo como quieras.
            </p>
            <p>
              El <b>software</b> se distribuye bajo <b>Apache 2.0 con Commons Clause</b>: puedes usarlo y modificarlo,
              pero no vender Hermit ni un producto o servicio que valga por lo que hace Hermit. Incluye componentes de
              terceros con sus propias licencias (por ejemplo, Remotion).
            </p>
          </Seccion>

          <Seccion titulo="7. Uso aceptable">
            <p>
              Te comprometes a usar Hermit conforme a la ley, a no emplearlo para contenido ilegal ni para vulnerar
              derechos de otras personas, y a respetar las condiciones de tu proveedor de inteligencia artificial.
              Respondes por lo que creas y publicas.
            </p>
          </Seccion>

          <Seccion titulo="8. Sin garantías">
            <p>
              Hermit se ofrece <b>«tal cual»</b>. Hacemos lo posible por que funcione bien, pero no garantizamos que
              esté libre de errores ni que sirva para un fin concreto. No respondemos por daños derivados del uso del
              programa, por el contenido que generes, ni por caídas o cambios en servicios de terceros (tu proveedor de
              inteligencia artificial, PayPal o las redes sociales).
            </p>
          </Seccion>

          <Seccion titulo="9. Privacidad">
            <p>
              Qué datos guardamos y para qué está en el{' '}
              <Link className="text-accent hover:underline" href="/privacidad">
                aviso de privacidad
              </Link>
              .
            </p>
          </Seccion>

          <Seccion titulo="10. Ley aplicable y reclamos">
            <p>
              Estos términos se rigen por las leyes de <b>Bolivia</b>, en particular la <b>Ley N.º 453, de 4 de diciembre
              de 2013</b>, General de los Derechos de las Usuarias y los Usuarios y de las Consumidoras y los
              Consumidores, y su Reglamento.
            </p>
            <p>
              Si tienes un reclamo, escríbenos primero a{' '}
              <a className="text-accent hover:underline" href={`mailto:${SELLER.correo}`}>{SELLER.correo}</a>: lo
              atendemos y te respondemos. También puedes acudir al <b>Viceministerio de Defensa de los Derechos del
              Usuario y Consumidor</b> (VDDUC, Ministerio de Justicia), a sus Centros de Atención al Usuario y Consumidor
              (CAUC) o a su línea gratuita <b>800 10 0202</b>.
            </p>
          </Seccion>

          <Seccion titulo="11. Cambios">
            <p>
              Si estos términos cambian, actualizamos la fecha de arriba y, si el cambio es importante, te lo avisamos.
              Si sigues usando Hermit después de un cambio, se entiende que aceptas la versión nueva.
            </p>
          </Seccion>

          <p className="mt-12 pt-6 border-t border-line text-sm text-muted">
            ¿Dudas? Escríbenos a{' '}
            <a className="text-accent hover:underline" href={`mailto:${SELLER.correo}`}>{SELLER.correo}</a> o por
            WhatsApp al {SELLER.whatsapp}.
          </p>
        </article>
      </main>

      <Footer />
    </>
  )
}
