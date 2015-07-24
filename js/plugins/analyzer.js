'use strict';

/**
 * A node that consists of a FFT analyzer node that enables analysis of the
 * playing waveform. Provides convenience methods for creating HTML5 canvas
 * elements that display the output of the analysis.
 *
 * @module plugins/analyzer
 * @param {AudioContext} context - The AudioContext to use for the analyzer.
 * @implements {WapiPlugin}
 * @example
 * var analyzer = new Analyzer();
 * var canvas = analyzer.createFrequencyGraph(300, 300);
 * document.body.appendChild(canvas);
 */
var Analyzer = function(context) {
    this.input = context.createAnalyser();
    this.input.maxDecibels = 0;
    this.input.fftSize = 256;
};

Analyzer.prototype.disconnect = function() {
    return this.input.disconnect();
};

Analyzer.prototype.connect = function(dest) {
    return this.input.connect(dest.input ? dest.input : dest);
};

/**
 * Creates and returns a `canvas` element with a simple frequency bar graph for
 * the analyzed input data.
 * @param {number} width - The width of the canvas.
 * @param {number} height - The height of the canvas.
 * @returns {Canvas}
 */
Analyzer.prototype.createFrequencyGraph = function(width, height) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    var bufferLength = this.input.frequencyBinCount;
    console.log('Buffer length', bufferLength);

    // Prepare data array.
    var data = new Uint8Array(bufferLength);

    // Find barwidth.
    var barSpace = 1;
    var barWidth = (width - bufferLength * barSpace) / bufferLength;

    var _this = this;
    var draw = function() {
        // Get the data.
        _this.input.getByteFrequencyData(data);
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

        window.requestAnimationFrame(draw);
    };

    draw();

    return canvas;
};

module.exports = Analyzer;
