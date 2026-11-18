
const fs = require('fs');


const urlsafeBase64 = require('urlsafe-base64');
const webpush = require('web-push');
const vapidPath = './vapid.json';
let vapid = null;

if (fs.existsSync(__dirname + '/vapid.json')) {
    vapid = require(vapidPath);
    webpush.setVapidDetails(
        'mailto:fernando.herrera85@gmail.com',
        vapid.publicKey,
        vapid.privateKey
    );
}




let suscripciones = require('./subs-db.json');


module.exports.getKey = () => {
    if (!vapid || !vapid.publicKey) return null;
    return urlsafeBase64.decode(vapid.publicKey);
};



module.exports.addSubscription = ( suscripcion ) => {

    suscripciones.push( suscripcion );

    
    fs.writeFileSync(`${ __dirname }/subs-db.json`, JSON.stringify(suscripciones) );
};


module.exports.sendPush = ( post ) => {
    if (!vapid) {
        console.warn('Push deshabilitado: falta server/vapid.json');
        return;
    }

    console.log('Mandando PUSHES');

    const notificacionesEnviadas = [];


    suscripciones.forEach( (suscripcion, i) => {


        const pushProm = webpush.sendNotification( suscripcion , JSON.stringify( post ) )
            .then( console.log( 'Notificacion enviada ') )
            .catch( err => {

                console.log('Notificación falló');

                if ( err.statusCode === 410 ) { // GONE, ya no existe
                    suscripciones[i].borrar = true;
                }

            });

        notificacionesEnviadas.push( pushProm );

    });

    Promise.all( notificacionesEnviadas ).then( () => {

        suscripciones = suscripciones.filter( subs => !subs.borrar );

        fs.writeFileSync(`${ __dirname }/subs-db.json`, JSON.stringify(suscripciones) );

    });

}

