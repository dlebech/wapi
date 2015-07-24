'use strict';

/**
 * An audio track. Implements the same methods as an AudioNode so it can be
 * used directly in an audio node network.
 *
 * The difference between an AudioNode an a track is that a track contains a
 * chain of audio nodes called "plugins" that are controlled within the context
 * of the track.
 *
 * In this sense, a track is more like a track in a traditional DAW than an
 * AudioNode.
 *
 * @param {AudioContext} context - The audio context that this track is part of.
 * @module core/track
 */
function WapiTrack(context) {
  this.context = context;

  /**
   * List of sequences pre-defined for this track.
   */
  this.sequences = [];

  /**
   * The plugin/effects chain for this track. Usually starts with an instrument
   * and optionally some effects to alter the audio output of the instrument.
   */
  this.plugins = [];

  /**
   * The input node to this track. A track always has an input node but for a
   * MIDI track, it might be unused.
   */
  this.input = this.context.createGain();

  /**
   * This main output node. Use the connect and disconnect methods for
   * connecting the output node.
   */
  this.output = this.context.createGain();
}

WapiTrack.prototype.disconnect = function() {
  this.output.disconnect();
};

/**
 * Connects this track to the given destination. Usually the master track.
 * @param {AudioNode|WapiTrack} destination - The audio destination for this
 * track.
 */
WapiTrack.prototype.connect = function(destination) {
  this.output.connect(destination.input ? destination.input : destination);
};

/**
 * Schedules a single beat for this track. Tracks are split into 16 beats per
 * sequence and the sequence function determines the notes to play for a
 * specific beat in the sequence.
 * @param {number} time - The exact time to schedule the beat at.
 * @param {number} sequenceIndex - The sequence number.
 * @param {number} beatIndex - The beat number within the sequence.
 */
WapiTrack.prototype.scheduleBeat = function(time, sequenceIndex, beatIndex) {
  if (sequenceIndex < this.sequences.length) {
    // Run the current sequence.
    // TODO: Actually, instead of having a sequence be a function, it might
    // make a bit more sense that it is a 2D array with an entry for each beat
    // and the notes to play for that entry.
    var events = this.sequences[sequenceIndex](time, beatIndex);
    var _this = this;

    // Schedule all the notes for playback or pause.
    if (events.noteOn) {
      events.noteOn.forEach(function(note) {
        _this.plugins[0].noteOn(time, note);
      });
    }

    if (events.noteOff) {
      events.noteOff.forEach(function(note) {
        _this.plugins[0].noteOff(time, note);
      });
    }
  }
};

/**
 * Add a plugin to the end of the plugin chain for this track.
 */
WapiTrack.prototype.addPlugin = function(plugin) {
  // If there are already plugins, re-connect the end of plugin chain.
  if (this.plugins.length > 0) {
    var lastPlugin = this.plugins[this.plugins.length-1];
    // Disconnect the last node
    lastPlugin.disconnect();

    // Can connect both to AudioNodes and plugins with an input parameter.
    lastPlugin.connect(plugin.input ? plugin.input : plugin);
  }
  // If this is the first plugin, connect the input to this plugin.
  else {
    this.input.connect(plugin.input ? plugin.input : plugin);
  }

  // Connect the new node to the output of the track.
  plugin.connect(this.output);

  this.plugins.push(plugin);
};

/**
 * Adds the specified MIDI sequence input to this track. A sequence is a
 * JavaScript function that is called once for every beat in a sequence. The
 * function fires events based on the time and beat index in the sequence.
 *
 * Currently, a sequence is restricted to 16 beats or bars, corresponding
 * roughly to 16th notes in the traditional sense.
 *
 * @param {function} sequence - A JavaScript function which fires MIDI events.
 */
WapiTrack.prototype.addSequence = function(sequence) {
  this.sequences.push(sequence);
};

module.exports = WapiTrack;
