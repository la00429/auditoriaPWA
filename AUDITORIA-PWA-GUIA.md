# Guia de Auditoria PWA - Chat de Superheroes

## Actividad 1: Preparacion y despliegue HTTPS

### GitHub Pages
1. Confirma que el sitio se publica desde la carpeta raiz y que `public/` contiene `index.html`, `manifest.json` y `sw.js`.
2. GitHub Pages sirve normalmente desde una rama, no desde una carpeta `public`. Para esta PWA, despliega el repositorio como raiz o mueve los archivos publicados a la carpeta configurada.
3. Abre `Settings > Pages`, selecciona la rama `main` y la carpeta `/ (root)` o `/docs`.
4. Espera el despliegue HTTPS y verifica una URL como `https://usuario.github.io/repositorio/`.
5. Si el proyecto se publica bajo una subcarpeta, ajusta `start_url`, `scope`, rutas absolutas del manifest y registro del Service Worker.

### Vercel
1. Importa el repositorio desde el panel de Vercel.
2. Configura el comando de salida para servir `public`, por ejemplo con el servidor Express existente:
   - Build Command: `npm install`
   - Start/Run Command: `npm start`
3. Comprueba que Vercel asigna HTTPS.
4. Abre la URL desplegada y revisa que `/manifest.json` y `/sw.js` respondan con estado 200.
5. Prueba una recarga normal y una recarga sin caché.

## Actividades 2 y 3: Auditorias

### PageSpeed Insights
1. Abre https://pagespeed.web.dev/.
2. Ingresa la URL HTTPS y ejecuta primero la auditoría móvil.
3. Registra LCP, INP, CLS, TBT, velocidad y puntaje Lighthouse.
4. Repite en modo escritorio con la misma URL.
5. Adjunta capturas completas y los enlaces del reporte.

### Lighthouse DevTools
1. Abre DevTools con `F12` y selecciona Lighthouse.
2. Usa una ventana Incógnito limpia.
3. Configura `Mode: Navigation`, `Device: Mobile`, categorías `Performance`, `Accessibility`, `Best practices`, `SEO` y PWA si está disponible.
4. Desmarca extensiones de navegador y inicia una sesión nueva.
5. Ejecuta la auditoría; exporta el informe JSON/HTML si la opción está disponible.
6. Desinstala o actualiza el Service Worker anterior con `Application > Service Workers > Unregister`.
7. Vacía almacenamiento con `Application > Storage > Clear site data` y repite.

### DevTools Performance
1. Abre `DevTools > Performance`.
2. En Mobile o Responsive, activa la captura de red y CPU.
3. Configura CPU: `6x slowdown` y Network: `Slow 3G`.
4. Pulsa `Record`, carga la página desde cero y espera a que termine la carga.
5. Reproduce una interacción: enviar mensaje, activar GPS y activar cámara.
6. Detén la captura y marca LCP, Long Tasks, Layout Shifts y el INP de la interacción.
7. Abre `Performance insights` o `Rendering > Layout Shift Regions` para localizar saltos.

## Actividad 4: Prueba de estres

1. Sin caché ni datos previos, abre una ventana Incógnito.
2. Ejecuta línea base con CPU normal y red normal.
3. Ejecuta CPU `6x slowdown` y Network `Slow 3G`.
4. Carga desde `sw.js` desregistrado para medir la primera visita, después repite con el Service Worker activo.
5. Mide la carga y luego:
   - envía cinco mensajes;
   - activa el GPS;
   - activa la cámara;
   - captura una foto.
6. Exporta capturas de PageSpeed, Lighthouse y Performance.

Impacto esperado bajo CPU 6x + 3G:
- LCP empeora por descarga tardía de CSS, fuentes e imágenes; el objetivo sigue siendo <= 2.5 s en la red real configurada.
- INP puede aumentar por JavaScript externo, `JSON.stringify`, `toDataURL`, listeners pesados y procesamiento síncrono de imágenes.
- CLS aumenta si avatares, video o fotos no reservan altura/ancho o cambian el DOM al cargar recursos.

## Evidencia RUM

Durante la interacción:
1. Abre `Console`.
2. Confirma filas con `onLCP`, `onINP` y `onCLS` mediante `console.table`.
3. Abre `Application > IndexedDB > PWA_RUM_MetricsDB > metrics`.
4. Exporta o captura las filas con `timestamp`, métrica, valor, rating, acción y elemento afectado.

## Tabla comparativa

| Métrica / aspecto | Línea base | CPU 6x + 3G | Post-optimización | Evidencia |
|---|---:|---:|---:|---|
| LCP (s) | ___ | ___ | ___ | Captura ___ |
| INP (ms) | ___ | ___ | ___ | Captura ___ |
| CLS | ___ | ___ | ___ | Captura ___ |
| TBT (ms) | ___ | ___ | ___ | Captura ___ |
| Lighthouse Performance | ___ | ___ | ___ | Captura ___ |
| Lighthouse Accesibilidad | ___ | ___ | ___ | Captura ___ |
| Lighthouse SEO | ___ | ___ | ___ | Captura ___ |
| Lighthouse PWA / Installable | ___ | ___ | ___ | Captura ___ |
| LCP afectado por | ___ | ___ | ___ | Elemento ___ |
| INP afectado por | ___ | ___ | ___ | Interacción ___ |
| CLS afectado por | ___ | ___ | ___ | Elemento ___ |

## Criterios de aceptación

- LCP <= 2.5 s.
- INP <= 200 ms.
- CLS <= 0.1.
- El manifest no muestra errores de iconos, `id`, `start_url` o `display`.
- El banner aparece únicamente después de `beforeinstallprompt`.
- Al aceptar o rechazar la instalación, el banner se oculta.
- `appinstalled` oculta el banner permanentemente durante esa sesión.
