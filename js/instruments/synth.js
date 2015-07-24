'use strict';

var notes = require('../core/notes');

/**
 * A very simple sawtooth-based synthesizer.
 *
 * @module instruments/synth
 * @implements {WapiPlugin}
 * @implements {WapiInstrument}
 */
function WapiSynth(context) {
  this.context = context;

  // Irrelevant but implemented for compatibility with an plugin and track
  // chain.
  this.input = context.createGain();
  this.saw = context.createOscillator();
  this.saw.type = 'sawtooth';
  this.lfo = context.createOscillator();
  this.lfo.frequency.value = 6;
  this.lfoGain = context.createGain();
  this.lfoGain.gain.value = 10;
  this.filter = context.createBiquadFilter();
  this.filter.type = 'lowpass';
  this.output = context.createGain();
  this.output.gain.value = 0;

  // Node network:
  // (1) Saw wave is connected through the lowpass filter to the output and (2)
  // the LFO controls the frequency of the saw wave.
  // 1: Saw -> lowpass filter -> output
  // 2: LFO -> LFO gain -> Saw frequency
  this.saw.connect(this.filter);
  this.filter.connect(this.output);
  this.lfo.connect(this.lfoGain);
  this.lfoGain.connect(this.saw.frequency);

  // Start the LFO and saw waves.
  this.saw.start();
  this.lfo.start();
}

WapiSynth.prototype.disconnect = function() {
  this.output.disconnect();
};

WapiSynth.prototype.connect = function(destination) {
  this.output.disconnect();
  this.output.connect(destination.input ? destination.input : destination);
};

WapiSynth.prototype.noteOn = function(time, note) {
  this.saw.frequency.setValueAtTime(notes[note], time);
  this.output.gain.linearRampToValueAtTime(1.0, time + 0.1);
};

WapiSynth.prototype.noteOff = function(time) {
  this.output.gain.linearRampToValueAtTime(0.0, time + 0.1);
};

module.exports = WapiSynth;
