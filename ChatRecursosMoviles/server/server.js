const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const os = require('os');


const app = express();


const publicPath = path.resolve(__dirname, '../public');
const port = process.env.PORT || 3000;


// app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // support encoded bodies


// Enable CORS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});



// Directorio Público
app.use(express.static(publicPath));

// Rutas 
const routes = require('./routes');
app.use('/api', routes );



app.listen(port, '0.0.0.0', (err) => {

    if (err) throw new Error(err);

    console.log(`Servidor corriendo en puerto ${ port }`);
    Object.keys(os.networkInterfaces()).forEach(function(interfaz) {
        os.networkInterfaces()[interfaz].forEach(function(direccion) {
            if (direccion.family === 'IPv4' && !direccion.internal) {
                console.log(`Red local: http://${direccion.address}:${port}`);
            }
        });
    });

});