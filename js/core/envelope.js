'use strict';

/**
 * Creates an Attack Decay Sustain Release envelope (ADSR) for the given
 * AudioNode parameter.
 *
 * Notice that larger values of time give shorter intervals for the
 * parameter, e.g. a decay time of 10 is shorter than a decay time of 3.
 *
 * To use purely as attack-decay node, simply leave out the sustain and
 * release parameters.
 *
 * TODO: The envelope feature should probably be added to individual
 * instruments/plugins.
 *
 * @param {AudioParam} param - The audio parameter to create the envelope
 * for, e.g. frequency for a sine node or gain for a gain node.
 * @param {int} startTime - The start time for the envelope.
 * @param {float} minValue - The minimum value.
 * @param {float} maxValue - The maximum or peak value.
 * @param {int} attack - The attack time.
 * @param {int} decay - The decay time.
 * @param {float} sustainValue - The value for the sustain.
 * @param {int} sustain - The sustain time.
 * @param {int} release - The release time.
 * @returns {float} The end time for the envelope.
 * @module core/envelope
 */
function ADSREnvelope(param, startTime, minValue,
    maxValue, attack, decay, sustainValue, sustain, release) {
  // http://en.wikipedia.org/wiki/Synthesizer#ADSR_envelope
  //
  // Here is how it looks in ASCII... because we like ASCII.
  //      /\
  //     /  \
  //    /    \
  //   /      \
  //  /        \-----\
  // /                \
  // A     D    S    R

  // Set initial value.
  param.setValueAtTime(0, startTime);

  // Attack
  // If the attack is set to 0, it means that there is no attack phase
  // and the maxValue is set immediately.
  // This can be useful for frequencies.
  var attackTime = startTime;
  if (attack > 0) {
    attackTime = startTime + 1/attack;
  }
  param.linearRampToValueAtTime(maxValue, attackTime);

  // Decay
  var decayTime = attackTime + 1/decay;
  sustainValue = sustainValue || minValue;
  param.linearRampToValueAtTime(sustainValue, decayTime);

  if (sustainValue > 0 && sustain > 0 && release > 0) {
    // Sustain
    // Don't do anything except calculate the sustain time.
    var sustainTime = decayTime + 1/sustain;

    // Release
    var releaseTime = sustainTime + 1/release;
    param.linearRampToValueAtTime(minValue, releaseTime);

    return releaseTime;
  }
  return decayTime;
}

module.exports = ADSREnvelope;
