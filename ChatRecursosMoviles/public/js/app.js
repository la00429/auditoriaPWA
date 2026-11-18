
var url = window.location.href;
var swLocation = '/sw.js';

var swReg;

if ( navigator.serviceWorker ) {


    if ( url.includes('localhost') ) {
        swLocation = '/sw.js';
    }


    window.addEventListener('load', function() {

        navigator.serviceWorker.register( swLocation ).then( function(reg){

            swReg = reg;
            swReg.pushManager.getSubscription().then( verificaSuscripcion ).catch(function(error) {
                console.warn('No se pudo consultar la suscripción push:', error);
            });

        }).catch(function(error) {
            console.error('No se pudo registrar el Service Worker:', error);
        });

    });

}





// Referencias de jQuery
var googleMapKey = 'AIzaSyA5mjCwx1TRLuBAjwQw84WE6h5ErSe7Uj8';

var titulo      = $('#titulo');
var nuevoBtn    = $('#nuevo-btn');
var salirBtn    = $('#salir-btn');
var cancelarBtn = $('#cancel-btn');
var postBtn     = $('#post-btn');
var avatarSel   = $('#seleccion');
var timeline    = $('#timeline');

var modal       = $('#modal');
var modalAvatar = $('#modal-avatar');
var avatarBtns  = $('.seleccion-avatar');
var txtMensaje  = $('#txtMensaje');

var btnActivadas    = $('.btn-noti-activadas');
var btnDesactivadas = $('.btn-noti-desactivadas');

var capacidadesPanel = $('#capacidades-panel');
var capacidadesAyuda = $('#capacidades-ayuda');
var wakeLock = null;
var wakeLockPreferido = localStorage.getItem('chat-wake-lock') === 'true';

var btnLocation      = $('#location-btn');

var modalMapa        = $('.modal-mapa');

var btnTomarFoto     = $('#tomar-foto-btn');
var btnPhoto         = $('#photo-btn');
var contenedorCamara = $('.camara-contenedor');

var lat  = null;
var lng  = null; 
var foto = null; 
var ubicacionActual = null;
var watchId = null;
var videoGrabado = null;

var videoElement = document.getElementById('player');
var iniciarCamaraBtn = $('#iniciar-camara-btn');
var grabarVideoBtn = $('#grabar-video-btn');
var detenerVideoBtn = $('#detener-video-btn');
var videoResultado = document.getElementById('video-result');

function escapeHtml(valor) {
    return String(valor == null ? '' : valor).replace(/[&<>"']/g, function(caracter) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[caracter];
    });
}

// El usuario, contiene el ID del héroe seleccionado
var usuario;

// Init de la camara class
const camara = new Camara( $('#player')[0] );

// ===== Codigo de la aplicación

function crearMensajeHTML(mensaje, personaje, lat, lng, foto, video) {

    // console.log(mensaje, personaje, lat, lng);

    var content =`
    <li class="animated fadeIn fast"
        data-user="${ personaje }"
        data-mensaje="${ encodeURIComponent(mensaje || '') }"
        data-tipo="mensaje">


        <div class="avatar">
            <img src="img/avatars/${ personaje }.jpg">
        </div>
        <div class="bubble-container">
            <div class="bubble">
                <h3>@${ personaje }</h3>
                <br/>
                ${ escapeHtml(mensaje) }
                <div class="mensaje-acciones">
                    <button type="button" data-accion-mensaje="copiar"><i class="fa fa-copy"></i> Copiar</button>
                    <button type="button" data-accion-mensaje="compartir"><i class="fa fa-share-alt"></i> Compartir</button>
                </div>
                `;
    
    if ( foto ) {
        content += `
                <br>
                <img class="foto-mensaje" src="${ foto }">
        `;
    }

    if ( video ) {
        content += `
                <br>
                <video class="video-mensaje" controls preload="metadata">
                    <source src="${ video }" type="video/webm">
                    Tu navegador no puede reproducir este video.
                </video>
        `;
    }
        
    content += `</div>        
                <div class="arrow"></div>
            </div>
        </li>
    `;

    
    // si existe la latitud y longitud, 
    // llamamos la funcion para crear el mapa
    if ( lat ) {
        crearMensajeMapa( lat, lng, personaje );
    }
    
    // Borramos la latitud y longitud por si las usó
    lat = null;
    lng = null;

    $('.modal-mapa').remove();

    timeline.prepend(content);
    cancelarBtn.click();

}

function crearMensajeMapa(lat, lng, personaje) {


    let content = `
    <li class="animated fadeIn fast"
        data-tipo="mapa"
        data-user="${ personaje }"
        data-lat="${ lat }"
        data-lng="${ lng }">
                <div class="avatar">
                    <img src="img/avatars/${ personaje }.jpg">
                </div>
                <div class="bubble-container">
                    <div class="bubble">
                        <iframe
                            width="100%"
                            height="250"
                            frameborder="0" style="border:0"
                            src="https://www.google.com/maps/embed/v1/view?key=${ googleMapKey }&center=${ lat },${ lng }&zoom=17" allowfullscreen>
                            </iframe>
                            <div class="mensaje-acciones">
                                <button type="button" data-accion-mensaje="compartir"><i class="fa fa-share-alt"></i> Compartir ubicación</button>
                            </div>
                    </div>
                    
                    <div class="arrow"></div>
                </div>
            </li> 
    `;

    timeline.prepend(content);
}




// Globals
function logIn( ingreso ) {

    if ( ingreso ) {
        nuevoBtn.removeClass('oculto');
        salirBtn.removeClass('oculto');
        timeline.removeClass('oculto');
        avatarSel.addClass('oculto');
        capacidadesPanel.removeClass('oculto');
        modalAvatar.attr('src', 'img/avatars/' + usuario + '.jpg');
    } else {
        nuevoBtn.addClass('oculto');
        salirBtn.addClass('oculto');
        timeline.addClass('oculto');
        avatarSel.removeClass('oculto');
        capacidadesPanel.addClass('oculto');

        titulo.text('Seleccione Personaje');
    
    }

}


// Seleccion de personaje
avatarBtns.on('click', function() {

    usuario = $(this).data('user');

    titulo.text('@' + usuario);

    logIn(true);

});

// Boton de salir
salirBtn.on('click', function() {

    logIn(false);

});

// Boton de nuevo mensaje
nuevoBtn.on('click', function() {

    modal.removeClass('oculto');
    modal.animate({ 
        marginTop: '-=1000px',
        opacity: 1
    }, 200 );

});


// Boton de cancelar mensaje
cancelarBtn.on('click', function() {

    if ( !modal.hasClass('oculto') ) {
        modal.animate({ 
            marginTop: '+=1000px',
            opacity: 0
         }, 200, function() {
             modal.addClass('oculto');
             modalMapa.addClass('oculto');
             txtMensaje.val('');
             videoGrabado = null;
             videoResultado.removeAttribute('src');
             videoResultado.classList.add('oculto');
             grabarVideoBtn.removeClass('oculto');
             detenerVideoBtn.addClass('oculto');
             detenerSeguimientoUbicacion();
             camara.apagar();
         });
    }

});

// Boton de enviar mensaje
function blobComoDataUrl(blob) {
    if (!blob) return Promise.resolve(null);

    return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onloadend = function() {
            resolve(reader.result);
        };
        reader.onerror = function() {
            reject(new Error('No se pudo preparar el video para enviarlo.'));
        };
        reader.readAsDataURL(blob);
    });
}

postBtn.on('click', function() {

    var mensaje = txtMensaje.val();
    if ( mensaje.length === 0 ) {
        cancelarBtn.click();
        return;
    }

    blobComoDataUrl(videoGrabado).then(function(video) {
        var data = {
            mensaje: mensaje,
            user: usuario,
            lat: lat,
            lng: lng,
            foto: foto,
            video: video
        };

        return fetch('api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        }).then(function(res) {
            if (!res.ok) throw new Error('El servidor rechazó el mensaje.');
            return res.json();
        }).then(function() {
            crearMensajeHTML(mensaje, usuario, lat, lng, foto, video);
            foto = null;
            videoGrabado = null;
            detenerSeguimientoUbicacion();
            camara.apagar();
        });
    }).catch(function(error) {
        mostrarAviso('No se pudo enviar el mensaje: ' + error.message, 'warning');
    });
});



// Obtener mensajes del servidor
function getMensajes() {

    fetch('api')
        .then( res => res.json() )
        .then( posts => {

            console.log(posts);

            posts.forEach( post => 
                crearMensajeHTML( post.mensaje, post.user, post.lat, post.lng, post.foto, post.video ));
        });


}

getMensajes();



// Detectar cambios de conexión
function isOnline() {

    if ( navigator.onLine ) {
        // tenemos conexión
        // console.log('online');
        $.mdtoast('Online', {
            interaction: true,
            interactionTimeout: 1000,
            actionText: 'OK!'
        });


    } else{
        // No tenemos conexión
        $.mdtoast('Offline', {
            interaction: true,
            actionText: 'OK',
            type: 'warning'
        });
    }

}

window.addEventListener('online', isOnline );
window.addEventListener('offline', isOnline );

isOnline();


// Notificaciones
function verificaSuscripcion( activadas ) {

    if ( activadas ) {
        
        btnActivadas.removeClass('oculto');
        btnDesactivadas.addClass('oculto');

    } else {
        btnActivadas.addClass('oculto');
        btnDesactivadas.removeClass('oculto');
    }

}



function enviarNotificacion() {

    const notificationOpts = {
        body: 'Este es el cuerpo de la notificación',
        icon: 'img/icons/icon-72x72.png'
    };


    const n = new Notification('Hola Mundo', notificationOpts);

    n.onclick = () => {
        console.log('Click');
    };

}


function notificarme() {

    if ( !window.Notification ) {
        console.log('Este navegador no soporta notificaciones');
        return;
    }

    if ( Notification.permission === 'granted' ) {
        
        // new Notification('Hola Mundo! - granted');
        enviarNotificacion();

    } else if ( Notification.permission !== 'denied' || Notification.permission === 'default' )  {

        Notification.requestPermission( function( permission ) {

            console.log( permission );

            if ( permission === 'granted' ) {
                // new Notification('Hola Mundo! - pregunta');
                enviarNotificacion();
            }

        });

    }



}

// notificarme();


// Get Key
function getPublicKey() {

    // fetch('api/key')
    //     .then( res => res.text())
    //     .then( console.log );

    return fetch('api/key')
        .then( res => res.arrayBuffer())
        // returnar arreglo, pero como un Uint8array
        .then( key => new Uint8Array(key) );


}

// getPublicKey().then( console.log );
btnDesactivadas.on( 'click', function() {

    if ( !swReg ) return console.log('No hay registro de SW');

    getPublicKey().then( function( key ) {

        swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: key
        })
        .then( res => res.toJSON() )
        .then( suscripcion => {

            // console.log(suscripcion);
            fetch('api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify( suscripcion )
            })
            .then( verificaSuscripcion )
            .catch( cancelarSuscripcion );


        });


    });


});



function cancelarSuscripcion() {

    swReg.pushManager.getSubscription().then( subs => {

        subs.unsubscribe().then( () =>  verificaSuscripcion(false) );

    });


}

btnActivadas.on( 'click', function() {

    cancelarSuscripcion();


});


// Recursos nativos
var GEO_TIMEOUT = 10000;
var GEO_MAXIMUM_AGE = 60000;
var geolocalizacionEnCurso = false;

function mostrarAviso(mensaje, tipo) {
    $.mdtoast(mensaje, {
        interaction: true,
        interactionTimeout: 3000,
        actionText: 'OK',
        type: tipo || 'info'
    });
}

function geolocalizacionDisponible() {
    if (!('geolocation' in navigator)) {
        mostrarAviso('Este navegador no permite geolocalización.', 'warning');
        return false;
    }
    if (window.isSecureContext === false && !window.location.hostname.includes('localhost')) {
        mostrarAviso('La geolocalización requiere HTTPS o localhost.', 'warning');
        return false;
    }
    return true;
}

function mensajeErrorGeolocalizacion(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            return 'Permiso de ubicación denegado. Actívalo en el navegador para mostrar el mapa.';
        case error.POSITION_UNAVAILABLE:
            return 'No fue posible determinar la ubicación del dispositivo.';
        case error.TIMEOUT:
            return 'Se agotó el tiempo de espera para obtener la ubicación.';
        default:
            return 'Ocurrió un error desconocido al obtener la ubicación.';
    }
}

function actualizarMapaModal(latitude, longitude) {
    var iframe = $('.modal-mapa iframe')[0];
    if (iframe) {
        iframe.src = 'https://www.google.com/maps/embed/v1/view?key=' + googleMapKey +
            '&center=' + latitude + ',' + longitude + '&zoom=17';
    }
}

function mostrarMapaModal(latitude, longitude) {
    $('.modal-mapa').remove();

    var content = '<div class="modal-mapa">' +
        '<iframe width="100%" height="250" frameborder="0" style="border:0" ' +
        'title="Mapa de ubicación" src="https://www.google.com/maps/embed/v1/view?key=' +
        googleMapKey + '&center=' + latitude + ',' + longitude + '&zoom=17"></iframe>' +
        '<p class="mapa-estado">Cargando mapa...</p></div>';

    modal.append(content);
    var mapa = $('.modal-mapa');
    var iframe = mapa.find('iframe')[0];
    var timeoutId = window.setTimeout(function() {
        if (mapa.find('.mapa-estado').text() === 'Cargando mapa...') {
            mapa.find('.mapa-estado').text('El mapa tardó demasiado en cargar.');
        }
    }, GEO_TIMEOUT);

    iframe.onload = function() {
        window.clearTimeout(timeoutId);
        mapa.find('.mapa-estado').remove();
    };
    iframe.onerror = function() {
        window.clearTimeout(timeoutId);
        mapa.find('.mapa-estado').text('No se pudo cargar el mapa.');
    };
}

function guardarUbicacion(position) {
    ubicacionActual = position;
    lat = position.coords.latitude;
    lng = position.coords.longitude;
    actualizarMapaModal(lat, lng);
}

function detenerSeguimientoUbicacion() {
    if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

function iniciarSeguimientoUbicacion() {
    if (watchId !== null || !geolocalizacionDisponible()) return;

    watchId = navigator.geolocation.watchPosition(function(position) {
        guardarUbicacion(position);
    }, function(error) {
        mostrarAviso('No se pudo actualizar la ubicación: ' + mensajeErrorGeolocalizacion(error), 'warning');
    }, {
        enableHighAccuracy: true,
        timeout: GEO_TIMEOUT,
        maximumAge: GEO_MAXIMUM_AGE
    });
}

function obtenerUbicacion() {
    if (!geolocalizacionDisponible()) return;
    if (geolocalizacionEnCurso) {
        mostrarAviso('Ya se está solicitando la ubicación.', 'info');
        return;
    }

    if (ubicacionActual && Date.now() - ubicacionActual.timestamp <= GEO_MAXIMUM_AGE) {
        mostrarMapaModal(ubicacionActual.coords.latitude, ubicacionActual.coords.longitude);
        guardarUbicacion(ubicacionActual);
        mostrarAviso('Se reutilizó una ubicación de menos de 60 segundos.', 'info');
        iniciarSeguimientoUbicacion();
        return;
    }

    geolocalizacionEnCurso = true;
    mostrarAviso('Solicitando permiso y ubicación...', 'info');
    navigator.geolocation.getCurrentPosition(function(position) {
        geolocalizacionEnCurso = false;
        guardarUbicacion(position);
        mostrarMapaModal(lat, lng);
        mostrarAviso('Ubicación obtenida. El mapa se actualizará si te desplazas.', 'info');
        iniciarSeguimientoUbicacion();
    }, function(error) {
        if (error.code !== error.PERMISSION_DENIED) {
            navigator.geolocation.getCurrentPosition(function(position) {
                geolocalizacionEnCurso = false;
                guardarUbicacion(position);
                mostrarMapaModal(lat, lng);
                mostrarAviso('Ubicación obtenida en modo estándar.', 'info');
                iniciarSeguimientoUbicacion();
            }, function(errorEstandar) {
                geolocalizacionEnCurso = false;
                mostrarAviso(mensajeErrorGeolocalizacion(errorEstandar), 'warning');
            }, {
                enableHighAccuracy: false,
                timeout: GEO_TIMEOUT,
                maximumAge: GEO_MAXIMUM_AGE
            });
            return;
        }
        geolocalizacionEnCurso = false;
        mostrarAviso(mensajeErrorGeolocalizacion(error), 'warning');
    }, {
        enableHighAccuracy: true,
        timeout: GEO_TIMEOUT,
        maximumAge: GEO_MAXIMUM_AGE
    });
}

btnLocation.on('click', obtenerUbicacion);

cancelarBtn.on('click', detenerSeguimientoUbicacion);

btnPhoto.on('click', function() {
    contenedorCamara.removeClass('oculto');
    camara.encender().catch(function(error) {
        mostrarAviso('No se pudo activar la cámara: ' + error.message, 'warning');
        contenedorCamara.addClass('oculto');
    });
});

btnTomarFoto.on('click', function() {
    try {
        foto = camara.tomarFoto();
        mostrarAviso('Foto capturada. Puedes continuar grabando el video.', 'info');
    } catch (error) {
        mostrarAviso('No se pudo tomar la foto: ' + error.message, 'warning');
    }
});

iniciarCamaraBtn.on('click', function() {
    camara.encender().then(function() {
        mostrarAviso('Cámara activada.', 'info');
    }).catch(function(error) {
        mostrarAviso('No se pudo activar la cámara: ' + error.message, 'warning');
    });
});

grabarVideoBtn.on('click', function() {
    try {
        camara.iniciarGrabacionWebM();
        grabarVideoBtn.addClass('oculto');
        detenerVideoBtn.removeClass('oculto');
    } catch (error) {
        mostrarAviso('No se pudo iniciar la grabación WebM: ' + error.message, 'warning');
    }
});

detenerVideoBtn.on('click', function() {
    camara.detenerGrabacion().then(function(blob) {
        if (!blob) return;
        videoGrabado = blob;
        videoResultado.src = URL.createObjectURL(blob);
        videoResultado.classList.remove('oculto');
        grabarVideoBtn.removeClass('oculto');
        detenerVideoBtn.addClass('oculto');
    }).catch(function(error) {
        mostrarAviso('No se pudo finalizar el video: ' + error.message, 'warning');
    });
});

timeline.on('click', 'li', function(evento) {
    if ($(evento.target).closest('[data-accion-mensaje]').length) return;
    var tipo = $(this).data('tipo');
    var mensaje = decodificarMensaje($(this));
    var shareOpts = {
        title: $(this).data('user'),
        text: tipo === 'mapa' ? 'Mapa' : mensaje
    };

    if (tipo === 'mapa') {
        shareOpts.url = 'https://www.google.com/maps/@' +
            $(this).data('lat') + ',' + $(this).data('lng') + ',15z';
    }

    if (!navigator.share) {
        mostrarAviso('Este navegador no permite compartir.', 'warning');
        return;
    }
    navigator.share(shareOpts).catch(function(error) {
        console.log('Error sharing', error);
    });
});

    function decodificarMensaje(elemento) {
        try {
            return decodeURIComponent(elemento.attr('data-mensaje') || '');
        } catch (error) {
            return elemento.attr('data-mensaje') || '';
        }
    }

    function datosMensajesDesdeTimeline() {
        return $('#timeline > li').map(function() {
            var elemento = $(this);
            var tipo = elemento.data('tipo');
            var mensaje = {
                tipo: tipo,
                user: elemento.data('user'),
                mensaje: tipo === 'mapa' ? '' : decodificarMensaje(elemento),
                exportadoEn: new Date().toISOString()
            };
            if (tipo === 'mapa') {
                mensaje.lat = Number(elemento.attr('data-lat'));
                mensaje.lng = Number(elemento.attr('data-lng'));
            } else {
                var imagen = elemento.find('.foto-mensaje').attr('src');
                var video = elemento.find('.video-mensaje source').attr('src');
                if (imagen) mensaje.foto = imagen;
                if (video) mensaje.video = video;
            }
            return mensaje;
        }).get();
    }

    function descargarArchivo(nombre, contenido, tipo) {
        var enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(new Blob([contenido], {type: tipo}));
        enlace.download = nombre;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        window.setTimeout(function() {
            URL.revokeObjectURL(enlace.href);
        }, 1000);
    }

    function compartir(opciones) {
        if (!navigator.share) {
            mostrarAviso('Web Share API no está disponible en este navegador.', 'warning');
            return Promise.resolve(false);
        }
        return navigator.share(opciones).then(function() {
            mostrarAviso('Contenido compartido.', 'info');
            return true;
        }).catch(function(error) {
            if (error.name !== 'AbortError') mostrarAviso('No se pudo compartir: ' + error.message, 'warning');
            return false;
        });
    }

    function obtenerTextoMensaje(elemento) {
        return '@' + elemento.data('user') + ': ' + decodificarMensaje(elemento);
    }

    $('#capacidades-toggle').on('click', function() {
        var oculto = $('.capacidades-acciones').toggleClass('oculto').hasClass('oculto');
        $(this).text(oculto ? 'Mostrar' : 'Ocultar');
    });

    function actualizarEstadoDispositivo() {
        $('#estado-red').text(navigator.onLine ? 'En línea' : 'Sin conexión');
        if (navigator.getBattery) {
            navigator.getBattery().then(function(bateria) {
                function pintarBateria() {
                    $('#estado-bateria').text(Math.round(bateria.level * 100) + '%' +
                        (bateria.charging ? ' (cargando)' : ''));
                }
                pintarBateria();
                bateria.addEventListener('levelchange', pintarBateria);
                bateria.addEventListener('chargingchange', pintarBateria);
            }).catch(function() {
                $('#estado-bateria').text('No disponible');
            });
        }
        if (screen.orientation) {
            $('#estado-orientacion').text(screen.orientation.type);
            screen.orientation.addEventListener('change', function() {
                $('#estado-orientacion').text(screen.orientation.type);
            });
        }
    }

    function activarWakeLock() {
        if (!('wakeLock' in navigator)) {
            mostrarAviso('Screen Wake Lock no está disponible en este navegador.', 'warning');
            return Promise.reject(new Error('Wake Lock no soportado'));
        }
        return navigator.wakeLock.request('screen').then(function(lock) {
            wakeLock = lock;
            wakeLock.addEventListener('release', function() {
                wakeLock = null;
                $('#wake-lock-btn').html('<i class="fa fa-eye"></i> Mantener pantalla activa');
            });
            $('#wake-lock-btn').html('<i class="fa fa-eye-slash"></i> Liberar pantalla activa');
            mostrarAviso('La pantalla permanecerá activa mientras esta página esté visible.', 'info');
            return lock;
        }).catch(function(error) {
            wakeLockPreferido = false;
            localStorage.setItem('chat-wake-lock', 'false');
            mostrarAviso('No se pudo activar la pantalla activa: ' + error.message, 'warning');
            throw error;
        });
    }

    function liberarWakeLock() {
        if (wakeLock) return wakeLock.release();
        return Promise.resolve();
    }

    $('#wake-lock-btn').on('click', function() {
        wakeLockPreferido = !wakeLockPreferido;
        localStorage.setItem('chat-wake-lock', String(wakeLockPreferido));
        if (wakeLockPreferido) activarWakeLock();
        else liberarWakeLock().then(function() {
            mostrarAviso('La pantalla activa fue liberada.', 'info');
        });
    });

    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible' && wakeLockPreferido && !wakeLock) {
            activarWakeLock();
        }
    });

    $('#vibrar-btn').on('click', function() {
        if (!navigator.vibrate) {
            mostrarAviso('La vibración no está disponible en este dispositivo.', 'warning');
            return;
        }
        navigator.vibrate([120, 60, 120]);
        mostrarAviso('Patrón de vibración ejecutado.', 'info');
    });

    $('#pantalla-btn').on('click', function() {
        var elemento = document.documentElement;
        if (!document.fullscreenElement && elemento.requestFullscreen) {
            elemento.requestFullscreen().catch(function(error) {
                mostrarAviso('No se pudo activar pantalla completa: ' + error.message, 'warning');
            });
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        } else {
            mostrarAviso('Pantalla completa no está disponible.', 'warning');
        }
    });

    $('#notificacion-btn').on('click', function() {
        if (!('Notification' in window)) {
            mostrarAviso('Las notificaciones no están disponibles.', 'warning');
            return;
        }
        Notification.requestPermission().then(function(permiso) {
            if (permiso === 'granted') enviarNotificacion();
            else mostrarAviso('El permiso de notificaciones no fue concedido.', 'warning');
        });
    });

    $('#compartir-app-btn').on('click', function() {
        compartir({
            title: 'Chat para superheroes',
            text: 'Estoy usando Chat para superheroes.',
            url: window.location.href
        });
    });

    $('#exportar-btn').on('click', function() {
        var exportacion = {
            aplicacion: 'Chat para superheroes',
            version: 2,
            exportadoEn: new Date().toISOString(),
            mensajes: datosMensajesDesdeTimeline()
        };
        descargarArchivo('mensajes-chat-superheroes.json',
            JSON.stringify(exportacion, null, 2), 'application/json');
        mostrarAviso('Los mensajes se exportaron al dispositivo.', 'info');
    });

    $('#importar-btn').on('click', function() {
        $('#importar-archivo').trigger('click');
    });

    $('#importar-archivo').on('change', function() {
        var archivo = this.files[0];
        if (!archivo) return;
        var lector = new FileReader();
        lector.onload = function() {
            try {
                var datos = JSON.parse(lector.result);
                var mensajesImportados = Array.isArray(datos) ? datos : datos.mensajes;
                if (!Array.isArray(mensajesImportados)) throw new Error('El archivo no contiene mensajes.');
                mensajesImportados.forEach(function(post) {
                    if (post.tipo === 'mapa') crearMensajeMapa(post.lat, post.lng, post.user || usuario);
                    else if (post.mensaje) crearMensajeHTML(post.mensaje, post.user || usuario, post.lat, post.lng, post.foto, post.video);
                });
                mostrarAviso('Se importaron ' + mensajesImportados.length + ' mensajes localmente.', 'info');
            } catch (error) {
                mostrarAviso('No se pudo importar el JSON: ' + error.message, 'warning');
            }
        };
        lector.onerror = function() {
            mostrarAviso('No se pudo leer el archivo seleccionado.', 'warning');
        };
        lector.readAsText(archivo);
        this.value = '';
    });

    timeline.on('click', '[data-accion-mensaje]', function(evento) {
        evento.stopPropagation();
        var boton = $(this);
        var elemento = boton.closest('li');
        var mensaje = elemento.data('tipo') === 'mapa' ? 'Ubicación compartida por @' + elemento.data('user') :
            obtenerTextoMensaje(elemento);
        if (boton.attr('data-accion-mensaje') === 'copiar') {
            if (!navigator.clipboard) {
                mostrarAviso('El portapapeles requiere un contexto seguro (HTTPS o localhost).', 'warning');
                return;
            }
            navigator.clipboard.writeText(mensaje).then(function() {
                mostrarAviso('Mensaje copiado al portapapeles.', 'info');
            }).catch(function(error) {
                mostrarAviso('No se pudo copiar el mensaje: ' + error.message, 'warning');
            });
        } else {
            var opciones = {title: elemento.data('user'), text: mensaje};
            if (elemento.data('tipo') === 'mapa') {
                opciones.url = 'https://www.google.com/maps/@' + elemento.data('lat') + ',' + elemento.data('lng') + ',15z';
            }
            compartir(opciones);
        }
    });

    function obtenerIdentificadorBluetooth(dispositivo) {
        if (dispositivo.name && dispositivo.name.trim()) {
            return dispositivo.name.trim();
        }

        return 'Dispositivo Bluetooth (' + dispositivo.id + ')';
    }

    $('#bluetooth-btn').on('click', function() {
        if (!navigator.bluetooth) {
            mostrarAviso('Web Bluetooth no está disponible. Usa Chrome/Edge en HTTPS o localhost.', 'warning');
            return;
        }
        navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['battery_service']
        }).then(function(dispositivo) {
            capacidadesAyuda.text('Dispositivo seleccionado: ' + obtenerIdentificadorBluetooth(dispositivo));
            return dispositivo.gatt && dispositivo.gatt.connect();
        }).then(function(servidorGatt) {
            if (!servidorGatt) return;
            return servidorGatt.getPrimaryService('battery_service')
                .then(function(servicio) {
                    return servicio.getCharacteristic('battery_level');
                })
                .then(function(caracteristica) {
                    return caracteristica.readValue();
                })
                .then(function(valor) {
                    capacidadesAyuda.text('Bluetooth conectado. Batería GATT: ' + valor.getUint8(0) + '%.');
                }).catch(function() {
                    capacidadesAyuda.text('Bluetooth conectado. El dispositivo no expone batería GATT.');
                });
        }).catch(function(error) {
            if (error.name !== 'NotFoundError') {
                mostrarAviso('No se pudo vincular el dispositivo Bluetooth: ' + error.message, 'warning');
            }
        });
    });

    $('#bluetooth-limpiar-btn').on('click', function() {
        if (!navigator.bluetooth) {
            mostrarAviso('Web Bluetooth no está disponible. Usa Chrome/Edge en HTTPS o localhost.', 'warning');
            return;
        }

        capacidadesAyuda.text('Selecciona el dispositivo Bluetooth que quieres desconectar.');
        navigator.bluetooth.requestDevice({
            acceptAllDevices: true
        }).then(function(dispositivo) {
            var identificador = obtenerIdentificadorBluetooth(dispositivo);

            if (dispositivo.gatt && dispositivo.gatt.connected) {
                dispositivo.gatt.disconnect();
            }

            if (typeof dispositivo.forget === 'function') {
                return dispositivo.forget().then(function() {
                    capacidadesAyuda.text('Dispositivo olvidado: ' + identificador + '.');
                });
            }

            capacidadesAyuda.text('Dispositivo desconectado: ' + identificador +
                '. Este navegador no permite olvidarlo automáticamente.');
        }).catch(function(error) {
            if (error.name !== 'NotFoundError') {
                mostrarAviso('No se pudo desconectar el dispositivo Bluetooth: ' + error.message, 'warning');
            }
        });
    });

    var audioGrabador = null;
    var audioPartes = [];
    var capturaPantalla = null;
    var orientacionActiva = false;
    var movimientoActivo = false;
    var orientacionHandler = null;
    var movimientoHandler = null;
    var barcodeStream = null;
    var barcodeTimer = null;
    var faceStream = null;
    var faceTimer = null;

    function apiNoDisponible(nombre) {
        if (window.isSecureContext === false && !window.location.hostname.includes('localhost')) {
            mostrarAviso(nombre + ' requiere HTTPS. Abre la app mediante https:// o usa localhost con ADB.', 'warning');
            capacidadesAyuda.text('El teléfono está usando HTTP. Cámara, micrófono, sensores, biometría, Service Worker e instalación requieren HTTPS.');
            return;
        }
        mostrarAviso(nombre + ' no está disponible en este navegador o dispositivo.', 'warning');
    }

    function validarContextoSeguro(nombre) {
        if (window.isSecureContext === false && !window.location.hostname.includes('localhost')) {
            apiNoDisponible(nombre);
            return false;
        }
        return true;
    }

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
                rp: { name: 'Chat para superheroes' },
                user: {
                    id: new TextEncoder().encode(usuario || 'superheroe'),
                    name: (usuario || 'superheroe') + '@chat.local',
                    displayName: usuario || 'Superhéroe'
                },
                pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
                authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
                timeout: 60000,
                attestation: 'none'
            }
        }).then(function() {
            mostrarAviso('Autenticación biométrica completada.', 'info');
        }).catch(function(error) {
            if (error.name !== 'NotAllowedError') mostrarAviso('No se pudo autenticar: ' + error.message, 'warning');
        });
    });

    function abrirCamaraParaDetector() {
        if (!validarContextoSeguro('La cámara')) {
            return Promise.reject(new Error('Se requiere HTTPS'));
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            apiNoDisponible('La cámara');
            return Promise.reject(new Error('Cámara no disponible'));
        }
        return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function(stream) {
            videoElement.srcObject = stream;
            contenedorCamara.removeClass('oculto');
            return stream;
        });
    }

    function detenerStream(video) {
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(function(track) { track.stop(); });
            video.srcObject = null;
        }
    }

    function asignarStream(video, stream) {
        if (!video) return Promise.reject(new Error('No se encontró el elemento de video.'));
        video.srcObject = stream;
        var reproduccion = video.play();
        return reproduccion && typeof reproduccion.catch === 'function' ?
            reproduccion.catch(function(error) {
                mostrarAviso('No se pudo reproducir la cámara: ' + error.message, 'warning');
            }) : Promise.resolve();
    }

    function detectarDesdeCamara(tipo) {
        var Detector = window[tipo];
        if (tipo === 'BarcodeDetector') {
            iniciarLectorBarcode(Detector);
            return;
        }
        iniciarLectorRostro(Detector);
    }

    $('#rostro-btn').on('click', function() { detectarDesdeCamara('FaceDetector'); });
    $('#codigo-btn').on('click', function() { detectarDesdeCamara('BarcodeDetector'); });

    function cerrarLectorBarcode() {
        if (barcodeTimer) window.clearTimeout(barcodeTimer);
        barcodeTimer = null;
        detenerStream($('#barcode-video')[0]);
        barcodeStream = null;
        $('#barcode-scanner').addClass('oculto');
    }

    function cerrarLectorRostro() {
        if (faceTimer) window.clearTimeout(faceTimer);
        faceTimer = null;
        detenerStream($('#face-video')[0]);
        faceStream = null;
        $('#face-scanner').addClass('oculto');
        $('#face-ovalo').removeClass('detectado');
    }

    function iniciarLectorRostro(Detector) {
        cerrarLectorRostro();
        if (!validarContextoSeguro('Face Detection')) return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            apiNoDisponible('La cámara');
            return;
        }
        navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' } } }).then(function(stream) {
            faceStream = stream;
            var video = $('#face-video')[0];
            video.srcObject = stream;
            $('#face-scanner').removeClass('oculto');
            if (!Detector) {
                $('#face-scanner-mensaje').text('Vista previa activa. Face Detection no está disponible en este navegador.');
                apiNoDisponible('Face Detection');
                return;
            }
            return video.play().then(function() {
                var detector = new Detector();
                var lienzo = document.createElement('canvas');
                var buscar = function() {
                    if (!faceStream) return;
                    if (!video.videoWidth || !video.videoHeight) {
                        faceTimer = window.setTimeout(buscar, 250);
                        return;
                    }
                    lienzo.width = video.videoWidth;
                    lienzo.height = video.videoHeight;
                    lienzo.getContext('2d').drawImage(video, 0, 0);
                    detector.detect(lienzo).then(function(resultados) {
                        if (resultados.length) {
                            $('#face-ovalo').addClass('detectado');
                            $('#face-scanner-mensaje').text('Rostro detectado');
                            mostrarAviso('Rostro detectado.', 'info');
                        } else {
                            $('#face-ovalo').removeClass('detectado');
                            $('#face-scanner-mensaje').text('Coloca tu rostro dentro del óvalo');
                        }
                        faceTimer = window.setTimeout(buscar, 400);
                    }).catch(function(error) {
                        cerrarLectorRostro();
                        mostrarAviso('No se pudo detectar el rostro: ' + error.message, 'warning');
                    });
                };
                buscar();
            });
        }).catch(function(error) {
            cerrarLectorRostro();
            mostrarAviso('No se pudo abrir la cámara. Revisa HTTPS y el permiso del navegador: ' + error.message, 'warning');
        });
    }

    function iniciarLectorBarcode(Detector) {
        cerrarLectorBarcode();
        if (!validarContextoSeguro('Barcode Detection')) return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            apiNoDisponible('La cámara');
            return;
        }
        navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } }).then(function(stream) {
            barcodeStream = stream;
            var video = $('#barcode-video')[0];
            video.srcObject = stream;
            $('#barcode-scanner').removeClass('oculto');
            if (!Detector) {
                $('#barcode-scanner-mensaje').text('Vista previa activa. Barcode Detection no está disponible en este navegador.');
                apiNoDisponible('Barcode Detection');
                return;
            }
            return video.play().then(function() {
                var detector = new Detector({ formats: ['qr_code', 'ean_13', 'code_128'] });
                var lienzo = document.createElement('canvas');
                var buscar = function() {
                    if (!barcodeStream) return;
                    if (!video.videoWidth || !video.videoHeight) {
                        barcodeTimer = window.setTimeout(buscar, 250);
                        return;
                    }
                    lienzo.width = video.videoWidth;
                    lienzo.height = video.videoHeight;
                    lienzo.getContext('2d').drawImage(video, 0, 0);
                    detector.detect(lienzo).then(function(resultados) {
                        if (resultados.length) {
                            mostrarAviso('Código detectado: ' + resultados[0].rawValue, 'info');
                            cerrarLectorBarcode();
                        } else {
                            barcodeTimer = window.setTimeout(buscar, 250);
                        }
                    }).catch(function(error) {
                        cerrarLectorBarcode();
                        mostrarAviso('No se pudo leer el código: ' + error.message, 'warning');
                    });
                };
                buscar();
            });
        }).catch(function(error) {
            cerrarLectorBarcode();
            mostrarAviso('No se pudo abrir la cámara. Revisa HTTPS y el permiso del navegador: ' + error.message, 'warning');
        });
    }

    $('#detener-barcode-btn').on('click', cerrarLectorBarcode);
    $('#detener-face-btn').on('click', cerrarLectorRostro);

    $('#captura-pantalla-btn').on('click', function() {
        if (!validarContextoSeguro('La captura de pantalla')) return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            apiNoDisponible('La captura de pantalla');
            return;
        }
        navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }).then(function(stream) {
            capturaPantalla = stream;
            var videoCaptura = $('#captura-pantalla-video')[0];
            $('#captura-pantalla-video').removeClass('oculto');
            asignarStream(videoCaptura, stream);
            if (navigator.mediaDevices.setCaptureHandleConfig) {
                navigator.mediaDevices.setCaptureHandleConfig({ handle: 'chat-superheroes', exposeOrigin: true });
            }
            stream.getVideoTracks()[0].addEventListener('ended', function() {
                capturaPantalla = null;
                detenerStream(videoCaptura);
                $('#captura-pantalla-video').addClass('oculto');
            });
            mostrarAviso('Captura de pantalla activa. Comparte la ventana o pantalla solicitada.', 'info');
        }).catch(function(error) {
            mostrarAviso('No se pudo capturar la pantalla. Revisa HTTPS y el permiso: ' + error.message, 'warning');
        });
    });

    $('#audio-btn').on('click', function() {
        if (audioGrabador && audioGrabador.state === 'recording') {
            audioGrabador.stop();
            $(this).html('<i class="fa fa-microphone"></i> Grabar audio');
            return;
        }
        if (!validarContextoSeguro('La grabación de audio')) return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
            apiNoDisponible('La grabación de audio');
            return;
        }
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
            audioPartes = [];
            audioGrabador = new MediaRecorder(stream);
            audioGrabador.ondataavailable = function(evento) { if (evento.data.size) audioPartes.push(evento.data); };
            audioGrabador.onstop = function() {
                stream.getTracks().forEach(function(track) { track.stop(); });
                $('#audio-grabado').removeClass('oculto').prop('src', URL.createObjectURL(new Blob(audioPartes, { type: audioGrabador.mimeType || 'audio/webm' })));
                mostrarAviso('Audio grabado. Reprodúcelo desde el panel.', 'info');
            };
            audioGrabador.start();
            $('#audio-btn').html('<i class="fa fa-stop"></i> Detener audio');
            mostrarAviso('Grabando audio...', 'info');
        }).catch(function(error) { mostrarAviso('No se pudo acceder al micrófono: ' + error.message, 'warning'); });
    });

    function pintarSensores(texto) { $('#sensores-estado').text(texto); }
    function detenerSensores() {
        if (orientacionHandler) window.removeEventListener('deviceorientation', orientacionHandler);
        if (movimientoHandler) window.removeEventListener('devicemotion', movimientoHandler);
        orientacionHandler = null;
        movimientoHandler = null;
        orientacionActiva = false;
        movimientoActivo = false;
        $('#orientacion-btn').html('<i class="fa fa-compass"></i> Activar orientación');
        $('#movimiento-btn').html('<i class="fa fa-running"></i> Activar movimiento');
        pintarSensores('Sensores: en espera');
    }

    function activarOrientacion() {
        if (!validarContextoSeguro('La orientación')) return;
        if (!window.DeviceOrientationEvent) { apiNoDisponible('La orientación'); return; }
        if (orientacionActiva) {
            detenerSensores();
            mostrarAviso('Orientación desactivada.', 'info');
            return;
        }
        detenerSensores();
        var iniciar = function() {
            orientacionActiva = true;
            orientacionHandler = function(evento) {
                pintarSensores('Orientación\\nAlfa: ' + Math.round(evento.alpha || 0) + '°  Beta: ' + Math.round(evento.beta || 0) + '°  Gamma: ' + Math.round(evento.gamma || 0) + '°');
            };
            window.addEventListener('deviceorientation', orientacionHandler);
            $('#orientacion-btn').html('<i class="fa fa-stop"></i> Detener orientación');
            mostrarAviso('Orientación activada.', 'info');
        };
        if (typeof DeviceOrientationEvent.requestPermission === 'function') DeviceOrientationEvent.requestPermission().then(function(p) { if (p === 'granted') iniciar(); else apiNoDisponible('El permiso de orientación'); });
        else iniciar();
    }
    $('#orientacion-btn').on('click', activarOrientacion);

    $('#movimiento-btn').on('click', function() {
        if (!validarContextoSeguro('El movimiento')) return;
        if (!window.DeviceMotionEvent) { apiNoDisponible('El movimiento'); return; }
        if (movimientoActivo) {
            detenerSensores();
            mostrarAviso('Movimiento desactivado.', 'info');
            return;
        }
        detenerSensores();
        var iniciar = function() {
            movimientoActivo = true;
            movimientoHandler = function(evento) {
                var aceleracion = evento.accelerationIncludingGravity || {};
                pintarSensores('Movimiento\\nX: ' + Math.round(aceleracion.x || 0) + '  Y: ' + Math.round(aceleracion.y || 0) + '  Z: ' + Math.round(aceleracion.z || 0));
            };
            window.addEventListener('devicemotion', movimientoHandler);
            $('#movimiento-btn').html('<i class="fa fa-stop"></i> Detener movimiento');
            mostrarAviso('Movimiento activado.', 'info');
        };
        if (typeof DeviceMotionEvent.requestPermission === 'function') DeviceMotionEvent.requestPermission().then(function(p) { if (p === 'granted') iniciar(); else apiNoDisponible('El permiso de movimiento'); });
        else iniciar();
    });

    $('#transicion-btn').on('click', function() {
        var cambiar = function() {
            var estado = $('#transicion-btn').text().indexOf('activa') === -1;
            $('#transicion-btn').text(estado ? 'Transición activa' : 'Ver transición');
            $('#capacidades-panel').toggleClass('transicion-activa', estado);
        };
        if (document.startViewTransition) document.startViewTransition(cambiar);
        else cambiar();
    });

    $('#multi-touch-area').on('touchstart touchmove touchend touchcancel', function(evento) {
        evento.preventDefault();
        $('#multi-touch-estado').text(evento.originalEvent.touches.length + ' puntos de contacto');
    });

    actualizarEstadoDispositivo();
    if (wakeLockPreferido && document.visibilityState === 'visible') activarWakeLock();
