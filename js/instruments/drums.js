'use strict';

var notes = require('../core/notes');
var envelope = require('../core/envelope');
var NoiseNode = require('../effects/noise');

/**
 * A simple drum-set.
 *
 * @class
 * @implements {WapiPlugin}
 * @implements {WapiInstrument}
 */
function WapiDrums(context) {
  this.context = context;
  this.input = context.createGain();
  this.output = context.createGain();
}

WapiDrums.prototype.disconnect = function() {
  this.output.disconnect();
};

WapiDrums.prototype.connect = function(destination) {
  this.output.disconnect();
  this.output.connect(destination.input ? destination.input : destination);
};

WapiDrums.prototype.noteOn = function(time, note) {
  if (notes[note] === notes.C4) {
    this.simpleKick(time);
  }
  else {
    this.simpleSnare(time);
  }
};

/**
 * Plays a very synth-y drum snare.
 *
 * @param {number} time - The time that the instrument will start playing.
 */
WapiDrums.prototype.simpleSnare = function(time) {
  // A drum snare is a drum synth with some added noise.
  // Node network:
  // noise -> lowpass filter -> gain -> master mixer

  var gainNode = this.context.createGain();
  gainNode.connect(this.output);

  // How long time the entire beat and gain decay takes.
  var gainDecay = 3;

  // Make a slight increase in gain in the beginning to simulate a
  // hitting pedal or snare. Basically, go from silence to loud in a very
  // short timespan and then back to silence.
  var endTime = envelope(gainNode.gain, time, 0, 1, 0, gainDecay);

  // Create new NoiseNode and pass it through a low-pass filter.
  var noise = new NoiseNode(this.context);
  var filter = this.context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 4000;
  filter.Q.value = 5;
  noise.connect(filter);
  filter.connect(gainNode);
  noise.start(time);
  noise.stop(endTime);
  this.simpleDrum(time, this.output, 400, 100, gainDecay, gainDecay);
};

/**
 * Plays a nice low drum kick.
 *
 * @param {number} time - The time that the instrument will start playing.
 */
WapiDrums.prototype.simpleKick = function(time) {
  // Uses the base drum sound with a 150 -> 100 hertz frequency drop that
  // happens quite fast.
  this.simpleDrum(time, this.output, 150, 100, 60, 10);
};

/**
 * Creates a synthesized drum sound. Good for drum kicks with varying
 * intensity.
 *
 * @param {number} time - The time that the instrument will start playing.
 * @param {AudioDestinationNode} destination - The destination node for the
 * instrument. Allows for playing the drums through other nodes such as
 * noise nodes.
 * @param {number} startFrequency - The start frequency of sine wave for the
 * drum.
 * @param {number} endFrequency - The end frequency of the sine wave for the
 * drum.
 * @param {number} frequencyDecay - The rate at which the the frequency decays
 * between start and end frequency. Higher numbers mean faster decay.
 * @param {number} gainDecay - The rate at which the gain (volume) decays.
 */
WapiDrums.prototype.simpleDrum = function(time, destination, startFrequency,
    endFrequency, frequencyDecay, gainDecay) {
  // The drum sound is just a sine wave with a rapid attack-release
  // envelope.
  //
  // The sound is made by making a rapid drop-off in both frequency and
  // gain (volume).
  // The frequency drop-off is usually faster than the gain drop-off,
  // depending on the given parameters.
  // See the ADSR envelope function for more details.

  // Node network:
  // sine -> gain -> destination
  var sineNode = this.context.createOscillator();
  var gainNode = this.context.createGain();
  sineNode.connect(gainNode);
  gainNode.connect(destination);

  // Wrap the sine node's frequency in an envelope.
  var freqEnd = envelope(sineNode.frequency, time, endFrequency,
    startFrequency, 0, frequencyDecay);

  // Make a slight increase in gain in the beginning to simulate a
  // hitting pedal or snare. Basically, go from silence to loud in a very
  // short timespan and then back to silence.
  // This is accomplished with an ADSR envelope.
  var gainEnd = envelope(gainNode.gain, time, 0, 1, 1000, gainDecay);

  // Determine when to end playing by taking the largest end time of the
  // frequency and gain envelopes.
  var endTime = freqEnd > gainEnd ? freqEnd : gainEnd;

  // Start the sine node.
  sineNode.start(time);
  sineNode.stop(endTime);
};

module.exports = WapiDrums;
