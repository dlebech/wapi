'use strict';

var notes = require('../core/notes');
var envelope = require('../core/envelope');

/**
 * An instrument that plays a classic electric synth bass tone.
 * @param {AudioContext} context
 * @param {object} [options]
 * @param {boolean} [options.sustain=false] - Indicates whether or not the bass
 * sustains its tone until a noteOff event is received. The default is false
 * which means that the bass has a short and defined tone.
 *
 * @module instruments/bass
 * @implements {WapiPlugin}
 * @implements {WapiInstrument}
 */
function WapiBass(context, options) {
  options = options || {};
  this.context = context;
  this.sustain = !!options.sustain;

  this.input = context.createGain();
  this.output = context.createGain();
  this.output.gain.value = 0;

  // Inspired by this tutorial:
  // http://www.futureaudioworkshop.com/circle/tutorials/tutorial2
  //
  // Node network:
  // saw1 -\
  //        -> filter -> output gain
  // saw2 -/
  // Create two sawtooth oscillators.
  this.saw1 = context.createOscillator();
  this.saw2 = context.createOscillator();
  this.saw1.type = this.saw2.type = 'sawtooth';

  this.filter = context.createBiquadFilter();
  this.filter.type = 'lowpass';
  this.filter.Q.value = 5;

  this.saw1.connect(this.filter);
  this.saw2.connect(this.filter);
  this.filter.connect(this.output);

  // Start both of the oscillators. The output channel is muted...
  this.saw1.start();
  this.saw2.start();
}

WapiBass.prototype.disconnect = function() {
  this.output.disconnect();
};

WapiBass.prototype.connect = function(destination) {
  this.output.disconnect();
  this.output.connect(destination.input ? destination.input : destination);
};

WapiBass.prototype.noteOn = function(time, note) {
  // Set the frequency of the saw waves based on the given note.
  // The two saw oscillators have the same frequency but they are
  // slightly detuned to add some width.
  this.saw1.frequency.setValueAtTime(notes[note], time);
  this.saw2.frequency.setValueAtTime(notes[note], time);
  this.saw1.detune.value = Math.pow(2, 1/12) * -7;
  this.saw2.detune.value = Math.pow(2, 1/12) * 7;

  // Add amplitude (gain) envelope.
  // Amplitudes: 0 -> 1 -> 0.3 -> (0)
  // Timing: Attack 100 -> Decay 10 -> Sustain 3 -> Release 10
  var minVal = 0;
  //if (!this.sustain)
  //  minVal = 0.3;
  var gainParam = this.output.gain;
  envelope(gainParam, time, minVal, 1, 100, 10, 0.3, 3, 10);

  // Add filter envelope.
  // Frequencies: 100 -> 4000 -> 1000
  // Timing: Attack 100 -> Decay 10 -> Sustain 5 -> Release 10
  envelope(this.filter.frequency, time, 100, 4000, 100, 10, 1000, 5, 10);
};

// Do nothing right now.
WapiBass.prototype.noteOff = function() {};

module.exports = WapiBass;
