import { TERMINOS } from './cobro'

/**
 * Quién ofrece Hermit y recibe los apoyos. Es el mismo dato en los términos, en el aviso de privacidad y al pie de los
 * correos del cobro, para no repetirlo ni contradecirlo.
 */
export const SELLER = {
  nombre: 'Luis Alberto',
  marca: 'luchodev',
  domicilio: 'Ciudad de El Alto, provincia Murillo, departamento de La Paz, Bolivia',
  correo: 'support.luchodev@gmail.com',
  whatsapp: '+591 76259553',
}

/** «Última actualización» de los términos: su versión publicada (`TERMINOS`), escrita como se lee, sin desfase de zona. */
export const ACTUALIZADO = new Date(`${TERMINOS}T12:00:00Z`).toLocaleDateString('es-BO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
