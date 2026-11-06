# La firma del instalador de Windows

Fecha: 2026-11-07

## Contexto

Al instalar `Hermit-Setup-0.3.46.exe` en una computadora con Windows Defender al día, el antivirus lo señaló como
`Wacatac.B!ml`, un troyano. El archivo no tiene nada: el `!ml` del nombre quiere decir *machine learning*, o sea una
sospecha del heurístico, no el nombre de un virus conocido que esté dentro. Lo que la provoca es que el `.exe` de la app
y el instalador salen **sin firmar**: un programa de editor desconocido que se ejecuta, se instala y se deja en Inicio
se parece demasiado a lo que hace un malware.

Mac tiene su equivalente desde el ADR 0006: sin cuenta de desarrollador la app sale con firma ad hoc y una vez se abre
desde Configuración → Privacidad y seguridad. Windows no da ni esa salida: sin firma, avisa. Como los clientes bajan el
instalador de la página, esto los asusta antes de abrir la app por primera vez.

## Decisión

- La firma de Windows va por su certificado de código, en los secretos `WIN_CSC_LINK` y `WIN_CSC_KEY_PASSWORD` del repo
  (`.github/workflows/venta.yml`), igual que la de Apple va por `CSC_LINK` y `CSC_KEY_PASSWORD` (ADR 0006).
- **electron-builder firma solo**, sin configuración: con `WIN_CSC_LINK` puesto firma el `.exe` de la app y el
  instalador, y con sello de tiempo (`http://timestamp.digicert.com`). Sin él, compila igual y el instalador sale sin
  firma, como hasta ahora. Por eso el bloque `win` de `scripts/compilar.mjs` no cambia.
- **Los dos certificados son distintos** y electron-builder tomaría cualquiera de los dos en cualquier sistema
  (`WIN_CSC_LINK` tiene prioridad sobre `CSC_LINK`). `scripts/compilar.mjs` deja en cada sistema solo el suyo: en Windows
  borra `CSC_LINK`, y en Mac y Linux, `WIN_CSC_LINK`. Así el de Apple no intenta firmar el `.exe` ni al revés.
- **El certificado se compra** y no es el de Apple. Con uno de validación extendida (EV), Windows le da buena reputación
  al instalador desde el primer día; con uno normal (OV), el aviso de SmartScreen se va solo según se descargue.

## Consecuencias

- Sin los secretos nada cambia: el instalador sale sin firma y Defender lo puede volver a señalar. El aviso se quita de
  verdad el día que se ponen.
- Firmar no rompe las actualizaciones: un instalador firmado se publica encima de una app instalada sin firmar, porque la
  regla de «el mismo equipo» es solo de macOS (ADR 0006). Se puede poner el certificado sin recompilar nada más.
- El sello de tiempo hace que una versión ya publicada siga valiendo cuando el certificado caduque; conviene no quitarlo.
- Lo que Hermit baja después (los agentes, FFmpeg, Python) es de terceros y lleva la firma de quien lo hizo, no la
  nuestra; el aviso del instalador es lo único que se arregla aquí.
- Queda como alternativa más barata **Azure Trusted Signing** (`win.azureSignOptions` de electron-builder), que firma
  desde la nube y cuesta por mes en vez de comprar el certificado. No está puesto.
- Mientras no haya certificado, el aviso se puede reportar gratis a Microsoft
  (https://www.microsoft.com/en-us/wdsi/filesubmission): suele darlo por bueno en unos días.
