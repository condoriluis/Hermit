import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Footer from '@/components/Footer'
import { TERMINOS } from '@/lib/cobro'
import { ACTUALIZADO, SELLER } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Aviso de privacidad — Hermit',
  description: 'Qué datos guarda Hermit, para qué sirven y cómo pedir que los borren.',
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold font-heading text-text">{titulo}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-2">{children}</div>
    </section>
  )
}

export default function Privacidad() {
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
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-text mt-2">Aviso de privacidad</h1>
          <p className="text-sm text-muted mt-3">
            Última actualización: <time dateTime={TERMINOS}>{ACTUALIZADO}</time>.
          </p>
          <p className="text-sm leading-relaxed text-text-2 mt-4">
            Hermit corre en tu computadora y guarda lo que creas ahí: no vemos tus archivos ni el contenido que produces.
            Solo salen de tu equipo los datos mínimos para tu cuenta, tu apoyo y el soporte. Aquí te contamos cuáles son.
          </p>

          <Seccion titulo="Quién trata tus datos">
            <p>
              <b>{SELLER.nombre}</b> (marca «{SELLER.marca}»), con domicilio en {SELLER.domicilio}. Si tienes cualquier
              duda sobre tus datos, escríbenos a{' '}
              <a className="text-accent hover:underline" href={`mailto:${SELLER.correo}`}>{SELLER.correo}</a>.
            </p>
          </Seccion>

          <Seccion titulo="Qué guardamos">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <b>Tu correo</b> y <b>tu clave</b>, para tu cuenta y tu apoyo.
              </li>
              <li>
                <b>Un identificador de esta computadora</b>, resumido y sin relación con tus archivos, para que tu clave
                valga y para poner un límite a las cuentas que se piden.
              </li>
              <li>
                <b>El estado de tu apoyo</b>: cuándo aceptaste estos términos, qué versión aceptaste y si el pago está
                activo, pendiente o cancelado.
              </li>
            </ul>
            <p>
              <b>No guardamos los datos de tu tarjeta</b>: el cobro lo hace PayPal. Tampoco guardamos lo que creas con
              Hermit, que se queda en tu computadora.
            </p>
          </Seccion>

          <Seccion titulo="Para qué los usamos">
            <p>
              Solo para tu cuenta, tu apoyo, darte soporte y avisarte de los cobros que vienen. <b>Nunca</b> para
              publicidad ni para venderte nada.
            </p>
          </Seccion>

          <Seccion titulo="Con quién los compartimos">
            <p>
              Con nadie para otros fines. El cobro lo procesa <b>PayPal</b> y los correos salen por un servicio de
              correo; ellos tratan los datos por su cuenta y con sus propias políticas. No vendemos ni cedemos tus datos
              a terceros.
            </p>
          </Seccion>

          <Seccion titulo="Cuánto los guardamos">
            <p>
              Mientras tengas la cuenta o el apoyo. Si nos pides que borremos tu cuenta, eliminamos tus datos, salvo lo
              que la ley nos obligue a conservar por el cobro.
            </p>
          </Seccion>

          <Seccion titulo="Tus derechos">
            <p>
              Puedes pedirnos <b>acceder</b> a tus datos, <b>corregirlos</b> o <b>borrarlos</b> escribiéndonos a{' '}
              <a className="text-accent hover:underline" href={`mailto:${SELLER.correo}`}>{SELLER.correo}</a>. En
              Bolivia, la privacidad está protegida por la Constitución y su acción de hábeas data; todavía no hay una
              ley integral de datos personales en vigor.
            </p>
          </Seccion>

          <Seccion titulo="Cookies">
            <p>
              Este sitio no te pide registro para verlo y no usa cookies de publicidad ni de seguimiento.
            </p>
          </Seccion>

          <Seccion titulo="Cambios">
            <p>
              Si este aviso cambia, actualizamos la fecha de arriba. Los{' '}
              <Link className="text-accent hover:underline" href="/terminos">
                términos y condiciones
              </Link>{' '}
              completan este aviso.
            </p>
          </Seccion>
        </article>
      </main>

      <Footer />
    </>
  )
}
