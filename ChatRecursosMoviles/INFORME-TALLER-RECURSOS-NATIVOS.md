# Informe - Taller: Recursos Nativos en Dispositivos Móviles 3

## 1. Ingreso y acceso a los demos

Los demos se tomaron como referencia de [What PWA Can Do Today](https://whatpwacando.today/) y se implementaron con APIs nativas del navegador dentro de **Chat para superheroes**.

### Pasos generales

1. Ejecutar el proyecto con `npm start`.
2. Abrir `http://localhost:3000` en el mismo computador.
3. Seleccionar uno de los personajes.
4. Abrir el panel **Capacidades del dispositivo**.
5. Presionar el botón del demo que se desea probar.
6. Aceptar los permisos solicitados por el navegador.

Para probar en un teléfono se recomienda utilizar HTTPS. Las APIs de cámara, micrófono, sensores, autenticación y captura de pantalla pueden requerir un contexto seguro. Algunas APIs experimentales solo funcionan en determinados navegadores.

---

## 2. Instalación como aplicación PWA

La aplicación cuenta con el archivo [public/manifest.json](public/manifest.json), que define el nombre, iconos, colores, orientación, pantalla inicial y modo independiente. El Service Worker también precarga el manifest y los iconos principales para que la instalación tenga los recursos básicos disponibles.

### Probar en computador

1. Ejecutar `npm start`.
2. Abrir `http://localhost:3000` en Chrome o Edge.
3. Seleccionar el icono **Instalar** en la barra de direcciones, o abrir el menú del navegador y elegir **Instalar Chat para superheroes**.
4. Confirmar la instalación.
5. Abrir la aplicación desde el menú de aplicaciones y seleccionar un personaje.

### Probar en un teléfono Android

1. Ejecutar el servidor en un equipo conectado a la misma red Wi-Fi que el teléfono.
2. Para una prueba rápida con Android y USB, activar la depuración USB y ejecutar `adb reverse tcp:3000 tcp:3000`; después abrir `http://localhost:3000` en Chrome del teléfono.
3. Si se usa Wi-Fi, identificar la IP local del equipo y abrir `http://IP_DEL_EQUIPO:3000`. Esta dirección permite ver la página, pero normalmente no permite cámara, micrófono, sensores, biometría, Service Worker ni instalación PWA porque es HTTP.
4. Para una prueba completa por Wi-Fi, publicar el proyecto con HTTPS y abrir el enlace forwarded `https://...`. El certificado debe ser confiable para el teléfono.
5. En Chrome Android abrir el menú y seleccionar **Instalar aplicación** o **Agregar a pantalla principal**.
6. Abrir la aplicación instalada y probar cada botón del panel.

`localhost` suele considerarse un contexto seguro. Una dirección HTTP basada en una IP local no es suficiente para probar todas las demos. Si se abre la aplicación por HTTP en un teléfono, el panel muestra explícitamente que se requiere HTTPS.

En Chrome Android, la captura de pantalla mediante `getDisplayMedia()` puede no estar implementada aunque la aplicación esté en HTTPS. En ese caso el demo informa que la API no está disponible; debe evidenciarse en un navegador de escritorio compatible.

### Verificar que la PWA es instalable

En Chrome:

1. Abrir DevTools con `F12`.
2. Entrar en **Application > Manifest** y comprobar nombre, iconos, `start_url` y `display`.
3. Entrar en **Application > Service Workers** y verificar que `sw.js` esté registrado y activo.
4. Revisar **Installability** para identificar requisitos faltantes.

---

## 3. Demo 1: Authentication

### Objetivo

Implementar autenticación biométrica mediante WebAuthn, utilizando el autenticador disponible en el dispositivo, por ejemplo huella digital, reconocimiento facial o PIN del sistema.

### Implementación

El botón **Autenticación biométrica** se encuentra en el panel de capacidades. Al presionarlo se genera un reto criptográfico y se solicita un autenticador de plataforma con verificación de usuario obligatoria.

### Fragmento de código

Archivo: `public/js/app.js`

```javascript
$('#biometria-btn').on('click', function() {
    if (!window.PublicKeyCredential || !navigator.credentials) {
        apiNoDisponible('La autenticación biométrica');
        return;
    }

    var reto = new Uint8Array(32);
    window.crypto.getRandomValues(reto);

    navigator.credentials.create({
        publicKey: {
            challenge: reto,
            authenticatorSelection: {
                authenticatorAttachment: 'platform',
                userVerification: 'required'
            }
        }
    }).then(function() {
        mostrarAviso('Autenticación biométrica completada.', 'info');
    });
});
```

### Cómo evidenciarlo

1. Presionar **Autenticación biométrica**.
2. Mostrar en la captura o video el diálogo nativo de huella, rostro o PIN.
3. Completar la autenticación.
4. Capturar el mensaje **“Autenticación biométrica completada”**.

---

## 4. Demo 2: Face detection

### Objetivo

Detectar un rostro utilizando la cámara del dispositivo y la API `FaceDetector`.

### Implementación

El botón **Detectar rostro** solicita acceso a la cámara, toma un fotograma del video y lo procesa con `FaceDetector.detect()`.

### Fragmento de código

Archivo: `public/js/app.js`

```javascript
$('#rostro-btn').on('click', function() {
    detectarDesdeCamara('FaceDetector');
});

var detector = new FaceDetector();
var lienzo = document.createElement('canvas');
lienzo.getContext('2d').drawImage(videoElement, 0, 0);

detector.detect(lienzo).then(function(resultados) {
    mostrarAviso(
        resultados.length ? 'Rostro detectado.' : 'No se detectaron rostros.',
        'info'
    );
});
```

### Cómo evidenciarlo

1. Presionar **Detectar rostro**.
2. Conceder permiso para usar la cámara.
3. Colocar el rostro frente a la cámara.
4. Capturar el aviso **“Rostro detectado”**.

Si el navegador no implementa `FaceDetector`, se debe capturar el mensaje que informa que la API no está disponible.

---

## 5. Demo 3: Barcode detection

### Objetivo

Leer códigos QR, EAN-13 o Code 128 usando la cámara del dispositivo.

### Implementación

El botón **Escanear código** usa la cámara trasera y ejecuta `BarcodeDetector` sobre un fotograma.

### Fragmento de código

Archivo: `public/js/app.js`

```javascript
$('#codigo-btn').on('click', function() {
    detectarDesdeCamara('BarcodeDetector');
});

var detector = new BarcodeDetector({
    formats: ['qr_code', 'ean_13', 'code_128']
});

detector.detect(lienzo).then(function(resultados) {
    if (resultados.length) {
        mostrarAviso('Código detectado: ' + resultados[0].rawValue, 'info');
    }
});
```

### Cómo evidenciarlo

1. Mostrar un código QR o de barras en otro teléfono o en una pantalla.
2. Presionar **Escanear código**.
3. Aceptar el permiso de cámara.
4. Verificar que aparece la pantalla de cámara del lector con el recuadro verde, incluso si el navegador no soporta `BarcodeDetector`.
5. Colocar el código dentro del recuadro; el lector realiza intentos continuos.
6. Capturar el mensaje con el valor leído.
7. Presionar **Cerrar cámara** cuando se termine la prueba.

Si la API no está disponible, la vista de cámara permanece visible y muestra el aviso de compatibilidad; esto también permite evidenciar claramente la limitación del navegador.

---

## 6. Demo 4: Screen capture

### Objetivo

Capturar la pantalla, una ventana o una pestaña del navegador y mostrar la previsualización dentro de la aplicación.

### Implementación

Se utiliza `getDisplayMedia()` y, cuando el navegador lo permite, se configura un identificador de captura mediante Capture Handle.

### Fragmento de código

Archivo: `public/js/app.js`

```javascript
navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false
}).then(function(stream) {
    $('#captura-pantalla-video')
        .removeClass('oculto')
        .prop('srcObject', stream);

    if (navigator.mediaDevices.setCaptureHandleConfig) {
        navigator.mediaDevices.setCaptureHandleConfig({
            handle: 'chat-superheroes',
            exposeOrigin: true
        });
    }
});
```

### Cómo evidenciarlo

1. Presionar **Capturar pantalla**.
2. Seleccionar una pantalla, ventana o pestaña.
3. Aceptar el permiso del navegador.
4. Capturar la previsualización que aparece en el panel.
5. Para el video, mostrar también cómo se detiene la captura desde el navegador.

---

## 7. Demo 5: Audio Recording

### Objetivo

Grabar audio desde el micrófono y reproducir el resultado dentro de la aplicación.

### Implementación

El botón **Grabar audio** solicita el micrófono y utiliza `MediaRecorder`. Al detener la grabación, se crea un objeto de audio reproducible.

### Fragmento de código

Archivo: `public/js/app.js`

```javascript
audioGrabador = new MediaRecorder(stream);
audioPartes = [];

audioGrabador.ondataavailable = function(evento) {
    if (evento.data.size) audioPartes.push(evento.data);
};

audioGrabador.onstop = function() {
    var audio = new Blob(audioPartes, {
        type: audioGrabador.mimeType || 'audio/webm'
    });
    $('#audio-grabado')
        .removeClass('oculto')
        .prop('src', URL.createObjectURL(audio));
};

audioGrabador.start();
```

### Cómo evidenciarlo

1. Presionar **Grabar audio**.
2. Aceptar el permiso del micrófono.
3. Hablar durante algunos segundos.
4. Presionar **Detener audio**.
5. Capturar el reproductor de audio y reproducirlo.

---

## 8. Demo 6: Orientation

### Objetivo

Obtener la orientación del dispositivo y mostrar los valores de rotación.

### Implementación

El botón **Activar orientación** escucha el evento `deviceorientation`. En dispositivos que lo requieren, también solicita el permiso de sensores.

### Fragmento de código

Archivo: `public/js/app.js`

```javascript
window.addEventListener('deviceorientation', function(evento) {
    pintarSensores(
        'Orientación\n' +
        'Alfa: ' + Math.round(evento.alpha || 0) + '°  ' +
        'Beta: ' + Math.round(evento.beta || 0) + '°  ' +
        'Gamma: ' + Math.round(evento.gamma || 0) + '°'
    );
});
```

### Cómo evidenciarlo

1. Presionar **Activar orientación**.
2. Aceptar el permiso de sensores si aparece.
3. Girar e inclinar el teléfono.
4. Capturar los valores Alfa, Beta y Gamma cambiando en pantalla.
5. Presionar **Detener orientación** para finalizar el demo.

La orientación y el movimiento son modos exclusivos: al activar uno, el otro se detiene para evitar que ambos escriban simultáneamente en el mismo bloque de resultados.

---

## 9. Demo 7: Motion

### Objetivo

Detectar el movimiento del dispositivo mediante los valores de aceleración.

### Implementación

El botón **Activar movimiento** registra el evento `devicemotion` y muestra los valores X, Y y Z.

### Fragmento de código

Archivo: `public/js/app.js`

```javascript
window.addEventListener('devicemotion', function(evento) {
    var aceleracion = evento.accelerationIncludingGravity || {};

    pintarSensores(
        'Movimiento\n' +
        'X: ' + Math.round(aceleracion.x || 0) + '  ' +
        'Y: ' + Math.round(aceleracion.y || 0) + '  ' +
        'Z: ' + Math.round(aceleracion.z || 0)
    );
});
```

### Cómo evidenciarlo

1. Presionar **Activar movimiento**.
2. Aceptar el permiso de sensores.
3. Mover o agitar suavemente el dispositivo.
4. Capturar los valores X, Y y Z actualizándose.
5. Presionar **Detener movimiento** para finalizar el demo.

---

## 10. Demo 8: Multitouch

### Objetivo

Detectar simultáneamente varios puntos de contacto en la pantalla.

### Implementación

Se agregó un área táctil en el panel. El número de dedos se obtiene mediante `event.touches.length`.

### Fragmento de código

Archivo: `public/js/app.js`

```javascript
$('#multi-touch-area').on(
    'touchstart touchmove touchend touchcancel',
    function(evento) {
        evento.preventDefault();
        $('#multi-touch-estado').text(
            evento.originalEvent.touches.length +
            ' puntos de contacto'
        );
    }
);
```

### Cómo evidenciarlo

1. Buscar el recuadro **Toca aquí con uno o más dedos**.
2. Colocar dos o más dedos simultáneamente.
3. Capturar el texto **“2 puntos de contacto”** o un número mayor.
4. Retirar los dedos y evidenciar que el contador vuelve a cero.

---

## 11. Demo 9: ViewTransition

### Objetivo

Aplicar una transición visual al cambiar el estado del panel, utilizando View Transition API cuando está disponible.

### Implementación

El botón **Ver transición** cambia el estado visual del panel. En navegadores compatibles, el cambio se envuelve con `document.startViewTransition()`. También existe un fallback para navegadores que no tienen la API.

### Fragmento de código

Archivo: `public/js/app.js`

```javascript
var cambiar = function() {
    var activa = $('#transicion-btn').text().indexOf('activa') === -1;
    $('#transicion-btn').text(
        activa ? 'Transición activa' : 'Ver transición'
    );
    $('#capacidades-panel').toggleClass('transicion-activa', activa);
};

if (document.startViewTransition) {
    document.startViewTransition(cambiar);
} else {
    cambiar();
}
```

### Cómo evidenciarlo

1. Presionar **Ver transición**.
2. Grabar un video corto donde se observe el cambio visual.
3. Capturar el panel con el botón **Transición activa** y el borde resaltado.
4. Volver a presionar el botón para mostrar el estado original.

---

## 12. Archivos modificados

- [public/index.html](public/index.html): botones, área multitouch, reproductor de audio, video de captura y estado de sensores.
- [public/js/app.js](public/js/app.js): lógica de los nueve demos y manejo de permisos/errores.
- [public/css/style.css](public/css/style.css): estilos de previsualizaciones, multitouch, sensores y transición.

## 13. Checklist de evidencias

- [ ] Panel de capacidades con los nueve demos visibles.
- [ ] Autenticación biométrica completada.
- [ ] Rostro detectado.
- [ ] Código QR o de barras leído.
- [ ] Pantalla capturada y previsualizada.
- [ ] Audio grabado y reproducido.
- [ ] Valores de orientación cambiando.
- [ ] Valores de movimiento cambiando.
- [ ] Multitouch con dos o más dedos.
- [ ] Video corto de ViewTransition.

## 14. Limitaciones

El resultado depende del navegador, sistema operativo, permisos y hardware. `FaceDetector`, `BarcodeDetector`, Capture Handle y algunos sensores son APIs experimentales o de disponibilidad limitada. Cuando una API no existe o el usuario rechaza el permiso, la aplicación muestra un aviso explícito en lugar de simular un resultado.
