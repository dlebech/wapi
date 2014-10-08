define(['wapi-core'], function(Wapi) {

    Wapi.prototype.createFrequencyGraph = function(width, height) {
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);

        this.analyser.maxDecibels = 0;
        this.analyser.fftSize = 256;
        var bufferLength = this.analyser.frequencyBinCount;
        console.log('Buffer length', bufferLength);

        // Prepare data array.
        var data = new Uint8Array(bufferLength);


        // Find barwidth.
        var barSpace = 1;
        var barWidth = (width - bufferLength * barSpace) / bufferLength;

        // Make a closure for the analyser.
        var analyser = this.analyser;

        var draw = function() {
            // Get the data.
            analyser.getByteFrequencyData(data);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);

            var barHeight;
            var x = 0;

            for (var i = 0; i < bufferLength; i++) {
                barHeight = data[i]/256*height;
                ctx.fillStyle = 'rgb(200, 50, 50)';
                ctx.fillRect(x, height-barHeight, barWidth, barHeight);
                x += barWidth + barSpace;
            }

            requestAnimationFrame(draw);
        };

        draw();

        return canvas;
    };
});
