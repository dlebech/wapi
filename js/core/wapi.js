'use strict';

/* global AudioContext */

/**
 * Core module for Wapi. Provides the {@link Wapi} class that includes a basic
 * sequencer, note list and other convenient functions for interfacing with the
 * Web Audio API.
 *
 * @module core/wapi
 * @author David Volquartz Lebech
 * @license MIT
 */

var notes = require('./notes');
var WapiTrack = require('./track');

// Controls playback.
var playing = false;

// Current sequence and beat index.
var currentSequenceIndex = 0;
var currentBeatIndex = 0;

// At what time does the next beat play.
var nextBeatTime = 0;

// Determines how many milliseconds to look ahead for new schedules.
var lookAheadTime = 25.0;

// Determines how far ahead to schedule beats.
var scheduleAheadTime = 0.5;

/**
 * WAPI, Web audio API. A programmatic DAW. Call it whatever. Mostly a toy,
 * maybe it will grow. No-one knows. But it is very much a work-in-progress.
 * @class Wapi
 * @example
 * var wapi = new Wapi();
 *
 * // Create a new Wapi track
 * var bassTrack = wapi.createTrack();
 *
 * // Create a bass from the ElectroSynthBass plugin and add it to the track.
 * var bass = new ElectroSynthBass(wapi.context);
 * bassTrack.addPlugin(bass);
 *
 * // Create a MIDI sequence.
 * var sequence = function(time, beatIndex) {
 *   var notes = [];
 *   if (beatIndex % 4 == 0) {
 *     notes.push('C4');
 *   }
 *   if (beatIndex % 8 == 0) {
 *     notes.push('D4');
 *   }
 *   return notes;
 * }
 *
 * // Add the sequence to Wapi.
 * bassTrack.addSequence(sequence);
 *
 * wapi.play();
 */
function Wapi() {
  /**
   * The AudioContext instance that is used to interface with the Web Audio
   * API. All audio plugins use the same context for creating audio nodes,
   * filters, etc.
   */
  this.context = new AudioContext();

  /**
   * An object containing 8 octaves of pre-calculated notes (C0-B7) within
   * the equal tempered scale where A4 = 440 hertz.
   *
   * @const
   * @example
   * var myNote = Wapi.NOTES.C4;
   */
  this.NOTES = notes;

  /**
   * The current beats per minute. Can be changed by the user.
   */
  this.bpm = 120.0;

  this.tracks = [];

  /**
   * The master track. Instruments should always connect to this node
   * instead of the context destination because the master goes through a
   * dynamic compressor that helps mitigate clipping issues when multiple
   * sounds are playing at the same time.
   */
  this.master = new WapiTrack(this.context);

  // Add a compressor to the master by default.
  // TODO: This should be up to the user in the future.
  this.master.addPlugin(this.context.createDynamicsCompressor());

  // Add an analyser to the master track.
  // TODO: This should be up to the user in the future.
  this.master.addPlugin(this.context.createAnalyser());

  // Connect the master track to the context destination (the speakers). The
  // current setup is then:
  // master gain -> compressor -> analyzer -> speakers.
  this.master.connect(this.context.destination);

  var _this = this;

  // The private methods below set up the sequencer that schedules playback.
  // Basically, Wapi looks ahead in time a little bit and schedules all beats
  // for that range. This is, kind of, similar to the buffering in a DAW.

  // Calculate current seconds per beat.
  // TODO, make this modular like the BPM:
  var secondsPerBeat = 60.0 / this.bpm;

  // Fetches the next beat from the currently playing sequence.
  var nextBeat = function() {
    nextBeatTime += 0.25 * secondsPerBeat;

    // Increment beat index.
    // Reset the beat index after 16 beats and increment the sequence counter.
    currentBeatIndex++;
    if (currentBeatIndex === 16) {
      currentBeatIndex = 0;
      currentSequenceIndex++;
    }
  };

  // Notifies all tracks about what time the current beat is going to be played.
  var scheduleBeat = function(time) {
    for (var i = 0; i < _this.tracks.length; i++) {
      var track = _this.tracks[i];
      track.scheduleBeat(time, currentSequenceIndex, currentBeatIndex);
    }
  };

  // Schedules a series of beats in the current sequence.
  var schedule = function() {
    var scheduleUntil = _this.context.currentTime + scheduleAheadTime;
    while (playing && nextBeatTime < scheduleUntil) {
      scheduleBeat(nextBeatTime);
      nextBeat();
    }

    // Re-schedule if we are still playing
    if (playing) {
      window.setTimeout(function() {
        schedule();
      }, lookAheadTime);
    }
  };

  /**
   * Starts playback
   */
  this.play = function() {
    playing = true;
    nextBeatTime = this.context.currentTime;
    schedule();
  };

  /**
   * Stops playback.
   */
  this.stop = function() {
    playing = false;
  };

  /**
   * Rewind playback to the beginning.
   */
  this.rewind = function() {
    currentSequenceIndex = 0;
    currentBeatIndex = 0;
  };
}

/**
 * Creates a new track and connects it to the master output by default.
 * @returns {WapiTrack} A new audio track.
 */
Wapi.prototype.createTrack = function() {
  var track = new WapiTrack(this.context);

  // Connect the track to the master channel by default
  track.connect(this.master);

  this.tracks.push(track);
  return track;
};

Wapi.prototype.toString = function() {
  for (var i = 0; i < this.tracks.length; i++) {
    var track = this.tracks[i];
    console.log('Track', i);
    console.log('  Sequences', track.sequences.length);
    console.log('  Input channels', track.input.numberOfInputs);
  }
};

module.exports = Wapi;
