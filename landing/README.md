# Hermit — Landing Page Oficial

Landing page moderna, rápida y de alto impacto construida con **Next.js (App Router)**, **TypeScript** y **Tailwind CSS**, utilizando la paleta de colores nativa de Hermit (`#0a0e14`, `#111722`, `#4f8cff`).

## 🚀 Características
- **100% Responsive & Dark Theme**: Diseñada para máxima conversión tanto en móviles como en monitores grandes.
- **Demostración Interactiva en Vivo**: Simulación del estudio con selector de fases (Video TikTok 9:16, Artículos de Blog horizontales y Terminal de código).
- **Detección Automática de Sistema Operativo**: El botón principal detecta si el usuario está en Windows, Mac o Linux.
- **Descarga desde el Worker**: Los instaladores los sirve el Worker del cobro (`licencias/`, ruta `/descargar`).
- **Apoyo Transparente**: Gratis para siempre, con apoyo opcional de $5 al mes o $50 al año. El precio lo da el Worker y los bolivianos van al cambio del dólar del mercado del día.

---

## 🛠️ Cómo Probar Localmente

Dentro de la carpeta `landing/`:

```bash
cd landing
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador. Copia `.env.example` a `.env.local` si quieres apuntar a otro Worker o cambiar el QR.

---

## ☁️ Cómo Desplegar en Vercel (Gratis)

1. Sube esta carpeta o un repositorio con ella a tu cuenta de GitHub (`condoriluis/Hermit` o un repo dedicado `Hermit-landing`).
2. Entra a [vercel.com](https://vercel.com) y pulsa **Add New Project**.
3. Selecciona el repositorio y si está en una subcarpeta, fija el **Root Directory** en `landing`.
4. Pulsa **Deploy**. En menos de 1 minuto estará en línea con HTTPS y CDN mundial gratuito.
