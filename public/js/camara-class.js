class Camara {
    constructor(videoNode) {
        this.videoNode = videoNode;
        this.stream = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
    }

    encender() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return Promise.reject(new Error('Este navegador no soporta acceso a la cámara.'));
        }

        return navigator.mediaDevices.getUserMedia({
            video: { width: 300, height: 300 },
            audio: true
        }).then((stream) => {
            this.stream = stream;
            this.videoNode.srcObject = stream;
            return stream;
        });
    }

    apagar() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }
        this.videoNode.pause();
        this.videoNode.srcObject = null;
    }

    tomarFoto() {
        if (!this.stream) {
            return Promise.reject(new Error('La cámara no está activa.'));
        }

        var canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        var context = canvas.getContext('2d');
        context.drawImage(this.videoNode, 0, 0, canvas.width, canvas.height);

        return new Promise((resolve, reject) => {
            canvas.toBlob(function(blob) {
                canvas.remove();
                if (!blob) {
                    reject(new Error('No se pudo procesar la foto.'));
                    return;
                }
                resolve(blob);
            }, 'image/webp', 0.82);
        });
    }

    iniciarGrabacionWebM() {
        if (!this.stream) {
            throw new Error('Activa la cámara antes de grabar.');
        }
        if (!window.MediaRecorder) {
            throw new Error('Este navegador no soporta grabación de video.');
        }

        var mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            throw new Error('El formato video/webm no es soportado.');
        }

        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: mimeType });
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) this.recordedChunks.push(event.data);
        };
        this.mediaRecorder.start();
    }

    detenerGrabacion() {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder) {
                resolve(null);
                return;
            }
            if (this.mediaRecorder.state === 'inactive') {
                resolve(null);
                return;
            }

            this.mediaRecorder.onerror = (event) => {
                reject(event.error || new Error('Error desconocido al grabar el video.'));
            };
            this.mediaRecorder.onstop = () => {
                resolve(new Blob(this.recordedChunks, { type: 'video/webm' }));
                this.mediaRecorder = null;
            };
            this.mediaRecorder.stop();
        });
    }
}
