(function() {
    'use strict';

    var DB_NAME = 'PWA_RUM_MetricsDB';
    var STORE_NAME = 'metrics';
    var dbPromise = null;
    var accionActual = 'carga-inicial';

    function abrirDB() {
        if (dbPromise) return dbPromise;

        dbPromise = new Promise(function(resolve, reject) {
            if (!('indexedDB' in window)) {
                reject(new Error('IndexedDB no está disponible.'));
                return;
            }

            var request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = function() {
                var db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }
            };
            request.onsuccess = function() { resolve(request.result); };
            request.onerror = function() { reject(request.error); };
        });

        return dbPromise;
    }

    function elementoAfectado(metric) {
        if (metric.name === 'LCP') {
            var lcpNode = metric.entries && metric.entries[metric.entries.length - 1] &&
                metric.entries[metric.entries.length - 1].element;
            return lcpNode ? (lcpNode.id || lcpNode.className || lcpNode.tagName) : accionActual;
        }

        if (metric.name === 'CLS') {
            var sources = [];
            (metric.entries || []).forEach(function(entry) {
                (entry.sources || []).forEach(function(source) {
                    var node = source.node;
                    if (node) sources.push(node.id || node.className || node.tagName);
                });
            });
            return sources.length ? sources.slice(0, 5).join(', ') : accionActual;
        }

        if (metric.name === 'INP') {
            var entry = metric.entries && metric.entries[metric.entries.length - 1];
            var target = entry && entry.target;
            return target ? (target.id || target.className || target.tagName) : accionActual;
        }

        return accionActual;
    }

    function guardarMetrica(metric) {
        var registro = {
            timestamp: new Date().toISOString(),
            metric: metric.name,
            value: Number(metric.value.toFixed(2)),
            rating: metric.rating,
            action: accionActual,
            element: elementoAfectado(metric)
        };

        console.table([registro]);

        abrirDB().then(function(db) {
            var transaction = db.transaction(STORE_NAME, 'readwrite');
            transaction.objectStore(STORE_NAME).add(registro);
        }).catch(function(error) {
            console.warn('No se pudo guardar la métrica RUM:', error);
        });
    }

    window.PWA_RUM = {
        markAction: function(elemento) {
            accionActual = String(elemento || 'chat');
        },
        getMetricsDB: abrirDB
    };

    if (!window.webVitals) {
        console.warn('web-vitals no está disponible.');
        return;
    }

    var opciones = { reportAllChanges: true };
    window.webVitals.onLCP(guardarMetrica, opciones);
    window.webVitals.onINP(guardarMetrica, opciones);
    window.webVitals.onCLS(guardarMetrica, opciones);
})();
