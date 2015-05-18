'use strict';

/**
 * A node with randomly generated noise. It has an interface similar to the Web
 * Audio APIs AudioNode.
 *
 * Inspired by liv3c0der project.
 *
 * @class
 * @author Jan Krutisch
 * @license MIT
 * @param {AudioContext} context - The AudioContext to use for the noise node.
 * @param {AudioBufferSourceNode} [buffer] - Optional existing buffer to use.
 * @example
 * var noise = new NoiseNode();
 */
var NoiseNode = function(context, buffer) {
    var makeBuffer = function(length) {
        var array, i, word, _i, _len, buffer;

        if (length == null) {
            length = 1;
        }
        buffer = context.createBuffer(1, 44100 * length, 44100);
        array = buffer.getChannelData(0);
        for (i = _i = 0, _len = array.length; _i < _len; i = ++_i) {
            word = array[i];
            array[i] = Math.random() * 2 - 1;
        }
        return buffer;
    };

    this.buffer = buffer;
    if (!this.buffer) {
        this.buffer = makeBuffer(1);
    }
    this.source = context.createBufferSource();
    this.source.buffer = this.buffer;
};

NoiseNode.prototype.connect = function(dest) {
    return this.source.connect(dest);
};

NoiseNode.prototype.start = function(time) {
    return this.source.start(time);
};

NoiseNode.prototype.stop = function(time) {
    return this.source.stop(time);
};

module.exports = NoiseNode;
